import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnchorGrid } from '../components/AnchorGrid';
import { Divider } from '../components/ui/Divider';
import { Input } from '../components/Input';
import { LockButton } from '../components/LockButton';
import { ScaleControl } from '../components/ScaleControl';
import { StrokeInclusionControl } from '../components/StrokeInclusionControl';
import { StrokeIcon } from '../components/Icons';
import { LinkedConnector } from '../components/ui/LinkedConnector';
import { SectionContainer } from '../components/ui/SectionContainer';
import { SectionTitle } from '../components/ui/SectionTitle';
import { fromDimensionUnit, parseDecimalInput, toDimensionUnit, type DimensionUnit } from '../domain/units';
import { dimensionsForEdit } from '../domain/geometry';
import {
  dimensionsWithOutsideStroke,
  nodeDimensionFromDisplayedSize,
  type StrokeOuterBounds,
} from '../domain/stroke-bounds';
import { formatDisplay } from '../domain/number-format';
import { isPluginToUiMessage, type GeometrySnapshot, type SelectionState, type UiToPluginMessage } from '../types/messages';
import type { AnchorPoint } from '../domain/scale';

import './app.css';

type Field = 'x' | 'y' | 'width' | 'height' | 'stroke';
type Drafts = Record<Field, string>;

const EMPTY_DRAFTS: Drafts = { x: '—', y: '—', width: '—', height: '—', stroke: '0' };

function sendPluginMessage(message: UiToPluginMessage): void {
  window.parent.postMessage({ pluginMessage: message }, '*');
}

function selectedNode(selection: SelectionState): GeometrySnapshot | null {
  return selection.kind === 'selected' ? selection.node : null;
}

function strokeOuterBounds(node: GeometrySnapshot): StrokeOuterBounds {
  return {
    widthPx: node.stroke.outerWidthPx,
    heightPx: node.stroke.outerHeightPx,
  };
}

function displayedDimensions(node: GeometrySnapshot, includesOutsideStroke: boolean) {
  return dimensionsWithOutsideStroke(
    { widthPx: node.widthPx, heightPx: node.heightPx },
    strokeOuterBounds(node),
    includesOutsideStroke,
  );
}

function draftsForNode(node: GeometrySnapshot, unit: DimensionUnit, includesOutsideStroke: boolean): Drafts {
  const dimensions = displayedDimensions(node, includesOutsideStroke);
  return {
    x: formatDisplay(node.xPx),
    y: formatDisplay(node.yPx),
    width: formatDisplay(toDimensionUnit(dimensions.widthPx, unit)),
    height: formatDisplay(toDimensionUnit(dimensions.heightPx, unit)),
    stroke: formatDisplay(toDimensionUnit(node.stroke.weightPx ?? 0, unit)),
  };
}

function displayValue(
  node: GeometrySnapshot | null,
  field: Field,
  unit: DimensionUnit,
  includesOutsideStroke: boolean,
): string {
  if (!node) {
    return '—';
  }
  if (field === 'x') {
    return formatDisplay(node.xPx);
  }
  if (field === 'y') {
    return formatDisplay(node.yPx);
  }
  const dimensions = displayedDimensions(node, includesOutsideStroke);
  const px = field === 'width'
    ? dimensions.widthPx
    : field === 'height'
      ? dimensions.heightPx
      : node.stroke.weightPx;
  return formatDisplay(toDimensionUnit(px ?? 0, unit));
}

function parseScaleInput(raw: string): number | null {
  const normalized = raw.trim().replace(/x$/i, '').trim();
  return parseDecimalInput(normalized);
}

function fieldError(field: Field): string {
  if (field === 'x' || field === 'y') {
    return 'Введите корректное значение позиции.';
  }
  return field === 'stroke'
    ? 'Введите корректную толщину обводки.'
    : 'Введите корректное значение размера.';
}

function isSameNode(selection: SelectionState, nodeId: string | null): boolean {
  return selection.kind === 'selected' && selection.node.id === nodeId;
}

function UnitToggle({ unit, onChange }: { unit: DimensionUnit; onChange: (unit: DimensionUnit) => void }) {
  return (
    <div className="unit-toggle" role="group" aria-label="Dimension unit">
      {(['mm', 'px'] as const).map((option, index) => (
        <span className="unit-toggle__item" key={option}>
          {index > 0 && <span className="unit-toggle__separator" aria-hidden="true">/</span>}
          <button
            type="button"
            className="unit-toggle__button"
            aria-pressed={unit === option}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        </span>
      ))}
    </div>
  );
}

function FieldLabels() {
  return (
    <div className="property-field-labels" aria-hidden="true">
      <span>Width</span>
      <span>Height</span>
      <span />
    </div>
  );
}

