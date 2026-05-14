import React, { useState, useCallback } from 'react';
import { generateReviewScript, ReviewScriptOptions, ScriptType, RegionalAccent, ReviewScriptResult, ModelLevel } from './services/geminiService';
import { SparklesIcon, LoadingSpinner, ErrorIcon, ArrowLeftIcon, ClipboardIcon, ClipboardCheckIcon, MicrophoneIcon } from './components/Icons';

type AppState = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

interface ReviewScriptGeneratorProps {
  onGoBack: () => void;
  modelLevel: ModelLevel;
}

const ReviewScriptGenerator: React.FC<ReviewScriptGeneratorProps> = ({ onGoBack, modelLevel }) => {
  const [productInfo, setProductInfo] = useState<string>('');
  const [scriptType, setScriptType] = useState<ScriptType>('Review sản phẩm');
  const [accent, setAccent] = useState<RegionalAccent>('Miền Bắc');

  const [generatedScript, setGeneratedScript] = useState<ReviewScriptResult | null>(null);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  
  const handleGenerateClick = useCallback(async () => {
    if (!productInfo.trim()) {
        setError('Vui lòng nhập thông tin sản phẩm.');
        setAppState('ERROR');
        return;
    };

    setAppState('PROCESSING');
    setError(null);
    setGeneratedScript(null);

    try {
        const result = await generateReviewScript({ productInfo, scriptType, accent }, modelLevel);
        setGeneratedScript(result);
        setAppState('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'Lỗi tạo kịch bản.');
      setAppState('ERROR');
    }
  }, [productInfo, scriptType, accent, modelLevel]);
  
  const handleCopyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const ScriptCard: React.FC<{ title: string, content: string, sectionKey: string, color: string }> = ({ title, content, sectionKey, color }) => (
      <div className={`bg-slate-800 rounded-xl p-5 border border-slate-700 relative group hover:border-${color}-500/50 transition-all`}>
        <div className="flex justify-between items-center mb-3">
            <span className={`text-xs font-bold uppercase px-2 py-1 rounded bg-${color}-500/10 text-${color}-400`}>{title}</span>
            <button onClick={() => handleCopyToClipboard(content, sectionKey)} className="text-slate-500 hover:text-white transition-colors">
                {copiedSection === sectionKey ? <ClipboardCheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
            </button>
        </div>
        <p className="text-slate-200 leading-relaxed font-medium">{content}</p>
      </div>
  );

  return (
    <div className="bg-slate-900 min-h-screen text-slate-200 font-sans">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="flex items-center justify-between mb-8">
            <button onClick={onGoBack} className="flex items-center text-slate-400 hover:text-white transition-colors">
                <ArrowLeftIcon className="w-5 h-5 mr-2"/>
                <span className="font-medium">Trang chủ</span>
            </button>
            <div className="flex items-center space-x-2">
                <span className={`text-xs font-mono px-2 py-1 rounded border ${modelLevel === 'pro' ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                    {modelLevel === 'pro' ? 'GEMINI 3 PRO' : 'GEMINI 2.5 FLASH'}
                </span>
            </div>
        </header>

        <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-rose-500/10 rounded-full mb-4">
                <MicrophoneIcon className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Review Script Writer</h1>
            <p className="text-slate-400">Tạo kịch bản video ngắn (TikTok/Shorts) chuẩn SEO & Viral.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Input Form */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
                 <div className="space-y-5">
                    <div>
                        <label className="text-sm font-bold text-slate-300 block mb-2">Thông tin sản phẩm</label>
                        <textarea
                            rows={5}
                            value={productInfo}
                            onChange={(e) => setProductInfo(e.target.value)}
                            placeholder="VD: Son kem lì 3CE, màu đỏ đất, không khô môi, đang sale 30%..."
                            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-rose-500 outline-none placeholder-slate-500"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-300 block mb-2">Loại nội dung</label>
                         <div className="flex flex-wrap gap-2">
                            {(['Review sản phẩm', 'Quảng cáo sản phẩm', 'Chào hàng (Sale)'] as ScriptType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setScriptType(type)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all
                                        ${scriptType === type ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-900 text-slate-400 hover:bg-slate-700'}
                                    `}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-300 block mb-2">Giọng điệu (Accent)</label>
                         <div className="flex gap-2">
                            {(['Miền Bắc', 'Miền Nam'] as RegionalAccent[]).map(item => (
                                <button
                                    key={item}
                                    onClick={() => setAccent(item)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all
                                        ${accent === item ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-900 text-slate-400 hover:bg-slate-700'}
                                    `}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateClick}
                        disabled={appState === 'PROCESSING' || !productInfo.trim()}
                        className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 disabled:opacity-50 transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                    >
                         {appState === 'PROCESSING' ? (
                             <> <LoadingSpinner className="w-5 h-5" /> <span>Đang viết kịch bản...</span> </>
                         ) : (
                             <> <SparklesIcon className="w-5 h-5" /> <span>Tạo Kịch Bản Ngay</span> </>
                         )}
                    </button>
                 </div>
            </div>

            {/* Result Area */}
            <div className="space-y-4">
                 {appState === 'PROCESSING' && (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
                        <LoadingSpinner className="w-10 h-10 text-rose-500 mb-3" />
                        <p>AI đang phân tích & sáng tạo...</p>
                    </div>
                 )}

                 {appState === 'ERROR' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
                        <ErrorIcon className="w-8 h-8 mx-auto mb-2"/>
                        <p>{error}</p>
                    </div>
                 )}

                 {appState === 'SUCCESS' && generatedScript && (
                    <div className="space-y-4 animate-fade-in-up">
                        <ScriptCard title="1. Hook (3s đầu)" content={generatedScript.hook} sectionKey="hook" color="orange" />
                        <ScriptCard title="2. Thân bài (Chính)" content={generatedScript.body} sectionKey="body" color="blue" />
                        <ScriptCard title="3. Kêu gọi (CTA)" content={generatedScript.cta} sectionKey="cta" color="green" />
                    </div>
                 )}

                 {appState === 'IDLE' && (
                     <div className="h-64 flex flex-col items-center justify-center text-slate-600 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                        <p>Kịch bản sẽ xuất hiện ở đây.</p>
                     </div>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewScriptGenerator;