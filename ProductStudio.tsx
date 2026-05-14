import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateStyledImage, generateModelImage, generateSelfieImage, ModelPose, AspectRatio, generateBackgroundSuggestion, ProductDisplayMode, SelfieFraming, ModelLevel, SelfieTone } from './services/geminiService';
import { UploadIcon, SparklesIcon, LoadingSpinner, ErrorIcon, HangerIcon, UserIcon, ArrowLeftIcon, DownloadIcon, XIcon, RefreshIcon, WandIcon, ClipboardIcon, ClipboardCheckIcon, CameraIcon, ZoomInIcon, PhotoIcon } from './components/Icons';

type ClothingType = 'Áo' | 'Quần' | 'Cả bộ' | 'Váy' | 'Phụ kiện';
type FeatureMode = 'product' | 'model' | 'selfie';
type Gender = 'Nam' | 'Nữ';
type ItemStatus = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

interface SessionItem {
    id: string;
    file: File | Blob;
    inputPreviewUrl: string; 
    outputUrl?: string;      
    videoPrompt?: string;    
    status: ItemStatus;
    error?: string;
}

interface ProductStudioProps {
  onGoBack: () => void;
  onEnhanceImage: (imageUrl: string) => void;
  modelLevel: ModelLevel;
}

const SELFIE_BACKGROUNDS = [
    "Phòng ngủ tối giản, gương đứng (Minimalist Bedroom)",
    "Phòng ngủ phong cách Bohemian, ấm cúng (Boho Bedroom)",
    "Phòng ngủ hiện đại, cửa sổ lớn (Modern Suite)",
    "Phòng ngủ phong cách Vintage (Retro Bedroom)",
    "Phòng thay đồ sang trọng (Luxury Walk-in Closet)",
    "Kệ treo quần áo gỗ tối giản (Wooden Closet Corner)",
    "Phòng thử đồ cao cấp, ánh sáng rực rỡ (Boutique Fitting Room)",
    "Gương phòng tắm hiện đại, gạch trắng (Aesthetic Bathroom)",
    "Gương trang điểm có đèn chuyên nghiệp (Vanity Mirror Studio)",
    "Góc quán cafe nội thất gỗ (Cafe Interior)",
    "Quán cafe phong cách Industrial (Industrial Cafe)",
    "Góc quán cafe ngập nắng (Sunlit Cafe Corner)",
    "Thư viện gia đình, kệ sách cao (Home Library)",
    "Phòng khách Scandi, sofa xám (Scandi Living Room)",
    "Phòng khách phong cách Indochine (Indochine Style)",
    "Sảnh khách sạn 5 sao sang trọng (Luxury Hotel Lobby)",
    "Thang máy khách sạn bằng kính (Hotel Elevator)",
    "Hành lang căn hộ Penthouse (Penthouse Hallway)",
    "Ban công căn hộ chung cư cao cấp (Luxury Balcony)",
    "Phòng tập Gym tại nhà chuyên nghiệp (Home Gym)",
    "Phòng tập Yoga, sàn gỗ (Yoga/Dance Studio)",
    "Studio phông xám chuyên nghiệp (Studio Grey)",
    "Studio nghệ thuật, tranh treo tường (Art Gallery Studio)",
    "Phòng đọc sách cổ điển, ghế bành da (Classic Study)",
    "Cửa hàng hoa rực rỡ trong nhà (Florist Shop Interior)",
    "Phòng làm việc sáng tạo (Creative Home Office)",
    "Cửa sổ máy bay hạng thương gia (Private Jet Interior)",
    "Bếp phong cách Bắc Âu (Nordic Kitchen)",
    "Góc gương trang trí với cây xanh (Green Mirror Corner)",
    "Tường bê tông thô phong cách Loft (Concrete Loft Wall)",
    "Sảnh sân bay hạng VIP (VIP Lounge)",
    "Phòng nghe nhạc với đĩa than (Music/Vinyl Room)",
    "Cổng chào tết trong nhà, rực rỡ hoa (Tet Indoor Decor)",
    "Không gian phòng khách trang trí Noel (Xmas Living Room)",
    "Bàn tiệc tối sang trọng trong nhà (Fine Dining Interior)",
    "Phòng triển lãm nghệ thuật hiện đại (Art Exhibition Room)"
];

