"""Scrape real user reviews for 26 pairs (52 apps) from Google Play.

Progress is checkpointed after each app so interrupted runs can resume without
re-fetching already completed apps. Google Play availability and rate limits
are external constraints; a failed app is recorded and can be retried by rerun.
"""

from __future__ import annotations

import json
import os
import tempfile
import time
from typing import Dict, List, Optional, Tuple

from google_play_scraper import Sort, reviews

APP_BENCHMARK_PAIRS = [
    {
        'pair_id': 1, 'category': 'Audio & Streaming',
        'app_a_name': 'Spotify', 'app_a_id': 'com.spotify.music',
        'app_b_name': 'Apple Music', 'app_b_id': 'com.apple.android.music',
        'gt_a': ['collaborative playlist', 'smart shuffle discovery', 'connect device handoff'],
        'gt_b': ['lossless spatial audio', 'curated human radio', 'synchronized vocal lyrics'],
    },
    {
        'pair_id': 2, 'category': 'Audio & Streaming',
        'app_a_name': 'SoundCloud', 'app_a_id': 'com.soundcloud.android',
        'app_b_name': 'Tidal', 'app_b_id': 'com.aspiro.tidal',
        'gt_a': ['independent creator upload', 'waveform track comments', 'underground dj mix'],
        'gt_b': ['master audio streaming', 'hifi sound quality', 'direct artist payouts'],
    },
    {
        'pair_id': 3, 'category': 'Urban Mobility',
        'app_a_name': 'Uber', 'app_a_id': 'com.ubercab',
        'app_b_name': 'Lyft', 'app_b_id': 'me.lyft.android',
        'gt_a': ['scheduled reserve ride', 'fare discount split', 'multi destination route'],
        'gt_b': ['upfront driver tip', 'commute route pass', 'shared airport carpool'],
    },
    {
        'pair_id': 4, 'category': 'Urban Mobility',
        'app_a_name': 'Citymapper', 'app_a_id': 'com.citymapper.app.release',
        'app_b_name': 'Moovit', 'app_b_id': 'com.tranzmate',
        'gt_a': ['multimodal transit route', 'live metro departures', 'step exit navigation'],
        'gt_b': ['crowdsourced bus alert', 'line arrival schedule', 'offline transit maps'],
    },
    {
        'pair_id': 5, 'category': 'Productivity',
        'app_a_name': 'Notion', 'app_a_id': 'notion.id',
        'app_b_name': 'Obsidian', 'app_b_id': 'md.obsidian',
        'gt_a': ['relational database table', 'team workspace doc', 'gallery block template'],
        'gt_b': ['local markdown storage', 'visual graph network', 'community plugin vault'],
    },
    {
        'pair_id': 6, 'category': 'Productivity',
        'app_a_name': 'Todoist', 'app_a_id': 'com.todoist',
        'app_b_name': 'TickTick', 'app_b_id': 'com.ticktick.task',
        'gt_a': ['natural language parsing', 'karma task productivity', 'project label filter'],
        'gt_b': ['pomodoro timer focus', 'native habit calendar', 'matrix task eisenhower'],
    },
    {
        'pair_id': 7, 'category': 'Productivity',
        'app_a_name': 'Evernote', 'app_a_id': 'com.evernote',
        'app_b_name': 'OneNote', 'app_b_id': 'com.microsoft.office.onenote',
        'gt_a': ['document scan ocr', 'web clipper extension', 'search text inside pdf'],
        'gt_b': ['freeform canvas note', 'infinite digital ink', 'office notebook integration'],
    },
    {
        'pair_id': 8, 'category': 'Health & Fitness',
        'app_a_name': 'Strava', 'app_a_id': 'com.strava',
        'app_b_name': 'Nike Run Club', 'app_b_id': 'com.nike.plusgps',
        'gt_a': ['segment leaderboard race', 'beacon live location', 'sensor bluetooth pair'],
        'gt_b': ['guided audio marathon', 'shoe mileage counter', 'custom interval speed'],
    },
    {
        'pair_id': 9, 'category': 'Health & Fitness',
        'app_a_name': 'MyFitnessPal', 'app_a_id': 'com.myfitnesspal.android',
        'app_b_name': 'Lose It!', 'app_b_id': 'com.fitnow.loseit',
        'gt_a': ['barcode meal scanner', 'macro nutrient goals', 'recipe nutritional import'],
        'gt_b': ['snap visual food photo', 'intermittent fast timer', 'budget calorie targets'],
    },
    {
        'pair_id': 10, 'category': 'Health & Fitness',
        'app_a_name': 'Fitbit', 'app_a_id': 'com.fitbit.FitbitMobile',
        'app_b_name': 'Garmin Connect', 'app_b_id': 'com.garmin.android.apps.connectmobile',
        'gt_a': ['daily readiness score', 'sleep cycle stages', 'stress management electro'],
        'gt_b': ['advanced training load', 'gps course track', 'battery body metric'],
    },
    {
        'pair_id': 11, 'category': 'Communication',
        'app_a_name': 'Slack', 'app_a_id': 'com.Slack',
        'app_b_name': 'Discord', 'app_b_id': 'com.discord',
        'gt_a': ['thread message organize', 'enterprise data search', 'instant huddle audio'],
        'gt_b': ['low latency voice room', 'role permission tier', 'high frame screen share'],
    },
    {
        'pair_id': 12, 'category': 'Communication',
        'app_a_name': 'Telegram', 'app_a_id': 'org.telegram.messenger',
        'app_b_name': 'WhatsApp', 'app_b_id': 'com.whatsapp',
        'gt_a': ['large channel broadcast', 'cloud unlimited storage', 'self destruct secret'],
        'gt_b': ['end to end encryption', 'direct status story', 'group call video join'],
    },
    {
        'pair_id': 13, 'category': 'Cloud Storage',
        'app_a_name': 'Dropbox', 'app_a_id': 'com.dropbox.android',
        'app_b_name': 'Google Drive', 'app_b_id': 'com.google.android.apps.docs',
        'gt_a': ['delta sync technology', 'lan transfer boost', 'document sign watermark'],
        'gt_b': ['real time team coauthor', 'deep drive ocr search', 'shared folder permissions'],
    },
    {
        'pair_id': 14, 'category': 'Cloud Storage',
        'app_a_name': 'Box', 'app_a_id': 'net.box.android',
        'app_b_name': 'OneDrive', 'app_b_id': 'com.microsoft.skydrive',
        'gt_a': ['enterprise audit trail', 'secure workflow task', 'granular retention governance'],
        'gt_b': ['windows file integration', 'personal secure vault', 'auto photo backup'],
    },
    {
        'pair_id': 15, 'category': 'Language Learning',
        'app_a_name': 'Duolingo', 'app_a_id': 'com.duolingo',
        'app_b_name': 'Babbel', 'app_b_id': 'com.babbel.mobile.android.en',
        'gt_a': ['gamified streak quest', 'competitive league board', 'interactive short stories'],
        'gt_b': ['formal grammar explainer', 'accent speech evaluator', 'practical dialogue practice'],
    },
    {
        'pair_id': 16, 'category': 'Language Learning',
        'app_a_name': 'Memrise', 'app_a_id': 'com.memrise.android.memrisecompanion',
        'app_b_name': 'Busuu', 'app_b_id': 'com.busuu.android.enc',
        'gt_a': ['native speaker video', 'spaced repetition review', 'real dialect audio'],
        'gt_b': ['native community correction', 'cefr lesson structure', 'complete offline study'],
    },
    {
        'pair_id': 17, 'category': 'Food & Dining',
        'app_a_name': 'DoorDash', 'app_a_id': 'com.dd.doordash',
        'app_b_name': 'Uber Eats', 'app_b_id': 'com.ubercab.eats',
        'gt_a': ['dashpass fee waiver', 'double store add-on order', 'live courier tracker'],
        'gt_b': ['express dispatch priority', 'curbside pickup directory', 'post tip adjustment'],
    },
    {
        'pair_id': 18, 'category': 'Food & Dining',
        'app_a_name': 'Grubhub', 'app_a_id': 'com.grubhub.android',
        'app_b_name': 'Deliveroo', 'app_b_id': 'com.deliveroo.orderapp',
        'gt_a': ['perks rewards loyalty', 'guaranteed on-time policy', 'campus dining ordering'],
        'gt_b': ['on-demand grocery delivery', 'rider tip boost', 'realtime delivery timeline'],
    },
    {
        'pair_id': 19, 'category': 'E-Commerce',
        'app_a_name': 'Amazon', 'app_a_id': 'com.amazon.mShop.android.shopping',
        'app_b_name': 'eBay', 'app_b_id': 'com.ebay.mobile',
        'gt_a': ['prime one-day shipping', 'seamless return dropoff', 'voice buy assistant'],
        'gt_b': ['secondhand auction bid', 'seller make an offer', 'rare vintage collectible'],
    },
    {
        'pair_id': 20, 'category': 'E-Commerce',
        'app_a_name': 'Shein', 'app_a_id': 'com.zzkko',
        'app_b_name': 'Temu', 'app_b_id': 'com.einnovation.temu',
        'gt_a': ['visual clothing search', 'fast fashion trend', 'interactive points coupon'],
        'gt_b': ['social referral credit', 'group bulk discount', 'daily wheel spin reward'],
    },
    {
        'pair_id': 21, 'category': 'Financial Services',
        'app_a_name': 'Revolut', 'app_a_id': 'com.revolut.revolut',
        'app_b_name': 'Wise', 'app_b_id': 'com.transferwise.android',
        'gt_a': ['built-in crypto exchange', 'disposable virtual card', 'vault saving interest'],
        'gt_b': ['mid-market exchange rate', 'multi currency account', 'low fee border transfer'],
    },
    {
        'pair_id': 22, 'category': 'Financial Services',
        'app_a_name': 'Robinhood', 'app_a_id': 'com.robinhood.android',
        'app_b_name': 'Webull', 'app_b_id': 'com.webull.android',
        'gt_a': ['fractional share buy', 'cash debit sweep interest', 'instant deposit clearing'],
        'gt_b': ['extended hour trading', 'level 2 market data', 'technical indicator chart'],
    },
    {
        'pair_id': 23, 'category': 'Travel & Booking',
        'app_a_name': 'Airbnb', 'app_a_id': 'com.airbnb.android',
        'app_b_name': 'Booking.com', 'app_b_id': 'com.booking',
        'gt_a': ['unique stay experience', 'long term rental host', 'split guest payment'],
        'gt_b': ['no booking deposit fee', 'instant hotel reservation', 'genius discount loyalty'],
    },
    {
        'pair_id': 24, 'category': 'Travel & Booking',
        'app_a_name': 'Hopper', 'app_a_id': 'com.hopper.mountainview.play',
        'app_b_name': 'Skyscanner', 'app_b_id': 'net.skyscanner.android.main',
        'gt_a': ['flight price freeze', 'predictive airfare drop', 'cancel for any reason'],
        'gt_b': ['multi city flight search', 'flexible month fare', 'price watch notification'],
    },
    {
        'pair_id': 25, 'category': 'Utilities & Security',
        'app_a_name': 'Bitwarden', 'app_a_id': 'com.x8bit.bitwarden',
        'app_b_name': 'LastPass', 'app_b_id': 'com.lastpass.lpandroid',
        'gt_a': ['open source security', 'self host server option', 'free multi device sync'],
        'gt_b': ['emergency contact access', 'family dashboard sharing', 'form auto credential fill'],
    },
    {
        'pair_id': 26, 'category': 'Utilities & Security',
        'app_a_name': 'Proton VPN', 'app_a_id': 'ch.protonvpn.android',
        'app_b_name': 'ExpressVPN', 'app_b_id': 'com.expressvpn.vpn',
        'gt_a': ['multi-hop secure core', 'built-in ad net shield', 'free tier bandwidth'],
        'gt_b': ['lightway fast protocol', 'global router firmware', 'split tunnel connection'],
    },
]

