# Use PyTorch's own official CPU image — torch is already installed
# This avoids downloading 2.5GB of torch on every build
FROM pytorch/pytorch:2.3.1-cuda11.8-cudnn8-runtime AS builder

WORKDIR /app

# Install only the remaining packages (fastapi, uvicorn, transformers, pydantic)
COPY log-monitoring-platform/apps/ml/requirements.txt ./
RUN pip install --no-cache-dir \
    fastapi==0.111.0 \
    uvicorn==0.30.1 \
    transformers==4.41.2 \
    pydantic==2.7.1

# ── Final image ───────────────────────────────────────────────────
FROM pytorch/pytorch:2.3.1-cuda11.8-cudnn8-runtime AS runner

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /opt/conda/lib/python3.10/site-packages /opt/conda/lib/python3.10/site-packages
COPY --from=builder /opt/conda/bin/uvicorn /opt/conda/bin/uvicorn

# Copy app code and model
COPY log-monitoring-platform/apps/ml/service ./service
COPY log-monitoring-platform/apps/ml/models ./models

EXPOSE 8001

RUN useradd -m -u 1001 appuser
USER appuser

CMD ["uvicorn", "service.main:app", "--host", "0.0.0.0", "--port", "8001"]