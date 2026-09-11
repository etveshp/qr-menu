import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ModifierSelector } from '../menu/ModifierSelector';
import type { ModifierGroup } from '@/lib/supabase';

const t = (key: string) => ({ chooseModifier: 'Оберіть', priceCurrency: '₴' }[key] ?? key);

const single: ModifierGroup = {
  id: 'size',
  nameUk: 'Обʼєм',
  nameHu: '',
  nameEn: 'Volume',
  type: 'single',
  required: true,
  display: 'chips',
  sortOrder: 0,
  options: [
    { id: 's', nameUk: '0.3 л', nameHu: '', nameEn: '', priceDelta: 0, sortOrder: 0 },
    { id: 'l', nameUk: '0.5 л', nameHu: '', nameEn: '', priceDelta: 10, sortOrder: 1 },
  ],
};

const multiple: ModifierGroup = {
  id: 'extras',
  nameUk: 'Додатки',
  nameHu: '',
  nameEn: '',
  type: 'multiple',
  required: false,
  display: 'tiles',
  sortOrder: 1,
  options: [
    { id: 'milk', nameUk: 'Молоко', nameHu: '', nameEn: '', priceDelta: 5, sortOrder: 0 },
    { id: 'sugar', nameUk: 'Цукор', nameHu: '', nameEn: '', priceDelta: 0, sortOrder: 1 },
  ],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ModifierSelector', () => {
  it('renders nothing without groups', () => {
    const { container } = render(
      <ModifierSelector groups={[]} selection={{}} onSetGroup={vi.fn()} lang="uk" t={t as any} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('emits a single selection and shows the price delta', () => {
    const onSetGroup = vi.fn();
    render(
      <ModifierSelector groups={[single]} selection={{}} onSetGroup={onSetGroup} lang="uk" t={t as any} />
    );
    const select = screen.getByRole('combobox', { name: 'Обʼєм' });
    fireEvent.change(select, { target: { value: 'l' } });
    expect(onSetGroup).toHaveBeenCalledWith('size', ['l']);
    expect(screen.getByText(/0\.5 л\s+\(\+10 ₴\)/)).toBeInTheDocument();
  });

  it('clears a single selection', () => {
    const onSetGroup = vi.fn();
    render(
      <ModifierSelector groups={[single]} selection={{ size: ['l'] }} onSetGroup={onSetGroup} lang="uk" t={t as any} />
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Обʼєм' }), { target: { value: '' } });
    expect(onSetGroup).toHaveBeenCalledWith('size', []);
  });

  it('toggles multiple options', () => {
    const onSetGroup = vi.fn();
    render(
      <ModifierSelector
        groups={[multiple]}
        selection={{ extras: ['sugar'] }}
        onSetGroup={onSetGroup}
        lang="uk"
        t={t as any}
      />
    );
    const milk = screen.getByRole('button', { name: /Молоко/ });
    expect(milk).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(milk);
    expect(onSetGroup).toHaveBeenCalledWith('extras', ['sugar', 'milk']);

    fireEvent.click(screen.getByRole('button', { name: /Цукор/ }));
    expect(onSetGroup).toHaveBeenLastCalledWith('extras', []);
  });

  it('falls back to the Ukrainian name for other languages', () => {
    render(
      <ModifierSelector groups={[single]} selection={{}} onSetGroup={vi.fn()} lang="en" t={t as any} />
    );
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('0.3 л')).toBeInTheDocument();
  });
});
