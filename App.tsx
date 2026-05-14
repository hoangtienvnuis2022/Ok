import React, { useState, useEffect } from 'react';
import HomePage from './HomePage';
import ProductStudio from './ProductStudio';
import ImageEnhancer from './ImageEnhancer';
import ReviewScriptGenerator from './ReviewScriptGenerator';
import LookbookGenerator from './LookbookGenerator';
import TextToSpeechGenerator from './TextToSpeechGenerator';
import { ModelLevel } from './services/geminiService';

export type View = 'HOME' | 'PRODUCT_STUDIO' | 'IMAGE_ENHANCER' | 'REVIEW_SCRIPT_GENERATOR' | 'LOOKBOOK_GENERATOR' | 'TEXT_TO_SPEECH';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('HOME');
  const [imageForEnhancement, setImageForEnhancement] = useState<string | null>(null);
  const [modelLevel, setModelLevel] = useState<ModelLevel>('flash');
  const [isKeySelected, setIsKeySelected] = useState<boolean>(true);

  // Check for API key selection state, particularly relevant for 'pro' models and video features.
  useEffect(() => {
    const checkApiKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setIsKeySelected(has);
      }
    };
    checkApiKey();
  }, [modelLevel]);

  const handleSelectFeature = (view: View) => {
    setCurrentView(view);
  };

  const handleGoHome = () => {
    setCurrentView('HOME');
    setImageForEnhancement(null);
  };

  const handleEnhanceRequest = (imageUrl: string) => {
    setImageForEnhancement(imageUrl);
    setCurrentView('IMAGE_ENHANCER');
  };

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume the key selection was successful after triggering the dialog to mitigate race conditions.
      setIsKeySelected(true);
    }
  };

  const renderView = () => {
    // Guidelines: Mandatory API key selection before accessing Pro models or Veo video generation.
    if (modelLevel === 'pro' && !isKeySelected) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-200 p-6">
          <div className="max-w-md w-full p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl text-center space-y-6">
            <h2 className="text-2xl font-bold text-white">Yêu cầu thiết lập API Key</h2>
            <p className="text-slate-400">
              Bạn đã chọn sử dụng mô hình <b>Gemini 3 Pro</b> hoặc các tính năng cao cấp. 
              Theo yêu cầu của Google GenAI API, bạn phải chọn một API Key từ tài khoản trả phí (Paid Project) để tiếp tục.
            </p>
            <div className="space-y-4 pt-4">
              <button 
                onClick={handleOpenKeySelector}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                Chọn API Key của bạn
              </button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm text-indigo-400 hover:underline"
              >
                Tìm hiểu về Billing & Quotas
              </a>
              <button 
                onClick={() => setModelLevel('flash')}
                className="block w-full text-xs text-slate-500 hover:text-slate-300 underline"
              >
                Quay lại dùng bản Flash 2.5 (Miễn phí)
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'PRODUCT_STUDIO':
        return <ProductStudio onGoBack={handleGoHome} onEnhanceImage={handleEnhanceRequest} modelLevel={modelLevel} />;
      case 'IMAGE_ENHANCER':
        return <ImageEnhancer onGoBack={handleGoHome} initialImageUrl={imageForEnhancement} modelLevel={modelLevel} />;
      case 'REVIEW_SCRIPT_GENERATOR':
        return <ReviewScriptGenerator onGoBack={handleGoHome} modelLevel={modelLevel} />;
      case 'LOOKBOOK_GENERATOR':
        return <LookbookGenerator onGoBack={handleGoHome} modelLevel={modelLevel} />;
      case 'TEXT_TO_SPEECH':
        return <TextToSpeechGenerator onGoBack={handleGoHome} />;
      case 'HOME':
      default:
        return <HomePage onSelectFeature={handleSelectFeature} modelLevel={modelLevel} setModelLevel={setModelLevel} />;
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {renderView()}
    </div>
  );
};

export default App;
