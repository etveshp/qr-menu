import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ModifiersEditor } from '../admin/ModifiersEditor';
import type { ModifierGroup } from '@/lib/supabase';

const t = (key: string) =>
  ({
    modifiersTitle: 'Модифікатори',
    addModifier: 'Додати модифікатор',
    modifiersEmpty: 'Порожньо',
    modifierUntitled: 'Без назви',
    modifierName: 'Назва',
    modifierType: 'Тип',
    modifierSingle: 'Один',
    modifierMultiple: 'Багато',
    modifierRequired: 'Обовʼязковий',
    modifierOptions: 'Значення',
    addOption: 'Додати значення',
    optionName: 'Назва значення',
    optionPriceDelta: 'Доплата',
    delete: 'Видалити',
    deleteConfirmTitle: 'Видалити?',
    deleteConfirmMessage: 'Ви впевнені',
    cancel: 'Скасувати',
  }[key] ?? key);

const group: ModifierGroup = {
  id: 'g1',
  nameUk: 'Смак',
  nameHu: '',
  nameEn: '',
  type: 'single',
  required: true,
  display: 'chips',
  sortOrder: 0,
  options: [
    { id: 'o1', nameUk: 'Ваніль', nameHu: '', nameEn: '', priceDelta: 0, sortOrder: 0 },
  ],
};

function renderEditor(overrides: Partial<Parameters<typeof ModifiersEditor>[0]> = {}) {
  return render(
    <ModifiersEditor
      value={[]}
      onChange={vi.fn()}
      lang="uk"
      autoSession={{}}
      onSession={vi.fn()}
      t={t as any}
      {...overrides}
    />
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ModifiersEditor', () => {
  it('shows the empty state', () => {
    renderEditor();
    expect(screen.getByText('Порожньо')).toBeInTheDocument();
  });

  it('adds a group with one option', () => {
    const onChange = vi.fn();
    renderEditor({ onChange });
    fireEvent.click(screen.getByRole('button', { name: 'Додати модифікатор' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as ModifierGroup[];
    expect(next).toHaveLength(1);
    expect(next[0].options).toHaveLength(1);
  });

  it('expands a group and edits its type and required flag', () => {
    const onChange = vi.fn();
    renderEditor({ value: [group], onChange });
    fireEvent.click(screen.getByRole('button', { name: 'expand' }));

    expect(screen.getByText('Назва')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Багато' }));
    const afterType = onChange.mock.calls.at(-1)![0] as ModifierGroup[];
    expect(afterType[0].type).toBe('multiple');

    fireEvent.click(screen.getByRole('switch', { name: 'Обовʼязковий' }));
    const afterRequired = onChange.mock.calls.at(-1)![0] as ModifierGroup[];
    expect(afterRequired[0].required).toBe(false);
  });

  it('adds an option to a group', () => {
    const onChange = vi.fn();
    renderEditor({ value: [group], onChange });
    fireEvent.click(screen.getByRole('button', { name: 'expand' }));
    fireEvent.click(screen.getByRole('button', { name: 'Додати значення' }));
    const next = onChange.mock.calls.at(-1)![0] as ModifierGroup[];
    expect(next[0].options).toHaveLength(2);
  });

  it('removes an unsaved option immediately', () => {
    const onChange = vi.fn();
    renderEditor({ value: [group], onChange, savedOptionIds: [] });
    fireEvent.click(screen.getByRole('button', { name: 'expand' }));
    fireEvent.click(screen.getByRole('button', { name: 'delete option' }));
    const next = onChange.mock.calls.at(-1)![0] as ModifierGroup[];
    expect(next[0].options).toHaveLength(0);
  });

  it('removes an unsaved group immediately', () => {
    const onChange = vi.fn();
    renderEditor({ value: [group], onChange });
    fireEvent.click(screen.getByRole('button', { name: 'expand' }));
    fireEvent.click(screen.getByRole('button', { name: 'Видалити' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('asks for confirmation before deleting a saved group', () => {
    const onChange = vi.fn();
    renderEditor({ value: [group], onChange, savedGroupIds: ['g1'] });
    fireEvent.click(screen.getByRole('button', { name: 'expand' }));
    fireEvent.click(screen.getByRole('button', { name: 'Видалити' }));
    expect(screen.getByText('Видалити?')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button', { name: 'Видалити' });
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('asks for confirmation before deleting a saved option', () => {
    const onChange = vi.fn();
    renderEditor({ value: [group], onChange, savedOptionIds: ['o1'] });
    fireEvent.click(screen.getByRole('button', { name: 'expand' }));
    fireEvent.click(screen.getByRole('button', { name: 'delete option' }));
    expect(screen.getByText('Видалити?')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button', { name: 'Видалити' });
    fireEvent.click(buttons[buttons.length - 1]);
    const next = onChange.mock.calls.at(-1)![0] as ModifierGroup[];
    expect(next[0].options).toHaveLength(0);
  });
});
