# Play Store Review Analyzer

CompFeat (Comparative Feature Advantage Scoring) is a research prototype for extracting candidate app features from Google Play reviews and ranking them by review-level sentiment differences between two apps. It is intended to help product and engineering teams triage review themes; its ranking scores are not validated measures of product quality or causal feature advantage.

**Evidence boundary:** the repository contains batch scraping and offline benchmark scripts. It does not currently implement a live streaming pipeline, report a measured per-review latency or memory benchmark, or document an industry deployment study. Those claims should not be inferred from this project.

## System overview

1. `scrape_real_reviews.py` fetches up to 300 newest English (US) reviews for each of 52 configured Google Play package IDs and checkpoints data after each app to `data/benchmark_real_52_apps.json`.
2. `extractors/feature_extractor.py` extracts short noun/adjective feature phrases using spaCy's English dependency parser; a lexical chunk fallback is available if the parser model is missing.
3. `Feature-Extraction/competitor_recommender.py` detects local positive/negative lexicon evidence near feature mentions.
4. `scorers/cfas_engine.py` applies smoothed comparative scoring to target/competitor counts. Results are ranked by score for offline analysis.
5. `evaluation/evaluator.py` and `evaluate_recommendation_benchmark.py` compare rankings with the benchmark's hand-authored ground-truth phrases.

The Google Play scraper makes network requests. Scoring and MiniLM evaluation run locally after their dependencies and model weights are installed; the pipeline does not make an LLM API call. Initial model installation requires downloading artifacts. No measured CPU throughput or memory footprint is currently recorded.

## Core capabilities and limitations

- Competitor-aware comparison of review sentiment instead of analyzing each app in isolation.
- Closed-form, inspectable CFAS calculation; no generative model is used to compute scores.
- Optional local `all-MiniLM-L6-v2` semantic similarity for benchmark alignment.
- Checkpointed batch review retrieval that can resume completed app-side fetches.
- Candidate phrases can be inspected alongside their mention counts and score components.

This code is an offline prototype, not a demonstrated millisecond streaming service. The included scrape is a sequential batch job, and the repository does not contain a streaming ingestion command or an end-to-end sprint-backlog integration. Claims about lower GPU cost or API spend than a particular LLM system have not been benchmarked here.

## Benchmark results

### Historical recorded run (original implementation)

The following is the exact table recorded for the original benchmark run. It is retained as a historical result and is **not** a result reproduced by the current implementation below.

| Method               | MRR   | Hit@1 | Hit@3 | Hit@5 |
| -------------------- | ----- | ----- | ----- | ----- |
| Negative Frequency   | 0.015 | 0.000 | 0.000 | 0.021 |
| Raw Frequency        | 0.066 | 0.021 | 0.042 | 0.062 |
| SAFE / KEFE          | 0.112 | 0.062 | 0.125 | 0.125 |
| SAFER-Style          | 0.081 | 0.042 | 0.042 | 0.062 |
| CompFeat (This Work) | 0.052 | 0.021 | 0.021 | 0.083 |

### Current implementation, measured 2026-09-28

Re-running `evaluate_recommendation_benchmark.py` with the current scorer, dependency-guided extraction, MiniLM semantic backend, and a 500-candidate cap produced:

| Method             |   MRR | Hit@1 | Hit@3 | Hit@5 | Precision@5 | Recall@5 |
| ------------------ | ----: | ----: | ----: | ----: | ----------: | -------: |
| Raw Frequency      | 0.057 | 0.000 | 0.042 | 0.146 |       0.029 |    0.049 |
| Negative Frequency | 0.033 | 0.021 | 0.042 | 0.042 |       0.008 |    0.014 |
| SAFE / KEFE        | 0.081 | 0.021 | 0.104 | 0.125 |       0.025 |    0.042 |
| SAFER-Style        | 0.089 | 0.021 | 0.125 | 0.167 |       0.033 |    0.056 |
| CompFeat           | 0.032 | 0.021 | 0.021 | 0.021 |       0.004 |    0.007 |

This run evaluated 48 directions from 24 app pairs; 4 directions were skipped because one app side had no reviews. CompFeat did **not** outperform the baselines in this run. Results are specific to the configured review snapshot, candidate cap, sentiment lexicon, semantic threshold, and ground-truth labels; they should not be presented as evidence of benchmark superiority.

### Interpretation and evaluation caveats

- Informal review wording can differ from the hand-authored reference phrases. The current evaluator uses MiniLM cosine similarity with a 0.78 threshold, exact normalized text matching, and token-set inclusion/overlap (inclusion is assigned 0.85). This reduces, but does not eliminate, lexical mismatch; semantic thresholds still need validation against human judgments.
- Ground-truth phrases are stored in the benchmark configuration and are not documented as independently annotated by multiple reviewers. Their coverage and label quality limit the conclusions that can be drawn.
- The historical exact-string-style metrics and the current semantic metrics use different evaluation implementations and are not directly comparable. Use the current run for current-code claims.
- `Hit@k` is 1 when at least one relevant candidate appears in the first `k` ranks. MRR uses the reciprocal rank of the first relevant candidate. Precision@5 and Recall@5 use unique ground-truth phrases matched among the first five ranked candidates. Relevance is defined by the evaluator's configured similarity threshold, not by exact equality alone.
- A top-five retrieval rate can be operationally useful, but this benchmark does not measure engineering-team utility, sprint outcomes, or the value of an individual retrieved feature.

