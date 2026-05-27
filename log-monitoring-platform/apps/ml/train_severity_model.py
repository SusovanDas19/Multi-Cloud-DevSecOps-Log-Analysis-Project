import os
import pandas as pd
from datasets import Dataset, ClassLabel
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)
import torch
from sklearn.metrics import accuracy_score, f1_score


DATA_PATH = os.path.join("data", "logs_for_training_merged.csv")
MODEL_DIR = os.path.join("models", "severity-model")
BASE_MODEL_NAME = "distilbert-base-uncased"


def load_data():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Training CSV not found at: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    # Basic cleaning
    df = df.dropna(subset=["originalMessage", "severity"])
    df["originalMessage"] = df["originalMessage"].astype(str)

    # Clip severity to [0, 10] and cast to int
    df["severity"] = df["severity"].clip(0, 10).astype(int)

    # Create HF dataset
    dataset = Dataset.from_pandas(df[["originalMessage", "severity"]])

    # 90/10 train/val split
    dataset = dataset.train_test_split(test_size=0.1, seed=42)
    train_ds = dataset["train"]
    val_ds = dataset["test"]

    # Provide label metadata (0–10)
    num_classes = 11
    severity_label = ClassLabel(num_classes=num_classes)

    train_ds = train_ds.cast_column("severity", severity_label)
    val_ds = val_ds.cast_column("severity", severity_label)

    return train_ds, val_ds, severity_label


def main():
    os.makedirs(MODEL_DIR, exist_ok=True)
    train_ds, val_ds, severity_label = load_data()

    train_ds = train_ds.rename_column("severity", "labels")
    val_ds = val_ds.rename_column("severity", "labels")

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)

    def preprocess(batch):
      return tokenizer(
          batch["originalMessage"],
          truncation=True,
          max_length=256,
      )

    train_enc = train_ds.map(preprocess, batched=True)
    val_enc = val_ds.map(preprocess, batched=True)



    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    model = AutoModelForSequenceClassification.from_pretrained(
        BASE_MODEL_NAME,
        num_labels=severity_label.num_classes,
    )

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = logits.argmax(axis=-1)
        acc = accuracy_score(labels, preds)
        f1 = f1_score(labels, preds, average="weighted")
        return {"accuracy": acc, "f1": f1}

    training_args = TrainingArguments(
    output_dir=MODEL_DIR,
    learning_rate=5e-5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=2,
    weight_decay=0.01,
    logging_steps=50,
)


    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_enc,
        eval_dataset=val_enc,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    trainer.train()

    trainer.save_model(MODEL_DIR)
    tokenizer.save_pretrained(MODEL_DIR)

    labels_path = os.path.join(MODEL_DIR, "severity_labels.txt")
    with open(labels_path, "w", encoding="utf-8") as f:
        for i in range(severity_label.num_classes):
            f.write(str(i) + "\n")

    print(f"✅ Model trained and saved to {MODEL_DIR}")


if __name__ == "__main__":
    if torch.cuda.is_available():
        print("Using CUDA:", torch.cuda.get_device_name(0))
    else:
        print("Using CPU")
    main()
