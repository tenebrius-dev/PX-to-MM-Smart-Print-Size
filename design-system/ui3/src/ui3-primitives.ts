/*
 * Framework-neutral UI3 primitives.
 *
 * The factories deliberately use native DOM controls and ARIA roles. A plugin
 * can wrap the returned elements in React/Vue/Svelte without bringing in a
 * runtime dependency. Keep product-specific behavior in the callbacks and
 * keep visual states in ui3-primitives.css.
 */

export type Ui3Content = Node | string;
export type Ui3State = "default" | "hover" | "active" | "focused" | "disabled" | "selected" | "danger";
export type Ui3Size = "default" | "small" | "large" | "wide";
export type Ui3Tone = "default" | "secondary" | "tertiary" | "brand" | "danger" | "success" | "warning" | "figjam";

export interface Ui3Handle {
  root: HTMLElement;
  destroy(): void;
}

export interface Ui3DisclosureHandle extends Ui3Handle {
  open(): void;
  close(): void;
  toggle(): void;
}

export interface Ui3ButtonOptions {
  label?: string;
  variant?: "primary" | "secondary" | "secondary-destruct" | "destructive" | "figjam" | "ghost" | "inverse" | "link" | "link-danger" | "success";
  size?: Ui3Size;
  state?: Ui3State;
  icon?: Node;
  iconLead?: "left" | "center";
  hotkey?: string;
  pressed?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (event: MouseEvent) => void;
}

export interface Ui3IconOptions {
  label?: string;
  size?: 16 | 24;
  tone?: Ui3Tone;
  decorative?: boolean;
}

export interface Ui3IconButtonOptions extends Ui3ButtonOptions {
  label: string;
  size?: "default" | "large";
}

export interface Ui3BadgeOptions {
  label: string;
  variant?: "default" | "brand" | "component" | "danger" | "feedback" | "figjam" | "invert" | "selected" | "success" | "variable" | "warn" | "merged" | "archived" | "menu";
  size?: "small" | "large";
  strong?: boolean;
  icon?: Node;
}

export interface Ui3AvatarOptions {
  name?: string;
  src?: string;
  size?: "small" | "default" | "large";
  shape?: "circle" | "square";
  state?: "default" | "dash" | "design" | "spotlight" | "audio-calling" | "disabled";
  variant?: "photo" | "purple" | "grey" | "green" | "yellow" | "red" | "pink" | "blue" | "overflow-unread" | "overflow-read" | "org";
}

export interface Ui3FieldOptions {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export interface Ui3InputOptions extends Ui3FieldOptions {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  size?: "default" | "large";
  state?: "default" | "empty" | "active-empty" | "active-filled" | "focus" | "active" | "disabled" | "variable";
  variable?: boolean;
  dropdown?: boolean;
  leadingIcon?: Node;
  type?: "text" | "search" | "email" | "url" | "password" | "number" | "color";
  multiline?: boolean;
  rows?: number;
  onValueChange?: (value: string, event: Event) => void;
}

export interface Ui3InputHandle extends Ui3Handle {
  input: HTMLInputElement | HTMLTextAreaElement;
  getValue(): string;
  setValue(value: string): void;
}

export interface Ui3Option<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  selected?: boolean;
  secondary?: string;
  icon?: Node;
}

export interface Ui3DropdownHandle<T = string> extends Ui3DisclosureHandle {
  trigger: HTMLButtonElement;
  menu: HTMLElement;
  getValue(): T | undefined;
  select(value: T): void;
}

export interface Ui3MenuItem {
  label?: string;
  value?: string;
  kind?: "item" | "separator" | "heading";
  disabled?: boolean;
  checked?: boolean;
  mixed?: boolean;
  danger?: boolean;
  shortcut?: string;
  icon?: Node;
  submenu?: boolean;
  onSelect?: (item: Ui3MenuItem, event: Event) => void;
}

export interface Ui3MenuOptions {
  label?: string;
  variant?: "default" | "mixed-icons" | "avatars" | "label-only";
  onSelect?: (item: Ui3MenuItem, event: Event) => void;
}

export interface Ui3ModalOptions extends Ui3FieldOptions {
  title: string;
  width?: 240 | 320 | 480;
  headerVariant?: "default" | "tabs" | "navigation" | "dropdown";
  footerVariant?: "default" | "growth-stepper" | "sharing-actions" | "qa-tabs" | "qa-plugin" | "blank" | "ds-analytics" | "ds-library-enabled" | "ds-library-swap" | "ds-publishing" | "ds-library-count" | "ds-compare-changes";
  content?: Ui3Content;
  footer?: Ui3Content;
  closeLabel?: string;
  closeOnBackdrop?: boolean;
  onClose?: () => void;
}

