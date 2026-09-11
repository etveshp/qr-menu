import { describe, it, expect, vi, afterEach } from 'vitest';
import { useRef } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useFocusTrap } from '../use-focus-trap';

function Harness({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div ref={ref}>
      <button type="button">First</button>
      <button type="button">Middle</button>
      <button type="button">Last</button>
    </div>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useFocusTrap', () => {
  it('focuses the first focusable element when active', () => {
    render(<Harness active />);
    expect(document.activeElement).toBe(screen.getByText('First'));
  });

  it('does not move focus when inactive', () => {
    render(<Harness active={false} />);
    expect(document.activeElement).not.toBe(screen.getByText('First'));
  });

  it('wraps focus forward from the last element', () => {
    render(<Harness active />);
    const last = screen.getByText('Last');
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByText('First'));
  });

  it('wraps focus backward from the first element', () => {
    render(<Harness active />);
    const first = screen.getByText('First');
    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText('Last'));
  });

  it('leaves focus alone in the middle or on other keys', () => {
    render(<Harness active />);
    const middle = screen.getByText('Middle');
    middle.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(middle);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(middle);
  });
});
