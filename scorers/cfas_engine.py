"""Interpretable Bayesian-smoothed Comparative Feature Advantage Scoring."""

from __future__ import annotations

import math
from typing import Mapping


def calculate_calibrated_cfas(
    feature: str,
    stats_a: Mapping[str, int | float],
    stats_b: Mapping[str, int | float],
    alpha: float = 1.0,
    beta: float = 2.0,
    neg_weight: float = 1.25,
    kappa: float = 0.5,
) -> float:
    """Score feature advantage using smoothed polarity, frequency, and salience.

    Stats dictionaries use ``pos``, ``neg``, and ``total`` keys. ``total`` is
    the number of reviews mentioning the feature; positive/negative values are
    review-level polarity evidence and may both be zero for neutral mentions.
    """
    del feature  # Kept in the API for traceability and future feature priors.
    if alpha <= 0 or beta <= 0 or neg_weight < 0 or kappa < 0:
        raise ValueError('alpha/beta must be positive; neg_weight/kappa non-negative')

    def validate(stats: Mapping[str, int | float]) -> tuple[float, float, float]:
        positive = float(stats.get('pos', 0))
        negative = float(stats.get('neg', 0))
        total = float(stats.get('total', 0))
        if min(positive, negative, total) < 0:
            raise ValueError('Sentiment counts cannot be negative')
        if positive > total or negative > total:
            raise ValueError('Positive and negative evidence cannot exceed total mentions')
        return positive, negative, total

    pos_a, neg_a, total_a = validate(stats_a)
    pos_b, neg_b, total_b = validate(stats_b)

    sentiment_a = (pos_a - neg_weight * neg_a + alpha) / (total_a + alpha + beta)
    sentiment_b = (pos_b - neg_weight * neg_b + alpha) / (total_b + alpha + beta)
    total_frequency = total_a + total_b
    if total_frequency == 0:
        return 0.0

    frequency_dampening = math.log2(1.0 + total_frequency)
    salience_gate = 1.0 - math.exp(-kappa * total_a)
    score = frequency_dampening * (sentiment_a - sentiment_b) * salience_gate
    return float(score)
