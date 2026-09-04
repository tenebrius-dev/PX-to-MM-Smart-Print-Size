import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const selectedMessage = {
  type: 'selection' as const,
  revision: 1,
  selection: {
    kind: 'selected' as const,
    node: {
      id: '1',
      name: 'A4',
      type: 'FRAME',
      xPx: -491,
      yPx: -297.78,
      widthPx: 72,
      heightPx: 36,
      canMoveX: true,
      canMoveY: true,
      canResizeWidth: true,
      canResizeHeight: true,
      canScale: true,
      aspectSupported: true,
      aspectLocked: false,
      aspectRatio: 2,
      locked: false,
      autoLayoutPosition: false,
      missingFont: false,
      stroke: {
        present: false,
        weightPx: null,
        canEdit: false,
        outerWidthPx: null,
        outerHeightPx: null,
      },
      raster: { detected: false, status: 'not-applicable' as const },
    },
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PX to MM — Smart Print Size property panel', () => {
  it('keeps Dimensions and Scale visible when nothing is selected', () => {
    render(<App />);
    expect(screen.getByText('Dimensions')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Scale' })).toBeInTheDocument();
    expect(screen.queryByText('Position')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dimensions' }).parentElement).toHaveStyle({ paddingTop: '12px', paddingBottom: '6px' });
    expect(screen.getByRole('heading', { name: 'Scale' }).parentElement).toHaveStyle({ paddingTop: '12px' });
    expect(screen.getByRole('heading', { name: 'Scale' }).parentElement).toHaveStyle({ paddingBottom: '6px' });
    expect(screen.getAllByRole('spinbutton')).toHaveLength(5);
    expect(screen.getAllByRole('spinbutton').every((input) => (input as HTMLInputElement).disabled)).toBe(true);
    expect(screen.getByLabelText('Stroke in mm')).toHaveValue(0);
    expect(screen.getByLabelText('Stroke in mm')).toBeDisabled();
    expect(screen.getByText('Stroke')).toHaveClass('property-stroke__label--disabled');
    expect(screen.getByText('Inside stroke')).toHaveClass('property-stroke__label--disabled');
  });

  it('renders selected geometry in mm by default and switches dimensions to px', async () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { pluginMessage: selectedMessage } }));
    });

    await waitFor(() => expect(screen.getByLabelText('Width in mm')).toHaveValue(25.4));
    expect(screen.getByLabelText('Height in mm')).toHaveValue(12.7);
    expect(screen.getByLabelText('Stroke in mm')).toHaveValue(0);
    expect(screen.getByLabelText('Stroke in mm')).toBeDisabled();
    expect(screen.getByLabelText('Scale width in mm')).toHaveValue(25.4);
    expect(screen.getByLabelText('Scale height in mm')).toHaveValue(12.7);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'px' }));
    });
    await waitFor(() => expect(screen.getByLabelText('Width in px')).toHaveValue(72));
    expect(screen.getByLabelText('Height in px')).toHaveValue(36);
    expect(screen.getByLabelText('Stroke in px')).toHaveValue(0);
    expect(screen.getByLabelText('Scale width in px')).toHaveValue(72);
  });

  it('applies an unrounded dimension on every valid input event', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage');
    render(<App />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { pluginMessage: selectedMessage } }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'px' }));
    const width = screen.getByLabelText('Width in px');
    await waitFor(() => expect(width).toHaveValue(72));
    act(() => {
      fireEvent.change(width, { target: { value: '33.3333333333333' } });
    });
    expect(postMessage).toHaveBeenCalledWith({
      pluginMessage: {
        type: 'set-dimension',
        nodeId: '1',
        revision: 1,
        axis: 'width',
        valuePx: 33.3333333333333,
      },
    }, '*');
  });

  it('shows Stroke after the visible 12 px gap and applies it in the selected unit', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage');
    render(<App />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          pluginMessage: {
            ...selectedMessage,
            selection: {
              ...selectedMessage.selection,
              node: {
                ...selectedMessage.selection.node,
                stroke: {
                  present: true,
                  weightPx: 3,
                  canEdit: true,
                  outerWidthPx: 6,
                  outerHeightPx: 6,
                },
              },
            },
          },
        },
      }));
    });

    const stroke = await screen.findByLabelText('Stroke in mm');
    expect(stroke).toHaveValue(1.06);
    expect(stroke.closest('.property-stroke')).toHaveClass('property-stroke');

    fireEvent.click(screen.getByRole('button', { name: 'px' }));
    await waitFor(() => expect(screen.getByLabelText('Stroke in px')).toHaveValue(3));
    fireEvent.change(screen.getByLabelText('Stroke in px'), { target: { value: '3.3333333333333' } });
    expect(postMessage).toHaveBeenCalledWith({
      pluginMessage: {
        type: 'set-stroke-weight',
        nodeId: '1',
        revision: 1,
        valuePx: 3.3333333333333,
      },
    }, '*');
  });

  it('removes hidden stroke from the display and restores it when visibility returns', async () => {
    render(<App />);
    const visibleMessage = {
      ...selectedMessage,
      revision: 10,
      selection: {
        ...selectedMessage.selection,
        node: {
          ...selectedMessage.selection.node,
          stroke: {
            present: true,
            weightPx: 3,
            canEdit: true,
            outerWidthPx: 6,
            outerHeightPx: 6,
          },
        },
      },
    };
    const hiddenMessage = {
      ...visibleMessage,
      revision: 11,
      selection: {
        ...visibleMessage.selection,
        node: {
          ...visibleMessage.selection.node,
          stroke: {
            present: false,
            weightPx: null,
            canEdit: false,
            outerWidthPx: null,
            outerHeightPx: null,
          },
        },
      },
    };

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { pluginMessage: visibleMessage },
      }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'px' }));
    await waitFor(() => expect(screen.getByLabelText('Width in px')).toHaveValue(78));
    expect(screen.getByRole('button', { name: 'Inside stroke' })).not.toBeDisabled();

    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { pluginMessage: hiddenMessage } }));
    });
    await waitFor(() => expect(screen.getByLabelText('Width in px')).toHaveValue(72));
    expect(screen.getByLabelText('Stroke in px')).toHaveValue(0);
    expect(screen.getByLabelText('Stroke in px')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Inside stroke' })).toBeDisabled();

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { pluginMessage: { ...visibleMessage, revision: 12 } },
      }));
    });
    await waitFor(() => expect(screen.getByLabelText('Width in px')).toHaveValue(78));
    expect(screen.getByLabelText('Stroke in px')).toHaveValue(3);
    expect(screen.getByRole('button', { name: 'Inside stroke' })).not.toBeDisabled();
  });

  it('toggles outside-stroke calculation in the Width-sized Stroke slot without changing Auto Layout', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage');
    render(<App />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          pluginMessage: {
            ...selectedMessage,
            revision: 3,
            selection: {
              ...selectedMessage.selection,
              node: {
                ...selectedMessage.selection.node,
                stroke: {
                  present: true,
                  weightPx: 3,
                  canEdit: true,
                  outerWidthPx: 6,
                  outerHeightPx: 6,
                },
              },
            },
          },
        },
      }));
    });

    const labels = screen.getByText('Inside stroke');
    expect(labels.parentElement).toHaveClass('property-stroke__labels');
    const trigger = screen.getByRole('button', { name: 'Inside stroke' });
    expect(trigger).toHaveTextContent('Included');
    expect(trigger.closest('.property-row--stroke')).toHaveClass('property-row--stroke');

    fireEvent.click(screen.getByRole('button', { name: 'px' }));
    expect(screen.getByLabelText('Width in px')).toHaveValue(78);
    expect(screen.getByLabelText('Scale width in px')).toHaveValue(78);

    fireEvent.click(trigger);
    const menu = await screen.findByRole('listbox', { name: 'Inside stroke options' });
    expect(screen.getByRole('option', { name: 'Included' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Included' })).toHaveClass('selected');
    expect(screen.getByRole('option', { name: 'Excluded' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('option', { name: 'Excluded' })).not.toHaveClass('selected');
    fireEvent.click(screen.getByRole('option', { name: 'Excluded' }));

    await waitFor(() => expect(screen.getByLabelText('Width in px')).toHaveValue(72));
    expect(screen.getByLabelText('Scale width in px')).toHaveValue(72);
    expect(postMessage).not.toHaveBeenCalled();
    await waitFor(() => expect(menu).not.toBeInTheDocument());
  });

  it('edits the geometry contour when the displayed size includes an outside stroke', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage');
    render(<App />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          pluginMessage: {
            ...selectedMessage,
            revision: 4,
            selection: {
              ...selectedMessage.selection,
              node: {
                ...selectedMessage.selection.node,
                stroke: {
                  present: true,
                  weightPx: 3,
                  canEdit: true,
                  outerWidthPx: 6,
                  outerHeightPx: 6,
                },
              },
            },
          },
        },
      }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'px' }));
    fireEvent.change(screen.getByLabelText('Width in px'), { target: { value: '100.3333333333333' } });
    expect(postMessage).toHaveBeenCalledWith({
      pluginMessage: {
        type: 'set-dimension',
        nodeId: '1',
        revision: 4,
        axis: 'width',
        valuePx: 94.3333333333333,
      },
    }, '*');
  });

  it('updates the paired field immediately when aspect ratio is locked', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage');
    render(<App />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          pluginMessage: {
            ...selectedMessage,
            revision: 2,
            selection: {
              ...selectedMessage.selection,
              node: { ...selectedMessage.selection.node, aspectLocked: true },
            },
          },
        },
      }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'px' }));
    const width = screen.getByLabelText('Width in px');
    await waitFor(() => expect(width).toHaveValue(72));
    fireEvent.change(width, { target: { value: '100' } });
    expect(screen.getByLabelText('Height in px')).toHaveValue(50);
    expect(postMessage).toHaveBeenCalledWith({
      pluginMessage: {
        type: 'set-dimension',
        nodeId: '1',
        revision: 2,
        axis: 'width',
        valuePx: 100,
      },
    }, '*');
  });

  it('keeps the Figma-like Scale panel visible and commits a scale with its anchor', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage');
    render(<App />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { pluginMessage: selectedMessage } }));
    });

    expect(screen.getByLabelText('Scale width in mm')).toHaveValue(25.4);
    expect(screen.getByLabelText('Scale height in mm')).toHaveValue(12.7);
    expect(document.querySelector('.scale-control__icon path')).toHaveAttribute('fill', 'currentColor');
    expect(screen.getByRole('combobox', { name: 'Scale' })).toHaveValue('1x');
    fireEvent.click(screen.getByRole('button', { name: 'px' }));
    expect(screen.getByLabelText('Scale width in px')).toHaveValue(72);
    expect(screen.getByLabelText('Scale height in px')).toHaveValue(36);
    expect(screen.getByRole('radiogroup', { name: 'Anchor point' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aspect ratio is locked while scaling' })).not.toBeInTheDocument();
    const scale = screen.getByRole('combobox', { name: 'Scale' });
    act(() => {
      fireEvent.change(scale, { target: { value: '2' } });
      fireEvent.blur(scale);
    });

    expect(postMessage).toHaveBeenCalledWith({
      pluginMessage: {
        type: 'set-scale',
        nodeId: '1',
        revision: 1,
        scale: 2,
        anchor: 4,
      },
    }, '*');
  });

  it('uses the PDF Smart Import dropdown pattern for the visible Scale block', async () => {
    render(<App />);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { pluginMessage: selectedMessage } }));
    });

    const trigger = screen.getByRole('button', { name: 'Open scale presets' });
    Object.defineProperty(trigger.parentElement, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: 16,
        y: 180,
        left: 16,
        right: 104,
        top: 180,
        bottom: 204,
        width: 88,
        height: 24,
        toJSON: () => ({}),
      }),
    });

    fireEvent.click(trigger);
    const menu = await screen.findByRole('listbox', { name: 'Scale presets' });
    expect(menu.parentElement).toBe(document.body);
    await waitFor(() => expect(menu).toHaveStyle({ left: '8px', width: '104px' }));

    const selected = screen.getByRole('option', { name: '1x' });
    expect(selected).toHaveAttribute('aria-selected', 'true');
    expect(selected).toHaveClass('selected');
    expect(selected.querySelector('.scale-control__option-check')).not.toBeNull();

    const first = screen.getByRole('option', { name: '0.25x' });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowUp' });
    expect(screen.getByRole('option', { name: '4x' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('option', { name: '4x' }), { key: 'Escape' });
    await waitFor(() => expect(menu).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
