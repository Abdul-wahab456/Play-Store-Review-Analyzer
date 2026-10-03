"""Uniform semantic ground-truth alignment for ranked feature candidates."""

from __future__ import annotations

import re
from typing import List, Sequence

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_TOKEN_RE = re.compile(r"[a-z0-9]+(?:[-'][a-z0-9]+)*", re.IGNORECASE)


def _normalize_tokens(text: str) -> List[str]:
    tokens = [token.lower() for token in _TOKEN_RE.findall(text)]
    normalized = []
    for token in tokens:
        if len(token) > 5 and token.endswith('ies'):
            token = token[:-3] + 'y'
        elif len(token) > 4 and token.endswith('s') and not token.endswith(('ss', 'us', 'is')):
            token = token[:-1]
        normalized.append(token)
    return normalized


class SemanticEvaluator:
    """Align extracted phrases using lexical checks and optional MiniLM vectors.

    If ``sentence-transformers`` or its model is unavailable, the evaluator uses
    character n-gram TF-IDF as a transparent lexical-similarity fallback. The
    ``backend`` property exposes which mode was actually used.
    """

    def __init__(self, threshold: float = 0.78) -> None:
        if not 0 <= threshold <= 1:
            raise ValueError('threshold must be between 0 and 1')
        self.threshold = threshold
        self.fallback_threshold = min(threshold, 0.45)
        self.model = None
        self.fallback_vectorizer = None
        self.backend = 'char_tfidf_fallback'
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            self.backend = 'all-MiniLM-L6-v2'
        except (ImportError, OSError, RuntimeError, ValueError):
            # Model dependency/download is optional to keep evaluation usable in
            # offline and resource-constrained environments.
            self.model = None

    def fit_fallback(self, corpus: Sequence[str]) -> None:
        """Fit shared lexical vectors when MiniLM is unavailable."""
        if self.model is None and corpus:
            self.fallback_vectorizer = TfidfVectorizer(
                analyzer='char_wb', ngram_range=(2, 5)
            ).fit(list(corpus))

    @staticmethod
    def _token_overlap(candidate: str, ground_truth: str) -> float:
        candidate_tokens = set(_normalize_tokens(candidate))
        truth_tokens = set(_normalize_tokens(ground_truth))
        if not candidate_tokens or not truth_tokens:
            return 0.0
        if candidate_tokens.issubset(truth_tokens) or truth_tokens.issubset(candidate_tokens):
            return 0.85
        return len(candidate_tokens & truth_tokens) / len(candidate_tokens | truth_tokens)

    def similarity_matrix(
        self, candidates: Sequence[str], ground_truth: Sequence[str]
    ) -> np.ndarray:
        """Return candidate-by-ground-truth similarities, computing vectors in batches."""
        if not candidates or not ground_truth:
            return np.zeros((len(candidates), len(ground_truth)), dtype=float)
        if self.model is not None:
            texts = list(candidates) + list(ground_truth)
            vectors = self.model.encode(
                texts, convert_to_numpy=True, normalize_embeddings=True,
                batch_size=128, show_progress_bar=False,
            )
            candidate_vectors = vectors[:len(candidates)]
            truth_vectors = vectors[len(candidates):]
            dense_similarities = candidate_vectors @ truth_vectors.T
        else:
            vectorizer = self.fallback_vectorizer or TfidfVectorizer(
                analyzer='char_wb', ngram_range=(2, 5)
            )
            if self.fallback_vectorizer is None:
                vectorizer.fit(list(candidates) + list(ground_truth))
            vectors = vectorizer.transform(list(candidates) + list(ground_truth))
            candidate_vectors = vectors[:len(candidates)]
            truth_vectors = vectors[len(candidates):]
            dense_similarities = cosine_similarity(candidate_vectors, truth_vectors)

        similarities = np.asarray(dense_similarities, dtype=float)
        for candidate_index, candidate in enumerate(candidates):
            candidate_norm = candidate.strip().casefold()
            for truth_index, truth in enumerate(ground_truth):
                truth_norm = truth.strip().casefold()
                lexical = 1.0 if candidate_norm == truth_norm else self._token_overlap(candidate, truth)
                similarities[candidate_index, truth_index] = max(
                    float(similarities[candidate_index, truth_index]), lexical
                )
        return similarities

    def encode(self, texts: Sequence[str]) -> np.ndarray:
        """Encode text using MiniLM or a deterministic TF-IDF fallback."""
        if not texts:
            return np.zeros((0, 0), dtype=float)
        if self.model is not None:
            return np.asarray(self.model.encode(
                list(texts), convert_to_numpy=True, normalize_embeddings=True,
                batch_size=128, show_progress_bar=False,
            ), dtype=float)
        vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 5))
        if self.fallback_vectorizer is not None:
            return self.fallback_vectorizer.transform(list(texts)).toarray()
        return vectorizer.fit_transform(list(texts)).toarray()

    def is_match(self, candidate: str, ground_truth_list: List[str]) -> bool:
        if not ground_truth_list or not candidate.strip():
            return False
        similarities = self.similarity_matrix([candidate], ground_truth_list)
        cutoff = self.threshold if self.model is not None else self.fallback_threshold
        return bool(float(np.max(similarities)) >= cutoff)

    def compute_ranking_metrics(
        self, ranked_candidates: List[str], ground_truth: List[str]
    ) -> tuple[float, float, float, float]:
        """Return MRR, Hit@1, Hit@3, and Hit@5 for semantic matches."""
        if not ranked_candidates or not ground_truth:
            return 0.0, 0.0, 0.0, 0.0
        similarities = self.similarity_matrix(ranked_candidates, ground_truth)
        cutoff = self.threshold if self.model is not None else self.fallback_threshold
        matched_ranks = [
            rank for rank, row in enumerate(similarities, start=1)
            if np.any(row >= cutoff)
        ]
        if not matched_ranks:
            return 0.0, 0.0, 0.0, 0.0
        first_rank = min(matched_ranks)
        return (
            1.0 / first_rank,
            float(first_rank <= 1),
            float(first_rank <= 3),
            float(first_rank <= 5),
        )
