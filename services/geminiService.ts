import { GoogleGenAI, Type, Modality } from "@google/genai";

// Types
export type ModelLevel = 'flash' | 'pro';

export type ClothingType = 'Áo' | 'Quần' | 'Cả bộ' | 'Váy' | 'Phụ kiện';
export type Gender = 'Nam' | 'Nữ';
export type ModelPose = 'Dáng đứng' | 'Dáng đi' | 'Giới thiệu (Cầm móc)' | 'Giới thiệu (Chỉ mặc)';
export type AspectRatio = '9:16' | '1:1' | '4:5' | '16:9';
export type ProductDisplayMode = 'hanger' | 'flatlay';
export type Ethnicity = 'Việt Nam' | 'Hàn Quốc';
export type SelfieFraming = 'Nửa thân' | 'Toàn thân';
export type SelfieTone = 'Trắng sáng' | 'Tự nhiên' | 'Ấm áp' | 'Lạnh' | 'Vintage' | 'Rực rỡ';

export interface ModelImageOptions {
    clothingType: ClothingType;
    gender: Gender;
    age: string;
    background: string;
    numberOfImages: number;
    pose: ModelPose;
    aspectRatio: AspectRatio;
}

export interface LookbookOptions {
    clothingType: ClothingType;
    gender: Gender;
    age: string;
    theme: string;
    additionalPrompt?: string;
    numberOfImages: number;
    pose: ModelPose;
    aspectRatio: AspectRatio;
    generateVideo: boolean;
    ethnicity: Ethnicity;
}

export interface LookbookResult {
    imageUrl: string;
    videoPrompt?: string;
}

export interface EnhanceOptions {
    upscale: boolean;
    sharpen: boolean;
    removeWatermark: boolean;
}

export interface ReviewScriptOptions {
    productInfo: string;
    scriptType: string;
    accent: string;
}

export type ScriptType = 'Review sản phẩm' | 'Quảng cáo sản phẩm' | 'Chào hàng (Sale)';
export type RegionalAccent = 'Miền Bắc' | 'Miền Nam';

export interface ReviewScriptResult {
    hook: string;
    body: string;
    cta: string;
}

export interface VideoPromptOptions {
    productInfo: string;
    targetAudience: string;
    videoStyle: string;
}

export type VoiceoverStyle = 'Năng động' | 'Trang trọng' | 'Thân thiện';

// Helpers
const fileToPart = (base64String: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64String,
            mimeType
        }
    };
};

