# Enhancing App Features Through User Reviews

CompFeat (Comparative Feature Advantage Scoring) is a research prototype in this project for extracting candidate app features from Google Play reviews and ranking them by review-level sentiment differences between two competing apps. It is designed to support product and engineering review triage, not to make causal claims about product quality.

> **Scope note:** This repository contains a web application codebase and a separate batch/offline CompFeat research pipeline. The included scraper is not a continuous review stream, and the current benchmark does not establish industry validation, live-service performance, engineering-team impact, or ranking superiority.

## 📋 Project Overview

App reviews contain requests, praise, and complaints in informal language. This project brings together a React frontend, Django backend, review and sentiment components, and research tooling for comparing app-review features. The CompFeat benchmark provides a reproducible offline path over a saved sample of Google Play reviews.

### Problem addressed

- Manual review triage can be time-consuming.
- Informal review language makes feature themes difficult to group consistently.
- Frequency-only rankings do not express whether review sentiment differs between two competing apps.
- Exact phrase matching can miss candidates that express the same idea using different words.

### Project capability areas

- Review collection and storage through scraper and backend components.
- Sentiment analysis and feature extraction components.
- Dashboard views for review-related information.
- CompFeat comparison of candidate feature sentiment across a target app and competitor.

These are repository capability areas, not a claim that every workflow is production-complete. Targets such as fake-review filtering, continuous ingestion, feedback-loop learning, 99.9% uptime, multi-store support, and AWS deployment are not validated by the current CompFeat benchmark.

## 🧭 CompFeat Pipeline

1. `scrape_real_reviews.py` fetches up to 300 newest English (US) reviews for each of 52 configured Google Play package IDs and checkpoints progress to `data/benchmark_real_52_apps.json`.
2. `extractors/feature_extractor.py` extracts short noun/adjective phrases using spaCy's English dependency parser. A lexical fallback is available when the parser model is unavailable.
3. `Feature-Extraction/competitor_recommender.py` identifies feature mentions and gathers nearby positive/negative lexicon evidence.
4. `scorers/cfas_engine.py` computes calibrated comparative scores from review-level evidence.
5. `evaluation/evaluator.py` aligns ranked phrases with configured ground truth using local MiniLM embeddings when available.
6. `evaluate_recommendation_benchmark.py` compares five ranking methods over both directions of each eligible app pair.

Scoring and semantic evaluation run locally after installation and model download. The review scraper requires network access. CompFeat does not use a generative LLM API to calculate scores. No per-review streaming latency or memory benchmark is currently reported.

## ✨ Capabilities and Limitations

- Competitor-aware review comparison rather than independent per-app sentiment alone.
- Interpretable closed-form CFAS scores and inspectable feature mention statistics.
- Dependency-guided candidate phrases, local lexicon sentiment, and optional MiniLM semantic matching.
- Checkpointed batch review scraping and offline benchmark evaluation.

The current pipeline is a sequential batch experiment, not a demonstrated real-time stream processor. The codebase does not provide evidence for millisecond throughput, zero total operating cost, or measured cost advantages over a specific LLM system. MiniLM inference is local, but the model must first be downloaded; scraping also makes external requests.

## 🧪 Benchmark Results

### Historical recorded results

This table preserves the original benchmark values supplied with the project. It describes an earlier implementation and is not reproduced by the current code and evaluator.

| Method | MRR | Hit@1 | Hit@3 | Hit@5 |
| --- | ---: | ---: | ---: | ---: |
| Negative Frequency | 0.015 | 0.000 | 0.000 | 0.021 |
| Raw Frequency | 0.066 | 0.021 | 0.042 | 0.062 |
| SAFE / KEFE | 0.112 | 0.062 | 0.125 | 0.125 |
| SAFER-Style | 0.081 | 0.042 | 0.042 | 0.062 |
| CompFeat (initial) | 0.052 | 0.021 | 0.021 | 0.083 |

### Current implementation results

