"""
RAG Service — ChromaDB-powered context retrieval for AI agents.

Stores processed email analyses as embeddings and retrieves similar
past emails to inject into agent prompts for better accuracy.
Per-user collections ensure data isolation.
"""

import os
import logging
from typing import List, Dict, Optional, Any

import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)

# ChromaDB storage path
CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chromadb_data")


class RAGService:
    """Manages ChromaDB collections for per-user context retrieval."""

    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=CHROMA_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
        logger.info(f"ChromaDB initialized at {CHROMA_DIR}")

    # ------------------------------------------------------------------
    # Collection helpers
    # ------------------------------------------------------------------

    def _email_collection(self, user_id: Optional[int] = None):
        """Get or create the email context collection for a user."""
        name = f"emails_{user_id}" if user_id else "emails_global"
        return self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )

    def _correction_collection(self, user_id: Optional[int] = None):
        """Get or create the correction collection for a user."""
        name = f"corrections_{user_id}" if user_id else "corrections_global"
        return self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )

    # ------------------------------------------------------------------
    # Store
    # ------------------------------------------------------------------

    def store_email_context(
        self,
        email_id: int,
        text: str,
        analysis: Dict[str, Any],
        user_id: Optional[int] = None,
    ) -> None:
        """
        Store a processed email + its analysis as a document in ChromaDB.

        The text is embedded automatically by ChromaDB's default embedding
        function. Metadata carries the structured analysis for retrieval.
        """
        collection = self._email_collection(user_id)
        doc_id = f"email_{email_id}"

        metadata = {
            "email_id": email_id,
            "category": str(analysis.get("category", "")),
            "urgency_score": int(analysis.get("urgency_score", 0)),
            "action_required": str(analysis.get("action_required", False)),
        }
        if analysis.get("summary"):
            metadata["summary"] = str(analysis["summary"])[:500]

        # Combine subject-like info + body for a richer embedding
        document = text[:2000]

        try:
            collection.upsert(
                ids=[doc_id],
                documents=[document],
                metadatas=[metadata],
            )
            logger.debug(f"Stored email context: {doc_id}")
        except Exception as e:
            logger.error(f"Failed to store email context {doc_id}: {e}")

    def store_correction(
        self,
        email_id: int,
        field: str,
        old_value: str,
        new_value: str,
        email_text: str,
        user_id: Optional[int] = None,
    ) -> None:
        """
        Store a user correction so similar future emails benefit.

        The correction text is embedded alongside the original email text
        so it surfaces when processing similar emails.
        """
        collection = self._correction_collection(user_id)
        doc_id = f"correction_{email_id}_{field}"

        document = (
            f"Correction for email: {email_text[:1000]}\n"
            f"Field '{field}' was '{old_value}' → corrected to '{new_value}'"
        )
        metadata = {
            "email_id": email_id,
            "field": field,
            "old_value": str(old_value)[:200],
            "new_value": str(new_value)[:200],
        }

        try:
            collection.upsert(
                ids=[doc_id],
                documents=[document],
                metadatas=[metadata],
            )
            logger.debug(f"Stored correction: {doc_id}")
        except Exception as e:
            logger.error(f"Failed to store correction {doc_id}: {e}")

    # ------------------------------------------------------------------
    # Retrieve
    # ------------------------------------------------------------------

    def retrieve_similar_emails(
        self,
        text: str,
        user_id: Optional[int] = None,
        top_k: int = 3,
    ) -> List[Dict[str, Any]]:
        """
        Find the top-K most similar past emails for a given text.

        Returns list of dicts with keys: document, metadata, distance.
        """
        collection = self._email_collection(user_id)

        if collection.count() == 0:
            return []

        try:
            results = collection.query(
                query_texts=[text[:2000]],
                n_results=min(top_k, collection.count()),
            )

            similar = []
            for i in range(len(results["ids"][0])):
                similar.append({
                    "document": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i] if results.get("distances") else None,
                })
            return similar
        except Exception as e:
            logger.error(f"RAG retrieval failed: {e}")
            return []

    def retrieve_corrections(
        self,
        text: str,
        user_id: Optional[int] = None,
        top_k: int = 3,
    ) -> List[Dict[str, Any]]:
        """
        Find relevant past corrections for a given email text.
        """
        collection = self._correction_collection(user_id)

        if collection.count() == 0:
            return []

        try:
            results = collection.query(
                query_texts=[text[:2000]],
                n_results=min(top_k, collection.count()),
            )

            corrections = []
            for i in range(len(results["ids"][0])):
                corrections.append({
                    "document": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i] if results.get("distances") else None,
                })
            return corrections
        except Exception as e:
            logger.error(f"Correction retrieval failed: {e}")
            return []

    def build_context_prompt(
        self,
        text: str,
        user_id: Optional[int] = None,
    ) -> str:
        """
        Build a context block to prepend to the LLM system prompt.

        Combines similar emails and corrections into a single string.
        Returns empty string if no context is available.
        """
        similar = self.retrieve_similar_emails(text, user_id, top_k=3)
        corrections = self.retrieve_corrections(text, user_id, top_k=2)

        if not similar and not corrections:
            return ""

        parts = []

        if similar:
            parts.append("--- SIMILAR PAST EMAILS ---")
            for i, s in enumerate(similar, 1):
                meta = s["metadata"]
                parts.append(
                    f"{i}. Category: {meta.get('category', '?')} | "
                    f"Urgency: {meta.get('urgency_score', '?')} | "
                    f"Summary: {meta.get('summary', 'N/A')[:100]}"
                )

        if corrections:
            parts.append("\n--- USER CORRECTIONS ---")
            for c in corrections:
                meta = c["metadata"]
                parts.append(
                    f"• {meta.get('field', '?')}: "
                    f"'{meta.get('old_value', '')}' → '{meta.get('new_value', '')}'"
                )

        return "\n".join(parts)


# Singleton
_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Get or create the RAG service singleton."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