OUTPUT_FILE = os.path.join('data', 'benchmark_real_52_apps.json')


def fetch_app_reviews(pkg_id: str, count: int = 300, max_retries: int = 3) -> List[str]:
    """Fetch English (US) newest reviews, backing off after transient errors."""
    if count < 1 or max_retries < 1:
        raise ValueError('count and max_retries must be positive')
    for attempt in range(max_retries):
        try:
            result, _ = reviews(
                pkg_id,
                lang='en',
                country='us',
                sort=Sort.NEWEST,
                count=count,
            )
            return [
                review['content'] for review in result
                if review.get('content') and len(review['content'].strip()) > 10
            ]
        except Exception as exc:  # scraper/network exceptions vary by upstream
            wait_time = min(3 * (2 ** attempt), 30)
            print(f'Warning: retrying {pkg_id} after {exc!r} in {wait_time}s...')
            if attempt + 1 < max_retries:
                time.sleep(wait_time)
    return []


def _atomic_save(dataset: List[Dict], out_file: str) -> None:
    """Write a valid checkpoint atomically to avoid corrupting recovery data."""
    directory = os.path.dirname(out_file) or '.'
    os.makedirs(directory, exist_ok=True)
    fd, temp_path = tempfile.mkstemp(prefix='.reviews-', suffix='.tmp', dir=directory)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as handle:
            json.dump(dataset, handle, indent=2, ensure_ascii=False)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_path, out_file)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def _load_checkpoint(out_file: str) -> Dict[int, Dict]:
    if not os.path.exists(out_file):
        return {}
    try:
        with open(out_file, 'r', encoding='utf-8') as handle:
            data = json.load(handle)
        if not isinstance(data, list):
            raise ValueError('checkpoint root must be a list')
        return {
            int(pair['pair_id']): pair for pair in data
            if isinstance(pair, dict) and 'pair_id' in pair
        }
    except (OSError, json.JSONDecodeError, TypeError, ValueError) as exc:
        backup = f'{out_file}.corrupt-{int(time.time())}'
        os.replace(out_file, backup)
        print(f'Warning: invalid checkpoint moved to {backup}: {exc}')
        return {}


