import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ScrollToTop } from '../menu/ScrollToTop';

afterEach(() => {
  cleanup();
});

describe('ScrollToTop', () => {
  it('renders nothing when not visible', () => {
    render(<ScrollToTop visible={false} label="Нагору" onClick={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders button when visible', () => {
    render(<ScrollToTop visible label="Нагору" onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Нагору' })).toBeInTheDocument();
  });

  it('calls onClick when pressed', () => {
    const onClick = vi.fn();
    render(<ScrollToTop visible label="Нагору" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Нагору' }));
    expect(onClick).toHaveBeenCalled();
  });
});