import os
from typing import List, Optional
from pathlib import Path

import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification

app = FastAPI(title="Log Severity Model Service")

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models" / "severity-model"

tokenizer = None
model = None
device = "cpu"


@app.on_event("startup")
def startup_load_model():
    global tokenizer, model, device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Loading model from {MODEL_DIR} on {device}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
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
    texts = []
    for log in req.logs:
        print("🔍 Received log:", log.originalMessage)
        parts = [log.originalMessage]
        if log.level:
            parts.append(f"[LEVEL: {log.level}]")
        if log.source:
            parts.append(f"[SOURCE: {log.source}]")
        text = " ".join(parts)
        texts.append(text)

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