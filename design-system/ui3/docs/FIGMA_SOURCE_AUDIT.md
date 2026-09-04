# Аудит переноса UI3 из Figma

Дата первоначального снимка: 31 июля 2026 года.
Дата повторной проверки: 2 августа 2026 года.
Актуальная полная сверка: 6 августа 2026 года.

Источник: [UI3 — Figma’s UI Kit (Community)](https://www.figma.com/design/C87oqghCfxdKR5iYmCxEVP/UI3--Figma-s-UI-Kit--Community-?node-id=2012-163499), file key `C87oqghCfxdKR5iYmCxEVP`.

## Результат

Повторная проверка выполнена read-only через Figma Plugin API по всем 29 страницам. Отдельно проверены component sets и properties на страницах Avatars, Badges, Buttons, Checkboxes, Comments, Dropdowns, Inputs, Menus, Modals, Notifications, Radio Buttons, Segmented Control, Sliders, Switches, Tabs, Tooltips и Visual Bells. Правила применения и variant axes записаны в `references/ui3-community-pages.md`.

| Область | Источник Figma | Локальный комплект | Статус |
|---|---:|---:|---|
| Страницы | 29 | 29 в metadata snapshot | Совпадает |
| Цветовые variables | 946, 8 modes | 946, 8 modes | Совпадает |
| Typography variables | 57 | 57 | Совпадает |
| Sizing variables | 12 | 12 | Совпадает |
| Text styles | 12 | 12 | Совпадает |
| Effect/elevation styles | 10 | 10 JSON + CSS | Совпадает |
| Icon components | 820 | 820 в индексе | Совпадает |
| Icon component sets | 9 | 9 в индексе | Совпадает |
| Кандидаты на SVG-экспорт | 730 | 730 | Совпадает |
| Реально отрисовываемые icon components | 729 | 729 manifest records | Совпадает |
| Уникальные SVG | 728 | 728 локальных файлов | Совпадает с учетом дубля геометрии |
| Framework-neutral UI3 primitives | Основные product families и состояния | Native DOM + CSS/ARIA factories | Добавлено; visual QA в целевом iframe обязателен |

Актуальные counts component pages:

| Страница | Component sets | Components |
|---|---:|---:|
| Icons | 9 | 820 |
| Cursors | 0 | 90 |
| Avatars | 2 | 63 |
| Badges | 3 | 31 |
| Buttons | 5 | 237 |
| Checkboxes | 1 | 19 |
| Comments | 6 | 65 |
| Dropdowns | 1 | 16 |
| Inputs | 10 | 111 |
| Menus | 10 | 72 |
| Modals, Dialogs | 5 | 42 |
| Notifications | 1 | 4 |
| Radio Buttons | 1 | 12 |
| Segmented Control | 4 | 46 |
| Sliders | 4 | 33 |
| Switches | 1 | 9 |
| Tabs | 2 | 11 |
| Tooltips | 2 | 16 |
| Visual Bells | 2 | 39 |
| ❖ Document Components | 5 | 26 |

Остальные страницы (`Cover`, `Overview`, `Typography`, `Color`, `Elevations`, `Grid`, `Templates` и две `---`) содержат foundations, документацию или композиционные примеры и не добавляют product component sets.

Для иконок fingerprint имён 730 export candidates равен `929e248d` и совпадает с локальным manifest (включая один failed export). Поэтому по актуальной сверке замена token snapshot, CSS или SVG не требуется: локальный набор уже соответствует доступной публичной копии. Изменены только инструкции и каталог правил, чтобы новые component materials не терялись при внедрении.

Машинная сверка нормализованных данных дала одинаковые контрольные хэши источника и локального снимка:

- Colors: `95a0fdc7`;
- Typography: `f25b7660`;
- Sizing: `f4b8cb3e`;
- Text styles: `d705db1c`;
- Icon inventory: `56a468b8`.

Актуальная сверка имён variables 6 августа дала одинаковые fingerprints:

- Colors: `8d872026` (946, 8 modes);
- Typography: `cf48226f` (57);
- Sizing: `f4c27e55` (12).

## Иконки

Одноцветные SVG переведены на `currentColor`, многоцветные сохранены без подмены цветов. Manifest хранит исходное имя, `nodeId`, component key, размер, локальный путь и hash геометрии.

Для dropdown/menu в исходном UI3 snapshot поверхность меню — тёмная (`✦/bg/menu/default`), а основной текст меню — светлый (`✦/text/menu/default`) во всех восьми режимах. Поэтому исправление в starter-kit явно задаёт светлый текст и тёмную menu surface и в светлой, и в тёмной теме; это не зависит от наследования цвета страницы.

В источнике есть два повторяющихся имени:

- `icon.24.text.paragraph-indent` — одинаковая геометрия, поэтому два component records используют один SVG;
- `icon.24.text.resize-height` — разная геометрия, поэтому обе версии получили стабильный hash-суффикс.

Источник содержит одну подтвержденную аномалию: `icon.16.slice`, node `1:540750`, имеет видимую boolean-геометрию 0×0. Figma возвращает ошибку экспорта. Компонент записан в `failedExports` с кодом `SOURCE_EMPTY_GEOMETRY`; пустая или выдуманная замена не добавлялась.

## Граница полноты

Этот пакет полностью переносит проверенные foundations, стили эффектов и пригодные для экспорта иконки указанной Community-копии. Он также содержит runtime adapter и процесс внедрения в плагины.

Для основных product families добавлен framework-neutral native DOM слой в `src/ui3-primitives.ts` и `src/ui3-primitives.css`: Buttons, Inputs, Menus, Dropdowns, Dialogs, Notifications, Comments, Radio/Checkbox/Switch, Segmented/Tabs, Sliders, Tooltips, Avatars, Badges, Chit/Chip и Progress. Он переносит публичные variant axes и runtime-состояния в typed options, `data-*` и ARIA.

Это не обещает пиксельную code-component parity каждой из десятков комбинаций Figma text/boolean/instance-swap properties или helper-set геометрии. Figma-компонент и кодовый компонент имеют разные контракты доступности, поведения и runtime-темизации; поэтому product adapter должен пройти visual и functional QA в целевом iframe. Полный source inventory остаётся в `references/ui3-community-component-sets.md`.

## Повторная проверка

Из корня комплекта:

~~~sh
npm run effects:build
npm run validate
npm run icons:list
~~~

Для выборочной интеграции иконок:

~~~sh
npm run icons:module -- --icons icon.16.close,icon.24.check --out src/ui3-icons.selected.ts
~~~
