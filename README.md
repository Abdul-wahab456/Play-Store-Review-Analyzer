# Enhancing App Features Through User Reviews

CompFeat (Comparative Feature Advantage Scoring) is a research prototype in this project for extracting candidate app features from Google Play reviews and ranking them by review-level sentiment differences between two competing apps. It is designed to support product and engineering review triage, not to make causal claims about product quality.

> **Scope note:** This repository contains a web application codebase and a separate batch/offline CompFeat research pipeline. The included scraper is not a continuous review stream, and the current benchmark does not establish industry validation, live-service performance, engineering-team impact, or ranking superiority.

## 📚 Contents

- [Project overview](#-project-overview)
- [CompFeat pipeline](#-compfeat-pipeline)
- [Benchmark results](#-benchmark-results)
- [CFAS scoring](#-cfas-scoring)
- [Technology and architecture](#-technology-and-architecture)
- [User workflow](#-user-workflow)
- [API overview](#-api-overview)
- [Repository layout](#-repository-layout)
- [Getting started](#-getting-started-compfeat-cli)
- [Testing](#-testing)
- [Deployment and security](#-deployment-and-security)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contributing and support](#-contributing-and-support)
- [License and acknowledgments](#-license-and-acknowledgments)
- [Project team](#-project-team)

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
- The wider project documentation also describes summarization, urgent-issue triage, filters/exports, fake-review handling, feedback loops, and multi-store support as goals; their end-to-end status is not verified here.

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
- An 82.3% sentiment-accuracy figure appeared in the earlier README, but no evaluation dataset, test protocol, or reproducible result supporting it is included here; it is therefore not reported as a verified model result.

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

## 🧑‍💻 User Workflow

The frontend defines screens for app search/source selection, a dashboard, sentiment analysis, feature identification, and competitor analysis. A typical intended workflow is:

1. Start the backend and frontend in their respective directories.
2. Search for or select an app in the app-source flow.
3. Open the dashboard and analysis screens to review available app data.
4. For the independent CompFeat research evaluation, run the scraper and benchmark commands below; benchmark output is printed in the terminal.

The web dashboard and CompFeat CLI are separate workflows. The benchmark does not automatically publish its rankings into the frontend, and the frontend package does not define a development proxy for the Django API. The frontend also requests `/api/auth/status`, which is not registered in the backend URL configuration. Configure or implement the required auth-status route and same-origin API routing before expecting browser authentication and data flows to work end to end.

## 🔌 API Overview

The following routes are registered in `Backend/accounts/urls.py`. Methods are shown where verified in the view implementations; dashboard method details are not asserted here.

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/auth/csrf/` | GET | Obtain a CSRF token |
| `/api/auth/login/` | POST | Session login |
| `/api/auth/signup/` | POST | Register an account |
| `/api/auth/payment-status/` | GET | Read payment-status flag |
| `/api/auth/update-payment/` | POST | Update the account payment flag |
| `/api/validate-payment/` | POST | Payment validation endpoint; currently simulated, not a live payment processor |
| `/api/playstore/search/?q=...` | GET | Search Play Store apps, with development fallback data |
| `/api/user/apps/` | GET, POST, DELETE | Read, add, or remove the authenticated user's selected apps |
| `/api/main/dashboard/` | POST | Dashboard data endpoint |
| `/api/sentiment-analysis/` | POST | Sentiment analysis endpoint |
| `/api/feature-analysis/` | POST | Feature analysis endpoint |

The configured REST authentication uses Django sessions. The old documentation's generic JWT endpoint list does not match the registered routes. Analytics views depend on configured data/API services, so route registration alone does not guarantee a working response in a fresh local setup.

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

## 🩺 Troubleshooting

| Symptom | Check |
| --- | --- |
| Scrape contains empty review lists | Confirm the package ID is available in the selected country/language and inspect scraper warnings. Empty sides can be checkpointed as complete; repair that app-side checkpoint before rerunning it. |
| Evaluator reports a fallback backend | Check that the MiniLM model downloaded successfully. The fallback is character n-gram TF-IDF and produces a different evaluation setup. |
| Browser redirects or API calls fail | The frontend calls `/api/auth/status`, which the backend does not register; confirm this route and the API proxy/origin configuration before debugging credentials. |
| Analytics endpoint fails after server startup | Configure the data database and external API settings required by that view; a running Django server does not imply those services are configured. |
| Compose cannot start | The Compose file references an external `fyp-network`; create that Docker network before starting the services. |

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

The script requests newest English (US) reviews, up to 300 per package ID, and checkpoints to `data/benchmark_real_52_apps.json`. Google Play availability and rate limits can result in an app having no reviews. Check the saved counts before interpreting a run. Current checkpoint logic marks an app side complete after its retry attempts even when no reviews were returned, so a later run may skip that empty side; inspect and repair its checkpoint record before expecting a retry.

### 3. Run the offline benchmark

```powershell
python evaluate_recommendation_benchmark.py
```

The script prints MRR, Hit@1/3/5, Precision@5, and Recall@5 for all five ranking methods, plus skipped directions and semantic backend. A measured run on the development workstation took about 117 seconds including MiniLM initialization; this is one benchmark runtime, not per-review streaming latency.

### Run the Django backend

```powershell
Set-Location Backend
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:SECRET_KEY = "replace-with-a-local-development-secret"
$env:DEBUG = "true"
python manage.py migrate
python manage.py runserver
```

The backend defaults to SQLite. It can use a database URL through `DATABASE_URL`; some analytics handlers additionally refer to `DATA_DB_URL` and `GROQ_API_KEY`. Configure service-specific environment variables before using those endpoints. Do not use development secrets or debug mode in a public deployment.

### Optional PostgreSQL for local development

From a separate PowerShell terminal at the repository root:

```powershell
docker network create fyp-network
docker compose up -d postgres pg-admin
```

This starts only the local database tools. Set `DATABASE_URL` in the backend environment before starting Django if you want it to use PostgreSQL; otherwise Django uses its configured SQLite default. The Compose file includes development credentials and must not be exposed as a production service.

### Run the React frontend

In a second PowerShell terminal:

```powershell
Set-Location Frontend
npm ci
npm start
```

Create React App serves the UI at `http://localhost:3000`. The repository does not currently configure a proxy to the Django development server; set up the API routing before relying on authenticated or data-backed screens.

## ✅ Testing

### Backend checks

```powershell
Set-Location Backend
python manage.py check
python manage.py test
```

`Backend/accounts/tests.py` is currently a placeholder, so a successful test command does not demonstrate substantive backend test coverage.

### Frontend checks

```powershell
Set-Location Frontend
npm test -- --watchAll=false
npm run build
```

The frontend includes a Create React App test entry point. Run the commands in the current environment and review their output; this README does not claim a particular test pass rate.

### CompFeat checks

```powershell
python evaluate_recommendation_benchmark.py
```

The benchmark is an end-to-end evaluation script, not a substitute for unit tests of candidate extraction, scoring, or metric edge cases.

## 🚢 Deployment and Security

`docker-compose.yml` starts PostgreSQL and pgAdmin only. It declares an external Docker network named `fyp-network`, which must exist before running Compose. The file does not build or deploy the Django or React applications. No verified Terraform, CI/CD, AWS autoscaling, or production deployment procedure is included in the repository.

The Django settings support environment configuration and a PostgreSQL `DATABASE_URL`, but local defaults and application integrations still require review before production use. In particular:

- Set a strong `SECRET_KEY`, disable `DEBUG`, and configure allowed hosts, CORS, and CSRF origins for the deployment.
- The settings file contains a development fallback secret; do not rely on it outside a local environment.
- The payment validation view currently simulates success rather than charging or verifying a card through a payment provider. Do not submit real payment information to it.
- Review authentication, error handling, external API keys, database configuration, and frontend/backend origin settings before exposing the service publicly.

## 🗺 Roadmap

These are potential follow-up areas, not completion claims:

- Add and document tests for feature extraction, sentiment evidence, score edge cases, and benchmark metrics.
- Improve review-data coverage and retry/reporting for unavailable or failed app fetches.
- Have ground-truth phrases reviewed and evaluated by multiple annotators; document agreement and semantic threshold calibration.
- Run controlled ablations and compare the simplified benchmark baselines with faithful implementations of published methods.
- Connect CompFeat results to the application UI only after defining and testing the API contract.
- Investigate continuous ingestion, multi-store support, fake-review filtering, operational monitoring, and production deployment as separate future work.

## 🤝 Contributing and Support

1. Create a feature branch from `main`.
2. Keep changes focused and follow the conventions in the affected module.
3. Run relevant backend, frontend, or benchmark checks and report any external services or model downloads required.
4. Update the README when behavior, dependencies, or evaluation methodology changes.
5. Open a pull request describing the change and its verification.

For questions or bug reports, use the [GitHub Issues page](https://github.com/Abdul-wahab456/Play-Store-Review-Analyzer/issues). The original project documentation lists `L1F21BSDS0017@ucp.edu.pk` as a contact address; verify it is current before use.

## 📄 License and Acknowledgments

No top-level `LICENSE` file is present in the repository, so a license has not been stated here. Add and review a license file before redistributing the project under specific terms.

The project documentation acknowledges the University of Central Punjab, project advisor Dr. Naveed Hussain, Hugging Face model contributors, and Google Play review data sources.

## 🧑‍🔬 Project Team

| Project detail | Value |
| --- | --- |
| Group | F24DS004 |
| Advisor | Dr. Naveed Hussain |
| University | University of Central Punjab, Faculty of Information Technology |

| Team member | Role | Responsibilities |
| --- | --- | --- |
| Abdul Wahab | Backend developer | Django development, API design, ML integration |
| Muhammad Hassaan | Documentation and testing lead | Test cases, QA, documentation |
| Sohaib Tanveer | Frontend developer | React development, UI/UX, dashboard |