def main() -> None:
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    records = _load_checkpoint(OUTPUT_FILE)
    print(f'Starting real review scrape across {len(APP_BENCHMARK_PAIRS)} pairs...')

    for pair in APP_BENCHMARK_PAIRS:
        pair_id = pair['pair_id']
        record = records.get(pair_id, {
            'pair_id': pair_id,
            'category': pair['category'],
            'app_a': pair['app_a_name'],
            'app_a_id': pair['app_a_id'],
            'app_b': pair['app_b_name'],
            'app_b_id': pair['app_b_id'],
            'ground_truth_a': pair['gt_a'],
            'ground_truth_b': pair['gt_b'],
            'reviews_a': [],
            'reviews_b': [],
            'completed_apps': [],
        })
        record.setdefault('completed_apps', [])
        if pair_id in records and record.get('scrape_complete'):
            print(f'Pair {pair_id} already cached. Skipping.')
            continue

        for side in ('a', 'b'):
            if side in record['completed_apps']:
                continue
            pkg_id = pair[f'app_{side}_id']
            print(f"Scraping Pair {pair_id}: {pair[f'app_{side}_name']}...")
            record[f'reviews_{side}'] = fetch_app_reviews(pkg_id, count=300)
            record['completed_apps'].append(side)
            records[pair_id] = record
            _atomic_save([records[key] for key in sorted(records)], OUTPUT_FILE)
            time.sleep(1.5)

        record['scrape_complete'] = True
        records[pair_id] = record
        _atomic_save([records[key] for key in sorted(records)], OUTPUT_FILE)

    total = len(records)
    complete = sum(bool(record.get('scrape_complete')) for record in records.values())
    print(f'Scraping finished: {complete}/{len(APP_BENCHMARK_PAIRS)} pairs saved to {OUTPUT_FILE} ({total} records).')


if __name__ == '__main__':
    main()
