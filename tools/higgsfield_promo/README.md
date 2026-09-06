# Higgsfield promo advisor

Небольшой инструмент для магазина колец Aurelia: спрашивает ссылку на сайт
или описание бизнеса и советует, какой сценарий промо-видео в Higgsfield
подойдёт — «roomwalk» (проход камеры по помещению) или «exploded» (разборка
товара на детали крупным планом).

## Что здесь реальное, а что нет

- `roomwalk` и `exploded` — **не** официальные пресеты Higgsfield. Мы
  проверили `higgsfield preset list` / `higgsfield model list`: пресетов с
  такими именами нет. Это просто два сценария движения камеры, которые
  реальные модели Higgsfield (`cinematic_studio_video`,
  `marketing_studio_video`, `product-photoshoot` и т.д.) умеют выполнять,
  если описать их в prompt'е. Этот скрипт формирует такой prompt.
- Плагина `roomwalk@roomwalk` из маркетплейса `Aironzak/instagram` не
  существует — в связанном GitHub-аккаунте нет такого репозитория с
  подобным содержимым, поэтому вместо установки несуществующего плагина
  здесь написан рабочий инструмент поверх официального Higgsfield CLI
  (`@higgsfield/cli`, установлен через npm) и официального Python SDK
  (`higgsfield-client`, установлен через pip).

## Подключение к Higgsfield

`higgsfield auth login` (браузерный OAuth) в удалённой/облачной сессии не
работает: колбэк идёт на `localhost:8765` внутри песочницы, куда браузер на
вашем устройстве достучаться не может — вход просто зависает. Поэтому
используется способ, который сама документация Higgsfield рекомендует для
серверных интеграций — API-ключ:

1. Откройте https://cloud.higgsfield.ai/api-keys в своём браузере и войдите
   в аккаунт.
2. Создайте API-ключ (пара `key_id:key_secret`).
3. Задайте переменную окружения и проверьте подключение:

   ```bash
   export HF_KEY="key_id:key_secret"
   python3 tools/higgsfield_promo/connect_higgsfield.py
   ```

## Запуск советчика сценария

```bash
python3 tools/higgsfield_promo/advisor.py
```

Скрипт спросит ссылку на сайт или описание бизнеса, разберёт текст по
ключевым словам и предложит `roomwalk` или `exploded` вместе с готовым
prompt'ом и командой для CLI.
