from pathlib import Path
from typing import List, Optional

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForSequenceClassification, AutoTokenizer

app = FastAPI(title="Log Severity Model Service")

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models" / "severity-model"
BASE_MODEL_NAME = "distilbert-base-uncased"
NUM_LABELS = 11

tokenizer = None
model = None
device = "cpu"


def has_local_model_artifacts(model_dir: Path) -> bool:
    if not model_dir.exists():
        return False

    expected_files = [
        "config.json",
        "tokenizer.json",
        "tokenizer_config.json",
        "special_tokens_map.json",
        "pytorch_model.bin",
        "model.safetensors",
        "vocab.txt",
        "merges.txt",
    ]

    return any((model_dir / name).exists() for name in expected_files)


@app.on_event("startup")
def startup_load_model():
    global tokenizer, model, device

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if has_local_model_artifacts(MODEL_DIR):
        source = str(MODEL_DIR)
        print(f"Loading model from local folder: {source} on {device}...")
        tokenizer = AutoTokenizer.from_pretrained(source)
        model = AutoModelForSequenceClassification.from_pretrained(source)
    else:
        print(
            f"Local model not found at {MODEL_DIR}. "
            f"Falling back to base model: {BASE_MODEL_NAME}."
        )
        tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)
        model = AutoModelForSequenceClassification.from_pretrained(
            BASE_MODEL_NAME,
            num_labels=NUM_LABELS,
            ignore_mismatched_sizes=True,
        )

    model.to(device)
    model.eval()
    print("Model loaded ✅")


class LogInput(BaseModel):
    originalMessage: str
    level: Optional[str] = None
    source: Optional[str] = None
    eventId: Optional[int] = None


class BatchRequest(BaseModel):
    logs: List[LogInput]


class SeverityResult(BaseModel):
    severity: int


class BatchResponse(BaseModel):
    results: List[SeverityResult]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze-log-batch", response_model=BatchResponse)
def analyze_log_batch(req: BatchRequest):
    if tokenizer is None or model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")

    texts = []
    for log in req.logs:
        print("🔍 Received log:", log.originalMessage)
        parts = [log.originalMessage]
        if log.level:
            parts.append(f"[LEVEL: {log.level}]")
        if log.source:
            parts.append(f"[SOURCE: {log.source}]")
        texts.append(" ".join(parts))

    enc = tokenizer(
        texts,
        truncation=True,
        max_length=256,
        padding=True,
        return_tensors="pt",
    )

    enc = {k: v.to(device) for k, v in enc.items()}

    with torch.no_grad():
        outputs = model(**enc)
        logits = outputs.logits
        preds = torch.argmax(logits, dim=-1).cpu().tolist()

    results = [SeverityResult(severity=int(s)) for s in preds]
    return BatchResponse(results=results)