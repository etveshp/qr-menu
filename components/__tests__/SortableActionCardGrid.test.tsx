import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SortableActionCardGrid } from '../admin/SortableActionCardGrid';

interface Item {
  id: string;
  photo: string;
  label: string;
}

const items: Item[] = [
  { id: 'a', photo: '', label: 'Альфа' },
  { id: 'b', photo: '', label: 'Бета' },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SortableActionCardGrid', () => {
  it('renders rows and wires edit/delete/toggle', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <SortableActionCardGrid
        items={items}
        isOpenId={null}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onReorder={vi.fn()}
        getAlt={(i) => i.label}
        renderContent={(i) => <span>{i.label}</span>}
      />
    );

    expect(screen.getByText('Альфа')).toBeInTheDocument();
    expect(screen.getByText('Бета')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    expect(onEdit).toHaveBeenCalledWith(items[0]);

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    expect(onDelete).toHaveBeenCalledWith(items[1]);

    fireEvent.click(screen.getAllByRole('button', { name: 'Actions' })[0]);
    expect(onToggle).toHaveBeenCalledWith('a');
  });
});