const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// PCM to WAV Converter
const pcmToWav = (pcmData: ArrayBuffer, sampleRate: number = 24000, numChannels: number = 1, bitDepth: number = 16): Blob => {
    const dataView = new DataView(pcmData);
    const numSamples = pcmData.byteLength / (bitDepth / 8);
    const blockAlign = numChannels * (bitDepth / 8);
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    const pcmBytes = new Uint8Array(pcmData);
    const wavBytes = new Uint8Array(buffer, 44);
    wavBytes.set(pcmBytes);

    return new Blob([buffer], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

const getImageModel = (level: ModelLevel) => {
    return level === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
};

const getTextModel = (level: ModelLevel) => {
    return level === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
};

// Implementations

export const generateBackgroundSuggestion = async (base64Image: string, mimeType: string, clothingType: string, modelLevel: ModelLevel): Promise<string> => {
    try {
        // Instantiate GoogleGenAI right before use to get latest process.env.API_KEY.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = getTextModel(modelLevel);
        const prompt = `Suggest a short, artistic background description (under 20 words) suitable for a fashion photo of this ${clothingType}. In Vietnamese.`;
        
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [fileToPart(base64Image, mimeType), { text: prompt }]
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Generate Background Error", e);
        return "Phông nền studio chuyên nghiệp";
    }
}

export const generateStyledImage = async (base64Image: string, mimeType: string, clothingType: string, aspectRatio: AspectRatio, displayMode: ProductDisplayMode, count: number, modelLevel: ModelLevel): Promise<string[]> => {
    const results: string[] = [];
    const model = getImageModel(modelLevel);
    
    for(let i=0; i<count; i++) {
        try {
            // Instantiate GoogleGenAI right before use to get latest process.env.API_KEY.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let prompt = `Generate a high-end commercial fashion product photo of this ${clothingType}. `;
            
            if (displayMode === 'flatlay') {
                const pastelColors = ['soft creamy pink', 'pale mint green', 'light lavender', 'gentle baby blue', 'warm champagne'];
                const randomColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];
                const rugShape = Math.random() > 0.5 ? 'circular' : 'oval';
                const props = ['a small elegant glass vase with a single rose', 'an aesthetic open book with beautiful typography', 'a small fashionable luxury handbag'];
                const randomProp = props[Math.floor(Math.random() * props.length)];

                prompt += `
                Composition: Top-down flatlay shot, artistic and minimal.
                Subject Placement: The ${clothingType} MUST be placed neatly and perfectly DEAD CENTER on the rug.
                Background: The product lies on a ${randomColor} soft plush fur rug with a ${rugShape} shape. 
                Floor: The rug is placed on a clean, simple white marble floor (đá hoa) with subtle grey veins. 
                Setting: Indoor studio setting, but NO windows, NO curtains, and NO direct sunlight effects.
                Props: Near the rug, add ${randomProp} to create a professional lifestyle vibe.
                Lighting: Even, soft indoor studio lighting, balanced white balance, no harsh shadows.
                Quality: Ultra-sharp fabric details, realistic textures, 4k resolution, high fidelity.`;
            } else {
                prompt += `Display mode: Hanging on a minimalist wooden rack. Background: Clean high-end boutique interior. Aspect Ratio: ${aspectRatio}. Bright soft indoor lighting.`;
            }
            
            prompt += ` Quality: 4k resolution, ultra-sharp focus, highly detailed texture, professional white balance, no blur.`;

            const response = await ai.models.generateContent({
                model,
                contents: {
                    parts: [
                        fileToPart(base64Image, mimeType),
                        { text: prompt }
                    ]
                }
            });
            
            if(response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        results.push(part.inlineData.data);
                        break; 
                    }
                }
            }
        } catch (e) {
            console.error(`Error generating image ${i+1}:`, e);
        }
    }
    
    if (results.length === 0) {
        throw new Error("Không thể tạo ảnh. Vui lòng thử lại sau.");
    }
    return results;
}

