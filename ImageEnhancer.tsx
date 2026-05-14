import React, { useState, useCallback, useRef, useEffect } from 'react';
import { enhanceImage, EnhanceOptions, ModelLevel } from './services/geminiService';
import { UploadIcon, SparklesIcon, LoadingSpinner, ErrorIcon, ArrowLeftIcon, WandIcon, XIcon, DownloadIcon, ZoomInIcon } from './components/Icons';

type AppState = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

interface ImageEnhancerProps {
  onGoBack: () => void;
  initialImageUrl?: string | null;
  modelLevel: ModelLevel;
}

const ImageEnhancer: React.FC<ImageEnhancerProps> = ({ onGoBack, initialImageUrl, modelLevel }) => {
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [options, setOptions] = useState<EnhanceOptions>({
    upscale: false,
    sharpen: false,
    removeWatermark: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const mimeType = blob.type || 'image/jpeg';
      const finalFilename = filename.includes('.') ? filename : `${filename}.${mimeType.split('/')[1] || 'jpeg'}`;
      return new File([blob], finalFilename, { type: mimeType });
  };

  useEffect(() => {
    if (initialImageUrl) {
        const loadImage = async () => {
            try {
                setGeneratedImageUrl(null);
                setError(null);
                setAppState('IDLE');
                if (fileInputRef.current) fileInputRef.current.value = "";
                setOriginalImageUrl(initialImageUrl);
                const file = await dataUrlToFile(initialImageUrl, 'image-from-studio.jpeg');
                setOriginalImageFile(file);
            } catch (e) {
                setError("Không thể tải ảnh.");
                setAppState('ERROR');
            }
        };
        loadImage();
    }
  }, [initialImageUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn một tệp hình ảnh.');
        setAppState('ERROR');
        return;
      }
      setGeneratedImageUrl(null);
      setError(null);
      setAppState('IDLE');
      setOriginalImageFile(file);
      setOriginalImageUrl(URL.createObjectURL(file));
    }
  };
  
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOriginalImageFile(null);
    setOriginalImageUrl(null);
    setGeneratedImageUrl(null);
    setError(null);
    setAppState('IDLE');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOptionChange = (option: keyof EnhanceOptions) => {
    setOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const handleGenerateClick = useCallback(async () => {
    if (!originalImageFile || (!options.upscale && !options.sharpen && !options.removeWatermark)) return;

    setAppState('PROCESSING');
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(originalImageFile);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        if (!base64String) throw new Error('Failed to read image');

        const generatedImage = await enhanceImage(base64String, originalImageFile.type, options, modelLevel);
        setGeneratedImageUrl(`data:image/jpeg;base64,${generatedImage}`);
        setAppState('SUCCESS');
      };
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định.');
      setAppState('ERROR');
    }
  }, [originalImageFile, options, modelLevel]);
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const OptionCard: React.FC<{ id: keyof EnhanceOptions; title: string, desc: string, disabled: boolean }> = ({ id, title, desc, disabled }) => (
     <div 
        onClick={() => !disabled && handleOptionChange(id)}
        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start space-x-3
            ${disabled ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-800' : 
              options[id] ? 'border-sky-500 bg-sky-500/10' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}
        `}
     >
        <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors
            ${options[id] ? 'bg-sky-500 border-sky-500' : 'border-slate-500 bg-transparent'}
        `}>
            {options[id] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </div>
        <div>
            <h3 className={`font-semibold text-sm ${options[id] ? 'text-white' : 'text-slate-300'}`}>{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
        </div>
     </div>
  );

  return (
    <div className="bg-slate-900 min-h-screen text-slate-200 font-sans">
      {/* Zoom Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setZoomImage(null)}>
            <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-white/10 rounded-full" onClick={() => setZoomImage(null)}>
                <XIcon className="w-8 h-8" />
            </button>
            <img src={zoomImage} alt="Zoom" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <header className="flex-none h-16 border-b border-slate-700 bg-slate-800/50 backdrop-blur-md flex items-center px-6 justify-between z-20">
        <div className="flex items-center">
            <button onClick={onGoBack} className="flex items-center text-slate-400 hover:text-white transition-colors mr-4">
                <ArrowLeftIcon className="w-5 h-5 mr-2"/>
                <span className="font-medium">Trang chủ</span>
            </button>
            <div className="h-6 w-px bg-slate-700 mx-4"></div>
            <h1 className="text-lg font-bold text-white tracking-tight">Image Enhancer</h1>
        </div>
        <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono px-2 py-1 rounded border ${modelLevel === 'pro' ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                {modelLevel === 'pro' ? 'GEMINI 3 PRO' : 'GEMINI 2.5 FLASH'}
            </span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Input Column */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">Nâng Cấp Ảnh AI</h1>
                    <p className="text-slate-400">Tối ưu hóa chất lượng hình ảnh với công nghệ AI tiên tiến.</p>
                </div>

                {/* Upload */}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <div 
                    onClick={!originalImageUrl ? triggerFileInput : undefined}
                    className={`relative w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer
                        ${originalImageUrl ? 'border-sky-500 bg-slate-800' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-sky-400'}
                    `}
                >
                     {originalImageUrl ? (
                        <>
                            <img src={originalImageUrl} alt="Original" className="w-full h-full object-contain" />
                            <button onClick={handleRemoveImage} className="absolute top-2 right-2 bg-slate-900/80 p-2 rounded-full hover:bg-red-500 text-white transition-colors">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <div className="text-center">
                            <UploadIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                            <p className="text-slate-300 font-medium">Chọn ảnh cần nâng cấp</p>
                        </div>
                    )}
                </div>

                {/* Options */}
                <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tùy chọn xử lý</p>
                    <OptionCard id="upscale" title="Upscale 2K/4K" desc="Tăng độ phân giải và chi tiết." disabled={!originalImageFile} />
                    <OptionCard id="sharpen" title="Làm nét (Sharpen)" desc="Khử mờ, tăng độ sắc nét cho chủ thể." disabled={!originalImageFile} />
                    <OptionCard id="removeWatermark" title="Xóa Watermark" desc="Loại bỏ chữ, logo trên ảnh tự động." disabled={!originalImageFile} />
                </div>

                <button
                    onClick={handleGenerateClick}
                    disabled={appState === 'PROCESSING' || !originalImageFile || (!options.upscale && !options.sharpen && !options.removeWatermark)}
                    className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                     {appState === 'PROCESSING' ? (
                         <> <LoadingSpinner className="w-5 h-5" /> <span>Đang xử lý...</span> </>
                     ) : (
                         <> <WandIcon className="w-5 h-5" /> <span>Bắt đầu nâng cấp</span> </>
                     )}
                </button>
            </div>

            {/* Output Column */}
            <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700/50 flex flex-col">
                <h2 className="text-xl font-bold text-white mb-4">Kết quả</h2>
                <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden relative flex items-center justify-center group">
                    {appState === 'IDLE' && <p className="text-slate-500">Chưa có kết quả</p>}
                    {appState === 'PROCESSING' && (
                        <div className="text-center">
                            <LoadingSpinner className="w-12 h-12 text-sky-500 mx-auto mb-4" />
                            <p className="text-sky-400 animate-pulse">AI đang làm việc...</p>
                        </div>
                    )}
                    {appState === 'SUCCESS' && generatedImageUrl && (
                        <div className="relative w-full h-full cursor-pointer" onClick={() => setZoomImage(generatedImageUrl)}>
                            <img src={generatedImageUrl} alt="Enhanced" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ZoomInIcon className="w-12 h-12 text-white drop-shadow-lg" />
                            </div>
                        </div>
                    )}
                    {appState === 'ERROR' && (
                        <div className="text-center text-red-400">
                            <ErrorIcon className="w-10 h-10 mx-auto mb-2" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>
                
                {appState === 'SUCCESS' && generatedImageUrl && (
                    <a href={generatedImageUrl} download="enhanced-image.jpg" className="mt-4 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all">
                        <DownloadIcon className="w-5 h-5" />
                        <span>Tải ảnh về máy</span>
                    </a>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default ImageEnhancer;