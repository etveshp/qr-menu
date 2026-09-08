'use client';

import { useState } from 'react';
import type { Area } from 'react-easy-crop';
import { cropImageToWebP } from '@/lib/photo-storage';

export interface UseImageCropReturn {
  crop: { x: number; y: number };
  zoom: number;
  tempImg: string | null;
  isModalOpen: boolean;
  pendingPixels: { x: number; y: number; width: number; height: number } | null;
  onCropChange: (c: { x: number; y: number }) => void;
  onZoomChange: (z: number) => void;
  onCropComplete: (a: Area, p: Area) => void;
  openModal: (imageSrc: string) => void;
  closeModal: () => void;
  applyCrop: (aspect: number, quality?: number) => Promise<string | null>;
}

export function useImageCrop(): UseImageCropReturn {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [tempImg, setTempImg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingPixels, setPendingPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const onCropChange = (c: { x: number; y: number }) => setCrop(c);
  const onZoomChange = (z: number) => setZoom(z);
  const onCropComplete = (_a: Area, p: Area) => {
    if (p) setPendingPixels(p);
  };

  const openModal = (imageSrc: string) => {
    setTempImg(imageSrc);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPendingPixels(null);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const applyCrop = async (aspect: number, quality: number = 0.75): Promise<string | null> => {
    if (!tempImg || !pendingPixels) return null;
    try {
      return await cropImageToWebP(tempImg, pendingPixels, aspect, quality);
    } finally {
      setIsModalOpen(false);
    }
  };

  return {
    crop, zoom, tempImg, isModalOpen, pendingPixels,
    onCropChange, onZoomChange, onCropComplete,
    openModal, closeModal, applyCrop,
  };
}