FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (gcc for C extensions, curl for healthcheck)
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install watchfiles for fast reload inside Docker
RUN pip install --no-cache-dir watchfiles

# Copy application code
COPY . .

EXPOSE 8000

# Default command (overridden by docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
