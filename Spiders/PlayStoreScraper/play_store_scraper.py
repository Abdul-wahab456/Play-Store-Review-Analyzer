import json
import re
import time
from typing import Dict, List, Optional, Tuple, Union

import httpx
from Spiders.PlayStoreScraper.constants import play_store_elements as elements
from Spiders.PlayStoreScraper.constants import play_store_enums

PLAY_STORE_BASE_URL = "https://play.google.com"
REVIEWS_REGEX = re.compile(r"\)]}'\n\n([\s\S]+)")
APP_SCRIPT_REGEX = re.compile(r"AF_initDataCallback[\s\S]*?</script")
APP_KEY_REGEX = re.compile("(ds:.*?)'")
APP_VALUE_REGEX = re.compile(r"data:([\s\S]*?), sideChannel: {}}\);<\/")
MAX_COUNT_EACH_FETCH = 4500


class ContinuationToken:
    __slots__ = (
        "token",
        "lang",
        "country",
        "sort",
        "count",
        "filter_score_with",
        "filter_device_with",
    )

    def __init__(
        self, token, lang, country, sort, count, filter_score_with, filter_device_with
    ):
        self.token = token
        self.lang = lang
        self.country = country
        self.sort = sort
        self.count = count
        self.filter_score_with = filter_score_with
        self.filter_device_with = filter_device_with


class PlayStoreRequest:
    _MAX_RETRIES = 5
    _RATE_LIMIT_DELAY = 5

    def post(self, url: str, data: Union[str, bytes], headers: dict) -> str:
        last_exception = None
        rate_exceeded_count = 0

        for _ in range(self._MAX_RETRIES):
            try:
                response = httpx.post(url, data=data, headers=headers)
                response.raise_for_status()
                response_text = response.text

                if "com.google.play.gateway.proto.PlayGatewayError" in response_text:
                    rate_exceeded_count += 1
                    last_exception = Exception(
                        "com.google.play.gateway.proto.PlayGatewayError"
                    )
                    time.sleep(self._RATE_LIMIT_DELAY * rate_exceeded_count)
                    continue
                return response_text
            except httpx.HTTPError as e:
                if e.response and e.response.status_code == 404:
                    raise Exception("App not found (404).")
                last_exception = e
            except httpx.RequestError as e:
                last_exception = e
                continue
        raise last_exception

    def get(self, url) -> str:
        with httpx.Client() as client:
            try:
                response = client.get(url)
                response.raise_for_status()
                return response.text
            except httpx.RequestError as e:
                raise e