export interface Ui3ModalHandle extends Ui3DisclosureHandle {
  dialog: HTMLElement;
}

export interface Ui3ChoiceOptions extends Ui3FieldOptions {
  label: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean;
  muted?: boolean;
  mixed?: boolean;
  ghost?: boolean;
  variant?: "input" | "button";
  onChange?: (checked: boolean, event: Event) => void;
}

export interface Ui3TabsOptions<T = string> {
  items: Array<Ui3Option<T> & { panel?: Ui3Content }>;
  selected?: T;
  onChange?: (value: T, event: Event) => void;
}

export interface Ui3SliderOptions {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  ticks?: number[];
  variant?: "corner-radius" | "fill" | "gradient" | "range" | "stepper" | "slider" | "color-range" | "disabled";
  label?: string;
  onChange?: (value: number, event: Event) => void;
}

export interface Ui3NoticeOptions {
  message: Ui3Content;
  variant?: "default" | "danger" | "warning" | "success" | "info";
  actionLabel?: string;
  closeLabel?: string;
  state?: "default" | "danger";
  color?: "blue" | "green" | "grey" | "pink" | "purple" | "red" | "yellow";
  onAction?: () => void;
  onClose?: () => void;
}

export interface Ui3CommentOptions {
  author?: string;
  message?: string;
  time?: string;
  unread?: boolean;
  selected?: boolean;
  active?: boolean;
  replies?: number;
  avatar?: Ui3Content;
  onClick?: (event: MouseEvent) => void;
}

function setAttributes(element: HTMLElement, attributes: Record<string, string | number | boolean | undefined>): void {
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined) continue;
    if (value === false) element.removeAttribute(name);
    else element.setAttribute(name, String(value));
  }
}

function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, attributes?: Record<string, string | number | boolean | undefined>): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (attributes) setAttributes(element, attributes);
  return element;
}

function appendContent(parent: HTMLElement, content: Ui3Content | undefined): void {
  if (content === undefined) return;
  if (typeof content === "string") parent.append(document.createTextNode(content));
  else parent.append(content);
}

function appendIcon(parent: HTMLElement, icon: Node | undefined, className = "ui3-icon-slot"): void {
  if (!icon) return;
  const slot = createElement("span", className, { "aria-hidden": "true" });
  slot.append(icon);
  parent.append(slot);
}

function attach(root: HTMLElement, cleanups: Array<() => void> = []): Ui3Handle {
  return {
    root,
    destroy() {
      for (const cleanup of cleanups.splice(0)) cleanup();
      root.remove();
    },
  };
}

function listen(target: EventTarget, type: string, handler: (event: any) => void, cleanups: Array<() => void>): void {
  target.addEventListener(type, handler as EventListener);
  cleanups.push(() => target.removeEventListener(type, handler as EventListener));
}

export function createSvgIcon(svg: string, options: Ui3IconOptions = {}): HTMLElement {
  const root = createElement("span", "ui3-icon", {
    "data-size": options.size || 16,
    "data-tone": options.tone,
    "aria-hidden": options.decorative || !options.label ? "true" : undefined,
    role: options.label ? "img" : undefined,
    "aria-label": options.label,
  });
  root.innerHTML = svg.trim();
  const svgElement = root.querySelector("svg");
  if (svgElement) {
    svgElement.setAttribute("width", String(options.size || 16));
    svgElement.setAttribute("height", String(options.size || 16));
    svgElement.setAttribute("focusable", "false");
    svgElement.setAttribute("aria-hidden", "true");
  }
  return root;
}

export function createButton(options: Ui3ButtonOptions = {}): Ui3Handle {
  const cleanups: Array<() => void> = [];
  const button = createElement("button", "ui3-button", {
    type: options.type || "button",
    "data-variant": options.variant || "primary",
    "data-size": options.size || "default",
    "data-state": options.state || "default",
    "data-icon-lead": options.iconLead,
    "aria-pressed": options.pressed,
    disabled: options.disabled,
  });
  appendIcon(button, options.icon);
  if (options.label !== undefined) { const label = createElement("span", "ui3-button__label"); label.textContent = options.label; button.append(label); }
  if (options.hotkey) { const hotkey = createElement("kbd", "ui3-button__hotkey"); hotkey.textContent = options.hotkey; button.append(hotkey); }
  if (options.onClick) listen(button, "click", options.onClick, cleanups);
  return attach(button, cleanups);
}

