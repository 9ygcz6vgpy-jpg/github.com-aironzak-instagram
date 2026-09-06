#!/usr/bin/env python3
"""
Connects this environment to Higgsfield AI so promo videos can be generated
for the ring shop.

Important, read before relying on this: Higgsfield's CLI (`higgsfield auth
login`) only supports browser OAuth with a loopback callback to
localhost:8765 on the machine running the CLI. In a remote/cloud session
like this one, that localhost is inside the sandbox, not on your device, so
the browser can never deliver the callback here and the login would hang
forever. That is not a bug in this script; it is a real limitation of that
flow when the CLI and the browser are on different machines.

The reliable alternative for a server-side / remote environment is an API
key + secret, created in your own browser at the Higgsfield Cloud console
and then pasted here as an environment variable. That is also what
Higgsfield's own docs recommend for anything server-side (never embed
credentials in client-side code).

Usage:
    export HF_KEY="key_id:key_secret"          # from https://cloud.higgsfield.ai/api-keys
    python3 connect_higgsfield.py

or, with separate variables:
    export HF_API_KEY="key_id"
    export HF_API_SECRET="key_secret"
    python3 connect_higgsfield.py
"""
import os
import sys

API_KEYS_URL = "https://cloud.higgsfield.ai/api-keys"


def credentials_present() -> bool:
    return bool(os.environ.get("HF_KEY")) or bool(
        os.environ.get("HF_API_KEY") and os.environ.get("HF_API_SECRET")
    )


def print_setup_instructions() -> None:
    print(
        "Higgsfield ещё не подключён.\n"
        "\n"
        "Открыть браузерный `higgsfield auth login` из этой удалённой сессии нельзя — "
        "эта команда ждёт OAuth-колбэк на localhost внутри самой песочницы, а не на "
        "вашем устройстве, так что ваш браузер до неё физически не достучится и вход "
        "просто зависнет.\n"
        "\n"
        "Рабочий способ для серверной/удалённой среды — создать API-ключ в своём "
        "браузере (это именно то, что рекомендует сама документация Higgsfield для "
        "любых server-side интеграций):\n"
        f"\n  1. Откройте {API_KEYS_URL} и войдите в свой аккаунт Higgsfield.\n"
        "  2. Создайте API-ключ (пара key_id:key_secret).\n"
        "  3. Пришлите его мне, либо выполните перед запуском advisor.py:\n"
        '       export HF_KEY="key_id:key_secret"\n'
    )


def check_connection() -> bool:
    try:
        import higgsfield_client  # noqa: F401
    except ImportError:
        print("Пакет higgsfield-client не установлен: pip3 install --user higgsfield-client")
        return False

    hf_key = os.environ.get("HF_KEY")
    if hf_key and ":" not in hf_key:
        print('HF_KEY задан, но не похож на "key_id:key_secret" (нет двоеточия).')
        return False

    # There is no documented no-cost "ping" endpoint in the SDK, so we don't
    # fabricate one here. The credentials are format-checked above; the real
    # test happens on the first actual generation call in advisor.py, whose
    # error message will say plainly if the key/secret are rejected.
    print("Переменные окружения для Higgsfield заданы и выглядят корректно.")
    print("Итоговая проверка произойдёт при первом реальном вызове генерации в advisor.py.")
    return True


def main() -> int:
    if not credentials_present():
        print_setup_instructions()
        return 1
    return 0 if check_connection() else 1


if __name__ == "__main__":
    sys.exit(main())