## CFAS scoring

For app A and app B, let `pos` and `neg` be accumulated review-level polarity evidence and `T` the number of reviews mentioning a candidate. Defaults are `alpha=1`, `beta=2`, negative weight `lambda=1.25`, and target salience `kappa=0.5`:

$$
S_X(f)=\frac{P_X(f)-\lambda N_X(f)+\alpha}{T_X(f)+\alpha+\beta},\qquad
\operatorname{CFAS}(f)=\log_2(1+T_A+T_B)\,[S_A(f)-S_B(f)]\,[1-e^{-\kappa T_A(f)}].
$$

When both mention counts are zero, the scorer returns 0. When only competitor count is zero, its smoothed sentiment is `alpha/(alpha+beta)`; there is no division by zero. There is no hard mention threshold in the scorer. The benchmark first limits the union of candidates to the 500 with greatest combined extraction frequency. The recommender's profile method also omits candidates absent from the target reviews. The profile's reported specificity weight is diagnostic metadata and is not multiplied into the calibrated score.

On the current dataset and benchmark candidate cap, a directional score audit found **9,925 target-present candidate-direction records** with observed CFAS values from **-2.7748** to **1.9009** (median **-0.0328**, mean **-0.0439**, 5th/95th percentiles **-0.2590 / 0.0668**). Observed smoothed target polarity ranged from **-0.775** to **0.800**; competitor polarity ranged from **-0.775** to **0.800**. These are run-specific descriptive statistics, not theoretical bounds. With the implemented formula, smoothed polarity approaches `-1.25` and `+1` as counts grow under the scorer's count constraints; the log frequency multiplier means CFAS itself has no fixed `[-1, 1]` bound. Because the directional audit scoring routine was optimized separately from the five-way benchmark ranking loop, the CFAS descriptive distribution should be treated as an audit sample, not the empirical output score distribution of every ranked feature in the benchmark.

## Repository layout

```text
data/                         Scraped review benchmark JSON
extractors/                   Dependency-guided feature extraction
scorers/                      Calibrated CFAS scoring
evaluation/                   Semantic evaluator
Feature-Extraction/            Existing KEFE modules and CompFeat recommender
Frontend/                      Web client
Backend/                       Django API and application code
Sentiment_analysis/            Sentiment-analysis components
Spiders/                       Scrapy review collection code
Flowchart-Diagrams/            Project diagrams
scrape_real_reviews.py         Checkpointed Google Play batch scraper
evaluate_recommendation_benchmark.py  Five-method offline benchmark
```

There is no top-level `ui/` directory; the frontend lives in `Frontend/`.

## Getting started

### Create an environment and install the analysis dependencies

From the repository root (PowerShell):

```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

The root requirements install the Google Play scraper, numerical/data-science packages, spaCy, its configured English model, and Sentence Transformers. If installing the parser separately, use:

```powershell
python -m pip install spacy
python -m spacy download en_core_web_sm
```

The evaluator loads `sentence-transformers/all-MiniLM-L6-v2` locally. Its first use downloads the model; ensure network access and sufficient disk space. If the package/model cannot load, the evaluator reports and uses its character n-gram TF-IDF fallback, which is a different evaluation backend.

### Scrape reviews

```powershell
python scrape_real_reviews.py
```

This fetches newest English (US) reviews, up to 300 per package ID, and checkpoints to `data/benchmark_real_52_apps.json`. A failed or unavailable Play Store package may yield no reviews; inspect the resulting counts before interpreting the benchmark. The script is batch scraping, not a continuous stream consumer.

### Run evaluation

```powershell
python evaluate_recommendation_benchmark.py
```

The script prints aggregate metrics for Raw Frequency, Negative Frequency, SAFE / KEFE, SAFER-Style, and CompFeat. It reports skipped directions and the semantic backend. A timed rerun on the current workstation took approximately **117 seconds** including MiniLM initialization. This is one end-to-end benchmark duration, not a per-review streaming latency. For reproducible comparisons, retain the dataset snapshot, dependency/model versions, candidate cap, and evaluator threshold with the results.

## Project team

**Group:** F24DS004
**Advisor:** Dr. Naveed Hussain
**University:** University of Central Punjab, Faculty of Information Technology

| Team member      | Role                      |
| ---------------- | ------------------------- |
| Abdul Wahab      | Backend development       |
| Muhammad Hassaan | Documentation and testing |
| Sohaib Tanveer   | Frontend development      |