Measured on 2026-09-28 with the current calibrated scorer, dependency-guided extraction, MiniLM semantic backend, and a 500-candidate cap:

| Method | MRR | Hit@1 | Hit@3 | Hit@5 | Precision@5 | Recall@5 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Raw Frequency | 0.057 | 0.000 | 0.042 | 0.146 | 0.029 | 0.049 |
| Negative Frequency | 0.033 | 0.021 | 0.042 | 0.042 | 0.008 | 0.014 |
| SAFE / KEFE | 0.081 | 0.021 | 0.104 | 0.125 | 0.025 | 0.042 |
| SAFER-Style | 0.089 | 0.021 | 0.125 | 0.167 | 0.033 | 0.056 |
| CompFeat | 0.032 | 0.021 | 0.021 | 0.021 | 0.004 | 0.007 |

**Result:** CompFeat did not outperform the baselines in this run. The benchmark evaluated 48 directions from 24 app pairs and skipped 4 directions because one app side had no reviews. The current result must not be presented as an improvement over the baselines.

### Reading the metrics

- **MRR** is the mean reciprocal rank of the first relevant candidate in each evaluated direction.
- **Hit@k** is 1 if at least one relevant candidate appears among the first `k` ranks, otherwise 0; the table reports the mean over directions.
- **Precision@5** and **Recall@5** count distinct ground-truth phrases matched among the first five ranked candidates. Precision uses a denominator of five.
- Relevance in the current run is based on MiniLM cosine similarity at threshold 0.78, combined with exact normalized matching and token overlap/inclusion. Token-set inclusion receives a score of 0.85. These choices need human validation; semantic matching does not guarantee that a retrieved phrase is a useful requirement.
- Ground-truth phrases are configured in the scraper and are not documented as independently annotated by multiple reviewers. Review wording, candidate limits, missing app reviews, and label coverage all affect results.
- The historical and current tables use different evaluation implementations and are not directly comparable.

The benchmark's `SAFE / KEFE` and `SAFER-Style` names refer to simplified implementations inside `evaluate_recommendation_benchmark.py`. They do not execute the legacy KEFE pipeline or a separate SAFER package.

## 📐 CFAS Scoring

For app A and app B, `P` and `N` represent accumulated positive and negative review-level polarity evidence, and `T` is the number of reviews mentioning the candidate. Defaults are $\alpha=1$, $\beta=2$, negative weight $\lambda=1.25$, and target salience $\kappa=0.5$.

$$
S_X(f)=\frac{P_X(f)-\lambda N_X(f)+\alpha}{T_X(f)+\alpha+\beta},\qquad
\text{CFAS}(f)=\log_2(1+T_A+T_B)\,[S_A(f)-S_B(f)]\,[1-e^{-\kappa T_A(f)}].
$$

| Component | Meaning |
| --- | --- |
| $S_X(f)$ | Smoothed sentiment evidence for feature $f$ in app $X$ |
| $\log_2(1+T_A+T_B)$ | Logarithmic frequency factor over both apps |
| $S_A(f)-S_B(f)$ | Comparative sentiment difference, oriented toward app A |
| $1-e^{-\kappa T_A(f)}$ | Continuous salience gate based on target-app mentions |

If both mention counts are zero, the scorer returns 0. If app B has zero mentions, its smoothed sentiment is $\alpha/(\alpha+\beta)$, so there is no division by zero. The scorer has no hard minimum-mention threshold. The benchmark does cap the candidate union at 500 phrases per pair, selected by combined extraction frequency. The recommender's profile API omits candidates absent from the target app. The reported specificity weight is metadata and is not multiplied into the calibrated score.

### Observed score distribution

The following is a directional audit of 9,925 target-present candidate records from the saved review corpus, using the benchmark candidate cap. It is a run-specific descriptive distribution, not a theoretical bound.

