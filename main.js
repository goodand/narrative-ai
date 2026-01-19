import './style.css';
import ExifReader from 'exifreader';

// 1. API Key 설정 (Vite 환경 변수 사용)
const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;

// 2. DOM 요소 참조
const els = {
    input: document.getElementById('image-input'),
    dropZone: document.getElementById('drop-zone'),
    preview: document.getElementById('image-preview'),
    container: document.getElementById('preview-container'),
    placeholder: document.getElementById('upload-placeholder'),
    genBtn: document.getElementById('generate-btn'),
    btnText: document.getElementById('btn-text'),
    loader: document.getElementById('btn-loader'),
    resArea: document.getElementById('result-area'),
    captionInt: document.getElementById('caption-interactive'),
    captionEdit: document.getElementById('caption-edit'),
    editBtn: document.getElementById('edit-btn'),
    error: document.getElementById('error-msg'),
    lang: document.getElementById('language-select'),
    style: document.getElementById('style-select'),
    copy: document.getElementById('copy-btn'),
    mod: {
        sug: document.getElementById('suggestion-modal'),
        set: document.getElementById('settings-modal'),
        sugList: document.getElementById('suggestion-list'),
        sysIn: document.getElementById('system-prompt-input')
    }
};

// 3. 앱 상태 관리
let state = { 
    base64: null, 
    meta: {}, 
    currentData: null, 
    sns: "Instagram", 
    sysPrompt: "You are narrative AI. Help users tell stories using image metadata. Use emojis and platform-appropriate tone." 
};

// --- 초기 설정 및 이벤트 바인딩 ---

console.log("Vite 프로젝트가 성공적으로 로드되었습니다.");
if (apiKey) {
    console.log("API Key 로드 성공");
} else {
    console.warn("API Key를 찾을 수 없습니다. .env 파일의 VITE_GEMINI_API_KEY를 확인해주세요.");
}

// SNS 선택 토글 이벤트
document.querySelectorAll('.sns-item').forEach(item => {
    item.onclick = () => {
        document.querySelectorAll('.sns-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active'); 
        state.sns = item.dataset.value;
    };
});

// 설정 모달 핸들러
const openSettings = document.getElementById('open-settings');
const closeSettings = document.getElementById('close-settings');
const saveSettings = document.getElementById('save-settings');

if (openSettings) openSettings.onclick = () => els.mod.set.classList.remove('hidden');
if (closeSettings) closeSettings.onclick = () => els.mod.set.classList.add('hidden');
if (saveSettings) {
    saveSettings.onclick = () => {
        if(els.mod.sysIn.value.trim()) state.sysPrompt = els.mod.sysIn.value.trim();
        els.mod.set.classList.add('hidden');
    };
}

// 이미지 업로드 핸들러
els.dropZone.onclick = () => els.input.click();
els.input.onchange = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); };