export const generateModelImage = async (base64Image: string, mimeType: string, options: ModelImageOptions, modelLevel: ModelLevel): Promise<{imageUrl: string, videoPrompt: string}[]> => {
    const results: {imageUrl: string, videoPrompt: string}[] = [];
    const model = getImageModel(modelLevel);
    const genderEn = options.gender === 'Nam' ? 'male' : 'female';
    const beautyTerms = options.gender === 'Nam' ? 'handsome, K-pop idol style' : 'very beautiful, angelic face';
    
    let poseInstructions = "";
    let wearingStatus = "wearing this";

    switch (options.pose) {
        case 'Dáng đi':
            poseInstructions = "Walking confidently forward towards the camera (runway/catwalk style). Dynamic movement in hair and fabric. Full body shot.";
            break;
        case 'Giới thiệu (Cầm móc)':
            wearingStatus = "holding this"; 
            poseInstructions = "Standing and holding the clothes on a wooden hanger next to their body, presenting the product to the camera. Friendly smiling expression.";
            break;
        case 'Giới thiệu (Chỉ mặc)':
            poseInstructions = "Standing casually in a lifestyle pose, one hand on hip or touching the fabric, slightly angled body but face looking directly at the camera.";
            break;
        case 'Dáng đứng':
        default:
            poseInstructions = "Standing straight, confident upright posture, symmetric composition, professional e-commerce pose, arms relaxed.";
            break;
    }

    for(let i=0; i<options.numberOfImages; i++) {
        try {
             // Instantiate GoogleGenAI right before use to get latest process.env.API_KEY.
             const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
             const prompt = `Fashion photography. A ${options.age} year old Vietnamese ${genderEn} model (${beautyTerms}, fair white skin, glowing skin, flawless face, black hair, smiling gently, happy friendly expression) ${wearingStatus} ${options.clothingType}. 
             Pose: ${poseInstructions}.
             Background: ${options.background}. Aspect Ratio: ${options.aspectRatio}. 
             Lighting: Bright studio lighting, high-key, soft shadows, clean white balance, bright and sharp.
             Quality: 2k resolution, ultra-sharp details, high fidelity, depth of field, photorealistic, 8k uhd. Ensure the clothing looks exactly like the reference image.`;
             
             const response = await ai.models.generateContent({
                model, 
                contents: {
                    parts: [
                        fileToPart(base64Image, mimeType),
                        { text: prompt }
                    ]
                }
            });
            
            let imageUrl = "";
            if(response.candidates?.[0]?.content?.parts) {
                 for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        imageUrl = `data:image/jpeg;base64,${part.inlineData.data}`;
                        break; 
                    }
                }
            }
            
            if(imageUrl) {
                 const videoPrompt = `Cinematic shot of a beautiful Vietnamese ${genderEn} model with fair skin in ${options.background}, ${wearingStatus} ${options.clothingType}, ${poseInstructions}, 4k resolution, slow motion, bright lighting.`;
                 results.push({ imageUrl, videoPrompt });
            }
        } catch (e) {
            console.error(`Error generating model image ${i+1}:`, e);
        }
    }
    
    if (results.length === 0) {
        throw new Error("Không thể tạo ảnh người mẫu. Vui lòng kiểm tra lại ảnh đầu vào.");
    }
    return results;
}

