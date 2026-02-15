"""
RAG Service — pgvector-powered context retrieval for AI agents.

Stores processed email analyses as vector embeddings in PostgreSQL
and retrieves similar past emails to inject into agent prompts.
Per-user filtering via user_id column.

Uses sentence-transformers for local embedding generation.
Falls back to TF-IDF hashing when sentence-transformers is unavailable.
"""

import logging
import numpy as np
from typing import List, Dict, Optional, Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal

logger = logging.getLogger(__name__)

# Embedding dimension
EMBEDDING_DIM = 384


# ------------------------------------------------------------------
# Embedding generation
# ------------------------------------------------------------------

_embedder = None


def _get_embedder():
    """Lazy-load the sentence-transformer model."""
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedder = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Loaded sentence-transformers model: all-MiniLM-L6-v2")
        except ImportError:
            logger.warning("sentence-transformers not installed, using fallback embeddings")
            _embedder = "fallback"
    return _embedder


def _embed_text(text: str) -> List[float]:
    """Generate an embedding vector for the given text."""
    embedder = _get_embedder()

    if embedder == "fallback":
        # Deterministic hash-based fallback (not great quality, but functional)
        from hashlib import sha256
        h = sha256(text.encode()).hexdigest()
        # Convert hex to floats
        vec = []
        for i in range(0, min(len(h), EMBEDDING_DIM * 2), 2):
            vec.append((int(h[i:i+2], 16) - 128) / 128.0)
        # Pad to EMBEDDING_DIM
        while len(vec) < EMBEDDING_DIM:
            vec.append(0.0)
        return vec[:EMBEDDING_DIM]

    embedding = embedder.encode(text[:2000], normalize_embeddings=True)
    return embedding.tolist()


# ------------------------------------------------------------------
# pgvector extension & table setup
# ------------------------------------------------------------------

def ensure_pgvector_extension():
    """Create the pgvector extension if it doesn't exist."""
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
            logger.info("pgvector extension enabled")
    except Exception as e:
        logger.warning(f"Could not enable pgvector extension: {e}")


# ------------------------------------------------------------------
# RAG Service
# ------------------------------------------------------------------

