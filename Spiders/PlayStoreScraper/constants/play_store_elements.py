from dataclasses import dataclass, field
from datetime import datetime
from html import unescape
from typing import Any, Callable, Dict, List, Optional


def unescape_text(s: str):
    return unescape(s.replace("<br>", "\r\n"))


class ElementSpec:
    def __init__(
        self,
        ds_num: Optional[int],  # depth number
        data_map: List[int],  # at what index the values are present
        post_processor: Callable = None,  # function applied after value is parsed
        fallback_value: Any = None,  # backtracking if any exception is occurred
    ):
        self.ds_num = ds_num
        self.data_map = data_map
        self.post_processor = post_processor
        self.fallback_value = fallback_value

    def extract_content(self, source: Dict) -> Any:
        try:
            target_source = (
                source if self.ds_num is None else source.get(f"ds:{self.ds_num}", {})
            )
            result = nested_lookup(target_source, self.data_map)
            if self.post_processor:
                result = self.post_processor(result)
        except Exception:
            result = (
                self.fallback_value.extract_content(source)
                if isinstance(self.fallback_value, ElementSpec)
                else self.fallback_value
            )
        return result


@dataclass
class ElementSpecs:
    Review: Dict[str, ElementSpec] = field(
        default_factory=lambda: {
            "reviewId": ElementSpec(None, [0]),
            "userName": ElementSpec(None, [1, 0]),
            "userImage": ElementSpec(None, [1, 1, 3, 2]),
            "content": ElementSpec(None, [4]),
            "score": ElementSpec(None, [2]),
            "thumbsUpCount": ElementSpec(None, [6]),
            "reviewCreatedVersion": ElementSpec(None, [10]),
            "at": ElementSpec(None, [5, 0], lambda v: datetime.fromtimestamp(v)),
            "replyContent": ElementSpec(None, [7, 1]),
            "repliedAt": ElementSpec(
                None, [7, 2, 0], lambda v: datetime.fromtimestamp(v)
            ),
            "appVersion": ElementSpec(None, [10]),
        }
    )
    Detail = {
        "title": ElementSpec(5, [1, 2, 0, 0]),
        "description": ElementSpec(
            5,
            [1, 2],
            lambda s: unescape_text(
                nested_lookup(s, [12, 0, 0, 1]) or nested_lookup(s, [72, 0, 1])
            ),
        ),
        "descriptionHTML": ElementSpec(
            5,
            [1, 2],
            lambda s: nested_lookup(s, [12, 0, 0, 1]) or nested_lookup(s, [72, 0, 1]),
        ),
        "summary": ElementSpec(5, [1, 2, 73, 0, 1], unescape_text),
        "installs": ElementSpec(5, [1, 2, 13, 0]),
        "minInstalls": ElementSpec(5, [1, 2, 13, 1]),
        "realInstalls": ElementSpec(5, [1, 2, 13, 2]),
        "score": ElementSpec(5, [1, 2, 51, 0, 1]),
        "ratings": ElementSpec(5, [1, 2, 51, 2, 1]),
        "reviews": ElementSpec(5, [1, 2, 51, 3, 1]),
        "histogram": ElementSpec(
            5,
            [1, 2, 51, 1],
            lambda container: [
                container[1][1],
                container[2][1],
                container[3][1],
                container[4][1],
                container[5][1],
            ],
            [0, 0, 0, 0, 0],
        ),
        "price": ElementSpec(
            5, [1, 2, 57, 0, 0, 0, 0, 1, 0, 0], lambda price: (price / 1000000) or 0
        ),
        "free": ElementSpec(5, [1, 2, 57, 0, 0, 0, 0, 1, 0, 0], lambda s: s == 0),
        "currency": ElementSpec(5, [1, 2, 57, 0, 0, 0, 0, 1, 0, 1]),
        "sale": ElementSpec(4, [0, 2, 0, 0, 0, 14, 0, 0], bool, False),
        "saleTime": ElementSpec(4, [0, 2, 0, 0, 0, 14, 0, 0]),
        "originalPrice": ElementSpec(
            3, [0, 2, 0, 0, 0, 1, 1, 0], lambda price: (price / 1000000) or 0
        ),
        "saleText": ElementSpec(4, [0, 2, 0, 0, 0, 14, 1]),
        "offersIAP": ElementSpec(5, [1, 2, 19, 0], bool, False),
        "inAppProductPrice": ElementSpec(5, [1, 2, 19, 0]),
        "developer": ElementSpec(5, [1, 2, 68, 0]),
        "developerId": ElementSpec(5, [1, 2, 68, 1, 4, 2], lambda s: s.split("id=")[1]),
        "developerEmail": ElementSpec(5, [1, 2, 69, 1, 0]),
        "developerWebsite": ElementSpec(5, [1, 2, 69, 0, 5, 2]),
        "developerAddress": ElementSpec(5, [1, 2, 69, 2, 0]),
        "privacyPolicy": ElementSpec(5, [1, 2, 99, 0, 5, 2]),
        # "developerInternalID": ElementSpec(5, [0, 12, 5, 0, 0]),
        "genre": ElementSpec(5, [1, 2, 79, 0, 0, 0]),
        "genreId": ElementSpec(5, [1, 2, 79, 0, 0, 2]),
        "icon": ElementSpec(5, [1, 2, 95, 0, 3, 2]),
        "headerImage": ElementSpec(5, [1, 2, 96, 0, 3, 2]),
        "screenshots": ElementSpec(
            5, [1, 2, 78, 0], lambda container: [item[3][2] for item in container], []
        ),
        "video": ElementSpec(5, [1, 2, 100, 0, 0, 3, 2]),
        "videoImage": ElementSpec(5, [1, 2, 100, 1, 0, 3, 2]),
        "contentRating": ElementSpec(5, [1, 2, 9, 0]),
        "contentRatingDescription": ElementSpec(5, [1, 2, 9, 2, 1]),
        "adSupported": ElementSpec(5, [1, 2, 48], bool),
        "containsAds": ElementSpec(5, [1, 2, 48], bool, False),
        "released": ElementSpec(5, [1, 2, 10, 0]),
        "lastUpdatedOn": ElementSpec(5, [1, 2, 145, 0, 0]),
        "updated": ElementSpec(5, [1, 2, 145, 0, 1, 0]),
        "version": ElementSpec(
            5, [1, 2, 140, 0, 0, 0], fallback_value="Varies with device"
        ),
    }


def nested_lookup(source, indexes):
    try:
        if len(indexes) == 1:
            return source[indexes[0]]
        return nested_lookup(source[indexes[0]], indexes[1:])
    except (TypeError, KeyError, IndexError):
        return None
