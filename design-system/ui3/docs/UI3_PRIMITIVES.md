# UI3 reusable primitives

Этот слой переносит компонентные правила публичного UI3 Community-файла в framework-neutral native DOM API. Он не добавляет React/Vue-зависимость и не изменяет plugin-main: UI-компоненты живут только в iframe.

## Подключение

~~~ts
import "./design-system/ui3/src/index.css";
import { createButton, createDropdown } from "./design-system/ui3/src/ui3-primitives";

const primary = createButton({ label: "Import", variant: "primary", onClick: runImport });
document.querySelector("#actions")?.append(primary.root);

const format = createDropdown({
  label: "Format",
  items: [
    { label: "PDF", value: "pdf", selected: true },
    { label: "SVG", value: "svg" },
  ],
  onChange: value => console.log(value),
});
document.querySelector("#controls")?.append(format.root);
~~~

Каждый factory возвращает `{ root, destroy() }`. `destroy()` удаляет listeners и DOM-узел. `createDropdown` и `createModal` также возвращают `open()`, `close()` и `toggle()`.

## Покрытие страниц UI3

| Страница Figma | Primitive API |
|---|---|
| Buttons | `createButton`, `createIconButton` |
| Icons | `createSvgIcon` и выбранный модуль из `icons:module` |
| Avatars | `createAvatar` |
| Badges | `createBadge` |
| Checkboxes | `createCheckbox` |
| Radio Buttons | `createRadio` |
| Switches | `createSwitch` |
| Dropdowns | `createDropdown` |
| Inputs | `createTextInput`, `createNumericInput`, `createColorInput`, `createComboInput` |
| Menus | `createMenu` |
| Modals, Dialogs | `createModal` |
| Segmented Control | `createSegmentedControl` |
| Tabs | `createTabs` |
| Sliders | `createSlider` |
| Tooltips | `createTooltip` |
| Notifications | `createNotification` |
| Visual Bells | `createVisualBell` |
| Comments | `createComment`, `createCommentComposer` |
| Inputs / variable chips | `createChit`, `createVariableChip` |
| Layout support | `.ui3-stack`, `.ui3-row`, `.ui3-divider`, `.ui3-surface`, `.ui3-scroll-area` |

Templates, Cursors и Document Components остаются composition/reference assets, а не самостоятельными product controls. Их правила находятся в `references/ui3-community-pages.md` и `references/ui3-community-component-sets.md`.

## Правила реализации

- Варианты передаются через `data-variant`, `data-size`, `data-state` и ARIA; не добавляйте новые HEX в screen-код.
- Нативные `input`, `button`, `textarea`, `select` сохраняют клавиатурное поведение браузера.
- Dropdown и Menu используют явную тёмную поверхность и светлый текст в обеих темах; selection/disabled выражаются через `aria-selected`/`aria-disabled`.
- Modal использует `special/modalbackdrop`, E500, Header → Content → Footer и закрытие по Escape.
- Tabs используют `role=tablist/tab/tabpanel`; стрелки переключают вкладки.
- Checkbox, radio и switch используют native inputs; `mixed` выставляется через `indeterminate`.
- Icon-only controls получают обязательный accessible name.
- Component axes из каталога (`variant`, `size`, `state`, `disabled`, `stroke`, `iconLead`, `variable`, `dropdown`) передаются как `data-*` и не требуют дублирования CSS-компонента.
- Для async workflow используйте `createProgress` и Notice/Bell; не блокируйте UI во время длительной операции без статуса.

## Граница переноса

В Figma component sets есть десятки комбинаций text, boolean и instance-swap properties. CSS/DOM слой реализует все публичные component families и основные axes/states, но не копирует внутреннюю геометрию каждого helper-set пиксель-в-пиксель. Exact source inventory сохраняется в каталогах; product adapter должен выбирать только нужные варианты и проходить visual QA в реальном iframe.

Не переносите `_` helper components в production без отдельного решения. Не публикуйте в runtime nodeId, временные Figma export URL или API-токен.
