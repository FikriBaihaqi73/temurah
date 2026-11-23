"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move, 
  Check, 
  RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load image object when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      setImageObj(img);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Render on preview canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    ctx.save();

    // Lingkaran clipping agar terlihat persis avatar bulat
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Background netral
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, size, size);

    // Transformasi: Translasi ke titik tengah, Rotasi, Skala, dan Pan Offset
    ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Hitung aspect ratio image agar fit
    const imgAspect = imageObj.width / imageObj.height;
    let drawW = size;
    let drawH = size;
    if (imgAspect > 1) {
      drawW = size * imgAspect;
    } else {
      drawH = size / imgAspect;
    }

    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Gambar border lingkaran panduan
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }, [imageObj, zoom, rotation, offset]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Mouse & Touch Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel to Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(0.5, prev + delta)));
  };

  // Export cropped circular result as high-res base64
  const handleSaveCrop = () => {
    if (!imageObj) return;

    const outputCanvas = document.createElement("canvas");
    const outputSize = 400; // Ukuran resolusi standar avatar
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const ctx = outputCanvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    // Crop lingkaran
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Scale faktor relatif dari preview 280px ke 400px
    const scaleFactor = outputSize / 280;

    ctx.translate(
      outputSize / 2 + offset.x * scaleFactor,
      outputSize / 2 + offset.y * scaleFactor
    );
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

    const imgAspect = imageObj.width / imageObj.height;
    let drawW = 280;
    let drawH = 280;
    if (imgAspect > 1) {
      drawW = 280 * imgAspect;
    } else {
      drawH = 280 / imgAspect;
    }

    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Export hasil potongan sebagai WebP dengan kompresi berkualitas tinggi (0.82)
    let croppedBase64 = outputCanvas.toDataURL("image/webp", 0.82);
    // Fallback jika browser lawas tidak support image/webp
    if (!croppedBase64.startsWith("data:image/webp")) {
      croppedBase64 = outputCanvas.toDataURL("image/jpeg", 0.82);
    }
    onCropComplete(croppedBase64);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-4 sm:p-5 text-white shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-bold text-zinc-100">Sesuaikan Foto Profil</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[11px] text-zinc-400 mt-2 text-center">
          Geser foto untuk memposisikan & gunakan slider di bawah untuk zoom.
        </p>

        {/* Canvas Area Preview */}
        <div 
          ref={containerRef}
          className="relative my-3 flex items-center justify-center select-none touch-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <div className="relative p-1 rounded-full border border-zinc-800 bg-zinc-950/80 shadow-inner">
            <canvas 
              ref={canvasRef} 
              width={280} 
              height={280} 
              className="rounded-full shadow-md max-w-[240px] max-h-[240px] sm:max-w-[280px] sm:max-h-[280px]"
            />
          </div>
        </div>

        {/* Controls: Zoom Slider, Rotate, & Reset */}
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2.5 px-1">
            <ZoomOut className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <input 
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-red-600 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <ZoomIn className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          </div>

          {/* Quick Buttons: Rotate & Reset */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
              title="Putar 90 Derajat"
            >
              <RotateCw className="h-3 w-3 text-red-400" />
              <span>Putar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setOffset({ x: 0, y: 0 });
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Kembalikan ke posisi awal"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 text-zinc-300 border-zinc-700 hover:bg-zinc-800"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSaveCrop}
            className="text-xs h-8 gap-1.5 font-semibold px-4"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Pakai Foto Ini</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
