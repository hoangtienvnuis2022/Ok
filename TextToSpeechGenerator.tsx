import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSpeech } from './services/geminiService';
import { WaveformIcon, SparklesIcon, LoadingSpinner, ErrorIcon, ArrowLeftIcon, DownloadIcon, PlayIcon, SpeakerWaveIcon, StopIcon, ClipboardIcon, ClipboardCheckIcon, MicrophoneIcon } from './components/Icons';

type AppState = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

interface TextToSpeechGeneratorProps {
  onGoBack: () => void;
}

interface VoiceOption {
    id: string; // The internal Gemini voice name
    label: string; // Display name
    description: string;
    gender: 'Nam' | 'Nữ';
    tag: string;
}

// Map the UI requested voices to Gemini voices
const VOICES: VoiceOption[] = [
    { id: 'Aoede', label: 'Mai Linh', description: 'Giọng Bắc, trầm ấm, chuyên nghiệp.', gender: 'Nữ', tag: 'Tin tức' },
    { id: 'Puck', label: 'Minh Quân', description: 'Giọng Nam, năng động, vui vẻ.', gender: 'Nam', tag: 'Review' },
    { id: 'Kore', label: 'Thảo Nguyên', description: 'Nhẹ nhàng, thư giãn, kể chuyện.', gender: 'Nữ', tag: 'Podcast' },
    { id: 'Fenrir', label: 'Hùng Dũng', description: 'Giọng trầm, uy lực, dứt khoát.', gender: 'Nam', tag: 'Tài liệu' },
    { id: 'Charon', label: 'Bảo Long', description: 'Giọng dày, sâu sắc, tin cậy.', gender: 'Nam', tag: 'Sách nói' },
    { id: 'Zephyr', label: 'Thu Hà', description: 'Tự nhiên, hội thoại đời thường.', gender: 'Nữ', tag: 'Trợ lý' },
];

const QUICK_SCENARIOS = [
    {
        title: "Kịch bản bán hàng",
        content: "Chỉ trong 30 giây, bạn sẽ hiểu tại sao sản phẩm này thay đổi cuộc sống của bạn. Hãy tưởng tượng một buổi sáng thức dậy tràn đầy năng lượng."
    },
    {
        title: "Bản tin nhanh",
        content: "Bản tin AI hôm nay: Google vừa ra mắt mô hình mới... Đây là những gì bạn cần biết trong 60 giây tới."
    },
    {
        title: "Review phim",
        content: "Bộ phim bom tấn mới khiến khán giả đứng ngồi không yên. Ngay từ cảnh mở đầu, không khí hồi hộp đã bao trùm..."
    },
    {
        title: "Kể chuyện đêm khuya",
        content: "Ngày xửa ngày xưa, ở một vương quốc công nghệ, có một chú robot nhỏ bé mang trong mình ước mơ thay đổi thế giới..."
    },
    {
        title: "Thông báo sự kiện",
        content: "Kính mời quý khách đến tham dự sự kiện ra mắt sản phẩm mới vào 9 giờ sáng ngày mai tại trung tâm hội nghị."
    }
];

const TextToSpeechGenerator: React.FC<TextToSpeechGeneratorProps> = ({ onGoBack }) => {
  const [text, setText] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICES[0]);
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0);
  const [enableSSML, setEnableSSML] = useState<boolean>(false);
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  
  const handleGenerate = useCallback(async () => {
    if (!text.trim()) {
        setError('Vui lòng nhập văn bản.');
        setAppState('ERROR');
        return;
    }

    setAppState('PROCESSING');
    setError(null);
    setAudioUrl(null);

    try {
        let promptText = text;
        const isSSMLRequest = enableSSML;

        if (!enableSSML) {
            if (speed !== 1.0 || pitch !== 0) {
                 const pitchSt = pitch >= 0 ? `+${pitch}st` : `${pitch}st`;
                 promptText = `
                    <speak>
                        <prosody rate="${speed}" pitch="${pitchSt}">
                            ${text}
                        </prosody>
                    </speak>
                 `;
            }
        }

        const shouldUseSSMLMode = enableSSML || (speed !== 1.0 || pitch !== 0);
        const wavBlob = await generateSpeech(promptText, selectedVoice.id, shouldUseSSMLMode);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);
        setAppState('SUCCESS');
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Không thể tạo giọng nói.');
        setAppState('ERROR');
    }
  }, [text, selectedVoice, speed, pitch, enableSSML]);

  useEffect(() => {
    return () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-200 font-sans selection:bg-teal-500/30 selection:text-teal-200">
       <header className="flex-none h-16 border-b border-slate-700 bg-slate-800/50 backdrop-blur-md flex items-center px-6 justify-between z-20">
        <div className="flex items-center">
            <button onClick={onGoBack} className="flex items-center text-slate-400 hover:text-white transition-colors mr-4 group">
                <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"/>
                <span className="font-medium">Trang chủ</span>
            </button>
            <div className="h-6 w-px bg-slate-700 mx-4"></div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <WaveformIcon className="w-5 h-5 text-teal-400" />
                Audio Studio
            </h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                
                {/* LEFT COLUMN: INPUT STUDIO (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* 1. Voice Selector */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 shadow-lg">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                            <MicrophoneIcon className="w-4 h-4 mr-2" />
                            Chọn giọng đọc
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {VOICES.map(v => (
                                <button 
                                    key={v.id}
                                    onClick={() => setSelectedVoice(v)}
                                    className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md group
                                        ${selectedVoice.id === v.id 
                                            ? 'bg-teal-500/10 border-teal-500 shadow-teal-500/10' 
                                            : 'bg-slate-750 border-slate-700 hover:border-slate-500 hover:bg-slate-700'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`font-bold text-sm ${selectedVoice.id === v.id ? 'text-teal-400' : 'text-slate-200'}`}>
                                            {v.label}
                                        </span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border
                                            ${v.gender === 'Nam' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}
                                        `}>
                                            {v.gender}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 line-clamp-2">{v.description}</p>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {selectedVoice.id === v.id && <div className="w-2 h-2 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.8)]"></div>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Text Input Area */}
                    <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 p-1 flex flex-col shadow-lg min-h-[400px]">
                        <div className="flex-1 relative">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={enableSSML ? "<speak>Enter SSML here...</speak>" : "Nhập văn bản cần đọc tại đây..."}
                                className="w-full h-full bg-slate-900/50 rounded-xl p-6 text-slate-200 focus:outline-none resize-none text-base leading-relaxed font-sans custom-scrollbar placeholder-slate-600"
                            />
                            <div className="absolute bottom-4 right-4 text-xs font-mono text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
                                {text.length} ký tự
                            </div>
                        </div>

                        {/* Control Bar (Integrated) */}
                        <div className="p-4 bg-slate-800 rounded-b-xl border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
                            
                            <div className="flex items-center gap-6 flex-1">
                                {/* Speed Control */}
                                <div className="flex flex-col gap-1 w-32">
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                        <span>Tốc độ</span>
                                        <span className="text-teal-400">{speed}x</span>
                                    </div>
                                    <input 
                                        type="range" min="0.5" max="2.0" step="0.1"
                                        value={speed}
                                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                        disabled={enableSSML}
                                        className="h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500 disabled:opacity-30"
                                    />
                                </div>

                                {/* Pitch Control */}
                                <div className="flex flex-col gap-1 w-32">
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                        <span>Cao độ</span>
                                        <span className="text-teal-400">{pitch > 0 ? `+${pitch}` : pitch}</span>
                                    </div>
                                    <input 
                                        type="range" min="-5" max="5" step="1"
                                        value={pitch}
                                        onChange={(e) => setPitch(parseInt(e.target.value))}
                                        disabled={enableSSML}
                                        className="h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500 disabled:opacity-30"
                                    />
                                </div>

                                {/* SSML Toggle */}
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-9 h-5 rounded-full p-1 transition-colors ${enableSSML ? 'bg-teal-600' : 'bg-slate-600'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${enableSSML ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300">SSML</span>
                                    <input type="checkbox" checked={enableSSML} onChange={(e) => setEnableSSML(e.target.checked)} className="hidden" />
                                </label>
                            </div>

                            {/* Main Action Button */}
                            <button 
                                onClick={handleGenerate}
                                disabled={appState === 'PROCESSING' || !text.trim()}
                                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 min-w-[160px] justify-center"
                            >
                                {appState === 'PROCESSING' ? (
                                    <> <LoadingSpinner className="w-5 h-5" /> <span>Đang tạo...</span> </>
                                ) : (
                                    <> <SparklesIcon className="w-5 h-5" /> <span>Tạo Audio</span> </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: OUTPUT & UTILS (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* 1. Result Player Card */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl flex flex-col relative overflow-hidden group min-h-[220px]">
                        {/* Background Effect */}
                        <div className="absolute top-0 right-0 p-16 bg-teal-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>

                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 relative z-10">Kết quả</h2>
                        
                        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                            {appState === 'IDLE' && (
                                <div className="text-center text-slate-600">
                                    <SpeakerWaveIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Sẵn sàng</p>
                                </div>
                            )}

                            {appState === 'PROCESSING' && (
                                <div className="text-center">
                                    <div className="flex gap-1 justify-center mb-3">
                                        <div className="w-1.5 h-6 bg-teal-500/50 animate-pulse rounded-full" style={{animationDelay: '0ms'}}></div>
                                        <div className="w-1.5 h-8 bg-teal-500 animate-pulse rounded-full" style={{animationDelay: '150ms'}}></div>
                                        <div className="w-1.5 h-5 bg-teal-500/50 animate-pulse rounded-full" style={{animationDelay: '300ms'}}></div>
                                        <div className="w-1.5 h-7 bg-teal-500 animate-pulse rounded-full" style={{animationDelay: '75ms'}}></div>
                                        <div className="w-1.5 h-4 bg-teal-500/50 animate-pulse rounded-full" style={{animationDelay: '200ms'}}></div>
                                    </div>
                                    <p className="text-teal-400 text-xs font-medium animate-pulse">Đang xử lý âm thanh...</p>
                                </div>
                            )}

                            {appState === 'ERROR' && (
                                <div className="text-center text-rose-400">
                                    <ErrorIcon className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-xs max-w-[200px]">{error}</p>
                                </div>
                            )}

                            {appState === 'SUCCESS' && audioUrl && (
                                <div className="w-full animate-fade-in-up">
                                    <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                                                AI
                                            </div>
                                            <div className="overflow-hidden">
                                                <h3 className="text-sm font-bold text-white truncate">Audio Generated</h3>
                                                <p className="text-xs text-slate-400 truncate">{selectedVoice.label} • {speed}x</p>
                                            </div>
                                        </div>
                                        <audio controls src={audioUrl} className="w-full h-8 accent-teal-500 custom-audio-player" />
                                    </div>
                                    
                                    <a 
                                        href={audioUrl}
                                        download={`speech-${Date.now()}.wav`}
                                        className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                        Tải xuống WAV
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Quick Scenarios (Vertical List) */}
                    <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 p-5 shadow-lg overflow-hidden flex flex-col">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Kịch bản mẫu</h2>
                        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-3">
                            {QUICK_SCENARIOS.map((scenario, index) => (
                                <div 
                                    key={index} 
                                    onClick={() => setText(scenario.content)}
                                    className="p-3 bg-slate-900/50 hover:bg-slate-700 border border-slate-700/50 hover:border-teal-500/30 rounded-xl cursor-pointer transition-all group"
                                >
                                    <h3 className="text-xs font-bold text-slate-300 group-hover:text-teal-400 mb-1 transition-colors">{scenario.title}</h3>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{scenario.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default TextToSpeechGenerator;