// 4. 파일 처리 및 메타데이터 추출 로직
async function handleFile(file) {
    // 초기화
    state.meta = {};
    
    // UI 요소 리셋 (구 정보 숨김 확인)
    ['meta-name', 'meta-size', 'meta-dim'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    try {
        // 1. ExifReader로 메타데이터 추출
        const tags = await ExifReader.load(file);
        
        // 날짜 정보 추출 (DateTimeOriginal)
        if (tags['DateTimeOriginal']) {
            // 포맷: "YYYY:MM:DD HH:MM:SS" -> "YYYY-MM-DD HH:MM"
            const rawDate = tags['DateTimeOriginal'].description;
            const formattedDate = rawDate.substring(0, 16).replace(/:/g, '-').replace(' ', 'T').replace('T', ' ');
            // 간단하게 YYYY:MM:DD 부분을 YYYY-MM-DD로 바꾸고 시간까지 표시
            const displayDate = rawDate.substring(0, 16).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
            
            const metaDateEl = document.getElementById('meta-date');
            metaDateEl.innerText = `📅 ${displayDate}`;
            metaDateEl.classList.remove('hidden');
            state.meta.date = displayDate;
        }

        // GPS 정보 추출
        if (tags['GPSLatitude'] && tags['GPSLongitude']) {
            // ExifReader는 description에 이미 보기 좋은 포맷을 제공하기도 하지만, 
            // 소수점 좌표로 변환하여 깔끔하게 표시
            // tags['GPSLatitude'].description -> "37, 33, 58.9" (배열 형태 값 기반) 
            
            const latVal = tags['GPSLatitude'].value; // [degrees, minutes, seconds]
            const lonVal = tags['GPSLongitude'].value;
            const latRef = tags['GPSLatitudeRef'] ? tags['GPSLatitudeRef'].value[0] : 'N';
            const lonRef = tags['GPSLongitudeRef'] ? tags['GPSLongitudeRef'].value[0] : 'E';

            const latDec = convertDMSToDecimal(latVal, latRef);
            const lonDec = convertDMSToDecimal(lonVal, lonRef);

            const metaGpsEl = document.getElementById('meta-gps');
            metaGpsEl.innerText = `📍 ${latDec.toFixed(4)}, ${lonDec.toFixed(4)}`;
            metaGpsEl.classList.remove('hidden');
            state.meta.gps = { lat: latDec, lon: lonDec };
        }

    } catch (error) {
        console.error("Metadata extraction error:", error);
        // 메타데이터 에러가 있어도 이미지는 계속 처리
    }

    // 2. 이미지 리사이징 및 미리보기 설정
    resizeImage(file).then(resized => {
        state.base64 = resized.base64;
        els.preview.src = resized.dataUrl;
        
        els.container.classList.remove('hidden'); 
        els.placeholder.classList.add('hidden');
    }).catch(err => {
        console.error("Image resize error:", err);
        showError("이미지 처리 중 오류가 발생했습니다.");
    });
}

// DMS(Degree, Minute, Second) -> Decimal 변환 함수
function convertDMSToDecimal(dms, ref) {
    if (!dms || dms.length < 3) return 0;
    
    // ExifReader might return numbers or arrays [numerator, denominator]
    // handle potential array structure if ExifReader returns rational numbers as arrays
    const d = Array.isArray(dms[0]) ? dms[0][0]/dms[0][1] : dms[0];
    const m = Array.isArray(dms[1]) ? dms[1][0]/dms[1][1] : dms[1];
    const s = Array.isArray(dms[2]) ? dms[2][0]/dms[2][1] : dms[2];

    let decimal = d + (m / 60) + (s / 3600);
    
    if (ref === 'S' || ref === 'W') {
        decimal = decimal * -1;
    }
    return decimal;
}

// 이미지 리사이징 함수 (Max-side + Area-preserving)
function resizeImage(file, maxSide = 1024, maxArea = 1024 * 1024) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let w = img.width;
            let h = img.height;
            
            // 1. Max-side limit (scale = K / max(W, H))
            let scaleSide = 1;
            if (Math.max(w, h) > maxSide) {
                scaleSide = maxSide / Math.max(w, h);
            }
            
            // 2. Area limit (scale = sqrt(P_max / (W * H)))
            let scaleArea = 1;
            if (w * h > maxArea) {
                scaleArea = Math.sqrt(maxArea / (w * h));
            }
            
            // 두 조건 중 더 엄격한(작은) 스케일 적용
            const scale = Math.min(scaleSide, scaleArea);
            
            w = Math.round(w * scale);
            h = Math.round(h * scale);
            
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            
            // JPEG 퀄리티 0.85로 변환
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85); 
            resolve({ 
                base64: dataUrl.split(',')[1], 
                dataUrl: dataUrl,
                w: w, 
                h: h 
            });
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// 5. Gemini AI API 호출
els.genBtn.onclick = async () => {
    if (!apiKey) { showError("API Key가 설정되지 않았습니다. .env 파일을 확인하세요."); return; }
    if (!state.base64) { showError("사진을 업로드해주세요."); return; }
    setLoading(true);

    // 프롬프트 구성 분리 및 가독성 개선
    const prompt = `
        Role: Professional Storyteller.
        Task: Create a compelling story based on the image metadata and visual context.
        Context:
          - Platform: ${state.sns}
          - Mood: ${els.style.value}
          - Language: ${els.lang.value}
          - Metadata: ${JSON.stringify(state.meta)}
        Output Requirement: Identify 3-4 key emotional words for synonyms.
        Format: JSON only. {"original_caption": "caption text here", "keywords": [{"word": "target_word", "suggestions": ["synonym1", "synonym2"]}]}
    `;

    try {
        const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt }, 
                        { inlineData: { mimeType: "image/jpeg", data: state.base64 } }
                    ] 
                }],
                systemInstruction: { parts: [{ text: state.sysPrompt }] },
                generationConfig: { responseMimeType: "application/json" }
            })
        });
        
        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text;
        
        // JSON 파싱 전처리 (Markdown 코드 블록 제거)
        const cleanedText = resultText.replace(/```json|```/g, '').trim();
        
        try {
            state.currentData = JSON.parse(cleanedText);
        } catch (e) {
            console.error("JSON Parse Error:", resultText);
            throw new Error("AI 응답을 처리하는 중 오류가 발생했습니다. (JSON 형식 불일치)");
        }
        
        renderCaption();
        els.resArea.classList.remove('hidden'); 
        els.resArea.scrollIntoView({ behavior: 'smooth' });
    } catch (err) { 
        showError("AI 생성 중 오류 발생: " + err.message); 
    } finally { 
        setLoading(false); 
    } 
};

