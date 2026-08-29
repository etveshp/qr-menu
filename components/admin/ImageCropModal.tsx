'use client';

import { X } from 'lucide-react';
import Cropper from 'react-easy-crop';

export interface CropState {
  crop: { x: number; y: number };
  zoom: number;
}

export interface CropLabels {
  dragHint: string;
  zoom: string;
  reset: string;
  cancel: string;
  apply: string;
}

interface ImageCropModalProps {
  isOpen: boolean;
  image: string | null;
  title: string;
  subtitle: string;
  crop: CropState;
  aspect: number;
  labels: CropLabels;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
  onClose: () => void;
  onApply: () => void;
}

export function ImageCropModal({
  isOpen,
  image,
  title,
  subtitle,
  crop,
  aspect,
  labels,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onClose,
  onApply,
}: ImageCropModalProps) {
  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#FDFBF7] rounded-3xl border border-[#E6DFD5] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6DFD5] flex items-center justify-between bg-[#FAF6EE]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#C09E6D]/15 flex items-center justify-center text-[#C09E6D]">
              <CameraIcon />
            </div>
            <div>
              <h3 className="font-display font-medium text-lg text-[#231913]">{title}</h3>
              <p className="text-[11px] text-[#8E7A68]">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1ECE3] hover:bg-[#E6DFD5] text-[#8E7A68] hover:text-[#231913] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cropper View Area */}
        <div
          className="relative bg-white select-none shrink-0 border-y border-[#E6DFD5] mx-auto"
          style={{ width: `min(100%, calc(52vh * ${aspect}))`, aspectRatio: `${aspect}` }}
        >
          <Cropper
            image={image}
            crop={crop.crop}
            zoom={crop.zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
            restrictPosition={true}
            showGrid={true}
            objectFit="cover"
            style={{
              containerStyle: { background: '#ffffff', width: '100%', height: '100%' },
              mediaStyle: { opacity: '1.0' },
              cropAreaStyle: { border: '2px solid rgba(192, 158, 109, 0.85)', boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.55)' }
            }}
          />
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-[#231913]/85 backdrop-blur-xs text-[#FAF6EE] text-[11px] px-3.5 py-1 rounded-full pointer-events-none whitespace-nowrap z-10 border border-white/10">
            {labels.dragHint}
          </div>
        </div>

        {/* Controls & Zoom Slider inside Modal */}
        <div className="p-5 sm:p-6 bg-[#FAF6EE] space-y-5 overflow-y-auto">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
                  <span className="uppercase tracking-widest font-bold text-[#3E2F26]">{labels.zoom}</span>
              <span className="font-bold text-[#C09E6D] text-sm">{Math.round(crop.zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={crop.zoom}
                onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                className="w-full accent-[#C09E6D] cursor-pointer bg-[#E6DFD5] h-3 rounded-lg appearance-none [&::-webkit-slider-runnable-track]:bg-[#E6DFD5] [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-lg [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C09E6D] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#FAF6EE] [&::-webkit-slider-thumb]:-mt-1.5"
              />
              <button
                type="button"
                onClick={() => {
                  onZoomChange(1);
                  onCropChange({ x: 0, y: 0 });
                }}
                className="text-[11px] uppercase tracking-wider font-bold text-[#8E7A68] hover:text-[#3E2F26] px-2 py-1 rounded bg-[#E6DFD5]/50 transition-colors shrink-0 cursor-pointer"
              >
                {labels.reset}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DFD5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#8E7A68] hover:text-[#231913] transition-colors rounded-xl cursor-pointer"
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              onClick={onApply}
              className="px-6 py-2.5 bg-[#3E2F26] hover:bg-[#231913] text-[#FAF6EE] text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {labels.apply}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
