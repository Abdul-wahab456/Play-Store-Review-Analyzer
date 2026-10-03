"""Compare CompFeat with four review-feature ranking baselines."""

from __future__ import annotations

import json
import os
import sys
from typing import Dict, Iterable, List, Mapping, Sequence

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# The existing repository folder uses a hyphen, so it cannot be imported as a
# normal Python package. Add it to the module path while preserving the requested
# on-disk layout and direct script execution.
_FEATURE_EXTRACTION_DIR = os.path.join(os.path.dirname(__file__), 'Feature-Extraction')
if _FEATURE_EXTRACTION_DIR not in sys.path:
    sys.path.insert(0, _FEATURE_EXTRACTION_DIR)

from competitor_recommender import (  # noqa: E402  # type: ignore[reportMissingImports]
    CompFeatRecommender,
)
from evaluation.evaluator import SemanticEvaluator  # noqa: E402
from scorers.cfas_engine import calculate_calibrated_cfas  # noqa: E402

SYNTACTIC_FEATURE_SEEDS = {
    'sync', 'sharing', 'share', 'connect', 'save', 'tracking', 'track', 'coaching',
    'lessons', 'pricing', 'order', 'delivery', 'search', 'export', 'scanning',
    'runs', 'streaming', 'pickup', 'playlist', 'graph', 'database', 'streak',
    'voice', 'audio', 'leaderboard', 'challenge', 'collaboration', 'dialogues',
    'route', 'navigation', 'coauthor', 'passwords', 'encryption', 'vault',
    'timer', 'scanner', 'discounts', 'trading', 'exchange', 'huddles',
}
DATASET_PATH = os.path.join('data', 'benchmark_real_52_apps.json')
MAX_CANDIDATES_PER_DIRECTION = 500


