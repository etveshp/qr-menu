'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';

export interface DragHandleProps {
  handleRef: (element: HTMLButtonElement | null) => void;
  listeners: Record<string, any>;
  attributes: Record<string, any>;
}

interface ActionCardProps {
  photo: string;
  alt: string;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
  dragHandle?: DragHandleProps;
}

const PHOTO_WIDTH = 96;

export function ActionCard({
  photo,
  alt,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  children,
  dragHandle,
}: ActionCardProps) {
  return (
    <div className="relative flex items-stretch overflow-hidden border border-[#E6DFD5] bg-[#FAF6EE] rounded-2xl">
      <div className="relative w-24 aspect-[4/3] shrink-0 self-stretch overflow-hidden">
        <Image src={photo} alt={alt} fill sizes="96px" className="object-cover" referrerPolicy="no-referrer" />
      </div>

      {/* Sliding text panel (covers photo on open) */}
      <motion.div
        animate={{ x: isOpen ? -PHOTO_WIDTH : 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="absolute inset-y-0 left-24 right-0 z-10 flex items-center p-3 pr-14 bg-[#FAF6EE]"
      >
        <div className="min-w-0">{children}</div>
      </motion.div>

      {/* Fixed actions cluster at far right (kebab never moves) */}
      <div className={`absolute inset-y-0 right-2 z-20 flex items-center ${isOpen ? 'gap-1' : 'gap-0'}`}>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit"
          className={`h-9 flex items-center justify-center rounded-full text-[#3E2F26] bg-[#F1ECE3] hover:bg-[#E6DFD5] transition-all duration-200 cursor-pointer overflow-hidden ${
            isOpen ? 'w-9 opacity-100' : 'w-0 opacity-0'
          }`}
        >
          <Edit2 className="w-4 h-4 shrink-0" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          className={`h-9 flex items-center justify-center rounded-full text-[#3E2F26] bg-[#F1ECE3] hover:bg-[#E6DFD5] transition-all duration-200 cursor-pointer overflow-hidden ${
            isOpen ? 'w-9 opacity-100' : 'w-0 opacity-0'
          }`}
        >
          <Trash2 className="w-4 h-4 shrink-0" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          ref={dragHandle?.handleRef}
          {...(dragHandle?.listeners ?? {})}
          {...(dragHandle?.attributes ?? {})}
          aria-label="Actions"
          className={`w-10 h-10 flex items-center justify-center text-[#8E7A68] hover:text-[#3E2F26] transition-colors rounded-full cursor-pointer ${
            dragHandle ? 'cursor-grab touch-none active:cursor-grabbing' : ''
          }`}
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default ActionCard;