| Measure | Minimum | 5th percentile | Median | Mean | 95th percentile | Maximum |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| CFAS | -2.7748 | -0.2590 | -0.0328 | -0.0439 | 0.0668 | 1.9009 |
| Smoothed app A polarity | -0.7750 | -0.0500 | 0.2500 | 0.2493 | 0.5000 | 0.8000 |
| Smoothed app B polarity | -0.7750 | 0.2000 | 0.3333 | 0.3190 | 0.3333 | 0.8000 |

These observed ranges are dataset-specific. Smoothed polarity is not constrained to $[-1,1]$ under the implemented negative weight; as evidence grows it can approach -1.25 on the negative side and +1 on the positive side. CFAS has no fixed $[-1,1]$ bound because its frequency factor grows logarithmically. The score-distribution audit is separate from the benchmark's five-method ranking loop and should not be interpreted as a distribution over every feature ranked there.

## 🧰 Technology and Architecture

| Area | Repository components |
| --- | --- |
| Frontend | React 19, React Bootstrap, Chart.js/Recharts |
| Backend | Django 5.2, Django REST Framework |
| Database support | PostgreSQL service in `docker-compose.yml`; backend also contains SQLModel/SQLAlchemy dependencies |
| Review collection | Google Play scraper package and Scrapy project |
| NLP and research | spaCy, lexicon-based CompFeat scoring, scikit-learn, Sentence Transformers / MiniLM |

```text
Google Play reviews -- batch scrape --> saved review dataset
                                      |
                                      v
                      feature phrase extraction
                                      |
                                      v
                     review-level sentiment evidence
                                      |
                                      v
                         comparative CFAS ranking
                                      |
                                      v
                 semantic ground-truth evaluation
```

The transformer sentiment service and legacy KEFE modules are separate paths; the CompFeat benchmark uses its own lexicon evidence and scoring implementation. The repository configuration alone does not establish cloud deployment, multi-region availability, payment processing, or production security controls.

## 🗂 Repository Layout

```text
Backend/                              Django API and application code
Frontend/                             React web client
Sentiment_analysis/                   Sentiment-analysis service and components
Spiders/                              Scrapy review-collection code
Feature-Extraction/                   Legacy KEFE modules and CompFeat recommender
extractors/                           Dependency-guided feature phrase extraction
scorers/                              Calibrated CFAS scoring
evaluation/                           Semantic evaluator
data/                                 Scraped benchmark JSON
Flowchart-Diagrams/                   Project diagrams
scrape_real_reviews.py                Checkpointed benchmark scraper
evaluate_recommendation_benchmark.py  Five-method offline benchmark
```

The frontend directory is named `Frontend/`; there is no top-level `ui/` directory.

## 🚀 Getting Started: CompFeat CLI

Commands below run from the repository root in PowerShell.

### 1. Create and activate a Python environment

```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

The root requirements include the scraper, NumPy, pandas, scikit-learn, spaCy, its configured English model, and Sentence Transformers. The first MiniLM use downloads model files and requires network access and disk space. If the model is unavailable, the evaluator uses a character n-gram TF-IDF fallback and reports that backend; fallback metrics are not directly comparable to MiniLM results.

### 2. Scrape the configured apps

```powershell
python scrape_real_reviews.py
```

The script requests newest English (US) reviews, up to 300 per package ID, and checkpoints to `data/benchmark_real_52_apps.json`. Google Play availability and rate limits can result in an app having no reviews. Check the saved counts before interpreting a run.

### 3. Run the offline benchmark

```powershell
python evaluate_recommendation_benchmark.py
```

The script prints MRR, Hit@1/3/5, Precision@5, and Recall@5 for all five ranking methods, plus skipped directions and semantic backend. A measured run on the development workstation took about 117 seconds including MiniLM initialization; this is one benchmark runtime, not per-review streaming latency.

## 🧑‍🔬 Project Team

**Group:** F24DS004
**Advisor:** Dr. Naveed Hussain
**University:** University of Central Punjab, Faculty of Information Technology

| Team member | Role |
| --- | --- |
| Abdul Wahab | Backend development |
| Muhammad Hassaan | Documentation and testing |
| Sohaib Tanveer | Frontend development |