import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import type { Area } from 'react-easy-crop';

vi.mock('@/lib/photo-storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/photo-storage')>();
  return { ...actual, cropImageToWebP: vi.fn(async () => 'cropped-webp') };
});

import { cropImageToWebP } from '@/lib/photo-storage';
import { useImageCrop } from '../use-image-crop';

const mockedCrop = vi.mocked(cropImageToWebP);

const area: Area = { x: 0, y: 0, width: 100, height: 100 };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useImageCrop', () => {
  it('starts closed with default crop and zoom', () => {
    const { result } = renderHook(() => useImageCrop());
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.tempImg).toBeNull();
    expect(result.current.crop).toEqual({ x: 0, y: 0 });
    expect(result.current.zoom).toBe(1);
  });

  it('opens the modal and resets the crop state', () => {
    const { result } = renderHook(() => useImageCrop());
    act(() => {
      result.current.onCropChange({ x: 10, y: 10 });
      result.current.onZoomChange(2);
    });
    act(() => result.current.openModal('/img.png'));
    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.tempImg).toBe('/img.png');
    expect(result.current.crop).toEqual({ x: 0, y: 0 });
    expect(result.current.zoom).toBe(1);
  });

  it('tracks crop, zoom and completed crop area', () => {
    const { result } = renderHook(() => useImageCrop());
    act(() => result.current.onCropChange({ x: 5, y: 6 }));
    act(() => result.current.onZoomChange(1.5));
    act(() => result.current.onCropComplete(area, area));
    expect(result.current.crop).toEqual({ x: 5, y: 6 });
    expect(result.current.zoom).toBe(1.5);
    expect(result.current.pendingPixels).toEqual(area);
  });

  it('applies the crop and closes the modal', async () => {
    const { result } = renderHook(() => useImageCrop());
    act(() => result.current.openModal('/img.png'));
    act(() => result.current.onCropComplete(area, area));

    let cropped: string | null = null;
    await act(async () => {
      cropped = await result.current.applyCrop(4 / 3);
    });

    expect(mockedCrop).toHaveBeenCalledWith('/img.png', area, 4 / 3, 0.9);
    expect(cropped).toBe('cropped-webp');
    expect(result.current.isModalOpen).toBe(false);
  });

  it('returns null without a pending image', async () => {
    const { result } = renderHook(() => useImageCrop());
    let cropped: string | null = 'x';
    await act(async () => {
      cropped = await result.current.applyCrop(4 / 3);
    });
    expect(cropped).toBeNull();
    expect(mockedCrop).not.toHaveBeenCalled();
  });
});