// 6. 결과 렌더링 및 인터랙션 로직
function renderCaption() {
    let text = state.currentData.original_caption;
    // 긴 단어부터 치환하여 중복 치환 방지
    const sortedKeywords = [...state.currentData.keywords].sort((a,b) => b.word.length - a.word.length);
    
    sortedKeywords.forEach((item, i) => {
        const regex = new RegExp(`(${item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        text = text.replace(regex, `<span class="keyword-highlight" data-word="${item.word}">$1</span>`);
    });
    
    els.captionInt.innerHTML = `"${text}"`;
    els.captionEdit.value = state.currentData.original_caption;
    
    // 키워드 클릭 시 추천 모달 오픈
    document.querySelectorAll('.keyword-highlight').forEach(el => {
        el.onclick = () => {
            const wordData = state.currentData.keywords.find(k => k.word === el.dataset.word);
            if (wordData) openSugModal(wordData);
        };
    });
}

function openSugModal(data) {
    els.mod.sugList.innerHTML = '';
    data.suggestions.forEach(s => {
        const b = document.createElement('button');
        b.className = "w-full text-left p-4 hover:bg-[#E7FF68] rounded-xl font-bold border border-slate-100 mb-2 transition-colors";
        b.innerText = s;
        b.onclick = () => {
            state.currentData.original_caption = state.currentData.original_caption.replace(data.word, s);
            data.word = s; 
            renderCaption(); 
            els.mod.sug.classList.add('hidden');
        };
        els.mod.sugList.appendChild(b);
    });
    els.mod.sug.classList.remove('hidden');
}

// 7. 유틸리티 함수 (Retry, Loading, Error)
async function fetchWithRetry(url, opt, retries = 5, backoff = 1000) {
    const res = await fetch(url, opt);
    if (!res.ok && retries > 0) {
        await new Promise(r => setTimeout(r, backoff));
        return fetchWithRetry(url, opt, retries - 1, backoff * 2);
    }
    if (!res.ok) throw new Error(`서버 응답 오류: ${res.status}`);
    return res;
}

function setLoading(l) {
    els.genBtn.disabled = l; 
    els.loader.classList.toggle('hidden', !l);
    els.btnText.innerText = l ? "기억을 분석하는 중..." : "내 기억을 선명하게 하기";
}

function showError(m) {
    els.error.innerText = m; 
    els.error.classList.remove('hidden');
    setTimeout(() => els.error.classList.add('hidden'), 5000);
}

// 모달 닫기 이벤트
const closeModal = document.getElementById('close-modal');
if (closeModal) closeModal.onclick = () => els.mod.sug.classList.add('hidden');

// 복사 버튼 기능
els.copy.onclick = () => {
    const textToCopy = state.currentData ? state.currentData.original_caption : "";
    const tempInput = document.createElement("textarea");
    tempInput.value = textToCopy;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    
    const originalText = els.copy.innerText;
    els.copy.innerText = "복사 완료!";
    els.copy.classList.add("bg-[#E7FF68]");
    setTimeout(() => {
        els.copy.innerText = originalText;
        els.copy.classList.remove("bg-[#E7FF68]");
    }, 2000);
};