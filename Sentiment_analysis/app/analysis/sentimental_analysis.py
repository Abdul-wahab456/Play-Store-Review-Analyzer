from datetime import datetime
from pathlib import Path

import numpy as np
import torch
from scipy.special import softmax
from transformers import AutoModelForSequenceClassification, AutoTokenizer

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, cache_dir=BASE_DIR / "huggingface")
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, cache_dir=BASE_DIR / "huggingface")

labels = ("negative", "neutral", "positive")


def analyze_sentiment(text: str):
    text = text.replace("\n", " ").strip()
    max_chunk_length = 400
    tokens = tokenizer.tokenize(text)
    chunks = [
        tokens[i : i + max_chunk_length]
        for i in range(0, len(tokens), max_chunk_length)
    ]

    scores_list = []

    for chunk in chunks:
        chunk_text = tokenizer.convert_tokens_to_string(chunk)
        encoded_input = tokenizer(chunk_text, return_tensors="pt", truncation=True)
        with torch.no_grad():
            output = model(**encoded_input)
        scores = softmax(output.logits[0].numpy())
        scores_list.append(scores)

    if len(scores_list) > 1:
        scores = np.mean(scores_list, axis=0)
    else:
        scores = scores_list[0]

    sentiment = labels[np.argmax(scores)]
    confidence = float(np.max(scores))

    rating_estimate = round(1 + 4 * float(scores[2]), 1)

    if scores[2] > 0.85:
        category = "Highly Satisfied"
    elif scores[2] > 0.65:
        category = "Satisfied"
    elif scores[1] > 0.5:
        category = "Mixed Feelings"
    elif scores[0] > 0.6 and scores[0] < 0.8:
        category = "Unsatisfied"
    elif scores[0] >= 0.8:
        category = "Frustrated"
    else:
        category = "Unclear / Mixed"

    return  {
        "sentiment": sentiment,
        "confidence": round(confidence, 4),
        "rating_estimate": rating_estimate,
        "category": category,
        "raw_scores": {
            "negative": round(float(scores[0]), 3),
            "neutral": round(float(scores[1]), 3),
            "positive": round(float(scores[2]), 3),
        },
        "done_at": datetime.now(),
    }