export function createIconButton(options: Ui3IconButtonOptions): Ui3Handle {
  const button = createElement("button", "ui3-icon-button", {
    type: options.type || "button",
    "data-size": options.size || "default",
    "data-variant": options.variant,
    "data-state": options.state,
    "aria-label": options.label,
    "aria-pressed": options.pressed,
    disabled: options.disabled,
  });
  appendIcon(button, options.icon);
  const cleanups: Array<() => void> = [];
  if (options.onClick) listen(button, "click", options.onClick, cleanups);
  return attach(button, cleanups);
}

export function createBadge(options: Ui3BadgeOptions): Ui3Handle {
  const badge = createElement("span", "ui3-badge", {
    "data-variant": options.variant || "default",
    "data-size": options.size || "small",
    "data-strong": options.strong,
  });
  appendIcon(badge, options.icon);
  const badgeLabel = createElement("span", "ui3-badge__label"); badgeLabel.textContent = options.label; badge.append(badgeLabel);
  return attach(badge);
}

export function createAvatar(options: Ui3AvatarOptions = {}): Ui3Handle {
  const avatar = createElement("span", "ui3-avatar", {
    "data-size": options.size || "default",
    "data-shape": options.shape || "circle",
    "data-state": options.state || "default",
    "data-variant": options.variant || (options.src ? "photo" : "grey"),
    role: "img",
    "aria-label": options.name || "Avatar",
  });
  if (options.src) {
    const image = createElement("img", undefined, { src: options.src, alt: "" });
    avatar.append(image);
  } else {
    avatar.textContent = (options.name || "?").trim().slice(0, 1).toUpperCase();
  }
  return attach(avatar);
}

export function createChit(content: Ui3Content, options: { size?: "default" | "large"; shape?: "circle" | "square" } = {}): Ui3Handle {
  const chit = createElement("span", "ui3-chit", { "data-size": options.size || "default", "data-shape": options.shape || "square" });
  appendContent(chit, content);
  return attach(chit);
}

export function createVariableChip(label: string, options: { selected?: boolean; disabled?: boolean; onClose?: () => void } = {}): Ui3Handle {
  const chip = createElement("span", "ui3-chip", {
    "data-state": options.disabled ? "disabled" : options.selected ? "selected" : "default",
    "aria-selected": options.selected,
    "aria-disabled": options.disabled,
  });
  const chipLabel = createElement("span", "ui3-chip__label"); chipLabel.textContent = label; chip.append(chipLabel);
  const cleanups: Array<() => void> = [];
  if (options.onClose) {
    const close = createElement("button", "ui3-icon-button", { type: "button", "aria-label": "Remove", "data-size": "default" });
    close.textContent = "×";
    listen(close, "click", options.onClose, cleanups);
    chip.append(close);
  }
  return attach(chip, cleanups);
}

function createFieldRoot(options: Ui3FieldOptions = {}): { root: HTMLElement; body: HTMLElement } {
  const root = createElement("label", "ui3-field");
  if (options.label) {
    const label = createElement("span", "ui3-field__label");
    label.textContent = options.label + (options.required ? " *" : "");
    root.append(label);
  }
  const body = createElement("span", "ui3-field__body");
  root.append(body);
  if (options.description) {
    const description = createElement("span", "ui3-field__description");
    description.textContent = options.description;
    root.append(description);
  }
  if (options.error) {
    const error = createElement("span", "ui3-field__error", { role: "alert" });
    error.textContent = options.error;
    root.append(error);
  }
  return { root, body };
}

