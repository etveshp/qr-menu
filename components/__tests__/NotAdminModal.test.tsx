import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { NotAdminModal } from '../NotAdminModal';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('NotAdminModal', () => {
  it('renders nothing when closed', () => {
    render(<NotAdminModal isOpen={false} title="Заголовок" text="Текст" onOk={vi.fn()} />);
    expect(screen.queryByText('Заголовок')).not.toBeInTheDocument();
  });

  it('shows title, text and confirms', () => {
    const onOk = vi.fn();
    render(<NotAdminModal isOpen title="Заголовок" text="Текст" okLabel="В меню" onOk={onOk} />);
    expect(screen.getByRole('dialog', { name: 'Заголовок' })).toBeInTheDocument();
    expect(screen.getByText('Текст')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'В меню' }));
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it('renders the logo when provided', () => {
    render(<NotAdminModal isOpen logo="/logo.png" title="Заголовок" text="Текст" onOk={vi.fn()} />);
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('confirms on Escape and locks body scroll while open', () => {
    const onOk = vi.fn();
    const { unmount } = render(
      <NotAdminModal isOpen title="Заголовок" text="Текст" onOk={onOk} />
    );
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOk).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
