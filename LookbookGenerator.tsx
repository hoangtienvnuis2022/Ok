import React, { useState, useCallback, useRef } from 'react';
import { generateLookbookImages, LookbookOptions, ModelPose, AspectRatio, LookbookResult, Ethnicity, ModelLevel } from './services/geminiService';
import { UploadIcon, SparklesIcon, LoadingSpinner, ErrorIcon, ArrowLeftIcon, DownloadIcon, XIcon, PhotoIcon, ClipboardIcon, ClipboardCheckIcon, FilmIcon, UserIcon, ZoomInIcon } from './components/Icons';

type AppState = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
type ClothingType = 'Áo' | 'Quần' | 'Cả bộ' | 'Váy';
type Gender = 'Nam' | 'Nữ';

interface LookbookGeneratorProps {
  onGoBack: () => void;
  modelLevel: ModelLevel;
}

const LookbookGenerator: React.FC<LookbookGeneratorProps> = ({ onGoBack, modelLevel }) => {
  const [originalImageFile, setOriginalImageFile] = useState<File | Blob | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedLookbookItems, setGeneratedLookbookItems] = useState<(LookbookResult & { id: string })[]>([]);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  
  // Settings
  const [clothingType, setClothingType] = useState<ClothingType>('Áo');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [gender, setGender] = useState<Gender>('Nữ');
  const [ethnicity, setEthnicity] = useState<Ethnicity>('Việt Nam');
  const [age, setAge] = useState<string>('18-25');
  const [theme, setTheme] = useState<string>('');
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');
  const [numberOfImages, setNumberOfImages] = useState<number>(4);
  const [modelPose, setModelPose] = useState<ModelPose>('Dáng đi');
  const [generateVideo, setGenerateVideo] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setOriginalImageFile(file);
        setOriginalImageUrl(URL.createObjectURL(file));
        setGeneratedLookbookItems([]);
        setError(null);
        setAppState('IDLE');
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOriginalImageFile(null);
    setOriginalImageUrl(null);
    setGeneratedLookbookItems([]);
    setError(null);
    setAppState('IDLE');
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleGenerateClick = useCallback(async () => {
    if (!originalImageFile) {
        setError('Vui lòng tải ảnh trang phục.');
        setAppState('ERROR');
        return;
    }
    
    setAppState('PROCESSING');
    setError(null);
    setGeneratedLookbookItems([]);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(originalImageFile);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        if (!base64String) throw new Error('Cannot process image');

        const options: LookbookOptions = {
            clothingType,
            gender,
            age,
            theme: theme.trim() || "Professional commercial fashion photoshoot",
            additionalPrompt,
            numberOfImages,
            pose: modelPose,
            aspectRatio,
            generateVideo,
            ethnicity
        };
        const generatedItems = await generateLookbookImages(base64String, 'image/jpeg', options, modelLevel);
        
        setGeneratedLookbookItems(generatedItems.map(item => ({
            ...item,
            id: `lookbook_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        })));
        setAppState('SUCCESS');
      };
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã xảy ra lỗi.');
      setAppState('ERROR');
    }
  }, [originalImageFile, clothingType, gender, ethnicity, age, theme, additionalPrompt, numberOfImages, modelPose, aspectRatio, generateVideo, modelLevel]);
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCopyToClipboard = (textToCopy: string, index: number) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2000);
  };
  
  const isGenerateButtonDisabled = () => {
    return appState === 'PROCESSING' || !originalImageFile;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-200">
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
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-pink-400" />
                AI Fashion Shoot
            </h1>
        </div>
        <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono px-2 py-1 rounded border ${modelLevel === 'pro' ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                {modelLevel === 'pro' ? 'GEMINI 3 PRO' : 'GEMINI 2.5 FLASH'}
            </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-full md:w-[400px] lg:w-[450px] flex-none border-r border-slate-700 bg-slate-800/50 overflow-y-auto custom-scrollbar">
             <div className="p-6 space-y-8">
                {/* Image Upload */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">1. Tải lên trang phục</h2>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <div 
                        onClick={!originalImageUrl ? triggerFileInput : undefined}
                        className={`relative aspect-[3/4] w-full rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden cursor-pointer
                            ${originalImageUrl ? 'border-pink-500 bg-slate-800' : 'border-slate-600 bg-slate-800/50 hover:border-pink-400 hover:bg-slate-700'}
                        `}
                    >
                        {originalImageUrl ? (
                            <>
                                <img src={originalImageUrl} alt="Upload" className="w-full h-full object-contain" />
                                <button onClick={handleRemoveImage} className="absolute top-2 right-2 bg-slate-900/80 text-white p-2 rounded-full hover:bg-red-500 transition-colors">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <UploadIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                                <p className="text-slate-300 font-medium">Tải ảnh trang phục</p>
                                <p className="text-[10px] text-slate-500 mt-1">PNG, JPG hoặc WEBP</p>
                            </div>
                        )}
                    </div>
                     <div className="flex flex-wrap gap-2 mt-2">
                        {(['Áo', 'Quần', 'Cả bộ', 'Váy'] as ClothingType[]).map((type) => (
                            <button key={type} onClick={() => setClothingType(type)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${clothingType === type ? 'bg-pink-500/20 border-pink-500 text-pink-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Settings */}
                <div className={`space-y-6 transition-opacity duration-300 ${!originalImageFile ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">2. Cấu hình Photoshoot</h2>
                    
                    <div className="space-y-4 p-5 bg-slate-900/50 rounded-xl border border-slate-700">
                        {/* Pose Selection */}
                        <div>
                            <label className="text-xs font-bold text-pink-400 block mb-2 uppercase">Dáng người mẫu</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setModelPose('Dáng đứng')}
                                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${modelPose === 'Dáng đứng' ? 'bg-pink-600 border-pink-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                >
                                    Dáng đứng (Pose)
                                </button>
                                <button 
                                    onClick={() => setModelPose('Dáng đi')}
                                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${modelPose === 'Dáng đi' ? 'bg-pink-600 border-pink-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                >
                                    Dáng đi (Walk)
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 italic">Người mẫu sẽ luôn hướng về phía camera trực diện.</p>
                        </div>

                        {/* Theme Input */}
                        <div>
                             <label className="text-xs font-bold text-pink-400 block mb-2 uppercase">Bối cảnh / Chủ đề</label>
                             <textarea 
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                placeholder="VD: Đường phố Seoul hiện đại, Studio tối giản sang trọng, Bãi biển nhiệt đới..."
                                rows={3}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-pink-500 outline-none placeholder-slate-600"
                            />
                        </div>
                        
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1.5">Giới tính</label>
                                <div className="flex bg-slate-800 border border-slate-600 rounded-lg p-1">
                                    {(['Nữ', 'Nam'] as Gender[]).map(g => (
                                         <button
                                            key={g}
                                            onClick={() => setGender(g)}
                                            className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${gender === g ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                         >
                                            {g}
                                         </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1.5">Quốc tịch</label>
                                <select value={ethnicity} onChange={(e) => setEthnicity(e.target.value as Ethnicity)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-pink-500 outline-none">
                                    <option value="Việt Nam">Việt Nam</option>
                                    <option value="Hàn Quốc">Hàn Quốc</option>
                                </select>
                            </div>
                         </div>
                         
                         <div>
                            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-pink-500/50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={generateVideo} 
                                    onChange={(e) => setGenerateVideo(e.target.checked)}
                                    className="h-5 w-5 rounded border-slate-500 text-pink-600 focus:ring-pink-500 bg-slate-900"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white flex items-center">
                                        <FilmIcon className="w-4 h-4 mr-2 text-pink-500" />
                                        Kèm Video Prompt (Veo 3.1)
                                    </span>
                                    <span className="text-[10px] text-slate-500">Tạo prompt video tương thích hoàn toàn</span>
                                </div>
                            </label>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-700/50">
                            <div className="flex justify-between">
                                <label className="text-xs font-medium text-slate-400">Số lượng hình ảnh</label>
                                <span className="text-xs font-bold text-pink-400">{numberOfImages}</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" max="10" 
                                value={numberOfImages} 
                                onChange={(e) => setNumberOfImages(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateClick}
                        disabled={isGenerateButtonDisabled()}
                        className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                    >
                         {appState === 'PROCESSING' ? (
                             <>
                                <LoadingSpinner className="w-5 h-5" />
                                <span>AI đang thực hiện buổi chụp...</span>
                             </>
                         ) : (
                             <>
                                <PhotoIcon className="w-5 h-5" />
                                <span>Bắt đầu Photoshoot</span>
                             </>
                         )}
                    </button>
                </div>
             </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-slate-900 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
            {appState === 'SUCCESS' && generatedLookbookItems.length > 0 ? (
                <div className="w-full max-w-6xl space-y-6 animate-fade-in">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Kết quả Photoshoot</h2>
                            <p className="text-slate-400 text-sm">Đã tạo {generatedLookbookItems.length} ảnh hướng trực diện camera.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
                        {generatedLookbookItems.map((item, index) => (
                            <div key={index} className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 group flex flex-col">
                                <div className="relative aspect-[9/16] group cursor-pointer" onClick={() => setZoomImage(item.imageUrl)}>
                                    <img src={item.imageUrl} alt="Result" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <ZoomInIcon className="w-12 h-12 text-white drop-shadow-md" />
                                    </div>
                                    <a href={item.imageUrl} download={`photoshoot-${item.id}.jpg`} className="absolute top-3 right-3 bg-black/60 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-pink-600" onClick={(e) => e.stopPropagation()}>
                                        <DownloadIcon className="w-5 h-5"/>
                                    </a>
                                </div>
                                {item.videoPrompt && (
                                    <div className="p-4 bg-slate-900/80 border-t border-slate-700 flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-pink-500 flex items-center gap-1 uppercase tracking-widest">
                                                <FilmIcon className="w-3 h-3" />
                                                Veo 3.1 Prompt
                                            </span>
                                            <button onClick={() => handleCopyToClipboard(item.videoPrompt!, index)} className="p-1 hover:bg-slate-700 rounded transition-colors">
                                                {copiedPromptIndex === index ? <ClipboardCheckIcon className="w-4 h-4 text-green-500"/> : <ClipboardIcon className="w-4 h-4 text-slate-500 hover:text-white"/>}
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-4 italic">"{item.videoPrompt}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4 opacity-50">
                    {appState === 'PROCESSING' ? (
                         <div className="flex flex-col items-center gap-4">
                             <LoadingSpinner className="w-16 h-16 text-pink-500" />
                             <p className="text-lg animate-pulse">AI đang thiết kế buổi photoshoot...</p>
                         </div>
                    ) : (
                        <>
                             <PhotoIcon className="w-20 h-20" />
                             <p className="text-xl font-medium">Kết quả photoshoot sẽ xuất hiện tại đây</p>
                             <p className="text-sm max-w-xs text-center">Tải ảnh trang phục để bắt đầu buổi chụp chuyên nghiệp.</p>
                        </>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LookbookGenerator;