import React, { useState, useCallback, useRef } from 'react';
import { generateVideoPrompt, generateVoiceoverScript, VideoPromptOptions, VoiceoverStyle, ModelLevel } from './services/geminiService';
import { UploadIcon, SparklesIcon, LoadingSpinner, ErrorIcon, ArrowLeftIcon, FilmIcon, XIcon } from './components/Icons';

type AppState = 'IDLE' | 'PROCESSING_VOICEOVER' | 'PROCESSING_PROMPT' | 'SUCCESS' | 'ERROR';

interface VideoPromptGeneratorProps {
  onGoBack: () => void;
  modelLevel: ModelLevel;
}

const VideoPromptGenerator: React.FC<VideoPromptGeneratorProps> = ({ onGoBack, modelLevel }) => {
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [voiceoverScript, setVoiceoverScript] = useState<string>('');
  const [voiceoverStyle, setVoiceoverStyle] = useState<VoiceoverStyle>('Năng động');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<VideoPromptOptions>({
    productInfo: '',
    targetAudience: '',
    videoStyle: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn một tệp hình ảnh.');
        setAppState('ERROR');
        return;
      }
      // Reset only results, not settings
      setGeneratedPrompt('');
      setError(null);
      setAppState('IDLE');

      setOriginalImageFile(file);
      setOriginalImageUrl(URL.createObjectURL(file));
    }
  };
  
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only reset image and results, keep all other settings
    setOriginalImageFile(null);
    setOriginalImageUrl(null);
    setGeneratedPrompt('');
    setError(null);
    setAppState('IDLE');
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOptions(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGenerateVoiceover = async () => {
    if (!options.productInfo.trim()) {
        setError("Vui lòng nhập thông tin sản phẩm để tạo giọng đọc.");
        setAppState('ERROR');
        return;
    };
    
    setAppState('PROCESSING_VOICEOVER');
    setError(null);

    try {
        const script = await generateVoiceoverScript(options, voiceoverStyle, modelLevel);
        setVoiceoverScript(script);
        setAppState('IDLE'); // Return to idle to allow prompt generation
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Không thể tạo giọng đọc.');
        setAppState('ERROR');
    }
  };

  const handleGeneratePrompt = useCallback(async () => {
    if (!originalImageFile || !options.productInfo.trim() || !voiceoverScript.trim()) return;

    setAppState('PROCESSING_PROMPT');
    setError(null);
    setGeneratedPrompt('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(originalImageFile);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        if (!base64String) {
          throw new Error('Không thể chuyển đổi hình ảnh.');
        }

        const promptText = await generateVideoPrompt(base64String, originalImageFile.type, options, voiceoverScript, modelLevel);
        
        setGeneratedPrompt(promptText);
        setAppState('SUCCESS');
      };
      reader.onerror = () => {
         throw new Error('Lỗi khi đọc tệp hình ảnh.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
      setAppState('ERROR');
    }
  }, [originalImageFile, options, voiceoverScript, modelLevel]);
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetState = () => {
    setOriginalImageFile(null);
    setOriginalImageUrl(null);
    setGeneratedPrompt('');
    setVoiceoverScript('');
    setError(null);
    setOptions({ productInfo: '', targetAudience: '', videoStyle: '' });
    setAppState('IDLE');
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleCopyToClipboard = () => {
    if (resultTextareaRef.current) {
      resultTextareaRef.current.select();
      navigator.clipboard.writeText(resultTextareaRef.current.value);
    }
  };
  
  const isGeneratePromptDisabled = () => {
    return appState === 'PROCESSING_PROMPT' || appState === 'PROCESSING_VOICEOVER' || !originalImageFile || !options.productInfo.trim() || !voiceoverScript.trim();
  }

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8 md:mb-12 relative">
            <button onClick={onGoBack} className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors group">
                <ArrowLeftIcon className="w-6 h-6 mr-2 transform group-hover:-translate-x-1 transition-transform"/>
                <span className="font-semibold">Trang chủ</span>
            </button>
            <div className="flex items-center space-x-2 absolute right-0 top-0">
                <span className={`text-xs font-mono px-2 py-1 rounded border ${modelLevel === 'pro' ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-indigo-100 border-indigo-200 text-indigo-700'}`}>
                    {modelLevel === 'pro' ? 'GEMINI 3 PRO' : 'GEMINI 2.5 FLASH'}
                </span>
            </div>
            <div className="w-full text-center pointer-events-none">
                 <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                    Tạo Prompt Video AI
                </h1>
                 <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                    Tạo kịch bản video quảng cáo chuyên nghiệp (tiếng Anh) cho Veo/Sora.
                </p>
            </div>
        </header>

        <main className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Input Section */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <h2 className="text-2xl font-semibold text-gray-700">1. Cung cấp thông tin</h2>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={!originalImageUrl ? triggerFileInput : undefined}
                className="relative w-full max-w-md mx-auto aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col justify-center items-center text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors duration-300"
              >
                {originalImageUrl ? (
                   <>
                    <img src={originalImageUrl} alt="Original Upload" className="max-h-full max-w-full object-contain rounded-md p-2" />
                     <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-gray-900/50 text-white rounded-full p-1.5 hover:bg-gray-900/75 transition-colors z-10"
                        aria-label="Xóa ảnh"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-12 h-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">Tải ảnh sản phẩm</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP</p>
                  </>
                )}
              </div>

            <div className={`w-full max-w-md mx-auto space-y-4 transition-opacity duration-300 ${!originalImageFile ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                    <label htmlFor="productInfo" className="block text-sm font-medium text-gray-700 mb-1">Thông tin sản phẩm <span className="text-red-500">*</span></label>
                    <textarea
                        id="productInfo" name="productInfo" rows={3} value={options.productInfo} onChange={handleOptionChange}
                        placeholder="VD: Áo thun cotton thoáng mát, phong cách năng động..."
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                 <div>
                    <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">Đối tượng khách hàng</label>
                    <input
                        type="text" id="targetAudience" name="targetAudience" value={options.targetAudience} onChange={handleOptionChange}
                        placeholder="VD: Giới trẻ, nhân viên văn phòng"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                 <div>
                    <label htmlFor="videoStyle" className="block text-sm font-medium text-gray-700 mb-1">Phong cách video</label>
                    <input
                        type="text" id="videoStyle" name="videoStyle" value={options.videoStyle} onChange={handleOptionChange}
                        placeholder="VD: Năng động, sang trọng, tối giản"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div className="p-4 bg-gray-100 rounded-lg space-y-3">
                    <h3 className="font-semibold text-gray-800">Tùy chọn giọng đọc</h3>
                    <div>
                         <label htmlFor="voiceoverStyle" className="block text-sm font-medium text-gray-700 mb-1">Phong cách</label>
                        <select
                            id="voiceoverStyle" name="voiceoverStyle" value={voiceoverStyle}
                            onChange={(e) => setVoiceoverStyle(e.target.value as VoiceoverStyle)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option>Năng động</option>
                            <option>Trang trọng</option>
                            <option>Thân thiện</option>
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateVoiceover}
                        disabled={appState === 'PROCESSING_VOICEOVER' || !options.productInfo.trim()}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-300 transition-colors"
                    >
                       {appState === 'PROCESSING_VOICEOVER' ? (
                           <> <LoadingSpinner className="w-4 h-4 mr-2" /> Đang tạo... </>
                       ) : "Tạo giọng đọc (Tiếng Việt)"}
                    </button>
                    <textarea
                        id="voiceoverScript" name="voiceoverScript" rows={4} value={voiceoverScript}
                        onChange={(e) => setVoiceoverScript(e.target.value)}
                        placeholder="Tạo và chỉnh sửa kịch bản lồng tiếng ở đây..."
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 mt-2"
                    />
                </div>
            </div>

              <div className="w-full flex justify-center space-x-4 pt-4">
                  <button
                    onClick={handleGeneratePrompt}
                    disabled={isGeneratePromptDisabled()}
                    className="flex items-center justify-center w-full max-w-xs px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
                  >
                    {appState === 'PROCESSING_PROMPT' ? (
                      <>
                        <LoadingSpinner className="w-5 h-5 mr-3" />
                        Đang viết...
                      </>
                    ) : (
                      <>
                        <FilmIcon className="w-5 h-5 mr-3" />
                        Tạo kịch bản (Tiếng Anh)
                      </>
                    )}
                  </button>
                   {originalImageFile && (
                    <button
                        onClick={resetState}
                        className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                    >
                        Làm lại
                    </button>
                  )}
              </div>
            </div>
            
            {/* Output Section */}
            <div className="flex flex-col items-center justify-center space-y-6">
                 <h2 className="text-2xl font-semibold text-gray-700">2. Kịch bản Video (Tiếng Anh)</h2>
                <div className="w-full max-w-md mx-auto aspect-video bg-gray-100 rounded-lg flex justify-center items-center overflow-hidden shadow-inner p-4">
                    {appState === 'PROCESSING_PROMPT' && (
                        <div className="text-center text-gray-500">
                           <LoadingSpinner className="w-12 h-12 mx-auto" />
                           <p className="mt-4 animate-pulse">AI đang làm đạo diễn...</p>
                        </div>
                    )}
                    {(appState === 'ERROR' && error) && (
                        <div className="text-center text-red-500 p-4">
                            <ErrorIcon className="w-12 h-12 mx-auto"/>
                            <p className="mt-4 font-semibold">Lỗi!</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {appState === 'SUCCESS' && generatedPrompt && (
                        <textarea
                            ref={resultTextareaRef}
                            readOnly
                            value={generatedPrompt}
                            className="w-full h-full bg-transparent border-none text-gray-800 resize-none focus:ring-0"
                        />
                    )}
                    {(appState !== 'PROCESSING_PROMPT' && appState !== 'ERROR' && appState !== 'SUCCESS') && (
                       <div className="text-center text-gray-400 p-4">
                          <p>Kịch bản video do AI tạo sẽ xuất hiện ở đây.</p>
                       </div>
                    )}
                </div>
                {appState === 'SUCCESS' && generatedPrompt && (
                    <button
                        onClick={handleCopyToClipboard}
                        className="flex items-center justify-center w-full max-w-xs px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105"
                    >
                        Sao chép kịch bản
                    </button>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VideoPromptGenerator;