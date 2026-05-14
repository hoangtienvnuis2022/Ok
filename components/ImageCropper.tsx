import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from './Icons';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  initialAspectRatio?: number; // width / height
}

type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 'move';

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel, initialAspectRatio = 9/16 }) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(initialAspectRatio);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [crop, setCrop] = useState({ x: 20, y: 10, width: 60, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });

  const ratios = [
    { label: '9:16', value: 9/16 },
    { label: '2:3', value: 2/3 },
    { label: '3:4', value: 3/4 },
    { label: '1:1', value: 1 },
    { label: 'Tự do', value: null },
  ];

  useEffect(() => {
    if (aspectRatio && imageRef.current) {
      const img = imageRef.current;
      const containerWidth = img.clientWidth;
      const containerHeight = img.clientHeight;
      const imgAspect = containerWidth / containerHeight;

      let newWidth, newHeight;
      if (aspectRatio > imgAspect) {
        newWidth = 80;
        newHeight = (newWidth / aspectRatio) * imgAspect;
      } else {
        newHeight = 80;
        newWidth = (newHeight * aspectRatio) / imgAspect;
      }

      setCrop({
        width: newWidth,
        height: newHeight,
        x: (100 - newWidth) / 2,
        y: (100 - newHeight) / 2,
      });
    }
  }, [aspectRatio]);

  const handleMouseDown = (e: React.MouseEvent, type: HandleType) => {
    e.preventDefault();
    setIsDragging(true);
    setActiveHandle(type);
    setStartPos({
      x: e.clientX,
      y: e.clientY,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.width,
      cropH: crop.height
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !activeHandle || !containerRef.current || !imageRef.current) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    
    // Tính toán delta theo phần trăm của ảnh thực tế hiển thị
    const dx = ((e.clientX - startPos.x) / rect.width) * 100;
    const dy = ((e.clientY - startPos.y) / rect.height) * 100;

    setCrop(prev => {
      // Fix: Destructure directly from the existing state object instead of spreading into a new one
      // This resolves the 'Initializer provides no value for this binding element' errors on line 82.
      let x = prev.x;
      let y = prev.y;
      let width = prev.width;
      let height = prev.height;

      if (activeHandle === 'move') {
        x = Math.max(0, Math.min(100 - width, startPos.cropX + dx));
        y = Math.max(0, Math.min(100 - height, startPos.cropY + dy));
      } else {
        // Resize logic
        if (activeHandle.includes('r')) width = Math.max(10, Math.min(100 - startPos.cropX, startPos.cropW + dx));
        if (activeHandle.includes('l')) {
          const newW = Math.max(10, startPos.cropW - dx);
          if (startPos.cropX + (startPos.cropW - newW) >= 0) {
            x = startPos.cropX + (startPos.cropW - newW);
            width = newW;
          }
        }
        
        if (activeHandle.includes('b')) height = Math.max(10, Math.min(100 - startPos.cropY, startPos.cropH + dy));
        if (activeHandle.includes('t')) {
          const newH = Math.max(10, startPos.cropH - dy);
          if (startPos.cropY + (startPos.cropH - newH) >= 0) {
            y = startPos.cropY + (startPos.cropH - newH);
            height = newH;
          }
        }

        // Ép tỉ lệ nếu có
        if (aspectRatio) {
          const imgRect = img.getBoundingClientRect();
          const currentImgAspect = imgRect.width / imgRect.height;
          const targetVisualAspect = aspectRatio / currentImgAspect;

          if (activeHandle === 'br' || activeHandle === 'bl' || activeHandle === 'tr' || activeHandle === 'tl') {
            // Ưu tiên chiều rộng để tính lại chiều cao theo tỉ lệ
            height = width / targetVisualAspect;
            
            // Kiểm tra tràn biên dọc
            if (y + height > 100) {
              height = 100 - y;
              width = height * targetVisualAspect;
              if (activeHandle.includes('l')) x = startPos.cropX + startPos.cropW - width;
            }
          }
        }
      }

      return { x, y, width, height };
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveHandle(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = img.naturalWidth / 100;
    const scaleY = img.naturalHeight / 100;

    const drawX = crop.x * scaleX;
    const drawY = crop.y * scaleY;
    const drawW = crop.width * scaleX;
    const drawH = crop.height * scaleY;

    canvas.width = drawW;
    canvas.height = drawH;

    ctx.drawImage(img, drawX, drawY, drawW, drawH, 0, 0, drawW, drawH);
    onCropComplete(canvas.toDataURL('image/jpeg', 0.95));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in select-none">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
          <h2 className="text-white font-bold text-sm tracking-tight">Căn chỉnh trang phục</h2>
        </div>
        <button 
          onClick={handleConfirm}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-full shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
        >
          Xác nhận
        </button>
      </header>

      <div ref={containerRef} className="flex-1 relative flex items-center justify-center p-8 bg-slate-950/50 overflow-hidden">
        <div className="relative inline-block shadow-2xl">
          <img 
            ref={imageRef}
            src={imageSrc} 
            alt="To crop" 
            className="max-w-full max-h-[65vh] block pointer-events-none"
          />
          
          {/* Vùng cắt */}
          <div 
            className="absolute border-2 border-indigo-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.75)] cursor-move"
            style={{
              left: `${crop.x}%`,
              top: `${crop.y}%`,
              width: `${crop.width}%`,
              height: `${crop.height}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            {/* Grid 3x3 */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 w-full h-px bg-white/20"></div>
              <div className="absolute top-2/3 w-full h-px bg-white/20"></div>
              <div className="absolute left-1/3 h-full w-px bg-white/20"></div>
              <div className="absolute left-2/3 h-full w-px bg-white/20"></div>
            </div>

            {/* Các nút kéo ở góc (Handles) */}
            <div 
              className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nw-resize z-10"
              onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'tl'); }}
            ></div>
            <div 
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-ne-resize z-10"
              onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'tr'); }}
            ></div>
            <div 
              className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-sw-resize z-10"
              onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'bl'); }}
            ></div>
            <div 
              className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-se-resize z-10"
              onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'br'); }}
            ></div>
          </div>
        </div>
      </div>

      <footer className="bg-slate-900 border-t border-slate-800 p-8">
        <div className="max-w-xl mx-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">Tỉ lệ khung hình</p>
          <div className="flex justify-center gap-2">
            {ratios.map((r) => (
              <button
                key={r.label}
                onClick={() => setAspectRatio(r.value)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border
                  ${aspectRatio === r.value ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl scale-105' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}
                `}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-6 text-center italic">Mẹo: Kéo các góc màu trắng để phóng to/thu nhỏ vùng chọn trên hình ảnh.</p>
        </div>
      </footer>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ImageCropper;