class RAGService:
    """Manages vector embeddings in PostgreSQL via pgvector."""

    def __init__(self):
        ensure_pgvector_extension()
        logger.info("RAG service initialized with pgvector")

    def _get_session(self) -> Session:
        return SessionLocal()

    # ------------------------------------------------------------------
    # Store
    # ------------------------------------------------------------------

    def store_email_context(
        self,
        email_id: int,
        text_content: str,
        analysis: Dict[str, Any],
        user_id: Optional[int] = None,
    ) -> None:
        """Store a processed email as a vector embedding."""
        db = self._get_session()
        try:
            from app.models import PGVECTOR_AVAILABLE
            if not PGVECTOR_AVAILABLE:
                logger.debug("pgvector not available, skipping store")
                return

            from app.models import EmailEmbedding

            content = text_content[:2000]
            embedding = _embed_text(content)

            # Upsert — delete existing then insert
            existing = db.query(EmailEmbedding).filter(
                EmailEmbedding.email_id == email_id
            ).first()

            if existing:
                existing.content = content
                existing.category = str(analysis.get("category", ""))
                existing.urgency_score = int(analysis.get("urgency_score", 0))
                existing.summary = str(analysis.get("summary", ""))[:500]
                existing.embedding = embedding
                existing.user_id = user_id
            else:
                record = EmailEmbedding(
                    user_id=user_id,
                    email_id=email_id,
                    content=content,
                    category=str(analysis.get("category", "")),
                    urgency_score=int(analysis.get("urgency_score", 0)),
                    summary=str(analysis.get("summary", ""))[:500],
                    embedding=embedding,
                )
                db.add(record)

            db.commit()
            logger.debug(f"Stored email embedding for email_id={email_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to store email embedding: {e}")
        finally:
            db.close()

    def store_correction(
        self,
        email_id: int,
        field: str,
        old_value: str,
        new_value: str,
        email_text: str,
        user_id: Optional[int] = None,
    ) -> None:
        """Store a user correction as a vector embedding."""
        db = self._get_session()
        try:
            from app.models import PGVECTOR_AVAILABLE
            if not PGVECTOR_AVAILABLE:
                return

            from app.models import CorrectionEmbedding

            content = (
                f"Correction for email: {email_text[:1000]}\n"
                f"Field '{field}' was '{old_value}' → corrected to '{new_value}'"
            )
            embedding = _embed_text(content)

            record = CorrectionEmbedding(
                user_id=user_id,
                email_id=email_id,
                field=field,
                old_value=str(old_value)[:500],
                new_value=str(new_value)[:500],
                content=content,
                embedding=embedding,
            )
            db.add(record)
            db.commit()
            logger.debug(f"Stored correction embedding for email_id={email_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to store correction embedding: {e}")
        finally:
            db.close()

    # ------------------------------------------------------------------
    # Retrieve
    # ------------------------------------------------------------------

    def retrieve_similar_emails(
        self,
        text_content: str,
        user_id: Optional[int] = None,
        top_k: int = 3,
    ) -> List[Dict[str, Any]]:
        """Find top-K similar past emails using cosine distance."""
        db = self._get_session()
        try:
            from app.models import PGVECTOR_AVAILABLE
            if not PGVECTOR_AVAILABLE:
                return []

            from app.models import EmailEmbedding

            query_embedding = _embed_text(text_content[:2000])
            vec_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

            # Build query with optional user filter
            user_filter = ""
            params = {"vec": vec_str, "limit": top_k}
            if user_id is not None:
                user_filter = "AND user_id = :user_id"
                params["user_id"] = user_id

            sql = text(f"""
                SELECT email_id, content, category, urgency_score, summary,
                       embedding <=> :vec::vector AS distance
                FROM email_embeddings
                WHERE 1=1 {user_filter}
                ORDER BY distance ASC
                LIMIT :limit
            """)

            result = db.execute(sql, params)
            rows = result.fetchall()

            return [
                {
                    "email_id": row[0],
                    "document": row[1],
                    "metadata": {
                        "category": row[2],
                        "urgency_score": row[3],
                        "summary": row[4],
                    },
                    "distance": float(row[5]),
                }
                for row in rows
            ]
        except Exception as e:
            logger.error(f"RAG retrieval failed: {e}")
            return []
        finally:
            db.close()

    def retrieve_corrections(
        self,
        text_content: str,
        user_id: Optional[int] = None,
        top_k: int = 3,
    ) -> List[Dict[str, Any]]:
        """Find relevant past corrections using cosine distance."""
        db = self._get_session()
        try:
            from app.models import PGVECTOR_AVAILABLE
            if not PGVECTOR_AVAILABLE:
                return []

            query_embedding = _embed_text(text_content[:2000])
            vec_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

            user_filter = ""
            params = {"vec": vec_str, "limit": top_k}
            if user_id is not None:
                user_filter = "AND user_id = :user_id"
                params["user_id"] = user_id

            sql = text(f"""
                SELECT email_id, field, old_value, new_value, content,
                       embedding <=> :vec::vector AS distance
                FROM correction_embeddings
                WHERE 1=1 {user_filter}
                ORDER BY distance ASC
                LIMIT :limit
            """)

            result = db.execute(sql, params)
            rows = result.fetchall()

            return [
                {
                    "document": row[4],
                    "metadata": {
                        "email_id": row[0],
                        "field": row[1],
                        "old_value": row[2],
                        "new_value": row[3],
                    },
                    "distance": float(row[5]),
                }
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Correction retrieval failed: {e}")
            return []
        finally:
            db.close()

    # ------------------------------------------------------------------
    # Context builder
    # ------------------------------------------------------------------

    def build_context_prompt(
        self,
        text_content: str,
        user_id: Optional[int] = None,
    ) -> str:
        """
        Build a context block to prepend to the LLM system prompt.
        Combines similar emails and corrections into a single string.
        """
        similar = self.retrieve_similar_emails(text_content, user_id, top_k=3)
        corrections = self.retrieve_corrections(text_content, user_id, top_k=2)

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
