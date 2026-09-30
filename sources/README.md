# Исходники, из которых собирается игра

Эти файлы не открываются приложением напрямую и не попадают в offline-кэш.
Скрипты нарезают их в `public/assets/`.

## `games/sound-world`

| Файл | Было в корне | Куда нарезается |
|---|---|---|
| `drum-kick.mp3` | `кик.mp3` | `sfx/drum-kick.mp3` |
| `drum-snare.mp3` | `снейр.mp3` | `sfx/drum-snare.mp3` |
| `drum-tom.mp3` | `бас.mp3` | `sfx/drum-tom.mp3` |
| `drum-right.mp3` | `sg_203880.mp3` | `sfx/drum-right.mp3` |
| `letters-ru.mp3` | `Русский алфавит.mp3` | `sfx/letter-ru-*.mp3` |
| `letters-en.mp3` | `Английский алфавит.mp3` | `sfx/letter-en-*.mp3` |
| `ship.mp3` | `корабль.mp3` | `sfx/ship.mp3` |

Новые дорожки пианино и гитары тоже класть сюда: `piano-do.mp3` … `piano-si.mp3`.

## `menu`

`menu-visit-bed.png` — исходный вариант лежанки. В игре используется уже подготовленный файл `public/assets/menu/menu-visit-bed.png`.