def load_evaluation_dataset(filepath: str) -> List[Dict]:
    """Load and validate the scraper's pair-list JSON dataset."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f'File {filepath} not found. Run scrape_real_reviews.py first.')
    with open(filepath, 'r', encoding='utf-8') as handle:
        dataset = json.load(handle)
    if not isinstance(dataset, list):
        raise ValueError('Evaluation dataset must be a JSON list of app pairs.')
    return dataset


def compute_ranking_metrics(
    ranked_candidates: Sequence[str],
    ground_truth: Sequence[str],
    vectorizer: TfidfVectorizer | None = None,
    threshold: float = 0.78,
    k_vals: Sequence[int] = (1, 3, 5),
    evaluator: SemanticEvaluator | None = None,
) -> Dict[str, float]:
    """Compute consistently semantically aligned ranking metrics."""
    del vectorizer  # Retained for compatibility with the previous API.
    if not ground_truth:
        return {
            'MRR': 0.0, 'Hit@1': 0.0, 'Hit@3': 0.0,
            'Hit@5': 0.0, 'Precision@5': 0.0, 'Recall@5': 0.0,
        }
    semantic_evaluator = evaluator or SemanticEvaluator(threshold=threshold)
    similarities = semantic_evaluator.similarity_matrix(ranked_candidates, ground_truth)
    first_hit_rank = None
    matched_gt = set()
    for rank, row in enumerate(similarities, start=1):
        eligible = [
            index for index, similarity in enumerate(row)
            if similarity >= threshold and index not in matched_gt
        ]
        if eligible:
            if first_hit_rank is None:
                first_hit_rank = rank
            if rank <= 5:
                matched_gt.add(max(eligible, key=lambda index: row[index]))

    mrr = 1.0 / first_hit_rank if first_hit_rank is not None else 0.0
    hit_rates = {
        cutoff: float(first_hit_rank is not None and first_hit_rank <= cutoff)
        for cutoff in k_vals
    }
    return {
        'MRR': mrr,
        'Hit@1': hit_rates.get(1, 0.0),
        'Hit@3': hit_rates.get(3, 0.0),
        'Hit@5': hit_rates.get(5, 0.0),
        'Precision@5': len(matched_gt) / 5.0,
        'Recall@5': len(matched_gt) / float(len(ground_truth)),
    }


def _compute_candidate_stats(
    candidates: Iterable[str],
    reviews_target: Sequence[str],
    reviews_comp: Sequence[str],
    recommender: CompFeatRecommender,
) -> Dict[str, Dict[str, float]]:
    """Compute the shared per-candidate counts and sentiment evidence once."""
    candidate_list = list(candidates)
    target_scores = recommender.score_candidates_in_reviews(candidate_list, reviews_target)
    competitor_scores = recommender.score_candidates_in_reviews(candidate_list, reviews_comp)
    return {
        candidate: {
            'cnt_t': target_scores.get(candidate, (0.0, 0.0, 0))[2],
            'pos_t': target_scores.get(candidate, (0.0, 0.0, 0))[0],
            'neg_t': target_scores.get(candidate, (0.0, 0.0, 0))[1],
            'cnt_c': competitor_scores.get(candidate, (0.0, 0.0, 0))[2],
            'pos_c': competitor_scores.get(candidate, (0.0, 0.0, 0))[0],
            'neg_c': competitor_scores.get(candidate, (0.0, 0.0, 0))[1],
        }
        for candidate in candidate_list
    }


def rank_candidates_by_paradigm(
    paradigm: str,
    candidates: Iterable[str],
    reviews_target: Sequence[str],
    reviews_comp: Sequence[str],
    recommender: CompFeatRecommender,
    vectorizer: TfidfVectorizer | np.ndarray,
    precomputed_stats: Mapping[str, Mapping[str, float]] | None = None,
) -> List[str]:
    """Rank the same candidate set using one of the five requested methods."""
    cand_list = list(candidates)
    stats = precomputed_stats or _compute_candidate_stats(
        cand_list, reviews_target, reviews_comp, recommender
    )

    if paradigm == 'Raw Frequency':
        return sorted(cand_list, key=lambda c: (-stats[c]['cnt_t'], c))
    if paradigm == 'Negative Frequency':
        return sorted(cand_list, key=lambda c: (-stats[c]['neg_t'], c))
    if paradigm == 'SAFE / KEFE':
        def score_safe(candidate: str) -> float:
            current = stats[candidate]
            has_seed = any(token in SYNTACTIC_FEATURE_SEEDS for token in candidate.split())
            if not has_seed or current['cnt_t'] == 0:
                return -999.0 + current['cnt_t'] * 0.001
            net = (current['pos_t'] - current['neg_t']) / (
                current['pos_t'] + current['neg_t'] + 1.0
            )
            return net * np.log1p(current['cnt_t'])
        return sorted(cand_list, key=lambda c: (-score_safe(c), c))
    if paradigm == 'SAFER-Style':
        if isinstance(vectorizer, np.ndarray):
            candidate_embeddings = vectorizer
            similarity_matrix = candidate_embeddings @ candidate_embeddings.T
        else:
            candidate_vectors = vectorizer.transform(cand_list)
            similarity_matrix = cosine_similarity(candidate_vectors)
        def score_safer(candidate: str) -> float:
            current = stats[candidate]
            if current['cnt_t'] == 0:
                return -999.0
            index = candidate_index[candidate]
            neighbors = np.flatnonzero(similarity_matrix[index] > 0.40)
            cluster_t = sum(stats[cand_list[n]]['cnt_t'] for n in neighbors)
            cluster_c = sum(stats[cand_list[n]]['cnt_c'] for n in neighbors)
            prominence = cluster_t / (cluster_t + cluster_c + 1.0)
            return prominence * np.log1p(current['cnt_t'])
        candidate_index = {candidate: index for index, candidate in enumerate(cand_list)}
        return sorted(cand_list, key=lambda c: (-score_safer(c), c))
    if paradigm == 'CompFeat':
        def score_cfas(candidate: str) -> float:
            current = stats[candidate]
            return calculate_calibrated_cfas(
                candidate,
                {
                    'pos': current['pos_t'],
                    'neg': current['neg_t'],
                    'total': current['cnt_t'],
                },
                {
                    'pos': current['pos_c'],
                    'neg': current['neg_c'],
                    'total': current['cnt_c'],
                },
                alpha=recommender.alpha,
                beta=recommender.beta,
                neg_weight=recommender.negative_weight,
                kappa=recommender.kappa,
            )
        return sorted(cand_list, key=lambda c: (-score_cfas(c), c))
    raise ValueError(f'Unknown ranking paradigm: {paradigm}')


def _limit_candidates(
    candidates_a: Mapping[str, int], candidates_b: Mapping[str, int], limit: int
) -> List[str]:
    """Keep the most-mentioned union to bound the all-pairs similarity baseline."""
    combined = dict(candidates_a)
    for candidate, count in candidates_b.items():
        combined[candidate] = combined.get(candidate, 0) + count
    return sorted(combined, key=lambda c: (-combined[c], c))[:limit]


def main() -> None:
    dataset = load_evaluation_dataset(DATASET_PATH)
    all_texts = []
    for item in dataset:
        all_texts.extend(item.get('reviews_a', []))
        all_texts.extend(item.get('reviews_b', []))
        all_texts.extend(item.get('ground_truth_a', []))
        all_texts.extend(item.get('ground_truth_b', []))
    if not all_texts:
        raise ValueError('No review or ground-truth text is available to evaluate.')

    semantic_evaluator = SemanticEvaluator(threshold=0.78)
    semantic_evaluator.fit_fallback(all_texts)
    recommender = CompFeatRecommender()
    paradigms = [
        'Raw Frequency', 'Negative Frequency', 'SAFE / KEFE',
        'SAFER-Style', 'CompFeat',
    ]
    results_accumulator = {paradigm: [] for paradigm in paradigms}
    skipped_directions = 0

    for item in dataset:
        reviews_a = item.get('reviews_a') or []
        reviews_b = item.get('reviews_b') or []
        gt_a = item.get('ground_truth_a') or []
        gt_b = item.get('ground_truth_b') or []
        if not reviews_a or not reviews_b:
            skipped_directions += 2
            continue

        candidates_a = recommender.extract_candidate_ngrams(reviews_a)
        candidates_b = recommender.extract_candidate_ngrams(reviews_b)
        candidates = _limit_candidates(
            candidates_a, candidates_b, MAX_CANDIDATES_PER_DIRECTION
        )
        candidate_embeddings = semantic_evaluator.encode(candidates)
        directions = [
            (reviews_a, reviews_b, gt_a),
            (reviews_b, reviews_a, gt_b),
        ]
        for reviews_target, reviews_comp, ground_truth in directions:
            stats = _compute_candidate_stats(
                candidates, reviews_target, reviews_comp, recommender
            )
            ground_truth_embeddings = semantic_evaluator.encode(ground_truth)
            semantic_matrix = candidate_embeddings @ ground_truth_embeddings.T
            for candidate_index, candidate in enumerate(candidates):
                for truth_index, truth in enumerate(ground_truth):
                    lexical = 1.0 if candidate.strip().casefold() == truth.strip().casefold() else semantic_evaluator._token_overlap(candidate, truth)
                    semantic_matrix[candidate_index, truth_index] = max(
                        semantic_matrix[candidate_index, truth_index], lexical
                    )
            candidate_indexes = {candidate: index for index, candidate in enumerate(candidates)}
            for paradigm in paradigms:
                ranked = rank_candidates_by_paradigm(
                    paradigm, candidates, reviews_target, reviews_comp,
                    recommender, candidate_embeddings, precomputed_stats=stats,
                )
                ordered_matrix = semantic_matrix[
                    [candidate_indexes[candidate] for candidate in ranked]
                ] if ranked else np.zeros((0, len(ground_truth)))
                metrics = _metrics_from_similarity_matrix(
                    ordered_matrix,
                    len(ground_truth),
                    threshold=(
                        semantic_evaluator.threshold
                        if semantic_evaluator.model is not None
                        else semantic_evaluator.fallback_threshold
                    ),
                )
                results_accumulator[paradigm].append(metrics)

    summary = []
    for paradigm in paradigms:
        frame = pd.DataFrame(results_accumulator[paradigm])
        summary.append({
            'Method Paradigm': paradigm,
            **{
                metric: round(float(frame[metric].mean()), 3) if not frame.empty else 0.0
                for metric in ('MRR', 'Hit@1', 'Hit@3', 'Hit@5', 'Precision@5', 'Recall@5')
            },
        })

    print('\nREAL EVALUATION RESULTS (GOOGLE PLAY APP PAIRS):')
    print(pd.DataFrame(summary).to_string(index=False))
    print(
        f'\nEvaluated {len(dataset) * 2 - skipped_directions} directions; '
        f'skipped {skipped_directions} directions with missing app reviews. '
        f'Candidate cap: {MAX_CANDIDATES_PER_DIRECTION} per direction. '
        f'Semantic backend: {semantic_evaluator.backend}.'
    )


def _metrics_from_similarity_matrix(
    similarities: np.ndarray, ground_truth_count: int, threshold: float
) -> Dict[str, float]:
    """Compute metrics from a ranked candidate-by-reference score matrix."""
    if ground_truth_count == 0:
        return {
            'MRR': 0.0, 'Hit@1': 0.0, 'Hit@3': 0.0,
            'Hit@5': 0.0, 'Precision@5': 0.0, 'Recall@5': 0.0,
        }
    first_hit_rank = None
    matched_ground_truth = set()
    for rank, row in enumerate(similarities, start=1):
        available = [
            index for index, value in enumerate(row)
            if value >= threshold and index not in matched_ground_truth
        ]
        if available:
            if first_hit_rank is None:
                first_hit_rank = rank
            if rank <= 5:
                matched_ground_truth.add(max(available, key=lambda index: row[index]))
    return {
        'MRR': 1.0 / first_hit_rank if first_hit_rank else 0.0,
        'Hit@1': float(first_hit_rank is not None and first_hit_rank <= 1),
        'Hit@3': float(first_hit_rank is not None and first_hit_rank <= 3),
        'Hit@5': float(first_hit_rank is not None and first_hit_rank <= 5),
        'Precision@5': len(matched_ground_truth) / 5.0,
        'Recall@5': len(matched_ground_truth) / ground_truth_count,
    }


if __name__ == '__main__':
    main()