export default function App() {
  const [selection, setSelection] = useState<SelectionState>({ kind: 'empty' });
  const [revision, setRevision] = useState(0);
  const [unit, setUnit] = useState<DimensionUnit>('mm');
  const [anchor, setAnchor] = useState<AnchorPoint>(4);
  const [scaleDraft, setScaleDraft] = useState('1x');
  const [scaleFocused, setScaleFocused] = useState(false);
  const [includesOutsideStroke, setIncludesOutsideStroke] = useState(false);
  const [drafts, setDrafts] = useState<Drafts>(EMPTY_DRAFTS);
  const [focusedField, setFocusedField] = useState<Field | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastRevisionRef = useRef(-1);
  const cancelBlurRef = useRef<Field | null>(null);

  const node = selectedNode(selection);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message: unknown = event.data?.pluginMessage;
      if (!isPluginToUiMessage(message) || message.revision < lastRevisionRef.current) {
        return;
      }

      lastRevisionRef.current = message.revision;
      setRevision(message.revision);

      if (message.type === 'error') {
        setError(message.message);
        return;
      }

      const nextNode = selectedNode(message.selection);
      const nextNodeId = nextNode?.id ?? null;
      if (!isSameNode(selection, nextNodeId)) {
        setFocusedField(null);
        setScaleFocused(false);
        cancelBlurRef.current = null;
        setIncludesOutsideStroke(false);
        sendPluginMessage({ type: 'set-stroke-inclusion-preview', included: false });
        setDrafts(nextNode ? draftsForNode(nextNode, unit, false) : EMPTY_DRAFTS);
        setScaleDraft('1x');
      }
      setSelection(message.selection);
      setError(null);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [selection, unit]);

  useEffect(() => {
    if (!node) {
      setDrafts(EMPTY_DRAFTS);
      setScaleDraft('1x');
      return;
    }
    setDrafts((current) => ({
      x: focusedField === 'x' ? current.x : displayValue(node, 'x', unit, includesOutsideStroke),
      y: focusedField === 'y' ? current.y : displayValue(node, 'y', unit, includesOutsideStroke),
      width: focusedField === 'width' ? current.width : displayValue(node, 'width', unit, includesOutsideStroke),
      height: focusedField === 'height' ? current.height : displayValue(node, 'height', unit, includesOutsideStroke),
      stroke: focusedField === 'stroke' ? current.stroke : displayValue(node, 'stroke', unit, includesOutsideStroke),
    }));
    if (!scaleFocused) {
      setScaleDraft('1x');
    }
  }, [node, unit, focusedField, scaleFocused, includesOutsideStroke]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      sendPluginMessage({ type: 'resize', height: Math.ceil(root.getBoundingClientRect().height) });
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const commitFieldValue = useCallback((field: Field, rawValue: string, reportError: boolean): boolean => {
    const currentNode = selectedNode(selection);
    if (!currentNode) {
      return false;
    }

    const parsed = parseDecimalInput(rawValue);
    if (parsed === null) {
      if (reportError) {
        setError(fieldError(field));
      }
      return false;
    }

    if (field === 'x' || field === 'y') {
      if ((field === 'x' && !currentNode.canMoveX) || (field === 'y' && !currentNode.canMoveY)) {
        if (reportError) {
          setError('Позиция этого объекта управляется Figma.');
        }
        return false;
      }
      sendPluginMessage({
        type: 'set-position',
        nodeId: currentNode.id,
        revision,
        axis: field,
        valuePx: parsed,
      });
    } else if (field === 'stroke') {
      const valuePx = fromDimensionUnit(parsed, unit);
      if (!currentNode.stroke.canEdit || currentNode.stroke.weightPx === null) {
        if (reportError) {
          setError('Толщина обводки этого объекта недоступна для редактирования.');
        }
        return false;
      }
      sendPluginMessage({
        type: 'set-stroke-weight',
        nodeId: currentNode.id,
        revision,
        valuePx,
      });
    } else {
      const displayedValuePx = fromDimensionUnit(parsed, unit);
      const valuePx = nodeDimensionFromDisplayedSize(
        displayedValuePx,
        field,
        strokeOuterBounds(currentNode),
        includesOutsideStroke,
      );
      if ((field === 'width' && !currentNode.canResizeWidth) || (field === 'height' && !currentNode.canResizeHeight)) {
        if (reportError) {
          setError('Размер этого объекта недоступен для редактирования.');
        }
        return false;
      }
      sendPluginMessage({
        type: 'set-dimension',
        nodeId: currentNode.id,
        revision,
        axis: field,
        valuePx,
      });
    }
    setError(null);
    return true;
  }, [revision, selection, unit, includesOutsideStroke]);

  const commitField = useCallback((field: Field): boolean => (
    commitFieldValue(field, drafts[field], true)
  ), [commitFieldValue, drafts]);

  const changeField = (field: Field, value: string): void => {
    const currentNode = selectedNode(selection);
    const parsed = parseDecimalInput(value);

    setDrafts((current) => {
      const next = { ...current, [field]: value };
      if (
        !currentNode
        || parsed === null
        || (field !== 'width' && field !== 'height')
        || !currentNode.aspectLocked
      ) {
        return next;
      }

      const edited = dimensionsForEdit(
        { widthPx: currentNode.widthPx, heightPx: currentNode.heightPx },
        field,
        nodeDimensionFromDisplayedSize(
          fromDimensionUnit(parsed, unit),
          field,
          strokeOuterBounds(currentNode),
          includesOutsideStroke,
        ),
        true,
        currentNode.aspectRatio,
      );
      if (!edited) {
        return next;
      }
      const pairedField: Field = field === 'width' ? 'height' : 'width';
      const pairedValuePx = field === 'width' ? edited.heightPx : edited.widthPx;
      const outerBounds = strokeOuterBounds(currentNode);
      const pairedOuterPx = pairedField === 'width' ? outerBounds.widthPx : outerBounds.heightPx;
      const pairedWithStrokePx = includesOutsideStroke && pairedOuterPx !== null
        ? pairedValuePx + pairedOuterPx
        : pairedValuePx;
      return { ...next, [pairedField]: formatDisplay(toDimensionUnit(pairedWithStrokePx, unit)) };
    });

    // Figma applies each valid keystroke. Invalid intermediate text stays in
    // the editor so a person can finish typing without getting an error flash.
    commitFieldValue(field, value, false);
  };

  const commitScale = useCallback((rawOverride?: string): boolean => {
    const currentNode = selectedNode(selection);
    if (!currentNode) {
      return false;
    }

    const parsed = parseScaleInput(rawOverride ?? scaleDraft);
    if (parsed === null || parsed < 0.01) {
      setError('Введите коэффициент масштаба не меньше 0,01.');
      return false;
    }
    if (!currentNode.canScale) {
      setError('Масштаб этого объекта недоступен для редактирования.');
      return false;
    }

    sendPluginMessage({
      type: 'set-scale',
      nodeId: currentNode.id,
      revision,
      scale: parsed,
      anchor,
    });
    setScaleDraft('1x');
    setError(null);
    return true;
  }, [anchor, revision, scaleDraft, selection]);

  const handleBlur = (field: Field): void => {
    if (cancelBlurRef.current === field) {
      cancelBlurRef.current = null;
      setFocusedField(null);
      return;
    }
    if (parseDecimalInput(drafts[field]) === null) {
      commitField(field);
    }
    setFocusedField(null);
  };

  const handleKeyDown = (field: Field, event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelBlurRef.current = field;
      const currentNode = selectedNode(selection);
      if (currentNode) {
        setDrafts((current) => ({ ...current, [field]: displayValue(currentNode, field, unit, includesOutsideStroke) }));
      }
      event.currentTarget.blur();
    }
  };

  const changeUnit = (nextUnit: DimensionUnit): void => {
    if (focusedField === 'width' || focusedField === 'height' || focusedField === 'stroke') {
      if (parseDecimalInput(drafts[focusedField]) === null && !commitField(focusedField)) {
        return;
      }
    }
    setUnit(nextUnit);
    if (node) {
      setDrafts(draftsForNode(node, nextUnit, includesOutsideStroke));
    }
  };

  const toggleAspect = (): void => {
    if (!node?.aspectSupported || node.locked) {
      return;
    }
    sendPluginMessage({
      type: 'set-aspect-lock',
      nodeId: node.id,
      revision,
      locked: !node.aspectLocked,
    });
  };

  const changeOutsideStrokeInclusion = (included: boolean): void => {
    setIncludesOutsideStroke(included);
    sendPluginMessage({ type: 'set-stroke-inclusion-preview', included });
  };

  const dimensionsDisabled = !node || node.locked;
  const aspectDisabled = !node || !node.aspectSupported || node.locked;
  const scaleDisabled = !node || !node.canScale;
  const strokeDisabled = dimensionsDisabled
    || !node?.stroke.present
    || !node.stroke.canEdit
    || node.stroke.weightPx === null
    || node.stroke.weightPx === 0;
  const strokeInclusionDisabled = !node
    || node.stroke.outerWidthPx === null
    || node.stroke.outerHeightPx === null
    || (node.stroke.outerWidthPx === 0 && node.stroke.outerHeightPx === 0);

  return (
    <main ref={rootRef} className="property-panel" aria-label="PX to MM — Smart Print Size">
      <section className="property-section" aria-labelledby="dimensions-title">
        <SectionTitle rightAction={<UnitToggle unit={unit} onChange={changeUnit} />}>
          <span id="dimensions-title">Dimensions</span>
        </SectionTitle>
        <SectionContainer gap={0}>
            <FieldLabels />
            <div className="property-row property-row--dimensions">
              <Input
                label="Width"
                unit={unit}
                aria-label={`Width in ${unit}`}
                value={drafts.width}
                disabled={dimensionsDisabled || !node?.canResizeWidth}
                onChange={(value) => changeField('width', value)}
                onFocusStateChange={(focused) => setFocusedField(focused ? 'width' : null)}
                onBlur={() => handleBlur('width')}
                onKeyDown={(event) => handleKeyDown('width', event)}
              />
              <LinkedConnector
                linked={Boolean(node?.aspectLocked)}
                leftDisabled={dimensionsDisabled || !node?.canResizeWidth}
                rightDisabled={dimensionsDisabled || !node?.canResizeHeight}
                leftActive={focusedField === 'width'}
                rightActive={focusedField === 'height'}
              />
              <Input
                label="Height"
                unit={unit}
                aria-label={`Height in ${unit}`}
                value={drafts.height}
                disabled={dimensionsDisabled || !node?.canResizeHeight}
                onChange={(value) => changeField('height', value)}
                onFocusStateChange={(focused) => setFocusedField(focused ? 'height' : null)}
                onBlur={() => handleBlur('height')}
                onKeyDown={(event) => handleKeyDown('height', event)}
              />
              <LockButton
                linked={Boolean(node?.aspectLocked)}
                disabled={aspectDisabled}
                onClick={toggleAspect}
                title={node?.aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
              />
            </div>
          <div className="property-stroke">
            <div className="property-stroke__labels" aria-hidden="true">
              <span className={strokeDisabled ? 'property-stroke__label--disabled' : undefined}>Stroke</span>
              <span className={strokeInclusionDisabled ? 'property-stroke__label--disabled' : undefined}>Outside stroke</span>
              <span />
            </div>
            <div className="property-row property-row--stroke">
              <Input
                label=""
                leading={<StrokeIcon />}
                unit={unit}
                aria-label={`Stroke in ${unit}`}
                value={drafts.stroke}
                disabled={strokeDisabled}
                onChange={(value) => changeField('stroke', value)}
                onFocusStateChange={(focused) => setFocusedField(focused ? 'stroke' : null)}
                onBlur={() => handleBlur('stroke')}
                onKeyDown={(event) => handleKeyDown('stroke', event)}
              />
              <span aria-hidden="true" />
              <StrokeInclusionControl
                value={includesOutsideStroke}
                disabled={strokeInclusionDisabled}
                onChange={changeOutsideStrokeInclusion}
              />
              <span aria-hidden="true" />
            </div>
          </div>
        </SectionContainer>
      </section>

      <Divider />

      <section className="property-section" aria-labelledby="scale-title">
        <SectionTitle>
          <span id="scale-title">Scale</span>
        </SectionTitle>
        <SectionContainer gap={0}>
          <FieldLabels />
          <div className="property-row property-row--scale-dimensions">
            <Input
              label="Width"
              unit={unit}
              aria-label={`Scale width in ${unit}`}
              value={node ? formatDisplay(toDimensionUnit(displayedDimensions(node, includesOutsideStroke).widthPx, unit)) : '—'}
              disabled={!node}
              readOnly
              onChange={() => undefined}
            />
            <LinkedConnector
              linked
              leftDisabled={!node}
              rightDisabled={!node}
            />
            <Input
              label="Height"
              unit={unit}
              aria-label={`Scale height in ${unit}`}
              value={node ? formatDisplay(toDimensionUnit(displayedDimensions(node, includesOutsideStroke).heightPx, unit)) : '—'}
              disabled={!node}
              readOnly
              onChange={() => undefined}
            />
          </div>
          <div className="scale-details">
            <div className="scale-details__field">
              <span className="scale-details__label">Scale</span>
              <ScaleControl
                value={scaleDraft}
                disabled={scaleDisabled}
                invalid={Boolean(error)}
                onChange={setScaleDraft}
                onCommit={commitScale}
                onCancel={() => setScaleDraft('1x')}
                onFocusStateChange={setScaleFocused}
              />
            </div>
            <div className="scale-details__field">
              <span className="scale-details__label">Anchor point</span>
              <AnchorGrid value={anchor} disabled={scaleDisabled} onChange={setAnchor} />
            </div>
          </div>
        </SectionContainer>
      </section>

      {error && <p className="panel-error" role="alert">{error}</p>}
    </main>
  );
}
