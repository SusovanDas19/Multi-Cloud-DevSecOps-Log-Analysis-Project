# ── Stage 1: Build / install deps ────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY log-monitoring-platform/apps/ml/requirements.txt ./

# Install CPU-only torch first (much smaller — ~200MB vs 2.5GB for CUDA)
# then install remaining deps
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
      torch==2.3.1 --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir \
      fastapi==0.111.0 \
      uvicorn==0.30.1 \
      transformers==4.41.2 \
      pydantic==2.7.1

# ── Stage 2: Run ─────────────────────────────────────────────────
FROM python:3.11-slim AS runner

WORKDIR /app

# Security: upgrade packages
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn

# Copy app code and model
COPY log-monitoring-platform/apps/ml/service ./service
COPY log-monitoring-platform/apps/ml/models ./models

EXPOSE 8001

RUN useradd -m -u 1001 appuser
USER appuser

CMD ["uvicorn", "service.main:app", "--host", "0.0.0.0", "--port", "8001"]