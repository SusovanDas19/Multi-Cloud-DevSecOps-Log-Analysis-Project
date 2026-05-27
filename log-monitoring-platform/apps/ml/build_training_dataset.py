import os
import random
import pandas as pd

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")

# (filename, logical level)
SOURCE_FILES = [
    ("CriticalLogs.csv", "Critical"),
    ("ErrorLogs.csv", "Error"),
    ("WarningLogs.csv", "Warning"),
    ("InfoLogs.csv", "Info"),
]

CANDIDATE_MSG_COLS = [
    "Message",
    "message",
    "originalMessage",
    "OriginalMessage",
    "Description",
]

def pick_message_column(df: pd.DataFrame) -> str:
    for col in CANDIDATE_MSG_COLS:
        if col in df.columns:
            return col
    text_cols = [c for c in df.columns if df[c].dtype == "object"]
    if not text_cols:
        raise ValueError(f"Could not find a text column in columns: {df.columns}")
    return text_cols[0]

def assign_severity(level: str, n: int):
    """Option B: random ranges per level."""
    if level.lower().startswith("critical"):
        # Critical: 8–10
        return [random.randint(8, 10) for _ in range(n)]
    elif level.lower().startswith("error"):
        # Error: 6–8
        return [random.randint(6, 8) for _ in range(n)]
    elif level.lower().startswith("warning"):
        # Warning: 3–5
        return [random.randint(3, 5) for _ in range(n)]
    else:
        # Info/default: 0–2
        return [random.randint(0, 2) for _ in range(n)]

def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    all_rows = []

    for filename, level in SOURCE_FILES:
        path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(path):
            print(f"⚠️  Skipping {filename} (not found in data/)")
            continue

        print(f"📥 Reading {path}")
        df = pd.read_csv(path)

        msg_col = pick_message_column(df)
        msgs = df[msg_col].astype(str).tolist()
        severities = assign_severity(level, len(msgs))

        for msg, sev in zip(msgs, severities):
            all_rows.append(
                {
                    "originalMessage": msg,
                    "severity": sev,
                }
            )

    if not all_rows:
        raise RuntimeError("No rows collected from any CSV – check file paths/names.")

    csv_from_csvs = pd.DataFrame(all_rows)

    db_path = os.path.join(DATA_DIR, "logs_for_training.csv")
    if os.path.exists(db_path):
        print(f"📥 Also including DB dataset from {db_path}")
        db_df = pd.read_csv(db_path)
        if "originalMessage" in db_df.columns and "severity" in db_df.columns:
            db_df = db_df[["originalMessage", "severity"]]
            merged = pd.concat([db_df, csv_from_csvs], ignore_index=True)
        else:
            merged = csv_from_csvs
    else:
        merged = csv_from_csvs

    merged = merged.sample(frac=1.0, random_state=42).reset_index(drop=True)

    out_path = os.path.join(DATA_DIR, "logs_for_training_merged.csv")
    merged.to_csv(out_path, index=False, encoding="utf-8")

    print(f"✅ Final merged dataset saved to: {out_path}")
    print(f"   Total rows: {len(merged)}")


if __name__ == "__main__":
    main()