const ProductStudio: React.FC<ProductStudioProps> = ({ onGoBack, onEnhanceImage, modelLevel }) => {
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [featureMode, setFeatureMode] = useState<FeatureMode>('product');
  const [clothingType, setClothingType] = useState<ClothingType>('Áo');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [productDisplayMode, setProductDisplayMode] = useState<ProductDisplayMode>('hanger');
  const [gender, setGender] = useState<Gender>('Nữ');
  const [age, setAge] = useState<string>('18-25');
  const [background, setBackground] = useState<string>('');
  const [numberOfImages, setNumberOfImages] = useState<number>(1); 
  const [modelPose, setModelPose] = useState<ModelPose>('Dáng đứng');
  const [isGeneratingBackground, setIsGeneratingBackground] = useState<boolean>(false);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<string | null>(null);
  const [selfieFraming, setSelfieFraming] = useState<SelfieFraming>('Nửa thân');
  const [selfieBackground, setSelfieBackground] = useState<string>(SELFIE_BACKGROUNDS[0]);
  const [selfieTone, setSelfieTone] = useState<SelfieTone>('Trắng sáng');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File | Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
          };
          reader.onerror = error => reject(error);
      });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
        const newItems: SessionItem[] = Array.from(files)
            .filter((file: File) => file.type.startsWith('image/'))
            .map((file: File) => ({
                id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                file,
                inputPreviewUrl: URL.createObjectURL(file),
                status: 'IDLE'
            }));
        setSessionItems(prev => [...prev, ...newItems]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSessionItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
      setSessionItems([]);
      setBackground('');
  };

  const handleGenerateBackground = async () => {
    const firstItem = sessionItems[0];
    if (!firstItem || !clothingType) return;
    setIsGeneratingBackground(true);
    try {
        const base64String = await fileToBase64(firstItem.file);
        const suggestion = await generateBackgroundSuggestion(base64String, 'image/jpeg', clothingType, modelLevel);
        setBackground(suggestion.trim().replace(/^"|"$/g, '')); 
    } catch (err: any) {
        console.error("BG Gen Error", err);
    } finally {
        setIsGeneratingBackground(false);
    }
  };

  const processItem = async (item: SessionItem): Promise<SessionItem> => {
      try {
          const base64String = await fileToBase64(item.file);
          if (featureMode === 'product') {
              const urls = await generateStyledImage(
                  base64String, 'image/jpeg', clothingType, aspectRatio, productDisplayMode, 1, modelLevel
              );
              return { ...item, outputUrl: `data:image/jpeg;base64,${urls[0]}`, status: 'SUCCESS', error: undefined };
          } else if (featureMode === 'model') {
              const results = await generateModelImage(base64String, 'image/jpeg', {
                  clothingType, gender, age, background, numberOfImages: 1, pose: modelPose, aspectRatio
              }, modelLevel);
              return { ...item, outputUrl: results[0].imageUrl, videoPrompt: results[0].videoPrompt, status: 'SUCCESS', error: undefined };
          } else { 
              const urls = await generateSelfieImage(base64String, 'image/jpeg', clothingType, 1, gender, selfieFraming, selfieBackground, modelLevel, selfieTone);
              return { ...item, outputUrl: `data:image/jpeg;base64,${urls[0]}`, status: 'SUCCESS', error: undefined };
          }
      } catch (e: any) {
          return { ...item, status: 'ERROR', error: e.message || 'Error generating image' };
      }
  };

  const handleGenerateAll = async () => {
    if (sessionItems.length === 0) return;
    if (featureMode === 'model' && !background.trim()) {
        alert("Vui lòng nhập mô tả bối cảnh");
        return;
    }
    setIsGlobalProcessing(true);

    if (sessionItems.length === 1 && numberOfImages > 1) {
        const seedItem = sessionItems[0];
        const newItems: SessionItem[] = [];
        newItems.push({...seedItem, status: 'PROCESSING'});
        for(let i = 1; i < numberOfImages; i++) {
             newItems.push({
                 ...seedItem,
                 id: seedItem.id + `_variant_${i}`,
                 status: 'PROCESSING'
             });
        }
        setSessionItems(newItems);
        const results = await Promise.all(newItems.map(item => processItem(item)));
        setSessionItems(results);
    } else {
        setSessionItems(prev => prev.map(item => ({ ...item, status: 'PROCESSING', error: undefined })));
        const itemsToProcess = sessionItems.map(item => ({...item, status: 'PROCESSING' as ItemStatus}));
        
        const promises = itemsToProcess.map(async (item) => {
             const result = await processItem(item);
             setSessionItems(prev => prev.map(i => i.id === result.id ? result : i));
        });
        await Promise.all(promises);
    }
    setIsGlobalProcessing(false);
  };

  const handleRegenerateItem = async (id: string) => {
      const itemToRegen = sessionItems.find(i => i.id === id);
      if (!itemToRegen) return;
      setSessionItems(prev => prev.map(i => i.id === id ? { ...i, status: 'PROCESSING', error: undefined } : i));
      const result = await processItem(itemToRegen);
      setSessionItems(prev => prev.map(i => i.id === id ? result : i));
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleCopyToClipboard = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedPromptIndex(id);
    setTimeout(() => setCopiedPromptIndex(null), 2000);
  };

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
            <h1 className="text-lg font-bold text-white tracking-tight">Studio Sản phẩm AI</h1>
        </div>
        <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono px-2 py-1 rounded border ${modelLevel === 'pro' ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                {modelLevel === 'pro' ? 'GEMINI 3 PRO' : 'GEMINI 2.5 FLASH'}
            </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-full md:w-[400px] lg:w-[450px] flex-none border-r border-slate-700 bg-slate-800/50 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-8">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">1. Ảnh gốc ({sessionItems.length})</h2>
                        {sessionItems.length > 0 && (
                            <button onClick={handleClearAll} className="text-xs text-red-400 hover:text-red-300 underline">Xóa hết</button>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
                    {sessionItems.length === 0 ? (
                        <div 
                            onClick={triggerFileInput}
                            className="relative aspect-[3/2] w-full rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/50 hover:border-indigo-400 hover:bg-slate-700 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer"
                        >
                            <UploadIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                            <p className="text-slate-300 font-medium">Tải ảnh (Chọn nhiều)</p>
                            <p className="text-xs text-slate-500 mt-1">Quần, Áo, Váy, Bộ đồ...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {sessionItems.map((item) => (
                                <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-600 group">
                                    <img src={item.inputPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button onClick={(e) => handleRemoveItem(item.id, e)} className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <button onClick={triggerFileInput} className="aspect-square rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:border-indigo-400 hover:text-indigo-400 hover:bg-slate-800 transition-all">
                                <UploadIcon className="w-6 h-6" />
                                <span className="text-[10px] mt-1 font-medium">Thêm</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className={`space-y-3 transition-opacity duration-300 ${sessionItems.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">2. Chế độ tạo</h2>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-xl">
                        {[
                            { id: 'product', icon: HangerIcon, label: 'Sản phẩm' },
                            { id: 'model', icon: UserIcon, label: 'Mẫu ảo' },
                            { id: 'selfie', icon: CameraIcon, label: 'Selfie' }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setFeatureMode(mode.id as FeatureMode)}
                                className={`flex flex-col items-center justify-center py-3 rounded-lg text-xs font-semibold transition-all duration-200
                                    ${featureMode === mode.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                                `}
                            >
                                <mode.icon className="w-5 h-5 mb-1" />
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`space-y-6 transition-opacity duration-300 ${sessionItems.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400">Loại trang phục</label>
                        <div className="flex flex-wrap gap-2">
                            {(['Áo', 'Quần', 'Cả bộ', 'Váy', 'Phụ kiện'] as ClothingType[]).map((type) => (
                                <button key={type} onClick={() => setClothingType(type)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${clothingType === type ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {featureMode !== 'selfie' && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Tỉ lệ khung hình đầu ra</label>
                            <div className="flex bg-slate-900 rounded-lg p-1">
                                {(['9:16', '1:1', '4:5', '16:9'] as AspectRatio[]).map((ratio) => (
                                    <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${aspectRatio === ratio ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {featureMode === 'product' && (
                        <div className="space-y-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                             <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Phong cách chụp</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setProductDisplayMode('hanger')} className={`py-2 px-3 rounded-lg border text-xs font-medium ${productDisplayMode === 'hanger' ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Treo móc</button>
                                    <button onClick={() => setProductDisplayMode('flatlay')} className={`py-2 px-3 rounded-lg border text-xs font-medium ${productDisplayMode === 'flatlay' ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Flatlay thảm pastel</button>
                                </div>
                            </div>
                            {productDisplayMode === 'flatlay' && (
                                <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 animate-fade-in">
                                    <p className="text-[10px] text-indigo-300 leading-tight">AI sẽ tự động tạo thảm lông pastel mềm mại trên nền đá hoa sang trọng, kết hợp đạo cụ ngẫu nhiên (lọ hoa/sách/túi).</p>
                                </div>
                            )}
                        </div>
                    )}

                    {featureMode === 'model' && (
                        <div className="space-y-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-400 block mb-1.5">Giới tính</label>
                                    <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                                        <option value="Nữ">Nữ</option>
                                        <option value="Nam">Nam</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-400 block mb-1.5">Độ tuổi</label>
                                    <select value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                                        <option value="18-25">18-25</option>
                                        <option value="26-35">26-35</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1.5">Dáng Pose</label>
                                <select value={modelPose} onChange={(e) => setModelPose(e.target.value as ModelPose)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                                    <option value="Dáng đứng">Dáng đứng</option>
                                    <option value="Dáng đi">Dáng đi</option>
                                    <option value="Giới thiệu (Cầm móc)">Cầm móc áo</option>
                                    <option value="Giới thiệu (Chỉ mặc)">Chỉ mặc & Tạo dáng</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 block">Bối cảnh</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={background} 
                                        onChange={(e) => setBackground(e.target.value)} 
                                        placeholder="VD: Đường phố Sài Gòn, Studio..."
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <button onClick={handleGenerateBackground} disabled={isGeneratingBackground || !clothingType || sessionItems.length === 0} className="absolute right-1 top-1 p-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
                                        {isGeneratingBackground ? <LoadingSpinner className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {featureMode === 'selfie' && (
                        <div className="space-y-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                             <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 block mb-1.5">Giới tính</label>
                                <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                                    <option value="Nữ">Nữ</option>
                                    <option value="Nam">Nam</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Tone màu ảnh</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {(['Trắng sáng', 'Tự nhiên', 'Ấm áp', 'Lạnh', 'Vintage', 'Rực rỡ'] as SelfieTone[]).map((tone) => (
                                        <button 
                                            key={tone} 
                                            onClick={() => setSelfieTone(tone)} 
                                            className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold transition-all ${selfieTone === tone ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                        >
                                            {tone}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Góc chụp</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setSelfieFraming('Nửa thân')} className={`py-2 px-3 rounded-lg border text-xs font-medium ${selfieFraming === 'Nửa thân' ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Nửa thân</button>
                                    <button onClick={() => setSelfieFraming('Toàn thân')} className={`py-2 px-3 rounded-lg border text-xs font-medium ${selfieFraming === 'Toàn thân' ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Toàn thân</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 block">Góc chụp & Không gian trong nhà</label>
                                <div className="relative">
                                     <input type="text" value={selfieBackground} onChange={(e) => setSelfieBackground(e.target.value)} placeholder="Chọn bối cảnh gương soi..." className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none mb-2" />
                                    <div className="h-40 overflow-y-auto custom-scrollbar border border-slate-700 rounded-lg bg-slate-900 p-2 space-y-1">
                                        {SELFIE_BACKGROUNDS.map((bg, idx) => (
                                            <button key={idx} onClick={() => setSelfieBackground(bg)} className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-800 truncate transition-colors ${selfieBackground === bg ? 'text-indigo-400 bg-slate-800 font-bold' : 'text-slate-400'}`}>
                                                {bg}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                     {sessionItems.length === 1 && (
                         <div className="space-y-2">
                            <div className="flex justify-between">
                                 <label className="text-xs font-medium text-slate-400">Số lượng biến thể</label>
                                 <span className="text-xs font-bold text-indigo-400">{numberOfImages}</span>
                            </div>
                            <input type="range" min="1" max="4" value={numberOfImages} onChange={(e) => setNumberOfImages(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                        </div>
                     )}

                    <button onClick={handleGenerateAll} disabled={isGlobalProcessing || sessionItems.length === 0} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2">
                         {isGlobalProcessing ? (
                             <> <LoadingSpinner className="w-5 h-5" /> <span>Đang xử lý {sessionItems.length} ảnh...</span> </>
                         ) : (
                             <> <SparklesIcon className="w-5 h-5" /> <span>Bắt đầu tạo ảnh</span> </>
                         )}
                    </button>
                </div>
            </div>
        </div>

        <div className="flex-1 bg-slate-900 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
            {sessionItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 opacity-60">
                    <div className="p-6 rounded-full bg-slate-800 border border-slate-700">
                        <PhotoIcon className="w-12 h-12" />
                    </div>
                    <p className="text-lg font-medium text-center">Tải ảnh trang phục để bắt đầu</p>
                </div>
            ) : (
                <div className="w-full max-w-6xl space-y-8 animate-fade-in">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        {sessionItems.map((item) => (
                            <div key={item.id} className="bg-slate-800 rounded-2xl p-3 border border-slate-700 group relative flex flex-col h-full shadow-2xl">
                                <div className="relative rounded-xl overflow-hidden aspect-[9/16] bg-slate-900 mb-3">
                                    <div className="absolute top-2 left-2 z-20 w-12 h-16 rounded border border-white/20 overflow-hidden shadow-lg bg-black/40">
                                        <img src={item.inputPreviewUrl} alt="Input" className="w-full h-full object-cover" />
                                    </div>
                                    <button onClick={() => handleRegenerateItem(item.id)} disabled={item.status === 'PROCESSING'} className="absolute top-2 right-2 z-20 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-indigo-600 disabled:opacity-50">
                                        {item.status === 'PROCESSING' ? <LoadingSpinner className="w-4 h-4" /> : <RefreshIcon className="w-4 h-4" />}
                                    </button>
                                    {item.status === 'PROCESSING' && !item.outputUrl && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-sm z-10">
                                            <LoadingSpinner className="w-10 h-10 text-indigo-500 mb-2" />
                                            <span className="text-xs text-indigo-300">AI đang vẽ...</span>
                                        </div>
                                    )}
                                    {item.status === 'ERROR' ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-red-400 p-4 text-center">
                                            <ErrorIcon className="w-10 h-10 mb-2" />
                                            <p className="text-xs">{item.error || 'Lỗi tạo ảnh'}</p>
                                        </div>
                                    ) : item.outputUrl ? (
                                        <>
                                            <img src={item.outputUrl} alt="Generated" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 z-10">
                                                <div className="flex space-x-2 justify-end">
                                                    <button onClick={() => setZoomImage(item.outputUrl!)} className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20"><ZoomInIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => onEnhanceImage(item.outputUrl!)} className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20"><WandIcon className="w-5 h-5" /></button>
                                                    <a href={item.outputUrl} download={`${item.id}.jpg`} className="p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700"><DownloadIcon className="w-5 h-5" /></a>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                                            <SparklesIcon className="w-10 h-10 mb-2 opacity-20" />
                                            <span className="text-xs">Chờ lệnh tạo</span>
                                        </div>
                                    )}
                                </div>
                                {item.videoPrompt && (
                                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 mt-auto">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Video Prompt</span>
                                            <button onClick={() => handleCopyToClipboard(item.videoPrompt!, item.id)}>
                                                {copiedPromptIndex === item.id ? <ClipboardCheckIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3 text-slate-500" />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 line-clamp-2">{item.videoPrompt}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductStudio;