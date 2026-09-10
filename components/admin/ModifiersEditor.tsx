'use client';

import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Plus, Trash2, Check, X } from 'lucide-react';
import { AutoTransField, type LangCode } from '@/components/admin/AutoTransField';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import {
  createModifierGroup,
  createModifierOption,
  localizedGroupName,
  localizedOptionName,
} from '@/lib/modifiers';
import type { ModifierGroup, ModifierOption } from '@/lib/supabase';
import type { TRANSLATIONS } from '@/lib/translations';

type Translator = (key: keyof typeof TRANSLATIONS['uk']) => string;

export interface ModifiersEditorProps {
  value: ModifierGroup[];
  onChange: (groups: ModifierGroup[]) => void;
  lang: string;
  autoSession: Record<string, string>;
  onSession: (next: Record<string, string>) => void;
  t: Translator;
  /** Ids of groups that already exist in the saved product (deletion asks for confirmation). */
  savedGroupIds?: string[];
  /** Ids of options that already exist in the saved product (deletion asks for confirmation). */
  savedOptionIds?: string[];
}

const nameFor = (entity: { nameUk: string; nameHu: string; nameEn: string }, lang: string): string =>
  lang === 'hu' ? entity.nameHu : lang === 'en' ? entity.nameEn : entity.nameUk;

const namePatch = (lang: string, text: string): Partial<ModifierGroup> =>
  lang === 'hu' ? { nameHu: text } : lang === 'en' ? { nameEn: text } : { nameUk: text };

interface SortableGroupCardProps {
  group: ModifierGroup;
  isOpen: boolean;
  onToggleOpen: () => void;
  onUpdate: (patch: Partial<ModifierGroup>) => void;
  onRemove: () => void;
  onAddOption: () => void;
  onUpdateOption: (optionId: string, patch: Partial<ModifierOption>) => void;
  onRemoveOption: (optionId: string) => void;
  lang: string;
  autoSession: Record<string, string>;
  onSession: (next: Record<string, string>) => void;
  t: Translator;
  shouldSuppressToggle: () => boolean;
}

