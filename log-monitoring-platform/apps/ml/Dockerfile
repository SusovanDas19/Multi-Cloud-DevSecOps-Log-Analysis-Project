FROM pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY log-monitoring-platform/apps/ml/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY log-monitoring-platform/apps/ml/service ./service
COPY log-monitoring-platform/apps/ml/models ./models

EXPOSE 8001

RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

CMD ["uvicorn", "service.main:app", "--host", "0.0.0.0", "--port", "8001"]