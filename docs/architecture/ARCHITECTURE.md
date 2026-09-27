# Архитектура

**Статус:** целевая архитектура MVP + каркас S00 (реализация по `docs/07-SPRINTS.md`)  
**Ограничение:** клиентская PWA без сервера, аккаунтов и облачной синхронизации.

## Компоненты

```text
src/
  app/       оболочка, маршруты, меню плиток, родительский центр
  content/   тексты, фразы, каталог игр (без логики игр)
  games/     девять изолированных игровых модулей + registry.ts
  mascot/    отображение и реакции Мяу
  shared/    контракт игры, storage, placeholders (+ audio/pointer в S03)
  styles/    общие стили, placeholders.css, game-stub.css
public/
  assets/    статические изображения и аудио
tests/
  unit/      логика без браузера
  e2e/       критические пользовательские пути
```

## Поток данных (S00)

```text
main.ts
  → app/shell (экран)
  → (S01+) маршрутизация
       → games/registry.getGameById(id)
            → GameModule.mount(container, { settings })
            → GameModule.unmount()

settings: shared/storage.loadSettings() ⇄ localStorage
каталог имён: content/catalog.ts (только данные)
```

## Направление зависимостей

- `main.ts` запускает только оболочку.
- `app/` читает реестр игр и открывает модуль по ID.
- `games/<id>/` может использовать `shared/`, `mascot/`, `content/`.
- Игра **не импортирует другую игру**.
- `shared/` не знает о конкретной игре.
- `content/` не содержит DOM и бизнес-логику.

## Контракт игрового модуля (S00)

Файл: `src/shared/game-module.ts`.

- `meta`: id, title, zoneId, modules
- `mount(container, context)` — запуск
- `unmount()` — очистка DOM/слушателей/таймеров/аудио
- `context.settings` — снимок настроек на вход в игру

Заглушка `createStubGame` удалена: реестр отдаёт 9 настоящих игр.
Реестр: `src/games/registry.ts` — добавить игру = новая папка + одна строка в массиве;
оболочку для этого править не нужно.

## Состояние и данные

- Временное состояние игры живёт в памяти и очищается при `unmount`.
- Сохраняются: имя ребёнка, звук/музыка/тихий режим, EN-категория, лимит счёта,
  список ID локальных фото-пазлов (`src/shared/storage.ts`, ключ `meow-planet.settings`).
- `schemaVersion` + `normalizeSettings` / `loadSettings` — битый JSON и чужие типы
  не роняют приложение.
- Имя ребёнка: `sanitizeChildName` + только `textContent`, никогда `innerHTML`.
- Фото остаются локально; сеть, камера и облако не используются.

## Заглушки CSS/SVG (путь А)

До мегафайла (S13) визуал — классы из `src/styles/placeholders.css`
и хелпер `src/shared/placeholders.ts` (`placeholderClass`).

- Формы: circle, square, triangle, rect, star, balloon
- Цвета: 7 цветов радуги (`ph-color--red` … `violet`)
- Размер — CSS, не отдельные файлы «большой/маленький»
- Логика игр опирается на data-атрибуты/классы, не на PNG

## Общие сервисы

| Сервис | Статус |
|---|---|
| `game-module` / stub | S00 ✅ |
| `storage` | S00 ✅ |
| `placeholders` | S00 ✅ |
| `audio` | S03 ✅ |
| `pointer` / interactjs | S03 ✅ / S05 ✅ (drag в сортировке) |
| `soft-error` | S03 ✅ |
| `random` | S03 ✅ |
| `object-bank` | S03 ✅ (каркас) |
| `placement` | S05–S06 ✅ (match + magnet) |
| `puzzle-photos` / IndexedDB | S03 ✅ |
| `puzzle` / headbreaker | S09 |

## PWA и публикация

- Vite + `vite-plugin-pwa`.
- `base: '/meow-planet/'` для GitHub Pages.
- Workbox manifest — единый источник для app shell/offline precache и boot progress;
  build проверяет совпадение списков (ADR-0001).
- Обновление Service Worker — по запросу, без внезапного сброса активной игры.
- Финальные PNG-иконки 192×192 и 512×512 создаются в S13–S15.

## Проверка архитектуры

- Unit: реестр, storage, placeholders, чистая логика игр и сервисов.
- E2e: навигация, настройки, по одному критическому пути каждой игры.
- Игровая логика не должна зависеть от финальных изображений: до **S16** работают
  CSS/SVG-заглушки (S14 polish — на заглушках, **0.15.14**).