function SortableGroupCard({
  group,
  isOpen,
  onToggleOpen,
  onUpdate,
  onRemove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  lang,
  autoSession,
  onSession,
  t,
  shouldSuppressToggle,
}: SortableGroupCardProps) {
  const { setNodeRef, setActivatorNodeRef, transform, transition, listeners, attributes, isDragging } =
    useSortable({ id: group.id });

  const title = localizedGroupName(group, lang) || t('modifierUntitled');

  const segmentClass = (active: boolean) =>
    `w-full text-center px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
      active ? 'bg-[#3E2F26] text-[#FAF6EE] shadow-sm' : 'bg-[#F1ECE3] text-[#8E7A68] hover:bg-[#E6DFD5]'
    }`;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border border-[#E6DFD5] bg-[#FDFBF7] rounded-2xl overflow-hidden ${
        isDragging ? 'relative z-50 shadow-2xl ring-2 ring-[#C09E6D]/70' : ''
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        <span className="flex-1 font-semibold text-sm text-[#231913] truncate">{title}</span>
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          type="button"
          onClick={() => {
            if (shouldSuppressToggle()) return;
            onToggleOpen();
          }}
          className="p-1.5 rounded-full text-[#8E7A68] hover:bg-[#F1ECE3] hover:text-[#3E2F26] transition-colors cursor-pointer shrink-0 touch-none"
          aria-label={isOpen ? 'collapse' : 'expand'}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {isOpen && !isDragging && (
        <div className="px-3 pb-3 space-y-3 border-t border-[#E6DFD5] pt-3 bg-[#F1ECE3]/50">
          <AutoTransField
            label={t('modifierName')}
            sourceText={group.nameUk}
            currentValue={nameFor(group, lang)}
            sourceLang="uk"
            currentLang={lang as LangCode}
            baseId={`mod-${group.id}-name`}
            session={autoSession}
            onSession={onSession}
            onChange={(text) => onUpdate(namePatch(lang, text))}
          />

          <div>
            <span className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold mb-1.5">{t('modifierType')}</span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1ECE3]/60 rounded-xl w-full">
              <button type="button" className={segmentClass(group.type === 'single')}
                onClick={() => onUpdate({ type: 'single' })}>{t('modifierSingle')}</button>
              <button type="button" className={segmentClass(group.type === 'multiple')}
                onClick={() => onUpdate({ type: 'multiple' })}>{t('modifierMultiple')}</button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[#4A3B32]">{t('modifierRequired')}</span>
            <button
              type="button"
              role="switch"
              aria-checked={group.required}
              aria-label={t('modifierRequired')}
              onClick={() => onUpdate({ required: !group.required })}
              className={`relative inline-flex shrink-0 w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer border ${
                group.required ? 'bg-[#C09E6D] border-[#C09E6D]' : 'bg-[#E6DFD5] border-[#D5CBBF]'
              }`}
            >
              <span
                className={`absolute top-1/2 -translate-y-1/2 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-200 ${
                  group.required ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {group.required ? <Check className="w-3.5 h-3.5 text-[#3E2F26] stroke-[3]" /> : <X className="w-3.5 h-3.5 text-[#8E7A68]" />}
              </span>
            </button>
          </div>

          <div>
            <span className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold mb-1.5">{t('modifierOptions')}</span>
            <div className="space-y-2">
              {group.options.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <AutoTransField
                      sourceText={option.nameUk}
                      currentValue={nameFor(option, lang)}
                      sourceLang="uk"
                      currentLang={lang as LangCode}
                      baseId={`opt-${option.id}-name`}
                      session={autoSession}
                      onSession={onSession}
                      onChange={(text) => onUpdateOption(option.id, namePatch(lang, text) as Partial<ModifierOption>)}
                      placeholder={t('optionName')}
                    />
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <span className="text-base font-bold text-[#C09E6D]">+</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={option.priceDelta}
                      onChange={(e) => onUpdateOption(option.id, { priceDelta: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-16 px-2 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl text-center focus:outline-none focus:border-[#C09E6D] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label={t('optionPriceDelta')}
                    />
                  </div>
                  <span className="text-sm text-[#8E7A68] shrink-0">₴</span>
                  <button type="button" onClick={() => onRemoveOption(option.id)}
                    className="p-2.5 text-[#3E2F26] hover:bg-[#F1ECE3] rounded-full shrink-0 cursor-pointer" aria-label="delete option">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={onAddOption}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3E2F26] hover:text-[#C09E6D] transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5 text-[#C09E6D]" />
              {t('addOption')}
            </button>
          </div>

          <div className="flex items-center justify-end pt-3 mt-1 border-t border-[#E6DFD5]">
            <button type="button" onClick={onRemove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-[#B23A2E] hover:bg-[#B23A2E]/10 transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4" />
              {t('delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ModifiersEditor({ value, onChange, lang, autoSession, onSession, t, savedGroupIds = [], savedOptionIds = [] }: ModifiersEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [groupToRemove, setGroupToRemove] = useState<ModifierGroup | null>(null);
  const [optionToRemove, setOptionToRemove] = useState<{ groupId: string; option: ModifierOption } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 500, tolerance: 6 } })
  );

  const ids = useMemo(() => value.map((g) => g.id), [value]);
  const groupById = useMemo(() => new Map(value.map((g) => [g.id, g])), [value]);

  const [dragging, setDragging] = useState(false);
  const [displayIds, setDisplayIds] = useState<string[]>(ids);
  const displayIdsRef = useRef<string[]>(ids);
  const suppressToggleRef = useRef(false);

  const setLiveOrder = (next: string[]) => {
    displayIdsRef.current = next;
    setDisplayIds(next);
  };

  const armSuppress = () => {
    suppressToggleRef.current = true;
    window.setTimeout(() => {
      suppressToggleRef.current = false;
    }, 0);
  };

  const handleDragStart = () => {
    setDragging(true);
    setLiveOrder(ids);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const from = displayIdsRef.current.indexOf(String(active.id));
    const to = displayIdsRef.current.indexOf(String(over.id));
    if (from === -1 || to === -1 || from === to) return;
    setLiveOrder(arrayMove(displayIdsRef.current, from, to));
  };

  const handleDragEnd = () => {
    setDragging(false);
    armSuppress();
    const commit = displayIdsRef.current;
    const same = commit.length === ids.length && commit.every((id, i) => id === ids[i]);
    if (!same) {
      onChange(
        commit
          .map((id) => groupById.get(id))
          .filter((g): g is ModifierGroup => Boolean(g))
          .map((g, i) => ({ ...g, sortOrder: i }))
      );
    }
  };

  const handleDragCancel = () => {
    setDragging(false);
    armSuppress();
    setLiveOrder(ids);
  };

  const updateGroup = (id: string, patch: Partial<ModifierGroup>) =>
    onChange(value.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const updateOption = (groupId: string, optionId: string, patch: Partial<ModifierOption>) =>
    onChange(
      value.map((g) =>
        g.id === groupId ? { ...g, options: g.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)) } : g
      )
    );

  const addGroup = () => {
    const group = createModifierGroup({
      sortOrder: value.length,
      options: [createModifierOption({ sortOrder: 0 })],
    });
    onChange([...value, group]);
    setExpandedId(group.id);
  };

  const removeGroup = (id: string) => {
    onChange(value.filter((g) => g.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const requestRemoveGroup = (group: ModifierGroup) => {
    if (savedGroupIds.includes(group.id)) setGroupToRemove(group);
    else removeGroup(group.id);
  };

  const addOption = (groupId: string) =>
    onChange(
      value.map((g) => (g.id === groupId ? { ...g, options: [...g.options, createModifierOption({ sortOrder: g.options.length })] } : g))
    );

  const removeOption = (groupId: string, optionId: string) =>
    onChange(value.map((g) => (g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optionId) } : g)));

  const requestRemoveOption = (groupId: string, optionId: string) => {
    if (!savedOptionIds.includes(optionId)) {
      removeOption(groupId, optionId);
      return;
    }
    const option = value.find((g) => g.id === groupId)?.options.find((o) => o.id === optionId);
    if (option) setOptionToRemove({ groupId, option });
    else removeOption(groupId, optionId);
  };

  const orderedGroups = (dragging ? displayIds : ids)
    .map((id) => groupById.get(id))
    .filter((g): g is ModifierGroup => Boolean(g));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">
          {t('modifiersTitle')}
        </label>
        <button
          type="button"
          onClick={addGroup}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3E2F26] hover:text-[#C09E6D] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#C09E6D]" />
          {t('addModifier')}
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-[#8E7A68] italic leading-relaxed">{t('modifiersEmpty')}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={dragging ? displayIds : ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {orderedGroups.map((group) => (
                <SortableGroupCard
                  key={group.id}
                  group={group}
                  isOpen={expandedId === group.id}
                  onToggleOpen={() => setExpandedId(expandedId === group.id ? null : group.id)}
                  onUpdate={(patch) => updateGroup(group.id, patch)}
                  onRemove={() => requestRemoveGroup(group)}
                  onAddOption={() => addOption(group.id)}
                  onUpdateOption={(optionId, patch) => updateOption(group.id, optionId, patch)}
                  onRemoveOption={(optionId) => requestRemoveOption(group.id, optionId)}
                  lang={lang}
                  autoSession={autoSession}
                  onSession={onSession}
                  t={t}
                  shouldSuppressToggle={() => suppressToggleRef.current}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmModal
        isOpen={!!groupToRemove}
        title={t('deleteConfirmTitle')}
        message={groupToRemove ? `${t('deleteConfirmMessage')} "${localizedGroupName(groupToRemove, lang) || t('modifierUntitled')}"?` : ''}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onCancel={() => setGroupToRemove(null)}
        onConfirm={() => {
          if (groupToRemove) removeGroup(groupToRemove.id);
          setGroupToRemove(null);
        }}
      />

      <ConfirmModal
        isOpen={!!optionToRemove}
        title={t('deleteConfirmTitle')}
        message={optionToRemove ? `${t('deleteConfirmMessage')} "${localizedOptionName(optionToRemove.option, lang) || t('optionName')}"?` : ''}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onCancel={() => setOptionToRemove(null)}
        onConfirm={() => {
          if (optionToRemove) removeOption(optionToRemove.groupId, optionToRemove.option.id);
          setOptionToRemove(null);
        }}
      />
    </div>
  );
}
