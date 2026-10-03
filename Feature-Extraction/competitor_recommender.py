"""CompFeat comparative feature advantage recommender.

Extracts review n-grams and ranks features by the sentiment advantage they
exhibit in target-app reviews relative to competitor reviews.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from functools import lru_cache
from typing import Dict, Iterable, List, Tuple

from extractors.feature_extractor import extract_candidate_counts
from extractors.feature_extractor import _simple_lemma
from scorers.cfas_engine import calculate_calibrated_cfas

DEFAULT_STOPWORDS = {
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
    'yours', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them',
    'their', 'theirs', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
    'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the',
    'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at',
    'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
    'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
    'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's',
    't', 'can', 'will', 'just', 'don', 'should', 'now', 'app', 'apps', 'update',
    'latest', 'phone', 'stars', 'star', 'time', 'day', 'days', 'month', 'year',
    'version', 'fix', 'fixes', 'good', 'bad', 'great', 'terrible', 'people',
    'thing', 'things', 'way', 'much'
}

POSITIVE_LEXICON = {
    'love', 'best', 'great', 'awesome', 'seamless', 'flawless', 'incredible',
    'breathtaking', 'smooth', 'faster', 'clean', 'handy', 'inspiring', 'perfect',
    'brilliant', 'effortless', 'super', 'cheaper', 'straightforward', 'unmatched',
    'lifesaver', 'genius', 'worth', 'generous', 'affordable', 'motivating',
    'easily', 'helpful', 'addictive', 'reliable', 'solid', 'recommend', 'excellent',
    'superb', 'crisp', 'intuitive', 'fluid', 'top', 'favorite', 'useful'
}

NEGATIVE_LEXICON = {
    'garbage', 'hate', 'buggy', 'freezes', 'crashing', 'crash', 'compression',
    'terrible', 'worst', 'clunky', 'unintuitive', 'laggy', 'slow', 'horrible',
    'canceled', 'lags', 'bloated', 'unreliable', 'steep', 'eating', 'corrupts',
    'nightmare', 'flaws', 'outrageous', 'spilled', 'cold', 'refused', 'glitchy',
    'ruined', 'greed', 'fails', 'broken', 'sluggish', 'annoying', 'unhelpful',
    'counterproductive', 'punishes', 'dry', 'dated', 'expensive', 'pricey',
    'disconnecting', 'disconnects', 'mess', 'drowned', 'primitive', 'lost', 'drains'
}

NEGATION_LEXICON = {
    'not', 'no', 'never', 'without', "don't", "can't", "didn't", "won't",
    'hardly', 'barely', 'lack', 'lacks', 'cannot', 'neither'
}

GENERIC_DISCOURSE_TOKENS = {
    'app', 'update', 'latest', 'phone', 'device', 'review', 'reviews', 'stars',
    'star', 'problem', 'problems', 'issue', 'issues', 'hours', 'developer',
    'developers', 'screen', 'version', 'fixes', 'glitch'
}


class CompFeatRecommender:
    """Rank candidate features by comparative sentiment and target support."""

    def __init__(
        self,
        context_window: int = 6,
        smoothing_alpha: float = 1.0,
        smoothing_beta: float = 2.0,
        negative_weight: float = 1.25,
        salience_kappa: float = 0.5,
        specificity_penalty: float = 0.5,
    ) -> None:
        if context_window < 0:
            raise ValueError('context_window must be non-negative')
        if smoothing_alpha <= 0:
            raise ValueError('smoothing_alpha must be positive')
        if smoothing_beta <= 0:
            raise ValueError('smoothing_beta must be positive')
        if negative_weight < 0 or salience_kappa < 0:
            raise ValueError('negative_weight and salience_kappa must be non-negative')
        if not 0 <= specificity_penalty <= 1:
            raise ValueError('specificity_penalty must be between 0 and 1')
        self.context_window = context_window
        self.alpha = float(smoothing_alpha)
        self.beta = float(smoothing_beta)
        self.negative_weight = float(negative_weight)
        self.kappa = float(salience_kappa)
        self.penalty = float(specificity_penalty)

    @lru_cache(maxsize=100_000)
    def clean_text(self, text: str) -> str:
        """Normalize contractions and retain alphanumerics, whitespace, hyphens."""
        normalized = str(text).lower().replace("n't", ' not')
        normalized = re.sub(r"'re\b|'ve\b|'ll\b|'d\b|'m\b", ' ', normalized)
        normalized = re.sub(r'[^a-zA-Z0-9\s-]', ' ', normalized)
        return ' '.join(_simple_lemma(token) for token in normalized.split())

    def extract_candidate_ngrams(
        self, reviews: Iterable[str], min_n: int = 2, max_n: int = 3
    ) -> Dict[str, int]:
        """Count dependency-guided feature phrases, at most once per review."""
        if min_n < 1 or max_n < min_n:
            raise ValueError('Require 1 <= min_n <= max_n')
        return extract_candidate_counts(reviews, min_n=min_n, max_n=max_n)

    def score_context_sentiment(self, phrase: str, review: str) -> Tuple[float, float, bool]:
        """Return positive/negative lexicon evidence near every phrase mention."""
        words = self.clean_text(review).split()
        target_tokens = self.clean_text(phrase).split()
        target_len = len(target_tokens)
        if not target_tokens:
            return 0.0, 0.0, False
        starts = [
            index for index in range(len(words) - target_len + 1)
            if words[index:index + target_len] == target_tokens
        ]
        pos_score, neg_score = self._score_occurrences(target_len, words, starts)
        return pos_score, neg_score, bool(starts)

    def _score_occurrences(
        self, target_len: int, words: List[str], starts: List[int]
    ) -> Tuple[float, float]:
        pos_score = neg_score = 0.0
        for start_index in starts:
            start = max(0, start_index - self.context_window)
            end = min(len(words), start_index + target_len + self.context_window)
            negation_remaining = 0
            for token_index in range(start, end):
                if start_index <= token_index < start_index + target_len:
                    continue
                token = words[token_index]
                if token in NEGATION_LEXICON:
                    negation_remaining = 3
                    continue
                if token in POSITIVE_LEXICON:
                    if negation_remaining:
                        neg_score += 1.0
                    else:
                        pos_score += 1.0
                    negation_remaining = 0
                elif token in NEGATIVE_LEXICON:
                    if negation_remaining:
                        pos_score += 0.8
                    else:
                        neg_score += 1.0
                    negation_remaining = 0
                elif negation_remaining:
                    negation_remaining -= 1
        evidence_total = pos_score + neg_score
        if evidence_total:
            pos_score /= evidence_total
            neg_score /= evidence_total
        return pos_score, neg_score

    def score_candidates_in_reviews(
        self, candidates: Iterable[str], reviews: Iterable[str]
    ) -> Dict[str, Tuple[float, float, int]]:
        """Aggregate positive, negative, and mention counts via one review pass."""
        candidate_lengths: Dict[int, set[Tuple[str, ...]]] = {}
        phrase_lookup: Dict[Tuple[str, ...], str] = {}
        for candidate in candidates:
            tokens = tuple(self.clean_text(candidate).split())
            if tokens:
                candidate_lengths.setdefault(len(tokens), set()).add(tokens)
                phrase_lookup[tokens] = candidate
        totals = {candidate: [0.0, 0.0, 0] for candidate in phrase_lookup.values()}
        if not candidate_lengths:
            return {}

        max_length = max(candidate_lengths)
        for review in reviews:
            words = self.clean_text(review).split()
            found: Dict[Tuple[str, ...], List[int]] = {}
            for start_index in range(len(words)):
                for length, phrases in candidate_lengths.items():
                    if start_index + length > len(words):
                        continue
                    phrase_tokens = tuple(words[start_index:start_index + length])
                    if phrase_tokens in phrases:
                        found.setdefault(phrase_tokens, []).append(start_index)
                if start_index + max_length >= len(words):
                    continue
            for phrase_tokens, starts in found.items():
                candidate = phrase_lookup[phrase_tokens]
                positive, negative = self._score_occurrences(
                    len(phrase_tokens), words, starts
                )
                stats = totals[candidate]
                stats[0] += positive
                stats[1] += negative
                stats[2] += 1
        return {
            candidate: (values[0], values[1], int(values[2]))
            for candidate, values in totals.items()
        }

    def compute_cfas_profile(
        self, reviews_target: List[str], reviews_comp: List[str]
    ) -> List[Dict]:
        """Build a descending, Bayesian-calibrated CFAS profile."""
        candidates = set(self.extract_candidate_ngrams(reviews_target))
        candidates.update(self.extract_candidate_ngrams(reviews_comp))
        results = []
        for phrase in candidates:
            pos_t = neg_t = 0.0
            count_t = 0
            for review in reviews_target:
                p, n, found = self.score_context_sentiment(phrase, review)
                if found:
                    pos_t += p
                    neg_t += n
                    count_t += 1

            pos_c = neg_c = 0.0
            count_c = 0
            for review in reviews_comp:
                p, n, found = self.score_context_sentiment(phrase, review)
                if found:
                    pos_c += p
                    neg_c += n
                    count_c += 1
            if count_t == 0:
                continue

            sentiment_target = (pos_t - self.negative_weight * neg_t + self.alpha) / (
                count_t + self.alpha + self.beta
            )
            sentiment_comp = (pos_c - self.negative_weight * neg_c + self.alpha) / (
                count_c + self.alpha + self.beta
            )
            delta_sentiment = sentiment_target - sentiment_comp
            cfas_score = calculate_calibrated_cfas(
                phrase,
                {'pos': pos_t, 'neg': neg_t, 'total': count_t},
                {'pos': pos_c, 'neg': neg_c, 'total': count_c},
                alpha=self.alpha,
                beta=self.beta,
                neg_weight=self.negative_weight,
                kappa=self.kappa,
            )
            specificity = (
                self.penalty
                if any(word in GENERIC_DISCOURSE_TOKENS for word in phrase.split())
                else 1.0
            )
            results.append({
                'feature': phrase,
                'cfas_score': round(cfas_score, 4),
                'delta_sentiment': round(delta_sentiment, 4),
                'sentiment_target': round(sentiment_target, 4),
                'sentiment_competitor': round(sentiment_comp, 4),
                'target_mentions': count_t,
                'competitor_mentions': count_c,
                'specificity_weight': specificity,
                'frequency_dampening': round(math.log2(1 + count_t + count_c), 4),
                'target_salience': round(1 - math.exp(-self.kappa * count_t), 4),
            })

        results.sort(key=lambda item: (-item['cfas_score'], item['feature']))
        return results

    def recommend_top_features(
        self, reviews_target: List[str], reviews_comp: List[str], top_k: int = 5
    ) -> List[Dict]:
        """Return up to ``top_k`` highest-ranked CFAS features."""
        if top_k < 0:
            raise ValueError('top_k must be non-negative')
        return self.compute_cfas_profile(reviews_target, reviews_comp)[:top_k]
