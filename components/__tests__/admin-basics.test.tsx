import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ActionCard } from '../admin/ActionCard';
import { AdminDrawer } from '../admin/AdminDrawer';
import { AutoTransField } from '../admin/AutoTransField';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ActionCard', () => {
  it('renders children and fires edit/delete/toggle', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onToggle = vi.fn();
    render(
      <ActionCard
        photo="/p.png"
        alt="Кава"
        isOpen={false}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      >
        <span>Еспресо</span>
      </ActionCard>
    );
    expect(screen.getByText('Еспресо')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('accepts drag handle props without crashing', () => {
    render(
      <ActionCard
        photo=""
        alt=""
        isOpen
        logoUrl="/logo.png"
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        dragHandle={{ handleRef: vi.fn(), listeners: {}, attributes: {} }}
      >
        <span>Еспресо</span>
      </ActionCard>
    );
    expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
  });
});

describe('AdminDrawer', () => {
  it('renders nothing when closed', () => {
    render(
      <AdminDrawer isOpen={false} title="Заголовок" onClose={vi.fn()}>
        <span>Вміст</span>
      </AdminDrawer>
    );
    expect(screen.queryByText('Заголовок')).not.toBeInTheDocument();
  });

  it('renders header, subtitle, action and children when open', () => {
    render(
      <AdminDrawer
        isOpen
        title="Заголовок"
        subtitle="Підзаголовок"
        headerAction={<span>Дія</span>}
        onClose={vi.fn()}
      >
        <span>Вміст</span>
      </AdminDrawer>
    );
    expect(screen.getByText('Заголовок')).toBeInTheDocument();
    expect(screen.getByText('Підзаголовок')).toBeInTheDocument();
    expect(screen.getByText('Дія')).toBeInTheDocument();
    expect(screen.getByText('Вміст')).toBeInTheDocument();
  });

  it('closes on the close button, backdrop and Escape', () => {
    const onClose = vi.fn();
    const { container } = render(
      <AdminDrawer isOpen title="Заголовок" onClose={onClose}>
        <span>Вміст</span>
      </AdminDrawer>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const backdrop = container.querySelector('.absolute.inset-0.cursor-pointer');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe('AutoTransField', () => {
  it('renders the source value and reports edits without session writes', () => {
    const onChange = vi.fn();
    const onSession = vi.fn();
    render(
      <AutoTransField
        label="Назва"
        sourceText="Джерело"
        currentValue="Поточне"
        sourceLang="uk"
        currentLang="uk"
        baseId="f1"
        session={{}}
        onSession={onSession}
        onChange={onChange}
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Поточне');
    expect(screen.queryByRole('button', { name: 'Auto-translate' })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Нове' } });
    expect(onChange).toHaveBeenCalledWith('Нове');
    expect(onSession).not.toHaveBeenCalled();
  });

  it('translates from the source language via the API', async () => {
    const onChange = vi.fn();
    const onSession = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ json: async () => ({ translated: 'TR' }) }))
    );
    render(
      <AutoTransField
        sourceText="Джерело"
        currentValue=""
        sourceLang="uk"
        currentLang="en"
        baseId="f1"
        session={{}}
        onSession={onSession}
        onChange={onChange}
        multiline
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Auto-translate' }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('TR'));
    expect(onSession).toHaveBeenCalledWith({ 'f1:en': 'TR' });
  });
});
