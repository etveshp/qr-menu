'use client';

import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionCard, type DragHandleProps } from '@/components/admin/ActionCard';

export interface SortableCardItem {
  id: string;
  photo: string;
}

interface SortableActionCardGridProps<T extends SortableCardItem> {
  items: T[];
  isOpenId: string | null;
  onToggle: (id: string) => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onReorder: (orderedIds: string[]) => void;
  onDragStart?: () => void;
  getAlt: (item: T) => string;
  renderContent: (item: T) => React.ReactNode;
}

interface SortableRowProps<T extends SortableCardItem> {
  item: T;
  alt: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  renderContent: (item: T) => React.ReactNode;
}

function SortableRow<T extends SortableCardItem>({
  item,
  alt,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  renderContent,
}: SortableRowProps<T>) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    listeners,
    attributes,
    isDragging,
  } = useSortable({ id: item.id });

  const dragHandle: DragHandleProps = {
    handleRef: setActivatorNodeRef,
    listeners: listeners as Record<string, any>,
    attributes: attributes as Record<string, any>,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`min-w-0 ${isDragging ? 'relative z-50 opacity-100 shadow-2xl ring-2 ring-[#C09E6D]/70 rounded-2xl scale-[1.02]' : ''}`}
    >
      <ActionCard
        photo={item.photo}
        alt={alt}
        isOpen={isOpen && !isDragging}
        onToggle={() => onToggle(item.id)}
        onEdit={() => onEdit(item)}
        onDelete={() => onDelete(item)}
        dragHandle={dragHandle}
      >
        {renderContent(item)}
      </ActionCard>
    </div>
  );
}

/**
 * Перетягування карток (ActionCard) за кебаб `⋮` у сітці адмінки.
 * Довгий тап/затискання (~500 мс) на кебабі «відділяє» картку — вона піднімається
 * (тінь/ring/scale) і слідує за пальцем/курсором, решта карток live-зсувається,
 * показуючи кінцеве місце. На drop новий порядок id передається батьку (persist).
 */
export function SortableActionCardGrid<T extends SortableCardItem>({
  items,
  isOpenId,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
  onDragStart,
  getAlt,
  renderContent,
}: SortableActionCardGridProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 500, tolerance: 6 },
    })
  );

  const ids = useMemo(() => items.map((i) => i.id), [items]);
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // Порядок під час активного перетягування (live-preview). Коли перетягування
  // немає — використовуємо актуальні items (батько оновлює стан після збереження).
  const [dragging, setDragging] = useState(false);
  const [displayIds, setDisplayIds] = useState<string[]>(ids);
  // Дзеркало displayIds для читання в onDragEnd без stale closure (ref
  // оновлюється лише в обробниках подій / setState-updater, не під час рендеру).
  const displayIdsRef = useRef<string[]>(ids);
  const suppressToggleRef = useRef(false);

  const setLiveOrder = (next: string[]) => {
    displayIdsRef.current = next;
    setDisplayIds(next);
  };
  const moveLiveOrder = (from: number, to: number) => {
    const next = arrayMove(displayIdsRef.current, from, to);
    setLiveOrder(next);
  };

  const armSuppress = () => {
    suppressToggleRef.current = true;
    window.setTimeout(() => {
      suppressToggleRef.current = false;
    }, 0);
  };
  const safeToggle = (id: string) => {
    if (suppressToggleRef.current) return;
    onToggle(id);
  };

  const handleDragStart = (_event: DragStartEvent) => {
    setDragging(true);
    setLiveOrder(ids);
    onDragStart?.();
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const from = displayIdsRef.current.indexOf(String(active.id));
    const to = displayIdsRef.current.indexOf(String(over.id));
    if (from === -1 || to === -1 || from === to) return;
    moveLiveOrder(from, to);
  };

  const sameOrder = (a: string[], b: string[]): boolean =>
    a.length === b.length && a.every((id, i) => id === b[i]);

  const handleDragEnd = (_event: DragEndEvent) => {
    setDragging(false);
    armSuppress();
    // Live-порядок уже зібрано у displayIdsRef під час onDragOver — зберігаємо саме його.
    const commit = displayIdsRef.current;
    if (!sameOrder(commit, ids)) onReorder(commit);
  };

  const handleDragCancel = () => {
    setDragging(false);
    armSuppress();
    setLiveOrder(ids);
  };

  const orderedItems = (dragging ? displayIds : ids)
    .map((id) => itemById.get(id))
    .filter((item): item is T => Boolean(item));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={dragging ? displayIds : ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orderedItems.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              alt={getAlt(item)}
              isOpen={isOpenId === item.id}
              onToggle={safeToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              renderContent={renderContent}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
