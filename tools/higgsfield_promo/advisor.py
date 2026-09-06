#!/usr/bin/env python3
"""
Asks for a website URL or a short business description, then recommends
which promo-video approach fits better:

  - "roomwalk"  — camera moves through a physical space (shop, showroom,
                  interior, real estate, hotel, restaurant).
  - "exploded"  — a single manufactured product is broken into its parts
                  and reassembled on camera (jewelry, watches, electronics,
                  mechanical goods).

Important honesty note: Higgsfield does not ship literal presets named
"roomwalk" or "exploded" (there is no such preset id in `higgsfield preset
list` / `higgsfield model list`). Those are just useful short names for two
camera-movement concepts that its general-purpose video/product models
(`cinematic_studio_video`, `marketing_studio_video`, `product-photoshoot`,
etc.) can produce if you describe them in the prompt. This script builds
that prompt for you; it does not claim a preset exists that doesn't.

Run `connect_higgsfield.py` first (or just set HF_KEY) to be able to submit
the job for real; otherwise this only prints the recommendation and the
ready-to-run command.
"""
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse

ROOMWALK_KEYWORDS = [
    "шоурум", "showroom", "интерьер", "interior", "помещени", "магазин", "store",
    "boutique", "бутик", "отель", "hotel", "ресторан", "restaurant", "кафе", "cafe",
    "недвижимост", "real estate", "квартир", "apartment", "офис", "office",
    "выставочн", "showroom tour", "зал", "салон красоты", "spa",
]

EXPLODED_KEYWORDS = [
    "кольцо", "ring", "украшени", "jewelry", "jewellery", "часы", "watch",
    "гаджет", "gadget", "электроник", "electronics", "устройство", "device",
    "механизм", "mechanism", "деталь", "сборка", "assembly", "камень", "gemstone",
    "оправа", "setting", "handmade", "ручная работа", "флакон", "bottle", "упаковк",
]


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.chunks = []
        self.title_chunks = []
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        data = data.strip()
        if not data:
            return
        if self._in_title:
            self.title_chunks.append(data)
        else:
            self.chunks.append(data)


def looks_like_url(text: str) -> bool:
    parsed = urlparse(text if "://" in text else f"https://{text}")
    return bool(parsed.netloc) and "." in parsed.netloc


def fetch_site_text(url: str) -> str:
    import requests

    if "://" not in url:
        url = f"https://{url}"
    resp = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    parser = TextExtractor()
    parser.feed(resp.text)
    title = " ".join(parser.title_chunks)
    body = " ".join(parser.chunks)[:4000]
    return f"{title}. {body}"


def score_text(text: str) -> tuple[int, int]:
    lowered = text.lower()
    roomwalk_score = sum(1 for kw in ROOMWALK_KEYWORDS if kw in lowered)
    exploded_score = sum(1 for kw in EXPLODED_KEYWORDS if kw in lowered)
    return roomwalk_score, exploded_score


def recommend(text: str) -> tuple[str, str]:
    roomwalk_score, exploded_score = score_text(text)
    if roomwalk_score == 0 and exploded_score == 0:
        scenario = "exploded"
        reason = (
            "В описании не нашлось явных ключевых слов ни про помещение, ни про "
            "конкретный предмет. По умолчанию рекомендую 'exploded', так как это "
            "универсально работает для физического товара, который можно показать "
            "крупным планом."
        )
    elif exploded_score >= roomwalk_score:
        scenario = "exploded"
        reason = (
            f"Похоже на конкретный физический товар (совпадений: {exploded_score} "
            f"против {roomwalk_score} про помещение) — разборка/сборка предмета "
            "крупным планом лучше покажет детали, материалы и качество исполнения."
        )
    else:
        scenario = "roomwalk"
        reason = (
            f"Похоже на бизнес, завязанный на физическом пространстве (совпадений: "
            f"{roomwalk_score} против {exploded_score} про отдельный товар) — проход "
            "камеры по помещению лучше передаст атмосферу и масштаб."
        )
    return scenario, reason


PROMPTS = {
    "roomwalk": (
        "Cinematic steady walkthrough camera move, slowly gliding forward through "
        "the space, revealing key areas one by one, warm natural lighting, "
        "shallow depth of field, smooth continuous motion, no cuts"
    ),
    "exploded": (
        "Cinematic macro product shot, the object smoothly separates into its "
        "individual parts in mid-air in an exploded-view arrangement, then "
        "reassembles seamlessly, studio lighting, slow rotation, shallow depth "
        "of field, clean dark background"
    ),
}

COMMANDS = {
    "roomwalk": (
        "higgsfield generate create cinematic_studio_video "
        '--prompt "{prompt}" --image-references <путь_к_фото_помещения> --wait'
    ),
    "exploded": (
        "higgsfield generate create cinematic_studio_video "
        '--prompt "{prompt}" --image-references <путь_к_фото_товара> --wait'
    ),
}


def main() -> int:
    print(__doc__)
    user_input = input(
        "\nВставьте ссылку на сайт бизнеса или коротко опишите бизнес: "
    ).strip()

    if not user_input:
        print("Пустой ввод, нечего анализировать.")
        return 1

    if looks_like_url(user_input):
        try:
            text = fetch_site_text(user_input)
            print(f"\nСайт получен, анализирую текст со страницы...")
        except Exception as exc:  # noqa: BLE001
            print(f"\nНе удалось загрузить сайт ({exc}). Опишите бизнес текстом:")
            text = input("> ").strip()
    else:
        text = user_input

    scenario, reason = recommend(text)

    print(f"\nРекомендуемый сценарий: {scenario}")
    print(reason)
    print(f"\nГотовый prompt для Higgsfield:\n  {PROMPTS[scenario]}")

    if os.environ.get("HF_KEY") or (
        os.environ.get("HF_API_KEY") and os.environ.get("HF_API_SECRET")
    ):
        print(
            "\nHiggsfield подключён (переменные окружения заданы). Пришлите путь "
            "к фото товара/помещения — и я запущу генерацию через "
            "higgsfield_client.subscribe(...) с этим prompt'ом."
        )
    else:
        print(
            "\nHiggsfield пока не подключён. Сначала выполните connect_higgsfield.py "
            "(нужен API-ключ с https://cloud.higgsfield.ai/api-keys). Готовая команда "
            "для CLI, когда ключ будет:\n  "
            + COMMANDS[scenario].format(prompt=PROMPTS[scenario])
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