export function createTextInput(options: Ui3InputOptions = {}): Ui3InputHandle {
  const { root, body } = createFieldRoot(options);
  const cleanups: Array<() => void> = [];
  const input = options.multiline
    ? createElement("textarea", "ui3-input", { rows: options.rows || 3, placeholder: options.placeholder, disabled: options.disabled, "aria-invalid": options.invalid, "data-size": options.size, "data-state": options.state, "data-variable": options.variable, "data-dropdown": options.dropdown })
    : createElement("input", "ui3-input", { type: options.type || "text", placeholder: options.placeholder, disabled: options.disabled, "aria-invalid": options.invalid, "data-size": options.size, "data-state": options.state, "data-variable": options.variable, "data-dropdown": options.dropdown });
  input.value = options.value || "";
  input.setAttribute("data-variant", options.multiline ? "multi-line" : "single-line");
  if (options.leadingIcon) {
    const wrap = createElement("span", "ui3-input-wrap", { "data-icon-lead": true });
    const icon = createElement("span", "ui3-input__icon", { "aria-hidden": true });
    icon.append(options.leadingIcon);
    wrap.append(icon, input);
    body.append(wrap);
  } else body.append(input);
  if (options.onValueChange) listen(input, "input", event => options.onValueChange?.(input.value, event), cleanups);
  return {
    ...attach(root, cleanups),
    input,
    getValue: () => input.value,
    setValue: value => { input.value = value; },
  };
}

export function createNumericInput(options: Ui3InputOptions & { value?: number | string; min?: number; max?: number; step?: number } = {}): Ui3InputHandle {
  const handle = createTextInput({ ...options, type: "number", value: options.value === undefined ? undefined : String(options.value) });
  if (options.min !== undefined) handle.input.setAttribute("min", String(options.min));
  if (options.max !== undefined) handle.input.setAttribute("max", String(options.max));
  if (options.step !== undefined) handle.input.setAttribute("step", String(options.step));
  return handle;
}

export function createColorInput(options: Ui3InputOptions & { value?: string } = {}): Ui3InputHandle {
  return createTextInput({ ...options, type: "color", value: options.value });
}

export function createComboInput<T = string>(options: Ui3InputOptions & { items: Ui3Option<T>[]; onSelect?: (value: T) => void }): Ui3Handle {
  const { root, body } = createFieldRoot(options);
  const combo = createElement("span", "ui3-combo");
  const input = createElement("input", "ui3-combo__input", { type: options.type || "text", placeholder: options.placeholder, disabled: options.disabled, "aria-invalid": options.invalid, "data-size": options.size, "data-state": options.state, "data-variable": options.variable });
  input.value = options.value || "";
  const trigger = createElement("button", "ui3-icon-button ui3-combo__trigger", { type: "button", "aria-label": "Show options" });
  trigger.textContent = "⌄";
  combo.append(input, trigger);
  body.append(combo);
  const cleanups: Array<() => void> = [];
  const menu = createElement("div", "ui3-dropdown-popover", { role: "listbox", hidden: true });
  options.items.forEach(item => {
    const option = createElement("button", "ui3-dropdown-option", { type: "button", role: "option", "aria-disabled": item.disabled, "aria-selected": item.selected });
    option.textContent = item.label;
    listen(option, "click", () => { if (item.disabled) return; input.value = item.label; menu.hidden = true; options.onSelect?.(item.value); }, cleanups);
    menu.append(option);
  });
  combo.append(menu);
  const toggle = () => { menu.hidden = !menu.hidden; };
  listen(trigger, "click", toggle, cleanups);
  return attach(root, cleanups);
}

