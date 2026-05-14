import React, { useState, useCallback, useRef } from 'react';
import { removeBackground } from './services/geminiService';
import { UploadIcon, LoadingSpinner, ErrorIcon, ArrowLeftIcon, PhotoIcon, XIcon } from './components/Icons';

type AppState = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

interface BackgroundRemoverProps {
  onGoBack: () => void;
}

const BackgroundRemover: React.FC<BackgroundRemoverProps> = ({ onGoBack }) => {
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Only reset image and results
    setOriginalImageFile(null);
    setOriginalImageUrl(null);
    setGeneratedImageUrl(null);
    setError(null);
    setAppState('IDLE');
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleGenerateClick = useCallback(async () => {
    if (!originalImageFile) return;

    setAppState('PROCESSING');
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(originalImageFile);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        if (!base64String) {
          throw new Error('Không thể chuyển đổi hình ảnh.');
        }

        const generatedImage = await removeBackground(base64String, originalImageFile.type);
        
        setGeneratedImageUrl(`data:image/png;base64,${generatedImage}`);
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
  }, [originalImageFile]);
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetState = () => {
    setOriginalImageFile(null);
    setOriginalImageUrl(null);
    setGeneratedImageUrl(null);
    setError(null);
    setAppState('IDLE');
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const isGenerateButtonDisabled = () => {
    return appState === 'PROCESSING' || !originalImageFile;
  }

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8 md:mb-12 relative">
            <button onClick={onGoBack} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center text-gray-500 hover:text-indigo-600 transition-colors group">
                <ArrowLeftIcon className="w-6 h-6 mr-2 transform group-hover:-translate-x-1 transition-transform"/>
                <span className="font-semibold">Trang chủ</span>
            </button>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Xóa Nền Thông Minh
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Tự động xóa nền khỏi ảnh của bạn chỉ với một cú nhấp chuột.
          </p>
        </header>

        <main className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Input Section */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <h2 className="text-2xl font-semibold text-gray-700">1. Tải ảnh lên</h2>
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
                    <p className="mt-2 text-gray-500">Nhấp hoặc kéo và thả ảnh vào đây</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP</p>
                  </>
                )}
              </div>
              <div className="w-full flex justify-center space-x-4 pt-4">
                  <button
                    onClick={handleGenerateClick}
                    disabled={isGenerateButtonDisabled()}
                    className="flex items-center justify-center w-full max-w-xs px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
                  >
                    {appState === 'PROCESSING' ? (
                      <>
                        <LoadingSpinner className="w-5 h-5 mr-3" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <PhotoIcon className="w-5 h-5 mr-3" />
                        Xóa nền
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
                 <h2 className="text-2xl font-semibold text-gray-700">2. Kết quả từ AI</h2>
                <div 
                    className="w-full max-w-md mx-auto aspect-video bg-transparent rounded-lg flex justify-center items-center overflow-hidden shadow-inner"
                    style={{
                        backgroundImage: `
                            linear-gradient(45deg, #eee 25%, transparent 25%), 
                            linear-gradient(-45deg, #eee 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #eee 75%), 
                            linear-gradient(-45deg, transparent 75%, #eee 75%)`,
                        backgroundSize: `20px 20px`,
                        backgroundPosition: `0 0, 0 10px, 10px -10px, -10px 0px`
                    }}
                >
                    {appState === 'PROCESSING' && (
                        <div className="text-center text-gray-500">
                           <LoadingSpinner className="w-12 h-12 mx-auto" />
                           <p className="mt-4 animate-pulse">AI đang tách nền...</p>
                        </div>
                    )}
                    {(appState === 'ERROR' && error) && (
                        <div className="text-center text-red-500 p-4 bg-white/80 rounded-lg">
                            <ErrorIcon className="w-12 h-12 mx-auto"/>
                            <p className="mt-4 font-semibold">Lỗi!</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {appState === 'SUCCESS' && generatedImageUrl && (
                        <img src={generatedImageUrl} alt="AI Generated" className="w-full h-full object-contain transition-opacity duration-500 opacity-100" />
                    )}
                    {(appState === 'IDLE' || (!generatedImageUrl && appState !== 'PROCESSING' && appState !== 'ERROR')) && (
                       <div className="text-center text-gray-400 p-4">
                          <p>Ảnh đã xóa nền sẽ xuất hiện ở đây.</p>
                       </div>
                    )}
                </div>
                {appState === 'SUCCESS' && generatedImageUrl && (
                    <a
                        href={generatedImageUrl}
                        download="background-removed.png"
                        className="flex items-center justify-center w-full max-w-xs px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105"
                    >
                        Tải ảnh xuống (PNG)
                    </a>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BackgroundRemover;