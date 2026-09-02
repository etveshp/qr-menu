'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Language } from '@/lib/translations';

export interface LanguageSelectorProps {
  currentLang?: Language | 'ua';
  onChange?: (lang: Language) => void;
  options?: Language[];
}

export function LanguageSelector({ 
  currentLang = 'uk', 
  onChange,
  options = ['uk', 'hu', 'en']
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvedLang = currentLang === 'ua' ? 'uk' : currentLang;

  const handleSelectLanguage = (newLang: Language) => {
    if (onChange) {
      onChange(newLang);
    }
    setIsOpen(false);
  };

  // Закриття випадаючого списку при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: Language[] = options && options.length > 0 ? options : ['uk', 'hu', 'en'];

  const getLabel = (l: string) => {
    if (l === 'uk' || l === 'ua') return 'UA';
    if (l === 'hu') return 'HU';
    return 'EN';
  };

  return (
    <div 
      ref={containerRef} 
      id="lang-switcher-wrapper" 
      className="relative w-11 h-11 select-none z-30 flex items-center justify-center shrink-0"
    >
      <motion.div
        id="lang-switcher-container"
        initial={false}
        transition={{ 
          type: "spring", 
          stiffness: 350, 
          damping: 25 
        }}
        className={`absolute right-0 top-0 flex flex-col items-center overflow-hidden rounded-full ${
          isOpen 
            ? "w-11 py-1.5 gap-1.5 bg-[#F1ECE3] border border-[#E6DFD5] shadow-lg" 
            : "w-11 h-11 justify-center bg-[#F1ECE3] hover:bg-[#E6DFD5] border border-[#E6DFD5] shadow-sm transition-colors"
        }`}
      >
        {!isOpen ? (
          // Згорнутий стан: кругла кнопка в бежево-кавових кольорах додатку
          <button
            id="lang-collapsed-btn"
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full h-full rounded-full flex items-center justify-center text-[#3E2F26] text-xs font-black uppercase font-sans tracking-wide cursor-pointer outline-none active:scale-95 transition-transform"
          >
            {getLabel(resolvedLang)}
          </button>
        ) : (
          // Розгорнутий стан: капсульний випадаючий список з кавово-золотим індикатором
          <div id="lang-expanded-list" className="flex flex-col items-center gap-1.5 w-full">
            {languages.map((lang) => {
              const isActive = resolvedLang === lang;

              return (
                <button
                  key={lang}
                  id={`lang-option-${lang}`}
                  type="button"
                  onClick={() => handleSelectLanguage(lang)}
                  className="relative w-8 h-8 flex items-center justify-center text-[11px] font-extrabold uppercase font-sans tracking-wide transition-colors duration-200 cursor-pointer rounded-full outline-none"
                >
                  {/* Активне коло в золотаво-кавовому кольорі бренду */}
                  {isActive && (
                    <motion.div
                      layoutId="activeCircle"
                      transition={{ 
                        type: "spring", 
                        stiffness: 380, 
                        damping: 24 
                      }}
                      className="absolute inset-0 bg-[#C09E6D] rounded-full z-0 shadow-sm"
                    />
                  )}
                  <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-white font-black' : 'text-[#3E2F26] hover:text-[#C09E6D]'}`}>
                    {getLabel(lang)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default LanguageSelector;