export function createDropdown<T = string>(options: { label?: string; items: Ui3Option<T>[]; selected?: T; size?: "default" | "large"; disabled?: boolean; stroke?: boolean; iconLead?: boolean; onChange?: (value: T, event: Event) => void }): Ui3DropdownHandle<T> {
  const cleanups: Array<() => void> = [];
  const root = createElement("span", "ui3-dropdown");
  const trigger = createElement("button", "ui3-dropdown-control", { type: "button", "aria-haspopup": "listbox", "aria-expanded": false, "data-size": options.size, "data-stroke": options.stroke, "data-icon-lead": options.iconLead, disabled: options.disabled, "aria-label": options.label });
  const menu = createElement("div", "ui3-dropdown-popover", { role: "listbox", hidden: true, tabindex: -1 });
  root.append(trigger, menu);
  let selected = options.selected ?? options.items.find(item => item.selected)?.value;
  let open = false;
  const render = () => {
    const current = options.items.find(item => Object.is(item.value, selected));
    trigger.textContent = current?.label || options.label || "Select";
    menu.replaceChildren();
    for (const item of options.items) {
      const option = createElement("button", "ui3-dropdown-option", { type: "button", role: "option", "aria-selected": Object.is(item.value, selected), "aria-disabled": item.disabled });
      appendIcon(option, item.icon);
      const optionLabel = createElement("span", "ui3-dropdown-option__label"); optionLabel.textContent = item.label; option.append(optionLabel);
      if (item.secondary) { const secondary = createElement("span", "ui3-menu-item__trail"); secondary.textContent = item.secondary; option.append(secondary); }
      listen(option, "click", event => { if (item.disabled) return; selected = item.value; render(); close(); options.onChange?.(item.value, event); }, cleanups);
      menu.append(option);
    }
  };
  const openMenu = () => { if (options.disabled) return; open = true; trigger.setAttribute("aria-expanded", "true"); menu.hidden = false; menu.querySelector<HTMLElement>("[aria-selected='true']")?.focus(); };
  const close = () => { open = false; trigger.setAttribute("aria-expanded", "false"); menu.hidden = true; };
  const toggle = () => open ? close() : openMenu();
  render();
  listen(trigger, "click", toggle, cleanups);
  listen(trigger, "keydown", event => { if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") { event.preventDefault(); openMenu(); } }, cleanups);
  listen(menu, "keydown", event => {
    const items = [...menu.querySelectorAll<HTMLButtonElement>("[role='option']:not([aria-disabled='true'])")];
    const current = document.activeElement as HTMLButtonElement;
    const index = items.indexOf(current);
    if (event.key === "Escape") { close(); trigger.focus(); }
    else if (event.key === "ArrowDown") { event.preventDefault(); items[(index + 1) % items.length]?.focus(); }
    else if (event.key === "ArrowUp") { event.preventDefault(); items[(index - 1 + items.length) % items.length]?.focus(); }
  }, cleanups);
  listen(document, "pointerdown", event => { if (!root.contains(event.target as Node)) close(); }, cleanups);
  return {
    ...attach(root, cleanups),
    trigger,
    menu,
    open: openMenu,
    close,
    toggle,
    getValue: () => selected,
    select: value => { const item = options.items.find(entry => Object.is(entry.value, value)); if (item && !item.disabled) { selected = value; render(); } },
  };
}

export function createMenu(items: Ui3MenuItem[], options: Ui3MenuOptions = {}): Ui3Handle {
  const cleanups: Array<() => void> = [];
  const menu = createElement("div", "ui3-menu", { role: "menu", "aria-label": options.label, tabindex: -1, "data-variant": options.variant || "default" });
  for (const item of items) {
    if (item.kind === "separator") { menu.append(createElement("div", "ui3-menu-separator", { role: "separator" })); continue; }
    if (item.kind === "heading") { const heading = createElement("div", "ui3-menu-heading", { role: "presentation" }); heading.textContent = item.label || ""; menu.append(heading); continue; }
    const button = createElement("button", "ui3-menu-item", { type: "button", role: "menuitemcheckbox", "aria-checked": item.checked, "aria-disabled": item.disabled, "data-danger": item.danger, "aria-haspopup": item.submenu ? "menu" : undefined });
    appendIcon(button, item.icon);
    const itemLabel = createElement("span", "ui3-menu-item__label"); itemLabel.textContent = item.label || ""; button.append(itemLabel);
    if (item.checked !== undefined || item.mixed) { const check = createElement("span", "ui3-menu-item__check", { "aria-hidden": true }); check.textContent = item.mixed ? "–" : item.checked ? "✓" : ""; button.prepend(check); }
    if (item.shortcut) { const shortcut = createElement("span", "ui3-menu-item__trail"); shortcut.textContent = item.shortcut; button.append(shortcut); }
    listen(button, "click", event => { if (item.disabled) return; item.onSelect?.(item, event); options.onSelect?.(item, event); }, cleanups);
    menu.append(button);
  }
  listen(menu, "keydown", event => {
    const items = [...menu.querySelectorAll<HTMLButtonElement>(".ui3-menu-item:not([aria-disabled='true'])")];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown") { event.preventDefault(); items[(index + 1) % items.length]?.focus(); }
    if (event.key === "ArrowUp") { event.preventDefault(); items[(index - 1 + items.length) % items.length]?.focus(); }
  }, cleanups);
  return attach(menu, cleanups);
}

export function createCheckbox(options: Ui3ChoiceOptions): Ui3Handle {
  const root = createElement("label", "ui3-checkbox", { "data-muted": options.muted, "data-disabled": options.disabled, "data-ghost": options.ghost, "data-variant": options.variant || "input" });
  const input = createElement("input", "ui3-checkbox__control", { type: "checkbox", checked: options.checked, disabled: options.disabled, "aria-checked": options.mixed ? "mixed" : undefined });
  if (options.mixed) input.indeterminate = true;
  const text = createElement("span", "ui3-checkbox__label");
  const checkboxTitle = createElement("span", "ui3-checkbox__title"); checkboxTitle.textContent = options.label; text.append(checkboxTitle);
  if (options.description) { const description = createElement("span", "ui3-field__description"); description.textContent = options.description; text.append(description); }
  root.append(input, text);
  const cleanups: Array<() => void> = [];
  if (options.onChange) listen(input, "change", event => options.onChange?.(input.checked, event), cleanups);
  return attach(root, cleanups);
}

export function createRadio(options: Ui3ChoiceOptions & { name: string }): Ui3Handle {
  const root = createElement("label", "ui3-radio", { "data-disabled": options.disabled, "data-variant": options.variant || "input" });
  const input = createElement("input", "ui3-radio__control", { type: "radio", name: options.name, checked: options.checked, disabled: options.disabled });
  const text = createElement("span", "ui3-radio__label");
  const radioTitle = createElement("span", "ui3-radio__title"); radioTitle.textContent = options.label; text.append(radioTitle);
  if (options.description) { const description = createElement("span", "ui3-field__description"); description.textContent = options.description; text.append(description); }
  root.append(input, text);
  const cleanups: Array<() => void> = [];
  if (options.onChange) listen(input, "change", event => options.onChange?.(input.checked, event), cleanups);
  return attach(root, cleanups);
}

export function createSwitch(options: Ui3ChoiceOptions): Ui3Handle {
  const root = createElement("label", "ui3-switch", { "data-disabled": options.disabled });
  const input = createElement("input", "ui3-switch__control", { type: "checkbox", checked: options.checked, disabled: options.disabled, role: "switch" });
  if (options.mixed) input.indeterminate = true;
  const text = createElement("span", "ui3-switch__label");
  const switchTitle = createElement("span", "ui3-switch__title"); switchTitle.textContent = options.label; text.append(switchTitle);
  if (options.description) { const description = createElement("span", "ui3-field__description"); description.textContent = options.description; text.append(description); }
  root.append(input, text);
  const cleanups: Array<() => void> = [];
  if (options.onChange) listen(input, "change", event => options.onChange?.(input.checked, event), cleanups);
  return attach(root, cleanups);
}

export function createTabs<T = string>(options: Ui3TabsOptions<T>): Ui3Handle {
  const root = createElement("section", "ui3-tabs");
  const tablist = createElement("div", "ui3-tablist", { role: "tablist" });
  const panels = createElement("div", "ui3-tabpanels");
  root.append(tablist, panels);
  const selected = options.selected ?? options.items[0]?.value;
  let active = selected;
  const cleanups: Array<() => void> = [];
  const activate = (value: T, event?: Event) => {
    active = value;
    [...tablist.children].forEach((child, index) => {
      const item = options.items[index];
      const isSelected = Object.is(item.value, active);
      child.setAttribute("aria-selected", String(isSelected));
      child.setAttribute("tabindex", isSelected ? "0" : "-1");
      const panel = panels.children[index] as HTMLElement | undefined;
      if (panel) panel.hidden = !isSelected;
    });
    options.onChange?.(value, event || new Event("change"));
  };
  options.items.forEach((item, index) => {
    const tab = createElement("button", "ui3-tab", { type: "button", role: "tab", "aria-selected": Object.is(item.value, active), tabindex: Object.is(item.value, active) ? 0 : -1, disabled: item.disabled });
    tab.textContent = item.label;
    listen(tab, "click", event => { if (!item.disabled) activate(item.value, event); }, cleanups);
    listen(tab, "keydown", event => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = (index + direction + options.items.length) % options.items.length;
      (tablist.children[next] as HTMLElement)?.focus();
      activate(options.items[next].value, event);
    }, cleanups);
    tablist.append(tab);
    const panel = createElement("div", "ui3-tabpanel", { role: "tabpanel", hidden: !Object.is(item.value, active) });
    appendContent(panel, item.panel);
    panels.append(panel);
  });
  return attach(root, cleanups);
}

export function createSegmentedControl<T = string>(options: Ui3TabsOptions<T>): Ui3Handle {
  const root = createElement("div", "ui3-segmented", { role: "group" });
  const cleanups: Array<() => void> = [];
  let active = options.selected ?? options.items[0]?.value;
  options.items.forEach(item => {
    const button = createElement("button", "ui3-segment", { type: "button", "aria-pressed": Object.is(item.value, active), "aria-disabled": item.disabled });
    button.textContent = item.label;
    listen(button, "click", event => { if (item.disabled) return; active = item.value; [...root.children].forEach((child, index) => child.setAttribute("aria-pressed", String(Object.is(options.items[index].value, active)))); options.onChange?.(item.value, event); }, cleanups);
    root.append(button);
  });
  return attach(root, cleanups);
}

export function createSlider(options: Ui3SliderOptions = {}): Ui3Handle {
  const root = createElement("label", "ui3-slider-field", { "data-variant": options.variant || "slider" });
  if (options.label) { const label = createElement("span", "ui3-field__label"); label.textContent = options.label; root.append(label); }
  const wrap = createElement("span", "ui3-slider-wrap");
  const input = createElement("input", "ui3-slider", { type: "range", min: options.min ?? 0, max: options.max ?? 100, step: options.step ?? 1, disabled: options.disabled, value: options.value ?? 0 });
  const value = createElement("output", "ui3-slider__value");
  value.textContent = input.value;
  wrap.append(input, value);
  root.append(wrap);
  if (options.ticks?.length) {
    const ticks = createElement("span", "ui3-slider__ticks", { "aria-hidden": true });
    options.ticks.forEach(tick => { const tickNode = createElement("span"); tickNode.textContent = String(tick); ticks.append(tickNode); });
    root.append(ticks);
  }
  const cleanups: Array<() => void> = [];
  listen(input, "input", event => { value.textContent = input.value; options.onChange?.(Number(input.value), event); }, cleanups);
  return attach(root, cleanups);
}

export function createModal(options: Ui3ModalOptions): Ui3ModalHandle {
  const cleanups: Array<() => void> = [];
  const root = createElement("div", "ui3-modal", { role: "presentation", hidden: true, "data-width": options.width || 480, "data-header-variant": options.headerVariant || "default", "data-footer-variant": options.footerVariant || "default" });
  const dialog = createElement("section", "ui3-modal__dialog", { role: "dialog", "aria-modal": true, "aria-labelledby": "" });
  const titleId = `ui3-modal-title-${Math.random().toString(36).slice(2)}`;
  const header = createElement("header", "ui3-modal__header");
  const title = createElement("h2", "ui3-modal__title", { id: titleId });
  title.textContent = options.title;
  const close = createElement("button", "ui3-icon-button ui3-modal__close", { type: "button", "aria-label": options.closeLabel || "Close" });
  close.textContent = "×";
  header.append(title, close);
  dialog.setAttribute("aria-labelledby", titleId);
  const content = createElement("div", "ui3-modal__content");
  appendContent(content, options.content);
  const footer = createElement("footer", "ui3-modal__footer");
  appendContent(footer, options.footer);
  dialog.append(header, content, footer);
  root.append(dialog);
  let previousFocus: HTMLElement | null = null;
  const open = () => { previousFocus = document.activeElement as HTMLElement | null; root.hidden = false; (dialog.querySelector<HTMLElement>("button, input, textarea, select, [tabindex]:not([tabindex='-1'])") || close).focus(); };
  const closeModal = () => { root.hidden = true; previousFocus?.focus(); options.onClose?.(); };
  listen(close, "click", closeModal, cleanups);
  listen(root, "click", event => { if (options.closeOnBackdrop !== false && event.target === root) closeModal(); }, cleanups);
  listen(document, "keydown", event => { if (root.hidden) return; if (event.key === "Escape") { event.preventDefault(); closeModal(); } }, cleanups);
  return { ...attach(root, cleanups), dialog, open, close: closeModal, toggle: () => root.hidden ? open() : closeModal() };
}

export function createTooltip(trigger: Ui3Content, text: string, options: { placement?: "top" | "bottom" | "left" | "right"; hotkey?: string; variant?: "default" | "url" | "link" | "phone" | "email" | "page" | "prototype" | "frame" | "file" } = {}): Ui3Handle {
  const cleanups: Array<() => void> = [];
  const root = createElement("span", "ui3-tooltip", { "data-placement": options.placement || "top", "data-variant": options.variant || "default" });
  const triggerSlot = createElement("span", "ui3-tooltip__trigger");
  appendContent(triggerSlot, trigger);
  const content = createElement("span", "ui3-tooltip__content", { role: "tooltip" });
  content.textContent = text + (options.hotkey ? ` ${options.hotkey}` : "");
  root.append(triggerSlot, content);
  return attach(root, cleanups);
}

export function createNotification(options: Ui3NoticeOptions): Ui3Handle {
  const cleanups: Array<() => void> = [];
  const root = createElement("div", "ui3-notice", { role: options.variant === "danger" ? "alert" : "status", "data-variant": options.variant || "default", "data-state": options.state || "default", "data-color": options.color });
  const body = createElement("div", "ui3-notice__body");
  appendContent(body, options.message);
  root.append(body);
  if (options.actionLabel) {
    const action = createElement("button", "ui3-notice__action", { type: "button" });
    action.textContent = options.actionLabel;
    if (options.onAction) listen(action, "click", options.onAction, cleanups);
    root.append(action);
  }
  if (options.closeLabel) {
    const close = createElement("button", "ui3-icon-button ui3-notice__close", { type: "button", "aria-label": options.closeLabel });
    close.textContent = "×";
    if (options.onClose) listen(close, "click", options.onClose, cleanups);
    root.append(close);
  }
  return attach(root, cleanups);
}

export function createVisualBell(options: Ui3NoticeOptions & { state?: "default" | "danger"; dismissible?: boolean }): Ui3Handle {
  const bell = createNotification({ ...options, closeLabel: options.dismissible ? options.closeLabel || "Dismiss" : options.closeLabel });
  bell.root.classList.add("ui3-bell");
  return bell;
}

export function createComment(options: Ui3CommentOptions = {}): Ui3Handle {
  const cleanups: Array<() => void> = [];
  const root = createElement("article", "ui3-comment", { "data-state": options.selected ? "selected" : "default", "data-unread": options.unread, "data-active": options.active, tabindex: options.onClick ? 0 : undefined });
  if (options.avatar) {
    const avatar = createElement("span", "ui3-comment__avatar");
    appendContent(avatar, options.avatar);
    root.append(avatar);
  }
  const body = createElement("div", "ui3-comment__body");
  const meta = createElement("div", "ui3-comment__meta");
  if (options.author) { const author = createElement("strong"); author.textContent = options.author; meta.append(author); }
  if (options.time) { const time = createElement("time"); time.textContent = options.time; meta.append(time); }
  if (options.unread) { const unread = createElement("span", "ui3-comment__unread", { "aria-label": "Unread" }); meta.append(unread); }
  if (options.replies) { const replies = createElement("span", "ui3-comment__replies"); replies.textContent = String(options.replies); meta.append(replies); }
  body.append(meta);
  if (options.message) { const message = createElement("p", "ui3-comment__message"); message.textContent = options.message; body.append(message); }
  root.append(body);
  if (options.onClick) listen(root, "click", options.onClick, cleanups);
  return attach(root, cleanups);
}

export function createCommentComposer(options: { placeholder?: string; sendLabel?: string; onSend?: (value: string) => void }): Ui3Handle {
  const cleanups: Array<() => void> = [];
  const root = createElement("form", "ui3-comment-composer");
  const input = createElement("textarea", "ui3-input", { placeholder: options.placeholder || "Write a reply", rows: 3 });
  const footer = createElement("div", "ui3-row");
  const send = createElement("button", "ui3-button", { type: "submit", "data-variant": "primary" });
  send.textContent = options.sendLabel || "Send";
  footer.append(send);
  root.append(input, footer);
  listen(root, "submit", event => { event.preventDefault(); if (input.value.trim()) { options.onSend?.(input.value); input.value = ""; } }, cleanups);
  return attach(root, cleanups);
}

export function createProgress(value = 0): Ui3Handle {
  const root = createElement("div", "ui3-progress", { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": value });
  const bar = createElement("span", "ui3-progress__bar");
  bar.style.setProperty("--ui3-progress", `${Math.max(0, Math.min(100, value))}%`);
  root.append(bar);
  return attach(root);
}

export const ui3Primitives = {
  createSvgIcon,
  createButton,
  createIconButton,
  createBadge,
  createAvatar,
  createChit,
  createVariableChip,
  createTextInput,
  createNumericInput,
  createColorInput,
  createComboInput,
  createDropdown,
  createMenu,
  createCheckbox,
  createRadio,
  createSwitch,
  createTabs,
  createSegmentedControl,
  createSlider,
  createModal,
  createTooltip,
  createNotification,
  createVisualBell,
  createComment,
  createCommentComposer,
  createProgress,
};
