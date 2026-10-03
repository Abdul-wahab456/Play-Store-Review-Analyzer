"""Dependency-guided candidate feature extraction with a safe lightweight fallback."""

from __future__ import annotations

import re
from collections import Counter
from functools import lru_cache
from typing import Iterable, List, Set

DOMAIN_STOPWORDS: Set[str] = {
    'app', 'application', 'phone', 'device', 'update', 'version', 'review',
    'developer', 'star', 'fix', 'issue', 'problem', 'bug', 'thing', 'user',
    'people', 'time', 'day', 'way', 'bit', 'lot', 'item', 'everything',
    'use', 'using', 'used', 'get', 'got', 'make', 'made', 'one', 'would',
    'could', 'really', 'still', 'even', 'much', 'many', 'something', 'anything',
    'good', 'bad', 'great', 'terrible', 'awesome', 'excellent', 'amazing',
    'best', 'worst', 'love', 'hate', 'perfect', 'nice', 'useful', 'helpful',
}
GRAMMATICAL_STOPWORDS: Set[str] = {
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'as', 'at', 'by', 'for',
    'from', 'in', 'into', 'of', 'on', 'to', 'with', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'it', 'its', 'this', 'that', 'these',
    'those', 'my', 'your', 'our', 'their', 'i', 'we', 'you', 'they', 'he',
    'she', 'me', 'him', 'her', 'them', 'very', 'so', 'too', 'just', 'not',
}
_TOKEN_RE = re.compile(r"[a-z0-9]+(?:[-'][a-z0-9]+)*", re.IGNORECASE)


def _simple_lemma(token: str) -> str:
    """Conservative inflection normalization used if spaCy is unavailable."""
    if len(token) > 5 and token.endswith('ies'):
        return token[:-3] + 'y'
    if len(token) > 5 and token.endswith(('ches', 'shes', 'sses', 'xes', 'zes')):
        return token[:-2]
    if len(token) > 4 and token.endswith('s') and not token.endswith(('ss', 'us', 'is')):
        return token[:-1]
    if len(token) > 5 and token.endswith('ing'):
        stem = token[:-3]
        if len(stem) > 2 and stem[-1] == stem[-2]:
            stem = stem[:-1]
        elif stem.endswith(('c', 'v', 's')) or (stem.endswith('k') and not stem.endswith('ck')):
            stem += 'e'
        elif stem.endswith('ch'):
            stem += 'e'
        return stem
    return token


@lru_cache(maxsize=1)
def _load_spacy_model():
    """Load the small English parser when its optional dependency/model exist."""
    try:
        import spacy
        return spacy.load('en_core_web_sm', disable=['ner'])
    except (ImportError, OSError):
        return None


def _fallback_candidates(text: str, min_n: int, max_n: int) -> List[str]:
    words = [_simple_lemma(token.lower()) for token in _TOKEN_RE.findall(text)]
    words = [word for word in words if word]
    found = set()
    for n in range(min_n, max_n + 1):
        for start in range(len(words) - n + 1):
            chunk = words[start:start + n]
            if (chunk[0] in DOMAIN_STOPWORDS | GRAMMATICAL_STOPWORDS
                    or chunk[-1] in DOMAIN_STOPWORDS | GRAMMATICAL_STOPWORDS):
                continue
            useful = [
                word for word in chunk
                if word not in DOMAIN_STOPWORDS | GRAMMATICAL_STOPWORDS
            ]
            if len(useful) < min_n:
                continue
            phrase = ' '.join(useful)
            if len(phrase) >= 4:
                found.add(phrase)
    return sorted(found)


def extract_candidate_features(text: str, min_n: int = 2, max_n: int = 4) -> List[str]:
    """Extract normalized 2–4 token feature phrases from one review.

    spaCy noun chunks and compound/adjectival dependencies are used when
    ``en_core_web_sm`` is installed. Otherwise contiguous lexical chunks provide
    a deterministic, dependency-free fallback.
    """
    if not isinstance(text, str) or not text.strip():
        return []
    if min_n < 1 or max_n < min_n:
        raise ValueError('Require 1 <= min_n <= max_n')

    nlp = _load_spacy_model()
    if nlp is None:
        return _fallback_candidates(text, min_n, max_n)

    doc = nlp(text.lower())
    candidates = set()
    for chunk in doc.noun_chunks:
        # A noun chunk may contain several coordinated feature concepts (e.g.
        # "offline audio caching and biometric fingerprint authentication").
        # Split at conjunctions, then emit bounded contiguous spans of nouns and
        # adjectives rather than dropping a long chunk or joining concepts.
        segments = [[]]
        for token in chunk:
            if token.dep_ == 'cc' or token.lower_ in {'and', 'or'}:
                if segments[-1]:
                    segments.append([])
                continue
            if token.is_punct:
                if segments[-1]:
                    segments.append([])
                continue
            is_feature_modifier = token.pos_ == 'VERB' and token.dep_ in {
                'amod', 'compound', 'npadvmod'
            }
            if (token.pos_ not in {'NOUN', 'PROPN', 'ADJ'} and not is_feature_modifier) or token.is_stop:
                continue
            lemma = token.lemma_.lower().strip()
            if lemma in DOMAIN_STOPWORDS or len(lemma) <= 2:
                continue
            segments[-1].append(lemma)

        for segment in segments:
            for size in range(min_n, min(max_n, len(segment)) + 1):
                for start in range(len(segment) - size + 1):
                    candidates.add(' '.join(segment[start:start + size]))

    # Use fallback extraction only for parser cases that produced no noun chunks.
    # Mixing arbitrary n-grams into otherwise parsed output creates phrases that
    # cross clause boundaries and are not syntactic feature candidates.
    if not candidates:
        candidates.update(_fallback_candidates(text, min_n, max_n))
    return sorted(candidates)


def extract_candidate_counts(
    reviews: Iterable[str], min_n: int = 2, max_n: int = 4
) -> dict[str, int]:
    """Count each candidate at most once per review."""
    counts: Counter[str] = Counter()
    for review in reviews:
        counts.update(set(extract_candidate_features(review, min_n, max_n)))
    return dict(counts)
