'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';

interface ActionCardProps {
  photo: string;
  alt: string;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
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
}: ActionCardProps) {
  return (
    <div className="relative flex items-stretch overflow-hidden border border-[#E6DFD5] bg-[#FAF6EE] rounded-2xl">
      <div className="relative w-24 aspect-[4/3] shrink-0 overflow-hidden">
        <Image src={photo} alt={alt} fill className="object-cover" referrerPolicy="no-referrer" />
      </div>

      <div
        className={`absolute inset-y-0 right-0 w-24 flex items-center justify-end gap-1 pr-3 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit"
          className="w-9 h-9 flex items-center justify-center rounded-full text-[#C09E6D] bg-[#F1ECE3] hover:bg-[#E6DFD5] transition-colors cursor-pointer"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          className="w-9 h-9 flex items-center justify-center rounded-full text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <motion.div
        animate={{ x: isOpen ? -PHOTO_WIDTH : 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative z-10 flex flex-1 items-center justify-between gap-3 p-3 bg-[#FAF6EE]"
      >
        <div className="min-w-0">{children}</div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Actions"
          className="w-10 h-10 flex items-center justify-center text-[#8E7A68] hover:text-[#3E2F26] transition-colors rounded-full shrink-0 cursor-pointer"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}

export default ActionCard;
