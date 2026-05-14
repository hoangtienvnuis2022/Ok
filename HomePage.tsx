import React from 'react';
import { View } from './App';
import { CameraIcon, SparklesIcon, WandIcon, MicrophoneIcon, PhotoIcon, WaveformIcon } from './components/Icons';
import { ModelLevel } from './services/geminiService';

interface HomePageProps {
  onSelectFeature: (view: View) => void;
  modelLevel: ModelLevel;
  setModelLevel: (level: ModelLevel) => void;
}

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  colorClass: string;
}> = ({ icon, title, description, onClick, colorClass }) => (
  <button
    onClick={onClick}
    className="group relative overflow-hidden bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 text-left w-full h-full flex flex-col"
  >
    <div className={`absolute top-0 right-0 p-20 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${colorClass} -mr-10 -mt-10 pointer-events-none`}></div>
    
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-3 rounded-xl bg-slate-900/50 border border-slate-700 ${colorClass.replace('bg-', 'text-')}`}>
        {icon}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </div>
    
    <h3 className="text-xl font-bold text-white mb-2 relative z-10 group-hover:text-indigo-200 transition-colors">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed relative z-10 group-hover:text-slate-300 transition-colors">{description}</p>
  </button>
);

const HomePage: React.FC<HomePageProps> = ({ onSelectFeature, modelLevel, setModelLevel }) => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl relative">
      {/* Model Selector Top Right */}
      <div className="absolute top-4 right-4 z-50">
          <div className="inline-flex bg-slate-800 rounded-lg p-1 border border-slate-700 shadow-lg">
              <button 
                onClick={() => setModelLevel('flash')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${modelLevel === 'flash' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                  Flash 2.5
              </button>
              <button 
                onClick={() => setModelLevel('pro')}
                 className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center ${modelLevel === 'pro' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                  <SparklesIcon className="w-3 h-3 mr-1" />
                  Pro 3.0
              </button>
          </div>
      </div>

      <header className="text-center mb-16 space-y-6">
         <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-slate-800 border border-slate-700 mb-4 animate-fade-in-up">
            <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full mr-2">NEW</span>
            <span className="text-slate-300 text-xs pr-2">AI Studio v2.0 - Powered by {modelLevel === 'pro' ? 'Gemini 3 Pro' : 'Gemini 2.5 Flash'}</span>
         </div>
         
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tight">
          AI Fashion Studio
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Nền tảng sáng tạo hình ảnh thời trang all-in-one. Biến ý tưởng thành hiện thực với chất lượng Studio sắc nét.
        </p>
      </header>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 lg:col-span-2">
            <FeatureCard
              icon={<CameraIcon className="w-8 h-8" />}
              title="Studio Sản phẩm & Người Mẫu"
              description="Tạo ảnh sản phẩm thương mại điện tử, người mẫu ảo (AI Model) và selfie gương chân thực. Hỗ trợ tùy chỉnh dáng pose, độ tuổi và bối cảnh."
              colorClass="bg-indigo-500"
              onClick={() => onSelectFeature('PRODUCT_STUDIO')}
            />
          </div>
           
           <FeatureCard
            icon={<PhotoIcon className="w-8 h-8" />}
            title="AI Fashion Photoshoot"
            description="Tạo bộ sưu tập thời trang chuyên nghiệp với đa dạng bối cảnh, hành động và góc máy. Tự động đề xuất Video Prompt cho Veo 3.1."
            colorClass="bg-pink-500"
            onClick={() => onSelectFeature('LOOKBOOK_GENERATOR')}
          />
          
          <FeatureCard
            icon={<WandIcon className="w-8 h-8" />}
            title="Nâng Cấp Ảnh (Upscale)"
            description="Làm nét ảnh bị mờ, tăng độ phân giải lên 2K/4K và xóa watermark thông minh."
            colorClass="bg-sky-500"
            onClick={() => onSelectFeature('IMAGE_ENHANCER')}
          />
          
           <FeatureCard
            icon={<MicrophoneIcon className="w-8 h-8" />}
            title="Kịch Bản Review"
            description="Viết kịch bản TikTok/Shorts thu hút với ngôn ngữ địa phương (Bắc/Nam) tự nhiên."
            colorClass="bg-rose-500"
            onClick={() => onSelectFeature('REVIEW_SCRIPT_GENERATOR')}
          />

           <FeatureCard
            icon={<WaveformIcon className="w-8 h-8" />}
            title="Tạo Giọng Nói (TTS)"
            description="Chuyển văn bản thành giọng đọc Tiếng Việt tự nhiên với nhiều phong cách cảm xúc."
            colorClass="bg-teal-500"
            onClick={() => onSelectFeature('TEXT_TO_SPEECH')}
          />
          
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 flex flex-col justify-center items-center text-center opacity-75">
             <SparklesIcon className="w-8 h-8 text-slate-500 mb-3" />
             <h3 className="text-lg font-bold text-slate-400">Sắp ra mắt</h3>
             <p className="text-slate-500 text-xs mt-1">Video Editor AI & Virtual Try-on</p>
          </div>
        </div>
      </main>
      
      <footer className="mt-20 text-center text-slate-600 text-sm">
        <p>© 2024 AI Fashion Studio. Powered by {modelLevel === 'pro' ? 'Gemini 3 Pro' : 'Gemini 2.5 Flash'} & Veo.</p>
      </footer>
    </div>
  );
};

export default HomePage;