export const generateSelfieImage = async (base64Image: string, mimeType: string, clothingType: string, count: number, gender: Gender, framing: SelfieFraming, background: string, modelLevel: ModelLevel, tone: SelfieTone = 'Trắng sáng'): Promise<string[]> => {
    const results: string[] = [];
    const model = getImageModel(modelLevel);
    
    const genderTerm = gender === 'Nam' ? 'male' : 'female';
    const beautyTerm = gender === 'Nam' 
        ? 'handsome face, K-pop idol style, youthful' 
        : 'beautiful face, glowing skin, cute';
        
    let framingPrompt = "";
    if (framing === 'Toàn thân') {
         framingPrompt = "Full body shot in mirror, head to toe. Wide angle view showing the entire outfit including shoes.";
    } else {
         if (clothingType === 'Quần' || clothingType === 'Váy') {
            framingPrompt = "Medium shot in mirror (3/4 shot). Frame from knees up to ensure the skirt/pants are clearly visible, while still including the model's face.";
         } else {
            framingPrompt = "Medium shot in mirror (3/4 shot), from mid-thighs up. The framing MUST be wide enough to fully display the upper body outfit/dress. Focus on the model's face AND the clothing item. Do not crop the product.";
         }
    }

    // Tone specific prompt additions
    let tonePrompt = "";
    switch (tone) {
        case 'Trắng sáng':
            tonePrompt = "Tone & Aesthetic: Ultra-bright, clean white aesthetic (trắng sáng), luminous skin, airy and ethereal vibe. Lighting: Luminous high-key indoor lighting, bright softbox effect, pure clean white balance.";
            break;
        case 'Tự nhiên':
            tonePrompt = "Tone & Aesthetic: Natural colors, realistic skin tones, standard exposure, no heavy filters. Lighting: Soft ambient indoor daylight, balanced neutral white balance.";
            break;
        case 'Ấm áp':
            tonePrompt = "Tone & Aesthetic: Warm golden hour aesthetic, amber and golden tones, cozy and inviting vibe. Lighting: Soft warm indoor lighting with golden highlights, sunset-like warmth.";
            break;
        case 'Lạnh':
            tonePrompt = "Tone & Aesthetic: Cool blueish aesthetic, professional high-fashion cold lighting, clean and crisp. Lighting: Cool-toned LED lighting, slight blueish tint in highlights, modern vibes.";
            break;
        case 'Vintage':
            tonePrompt = "Tone & Aesthetic: Vintage film aesthetic, slightly desaturated colors, warm shadows, retro film grain texture, analog photography vibe. Lighting: Moody and soft, classic photography lighting.";
            break;
        case 'Rực rỡ':
            tonePrompt = "Tone & Aesthetic: Vibrant and high contrast, popping colors, highly saturated and rich tones, energetic vibe. Lighting: Bright and dynamic, highlighting all colors and textures vividly.";
            break;
    }

    for(let i=0; i<count; i++) {
        try {
            // Instantiate GoogleGenAI right before use to get latest process.env.API_KEY.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Mirror selfie fashion photography. 
            Setting: STRICTLY INDOORS. A stylish corner of a ${background}. 
            Subject: A 20-25 year old Vietnamese ${genderTerm} model (fair white skin, ${beautyTerm}, smiling gently, happy expression) wearing this ${clothingType}. 
            Pose: Standing, Front facing, looking directly at the mirror/camera, phone in hand.
            Composition: The model is reflected in a large aesthetic mirror. The indoor room background is visible in the reflection, providing depth and context.
            Framing: ${framingPrompt}.
            ${tonePrompt}
            Fabric texture: Detect and replicate the exact fabric texture from the reference image.
            Quality: 4k resolution, ultra-sharp focus, fair glowing skin tones, authentic interior lighting, high fidelity masterpiece, extremely detailed.`;

            const response = await ai.models.generateContent({
                model,
                contents: {
                    parts: [
                        fileToPart(base64Image, mimeType),
                        { text: prompt }
                    ]
                }
            });
            
            if(response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        results.push(part.inlineData.data);
                        break; 
                    }
                }
            }
        } catch (e) {
            console.error(`Error generating selfie image ${i+1}:`, e);
        }
    }
    
    if (results.length === 0) {
        throw new Error("Không thể tạo ảnh selfie. Vui lòng thử lại.");
    }
    return results;
}

export const generateLookbookImages = async (base64Image: string, mimeType: string, options: LookbookOptions, modelLevel: ModelLevel): Promise<LookbookResult[]> => {
    const results: LookbookResult[] = [];
    const model = getImageModel(modelLevel);
    const genderEn = options.gender === 'Nam' ? 'male' : 'female';
    
    let ethnicityPrompt = "";
    const beautyTerms = options.gender === 'Nam' ? 'handsome, attractive face' : 'beautiful, pretty face';

    if (options.ethnicity === 'Hàn Quốc') {
        ethnicityPrompt = "Korean (K-pop idol aesthetic, pale white skin, trendy hairstyle)";
    } else {
        ethnicityPrompt = "Vietnamese (distinctive Vietnamese Asian features, fair white skin, glowing skin)";
    }
    
    // Core Pose Logic: Enforce Front-Facing and Visibility
    const isWalking = options.pose === 'Dáng đi';
    const poseDetail = isWalking 
        ? "walking confidently directly towards the camera, mid-stride fashion walk, front-facing" 
        : "standing straight and posing, facing directly towards the camera, high-end commercial fashion pose";

    const photoshootScenarios = [
        { angle: "Eye level straight shot", context: "Modern minimal studio with high-end clean lighting" },
        { angle: "Low angle power shot looking up", context: "Urban city street background with luxury architecture" },
        { angle: "Medium shot eye level", context: "Chic designer cafe interior" },
        { angle: "Full body wide angle", context: "Professional luxury boutique lobby" },
        { angle: "Eye level straight shot", context: "Bright sunny outdoor luxury plaza" },
        { angle: "Symmetric front shot", context: "Clean contemporary museum interior" },
        { angle: "Eye level front view", context: "Artistic luxury hallway with soft lighting" },
        { angle: "Straight front shot", context: "Parisian street aesthetic" },
        { angle: "Centered frontal shot", context: "White minimalist studio backdrop" },
        { angle: "High-end commercial angle", context: "Garden villa terrace background" }
    ];

    for(let i=0; i<options.numberOfImages; i++) {
        try {
            // Instantiate GoogleGenAI right before use to get latest process.env.API_KEY.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const scenario = photoshootScenarios[i % photoshootScenarios.length];
            const themeContext = options.theme.trim() || "Professional commercial fashion photoshoot";

            const prompt = `High-end Fashion Photoshoot. 
            Subject: A ${options.age} year old ${ethnicityPrompt} ${genderEn} model (${beautyTerms}, friendly smiling expression, fair white skin) wearing this ${options.clothingType}.
            Camera Perspective: ${scenario.angle}. 
            CRITICAL DIRECTION: The model MUST be FACING DIRECTLY TOWARDS THE CAMERA at all times.
            Pose & Action: ${poseDetail}.
            Setting: ${scenario.context}. Theme variation: ${themeContext}.
            Additional details: ${options.additionalPrompt || 'None'}.
            Composition: Full model visibility, the model is always centered in the frame.
            Lighting: Professional bright lighting, high-key, clear colors.
            Quality: 4k resolution, ultra-sharp focus, detailed fabric texture, fair white skin texture, photorealistic, 8k uhd.`;

             const response = await ai.models.generateContent({
                model,
                contents: {
                    parts: [
                        fileToPart(base64Image, mimeType),
                        { text: prompt }
                    ]
                }
            });
            
            let imageUrl = "";
            if(response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        imageUrl = `data:image/jpeg;base64,${part.inlineData.data}`;
                        break; 
                    }
                }
            }
            
            if (imageUrl) {
                 let videoPrompt = "";
                 if (options.generateVideo) {
                     const actionKeyword = isWalking ? "walking straight towards the camera in slow motion" : "posing elegantly while facing the camera directly";
                     videoPrompt = `Cinematic high-fashion video. A beautiful ${ethnicityPrompt} ${genderEn} model with fair skin wearing this ${options.clothingType}. 
                     Camera: Cinematic front-facing tracking shot. 
                     Action: The model is ${actionKeyword}. 
                     Visibility: The model stays fully visible in the center of the frame throughout the video. 
                     Setting: ${scenario.context}. 
                     Lighting: Golden hour soft lighting, 4k, slow motion, shallow depth of field, sharp fabric details, professional quality. No text, no blur.`;
                 }
                 results.push({ imageUrl, videoPrompt });
            }

        } catch (e) {
            console.error(`Error generating photoshoot image ${i+1}:`, e);
        }
    }
    
    if (results.length === 0) {
        throw new Error("Không thể tạo bộ ảnh. Vui lòng thử lại.");
    }
    return results;
}

export const enhanceImage = async (base64Image: string, mimeType: string, options: EnhanceOptions, modelLevel: ModelLevel): Promise<string> => {
    try {
        // Instantiate GoogleGenAI right before use to get latest process.env.API_KEY.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = getImageModel(modelLevel);
        let promptInstructions = "";
        if (options.upscale) promptInstructions += "Upscale to high resolution (2K), improve clarity and definition. ";
        if (options.sharpen) promptInstructions += "Sharpen details, fix softness or blur, enhance focus. ";
        if (options.removeWatermark) promptInstructions += "Remove any watermarks, text, or logos overlaid on the image, filling the area naturally. ";
        
        const prompt = `Enhance this image based on the following instructions: ${promptInstructions}. 
        General Quality: 2k resolution, ultra-sharp focus, natural bright colors, photorealistic, high fidelity. Maintain the original subject identity and clothing details exactly.`;

        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    fileToPart(base64Image, mimeType),
                    { text: prompt }
                ]
            }
        });

        if(response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return part.inlineData.data;
                }
            }
        }
        throw new Error("No image returned from enhancement model.");
    } catch (e) {
        console.error("Enhance Image Error", e);
        throw new Error("Không thể nâng cấp ảnh. Vui lòng thử lại.");
    }
}

export const generateReviewScript = async (options: ReviewScriptOptions, modelLevel: ModelLevel): Promise<ReviewScriptResult> => {
    try {
        // Instantiate GoogleGenAI right before use to get latest process.env.API_KEY.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = getTextModel(modelLevel);
        const prompt = `Write a short, catchy 3-sentence video review script (TikTok/Shorts style) for this product.
        Product Info: ${options.productInfo}.
        Type: ${options.scriptType}.
        Accent/Regional Dialect: ${options.accent} (Use authentic local vocabulary).
        Structure:
        1. Hook (Capture attention in 2 seconds)
        2. Body (Key benefit/feature in 1 sentence)
        3. CTA (Call to action)
        
        Output JSON format: { "hook": "...", "body": "...", "cta": "..." }`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                 responseMimeType: "application/json"
            }
        });
        
        const text = response.text || "{}";
        return JSON.parse(text) as ReviewScriptResult;

    } catch (e) {
        console.error("Generate Script Error", e);
        throw new Error("Không thể tạo kịch bản. Vui lòng thử lại.");
    }
}

export const removeBackground = async (base64Image: string, mimeType: string): Promise<string> => {
     try {
        // Instantiate GoogleGenAI right before use to get latest process.env.API_KEY.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Remove the background of this image and return the subject on a pure white background. High precision edges.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    fileToPart(base64Image, mimeType),
                    { text: prompt }
                ]
            }
        });

        if(response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return part.inlineData.data;
                }
            }
        }
        throw new Error("No image returned.");
    } catch (e) {
        console.error("Remove Background Error", e);
        throw new Error("Không thể xóa nền.");
    }
}

export const generateVideoPrompt = async (base64Image: string, mimeType: string, options: VideoPromptOptions, voiceover: string, modelLevel: ModelLevel): Promise<string> => {
    try {
        // Instantiate GoogleGenAI right before use to get latest process.env.API_KEY.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = getTextModel(modelLevel);
        const prompt = `Act as an expert Video Director. Create a high-quality video generation prompt for Veo/Sora based on this product image and info.
        Product Info: ${options.productInfo}.
        Target Audience: ${options.targetAudience}.
        Video Style: ${options.videoStyle}.
        Voiceover Context: "${voiceover}".
        Keep it under 100 words in English.`;

        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    fileToPart(base64Image, mimeType),
                    { text: prompt }
                ]
            }
        });
        return response.text || "";
    } catch (e) {
         console.error("Generate Video Prompt Error", e);
         throw new Error("Không thể tạo prompt video.");
    }
}

export const generateVoiceoverScript = async (options: VideoPromptOptions, style: VoiceoverStyle, modelLevel: ModelLevel): Promise<string> => {
    try {
        // Instantiate GoogleGenAI right before use to get latest process.env.API_KEY.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = getTextModel(modelLevel);
        const prompt = `Write a short 30-second voiceover script (in Vietnamese) for a video ad about this product: ${options.productInfo}.
        Style: ${style}.
        Audience: ${options.targetAudience}.`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });
        return response.text || "";
    } catch (e) {
        console.error("Generate Voiceover Error", e);
        throw new Error("Không thể tạo kịch bản giọng đọc.");
    }
}

export const generateSpeech = async (text: string, voiceName: string, isSSML: boolean = false): Promise<Blob> => {
    try {
        // Instantiate GoogleGenAI right before use to get latest process.env.API_KEY.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = isSSML ? text : `Read the following text in Vietnamese naturally, with emotion: "${text}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName }
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data");

        const pcmBuffer = base64ToArrayBuffer(base64Audio);
        return pcmToWav(pcmBuffer, 24000, 1);
    } catch (e) {
        console.error("Generate Speech Error", e);
        throw new Error("Không thể tạo giọng nói.");
    }
}
