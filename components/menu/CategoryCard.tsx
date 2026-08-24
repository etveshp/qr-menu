'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import type { Category } from '@/lib/firebase';

interface CategoryCardProps {
  category: Category;
  index: number;
  name: string;
  onSelect: (categoryId: string) => void;
}

export function CategoryCard({ category, index, name, onSelect }: CategoryCardProps) {
  return (
    <motion.button
      onClick={() => onSelect(category.id)}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.45,
        delay: (index % 2) * 0.08,
        ease: [0.215, 0.61, 0.355, 1]
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      className="relative aspect-[4/3] w-full flex flex-col justify-end p-4 overflow-hidden border border-[#E6DFD5] transition-shadow text-left group rounded-2xl premium-shadow hover:border-[#C09E6D] hover:shadow-lg cursor-pointer"
    >
      <Image
        src={category.photo}
        alt={category.nameUk}
        fill
        className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#231913]/90 via-[#231913]/30 to-transparent" />

      <span className="relative z-10 text-base sm:text-lg font-display font-semibold tracking-wide uppercase text-white">
        {name}
      </span>
    </motion.button>
  );
}