class PlayStoreReviews:
    __URL_FORMAT = (
        "{}/_/PlayStoreUi/data/batchexecute?hl={{lang}}&gl={{country}}".format(
            PLAY_STORE_BASE_URL
        )
    )
    __PAYLOAD_FORMAT_FOR_FIRST_PAGE = "f.req=%5B%5B%5B%22oCPfdb%22%2C%22%5Bnull%2C%5B2%2C{sort}%2C%5B{count}%5D%2Cnull%2C%5Bnull%2C{score}%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C{device_id}%5D%5D%2C%5B%5C%22{app_id}%5C%22%2C7%5D%5D%22%2Cnull%2C%22generic%22%5D%5D%5D%0A"
    __PAYLOAD_FORMAT_FOR_PAGINATED_PAGE = "f.req=%5B%5B%5B%22oCPfdb%22%2C%22%5Bnull%2C%5B2%2C{sort}%2C%5B{count}%2Cnull%2C%5C%22{pagination_token}%5C%22%5D%2Cnull%2C%5Bnull%2C{score}%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C{device_id}%5D%5D%2C%5B%5C%22{app_id}%5C%22%2C7%5D%5D%22%2Cnull%2C%22generic%22%5D%5D%5D%0A"

    def __init__(self):
        self.__play_store_req = PlayStoreRequest()

    def __build_url(self, lang: str, country: str) -> str:
        return self.__URL_FORMAT.format(lang=lang, country=country)

    def __build_url_body(
        self,
        app_id: str,
        sort: int,
        count: int,
        filter_score_with: int,
        filter_device_with: int,
        pagination_token: str,
    ) -> bytes:
        if pagination_token is not None:
            result = self.__PAYLOAD_FORMAT_FOR_PAGINATED_PAGE.format(
                app_id=app_id,
                sort=sort,
                count=count,
                score=filter_score_with,
                device_id=filter_device_with,
                pagination_token=pagination_token,
            )
        else:
            result = self.__PAYLOAD_FORMAT_FOR_FIRST_PAGE.format(
                app_id=app_id,
                sort=sort,
                count=count,
                score=filter_score_with,
                device_id=filter_device_with,
            )
        return result.encode()

    def _fetch_review_items(
        self,
        url: str,
        app_id: str,
        sort: int,
        count: int,
        filter_score_with: Optional[int],
        filter_device_with: Optional[int],
        pagination_token: Optional[str],
    ):
        dom = self.__play_store_req.post(
            url,
            self.__build_url_body(
                app_id,
                sort,
                count,
                "null" if filter_score_with is None else filter_score_with,
                "null" if filter_device_with is None else filter_device_with,
                pagination_token,
            ),
            {"content-type": "application/x-www-form-urlencoded"},
        )
        match = json.loads(REVIEWS_REGEX.findall(dom)[0])
        try:
            token = json.loads(match[0][2])[-2][-1]
        except:
            token = None

        results = json.loads(match[0][2])
        if len(results) == 0 or len(results[0]) == 0:
            return [], token
        return results[0], token

    def reviews(
        self,
        app_id: str,
        lang: str = "en",
        country: str = "us",
        sort: play_store_enums.Sort = play_store_enums.Sort.NEWEST,
        count: int = 100,
        filter_score_with: int = None,
        filter_device_with: int = None,
        continuation_token: ContinuationToken = None,
    ) -> Optional[Tuple[List[dict], ContinuationToken]]:
        sort = sort.value

        if continuation_token is not None:
            token = continuation_token.token
            # print(token)

            if token is None:
                return None

            lang = continuation_token.lang
            country = continuation_token.country
            sort = continuation_token.sort
            count = continuation_token.count
            filter_score_with = continuation_token.filter_score_with
            filter_device_with = continuation_token.filter_device_with
        else:
            token = None

        url = self.__build_url(lang=lang, country=country)

        _fetch_count = count

        result = []

        while True:
            if _fetch_count == 0:
                break

            if _fetch_count > MAX_COUNT_EACH_FETCH:
                _fetch_count = MAX_COUNT_EACH_FETCH

            try:
                review_items, token = self._fetch_review_items(
                    url,
                    app_id,
                    sort,
                    _fetch_count,
                    filter_score_with,
                    filter_device_with,
                    token,
                )
            except Exception:
                token = None
                break

            for review in review_items:
                result.append(
                    {
                        k: spec.extract_content(review)
                        for k, spec in elements.ElementSpecs().Review.items()
                    }
                )

            _fetch_count = count - len(result)

            if isinstance(token, list):
                token = None
                break
            if token is None:
                break

        return (
            result,
            ContinuationToken(
                token, lang, country, sort, count, filter_score_with, filter_device_with
            ),
        )

    def reviews_all(self, app_id: str, sleep_milliseconds: int = 0, **kwargs) -> List:
        continuation_token = None
        result = []
        while True:
            _result, continuation_token = self.reviews(
                app_id,
                count=MAX_COUNT_EACH_FETCH,
                continuation_token=continuation_token,
                **kwargs
            )
            result.extend(_result)
            if continuation_token.token is None:
                break
            if sleep_milliseconds:
                time.sleep(sleep_milliseconds / 1000)
        return result


class PlayStoreAppDetails:
    __URL_FORMAT = (
        "{}/store/apps/details?id={{app_id}}&hl={{lang}}&gl={{country}}".format(
            PLAY_STORE_BASE_URL
        )
    )

    def __init__(self):
        self.__play_store_req = PlayStoreRequest()
        self.url = None

    def __build_url(self, app_id: str, lang: str, country: str) -> str:
        return self.__URL_FORMAT.format(app_id=app_id, lang=lang, country=country)

    def __fetch_app_details(
        self, app_id: str, lang: str = "en", country: str = "us"
    ) -> str:
        self.url = self.__build_url(app_id, lang, country)
        app_text = self.__play_store_req.get(self.url)
        return app_text

    def app(self, app_id: str, lang: str = "en", country: str = "us", **kwargs) -> Dict:
        app_text = self.__fetch_app_details(app_id, lang, country)
        matched_result = APP_SCRIPT_REGEX.findall(app_text)
        dataset: Dict = {}

        for match in matched_result:
            key_match = APP_KEY_REGEX.findall(match)
            value_match = APP_VALUE_REGEX.findall(match)
            if key_match and value_match:
                key = key_match[0]
                value = json.loads(value_match[0])
                dataset[key] = value
        result = {}

        for k, spec in elements.ElementSpecs.Detail.items():
            content = spec.extract_content(dataset)
            if content is None:
                result[k] = spec.fallback_value
            else:
                result[k] = content

        result["appId"] = app_id
        result["url"] = self.url

        return result
