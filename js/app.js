const translations = {
    en: {
        title: "Meta JSON Viewer",
        selectFile: "Select a Meta JSON file to load",
        allowMedia: "Load MEDIA folder",
        mediaTips: "To view images or videos, click the button and select the folder containing them.",
        perspective: "View from the perspective of:",
        customization: "Customization",
        showMyName: "Show my name",
        showTheirName: "Show their name",
        showTime: "Show timestamps",
        showReacts: "Show reactions",
        export: "Export",
        exportPdf: "Export to PDF (Local Print)",
        exportHint: "Uses local browser print for reliable offline PDF saving.",
        searchMsg: "Search messages",
        searchPlaceholder: "(supports fuzzy, no-diacritics)",
        searchBtn: "Search",
        clearBtn: "Clear",
        idle: "Idle",
        darkMode: "Dark mode",
        language: "Language",
        conversation: "Conversation:",
        noData: "No data available",
        loading: "Loading...",
        loadingMessages: "Loading messages...",
        processingMedia: "Processing media..."
    },
    ar: {
        title: "عارض JSON الخاص بـ Meta",
        selectFile: "حدد ملف JSON الخاص بـ Meta للتحميل",
        allowMedia: "تحميل مجلد الوسائط",
        mediaTips: "لعرض الصور أو الفيديوهات، اضغط على الزر وحدد المجلد الذي يحتوي عليها.",
        perspective: "العرض من منظور:",
        customization: "التخصيص",
        showMyName: "إظهار اسمي",
        showTheirName: "إظهار اسمهم",
        showTime: "إظهار الطابع الزمني",
        showReacts: "إظهار التفاعلات",
        export: "تصدير",
        exportPdf: "تصدير إلى PDF (طباعة محلية)",
        exportHint: "يستخدم متصفح الطباعة المحلي لحفظ ملفات PDF دون اتصال بالإنترنت.",
        searchMsg: "بحث في الرسائل",
        searchPlaceholder: "(يدعم البحث التقريبي بدون تشكيل)",
        searchBtn: "بحث",
        clearBtn: "مسح",
        idle: "خامل",
        darkMode: "الوضع الداكن",
        language: "اللغة",
        conversation: "المحادثة:",
        noData: "لا توجد بيانات متاحة",
        loading: "جاري التحميل...",
        loadingMessages: "جاري تحميل الرسائل...",
        processingMedia: "جاري معالجة الوسائط..."
    },
    ja: {
        title: "Meta JSON ビューア",
        selectFile: "読み込む Meta JSON ファイルを選択",
        allowMedia: "MEDIA フォルダを読み込む",
        mediaTips: "画像や動画を表示するには、ボタンをクリックしてそれらを含むフォルダを選択してください。",
        perspective: "次の視点から表示:",
        customization: "カスタマイズ",
        showMyName: "自分の名前を表示",
        showTheirName: "相手の名前を表示",
        showTime: "タイムスタンプを表示",
        showReacts: "リアクションを表示",
        export: "エクスポート",
        exportPdf: "PDFにエクスポート (ローカル印刷)",
        exportHint: "ブラウザのローカル印刷機能を使用してPDFとして保存します。",
        searchMsg: "メッセージを検索",
        searchPlaceholder: "(あいまい検索、ダイアクリティカルマークなし対応)",
        searchBtn: "検索",
        clearBtn: "クリア",
        idle: "待機中",
        darkMode: "ダークモード",
        language: "言語",
        conversation: "会話:",
        noData: "データがありません",
        loading: "読み込み中...",
        loadingMessages: "メッセージを読み込んでいます...",
        processingMedia: "メディアを処理しています..."
    }
};

function setLanguage(lang) {
    if (!translations[lang]) lang = 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    try { storageSet('ui_lang', lang); } catch(e) {}

    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerText = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });

    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = lang;
}

const langSelect = document.getElementById('langSelect');
langSelect?.addEventListener('change', (e) => {
    setLanguage(e.target.value);
});

try {
    const savedLang = storageGet('ui_lang') || 'en';
    setLanguage(savedLang);
} catch(e) {
    setLanguage('en');
}

document.getElementById("fileInput").addEventListener("change", handleFileUpload);

let currentJsonFileName = null;
let currentJsonFileSize = null;
let currentJsonFileModified = null;
const CHUNK_SIZE = 50;
let renderedMessages = new Map();
let observer = null;

const STORAGE_PREFIX = 'm_json_viewer_' + (window.location.hostname || 'local') + '_';

function setCookie(name, value, days = 365) {
    try {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
    } catch(e) {}
}

function getCookie(name) {
    try {
        const cookies = document.cookie ? document.cookie.split('; ') : [];
        for (let c of cookies) {
            const [k,v] = c.split('=');
            if (decodeURIComponent(k) === name) return decodeURIComponent(v || '');
        }
    } catch(e) {}
    return null;
}

function storageSet(key, value) {
    const k = STORAGE_PREFIX + key;
    try { localStorage.setItem(k, String(value)); return; } catch(e) {}
    try { setCookie(k, String(value)); } catch(e) {}
}

function storageGet(key) {
    const k = STORAGE_PREFIX + key;
    try { const v = localStorage.getItem(k); if (v !== null) return v; } catch(e) {}
    try { const v = getCookie(k); if (v !== null) return v; } catch(e) {}
    return null;
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (currentJsonFileName && (currentJsonFileName !== file.name || currentJsonFileSize !== file.size || currentJsonFileModified !== file.lastModified)) {
        try { __searchIndex = null; } catch(e){}
        try { if (searchInput) searchInput.value = ''; } catch(e){}
        try { if (searchResultsEl) searchResultsEl.innerHTML = ''; } catch(e){}
        try {
            if (searchProgress) {
                searchProgress.querySelector('.fill').style.width = '0%';
                searchProgress.querySelector('.progress-text').innerText = translations[document.documentElement.lang || 'en'].idle;
                searchProgress.style.display = 'none';
            }
        } catch(e){}
    }

    currentJsonFileName = file.name;
    currentJsonFileSize = file.size;
    currentJsonFileModified = file.lastModified;

    const options = document.getElementsByClassName("options")[0];
    const loading = document.getElementById("loading");
    const chatContainer = document.getElementById("chat");

    options.style.display = "block";
    loading.innerHTML = translations[document.documentElement.lang || 'en'].loading;
    loading.style.display = "flex";
    chatContainer.scrollTop = 0;
    chatContainer.innerHTML = "";

    const reader = new FileReader();
    reader.onload = (e) => processFileContent(e.target.result);
    reader.readAsText(file, 'utf-8');
}

function processFileContent(content) {
    try {
        let data;
        const isThreadPathFormat = content.includes('"thread_path"');

        if (isThreadPathFormat) {
            const replaced = content.replace(/\\u00([a-f0-9]{2})|\\u([a-f0-9]{4})/gi, (match, p1, p2) => {
                const code = p1 ? parseInt(p1, 16) : parseInt(p2, 16);
                return String.fromCharCode(code);
            });
            const decoded = decodeURIComponent(escape(replaced));
            data = JSON.parse(decoded);
            data.messages = data.messages.reverse();
        } else {
            data = JSON.parse(content);
        }
        setupChatInterface(data);
    } catch (error) {
        alert("Invalid JSON file!");
    }
}

function setupChatInterface(data) {
    window.currentChatData = data;
    __searchIndex = null;

    const participants = data.participants.map(p => (typeof p === 'string' ? p : p.name));
    const threadName = data.threadName || data.title || data.threadPath || "Untitled";

    document.getElementById("threadName").innerText = threadName;
    setupRadioButtons(participants);

    let selectedValue = (document.querySelector('input[name="choice"]:checked') || {}).value;

    setupCheckboxListeners();
    renderMessages(data, selectedValue);
}

function getSelectedPerspective() {
    return (document.querySelector('input[name="choice"]:checked') || {}).value;
}

function setupRadioButtons(participants) {
    const radioForm = document.getElementById("radioForm");
    radioForm.innerHTML = "";
    const saved = (storageGet('selectedPerspective') || null);
    participants.forEach((participant, index) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        
        input.type = "radio";
        input.name = "choice";
        input.id = `option${index + 1}`;
        input.value = participant;
        if (saved && saved === participant) input.checked = true;
        else if (!saved && index === 0) input.checked = true;

        input.addEventListener('change', () => {
            try { storageSet('selectedPerspective', input.value); } catch(e){}
            if (window.currentChatData) renderMessages(window.currentChatData, input.value);
        });

        label.appendChild(input);
        label.appendChild(document.createTextNode(` ${participant}`));
        
        radioForm.appendChild(label);
    });
}

function setupCheckboxListeners() {
    const checkboxConfig = [
        { id: "showTime", class: ".timestamp" },
        { id: "showMyName", class: ".from-me .sender-name" },
        { id: "showTheirName", class: ".from-them .sender-name" },
        { id: "showReacts", class: ".reaction" }
    ];

    checkboxConfig.forEach(({ id, class: className }) => {
        const input = document.getElementById(id);
        if (!input) return;
        try {
            const saved = storageGet('ui_' + id);
            if (saved !== null) {
                input.checked = saved === '1';
            }
        } catch(e) {}

        input.addEventListener("change", function() {
            const elements = document.querySelectorAll(className);
            elements.forEach(el => el.style.display = this.checked ? "block" : "none");
            try { storageSet('ui_' + id, this.checked ? '1' : '0'); } catch(e){}
        });

        input.dispatchEvent(new Event('change'));
    });
}

function renderMessages(data, selectedValue) {
    const chatContainer = document.getElementById("chat");
    const loading = document.getElementById("loading");
    
    chatContainer.style.display = "none";
    loading.innerHTML = translations[document.documentElement.lang || 'en'].loadingMessages;
    loading.style.display = "flex";
    
    if (observer) {
        observer.disconnect();
    }
    
    renderedMessages.clear();
    chatContainer.innerHTML = "";
    
    if (!data.messages.length) {
        loading.innerHTML = "No messages";
        chatContainer.style.display = "block";
        return;
    }

    const messageChunks = chunkArray(data.messages, CHUNK_SIZE);
    
    messageChunks.forEach((chunk, index) => {
        const chunkContainer = document.createElement("div");
        chunkContainer.classList.add("message-chunk");
        chunkContainer.dataset.chunkIndex = index;
        chatContainer.appendChild(chunkContainer);
    });

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chunkIndex = parseInt(entry.target.dataset.chunkIndex);
                renderChunk(chunkIndex, messageChunks[chunkIndex], selectedValue);
            }
        });
    }, {
        root: chatContainer,
        threshold: 0.1,
        rootMargin: "200px"
    });

    document.querySelectorAll(".message-chunk").forEach(chunk => {
        observer.observe(chunk);
    });

    setTimeout(() => {
        loading.style.display = "none";
        chatContainer.style.display = "block";
    }, 100);
}

let mediaFiles = {};
let mediaTypes = {};
const mediaFolderInput = document.getElementById("mediaFolder");

mediaFolderInput.addEventListener("change", function(event) {
    const files = event.target.files;
    if (!files.length) return;

    const chatContainer = document.getElementById("chat");
    const loading = document.getElementById("loading");
    chatContainer.style.display = "none";
    loading.innerHTML = translations[document.documentElement.lang || 'en'].processingMedia;
    loading.style.display = "flex";

    processMediaFiles(files).then(() => {
        if (window.currentChatData) {
            renderMessages(window.currentChatData, 
                document.querySelector('input[name="choice"]:checked').value);
            loading.style.display = "none";
            chatContainer.style.display = "block";
        }
    });
});

async function processMediaFiles(files) {
    const BATCH_SIZE = 20;
    const fileArray = Array.from(files);
    
    resetMedia();
    
    for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
        const batch = fileArray.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(file => {
            return new Promise(resolve => {
                const fileURL = URL.createObjectURL(file);
                const relativePath = file.webkitRelativePath || file.name;
                mediaFiles[relativePath] = fileURL;
                mediaTypes[relativePath] = getMediaType(file.name);
                resolve();
            });
        }));
    }
}

function resetMedia() {
    Object.values(mediaFiles).forEach(url => URL.revokeObjectURL(url));
    mediaFiles = {};
    mediaTypes = {};
}

function getMediaType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
    if (["mp4", "webm", "ogg"].includes(extension)) return "video";
    if (["mp3", "wav", "aac", "ogg"].includes(extension)) return "audio";
    return "unknown";
}

function buildNormalizedMap(original) {
    const mapping = [];
    let normalized = '';
    for (let i = 0; i < original.length; i++) {
        const ch = original[i];
        const n = ch.normalize('NFD').replace(/\p{Diacritic}/gu, '');
        for (let k = 0; k < n.length; k++) {
            mapping.push(i);
            normalized += n[k];
        }
    }
    return { normalized: normalized.toLowerCase(), mapping };
}

function findRangesForToken(original, tokenNorm) {
    const { normalized, mapping } = buildNormalizedMap(original);
    const ranges = [];
    let start = 0;
    while (true) {
        const idx = normalized.indexOf(tokenNorm, start);
        if (idx === -1) break;
        const origStart = mapping[idx];
        const origEnd = mapping[idx + tokenNorm.length - 1] + 1;
        ranges.push([origStart, origEnd]);
        start = idx + tokenNorm.length;
    }
    return ranges;
}

function mergeRanges(ranges) {
    if (!ranges.length) return [];
    ranges.sort((a,b)=>a[0]-b[0]);
    const out = [ranges[0].slice()];
    for (let i = 1; i < ranges.length; i++) {
        const cur = ranges[i];
        const last = out[out.length-1];
        if (cur[0] <= last[1]) {
            last[1] = Math.max(last[1], cur[1]);
        } else out.push(cur.slice());
    }
    return out;
}

function highlightText(original, query) {
    if (!query || !original) return escapeHtml(original);
    const qNorm = normalizeForSearch(query);
    const tokens = qNorm.split(' ').filter(Boolean);
    if (!tokens.length) return escapeHtml(original);

    let allRanges = [];
    for (const t of tokens) {
        const ranges = findRangesForToken(original, t);
        allRanges = allRanges.concat(ranges);
    }
    if (!allRanges.length) return escapeHtml(original);
    const merged = mergeRanges(allRanges);
    let out = '';
    let lastIdx = 0;
    for (const [s,e] of merged) {
        out += escapeHtml(original.slice(lastIdx, s));
        out += '<strong>' + escapeHtml(original.slice(s, e)) + '</strong>';
        lastIdx = e;
    }
    out += escapeHtml(original.slice(lastIdx));
    return out;
}

function createMessageHTML(msg, highlightQuery) {
    const sender = msg.senderName || msg.sender_name || "Unknown";
    const rawText = msg.text || msg.content || "";
    const text = highlightQuery ? highlightText(String(rawText), highlightQuery) : escapeHtml(String(rawText));
    const timestamp = msg.timestamp || msg.timestamp_ms || 0;
    const mediaItems = [].concat(
        msg.media || [],
        msg.photos || [],
        msg.videos || [],
        msg.audio || [],
        msg.audio_files || [],
        msg.gifs || []
    );

    return `
        <div class="sender-name">${escapeHtml(sender)}</div>
        <div class="message-content">
            ${text}
            ${mediaItems.map(media => {
                const fileName = media.uri.split(/[\\\/]/).pop().toLowerCase();
                const matchingFile = Object.keys(mediaFiles).find(f => f.toLowerCase().endsWith(fileName));
                const fileURL = matchingFile ? mediaFiles[matchingFile] : null;
                const extension = fileName.split('.').pop().toLowerCase();
                const mediaType = extension === "mp4" ? "video" : (matchingFile ? mediaTypes[matchingFile] : getMediaType(fileName));

                if (mediaType === "image") {
                    return fileURL 
                        ? `<a href="${fileURL}" target="_blank" class="media-preview"><img src="${fileURL}" alt="Image" class="preview"></a>`
                        : `[ Image not found ]`;
                } else if (mediaType === "video") {
                    return fileURL
                        ? `<a href="${fileURL}" target="_blank" class="media-preview"><video controls class="preview-video"><source src="${fileURL}" type="video/mp4"></video></a>`
                        : `[ Video not found ]`;
                } else if (mediaType === "audio") {
                    return fileURL
                        ? `<audio controls><source src="${fileURL}" type="audio/mpeg"></audio>`
                        : `[ Audio not found ]`;
                }
                return `[ Media not found ]`;
            }).join("")}
            ${msg.reactions?.length ? `<div class="reaction">${msg.reactions.map(r => `${escapeHtml(r.actor)}: ${escapeHtml(r.reaction)}`).join(", ")}</div>` : ""}
            <div class="timestamp">${new Date(timestamp).toLocaleString()}</div>
        </div>
    `;
}

function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

window.addEventListener("beforeunload", () => {
    if (observer) observer.disconnect();
    Object.values(mediaFiles).forEach(url => URL.revokeObjectURL(url));
    renderedMessages.clear();
});

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResultsEl = document.getElementById('searchResults');
const searchProgress = document.getElementById('searchProgress');

if (searchResultsEl) searchResultsEl.style.display = 'none';

function normalizeForSearch(str) {
    if (!str) return '';
    const normalized = str.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return normalized.toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildSearchIndex(messages) {
    const idx = [];
    for (let i = 0; i < messages.length; i++) {
        const m = messages[i];
        const parts = [];
        if (m.text) parts.push(typeof m.text === 'string' ? m.text : (m.content || ''));
        if (m.content) parts.push(m.content);
        if (m.senderName) parts.push(m.senderName);
        if (m.reactions && m.reactions.length) parts.push(m.reactions.map(r => r.reaction + ' ' + (r.actor||'')).join(' '));
        const mediaItems = [].concat(m.media || [], m.photos || [], m.videos || [], m.audio || [], m.audio_files || [], m.gifs || []);
        mediaItems.forEach(mi => { if (mi && mi.uri) parts.push(mi.uri); });

        const text = parts.join(' ');
        idx.push({ text, normalized: normalizeForSearch(text), sender: m.senderName || m.sender_name || 'Unknown', timestamp: m.timestamp || m.timestamp_ms || 0, idx: i });
    }
    return idx;
}

function fuzzyScore(query, target) {
    if (!query || !target) return 0;
    if (target.includes(query)) return 100 + Math.min(50, query.length);

    const qTokens = query.split(' ');
    const tTokens = target.split(' ');
    let overlap = 0;
    for (const qt of qTokens) {
        for (const tt of tTokens) {
            if (tt.includes(qt) || qt.includes(tt)) { overlap += 1; break; }
        }
    }
    return overlap * 10;
}

async function performSearch(query, index, onProgress) {
    const results = [];
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery) return results;

    const BATCH = 500;
    for (let i = 0; i < index.length; i += BATCH) {
        const batch = index.slice(i, i + BATCH);
        for (const item of batch) {
            const score = fuzzyScore(normalizedQuery, item.normalized);
            if (score > 0) results.push({ score, item });
        }
        if (onProgress) onProgress(Math.min(100, Math.round(((i + BATCH) / index.length) * 100)));
        await new Promise(r => setTimeout(r, 0));
    }
    results.sort((a,b) => b.score - a.score);
    return results;
}

let __searchIndex = null;

searchBtn?.addEventListener('click', startSearch);
searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') startSearch(); });
const clearSearchBtn = document.getElementById('clearSearchBtn');
clearSearchBtn?.addEventListener('click', clearSearch);

let _highlightTimeout = null;
searchInput?.addEventListener('input', () => {
    clearTimeout(_highlightTimeout);
    _highlightTimeout = setTimeout(() => {
        const q = (searchInput.value || '').trim();
        if (!q) {
            if (searchResultsEl) searchResultsEl.style.display = 'none';
        }
        updateHighlightsAcrossDOM(q);
    }, 250);
});

async function startSearch() {
    const q = searchInput.value || '';
    if (!window.currentChatData || !window.currentChatData.messages) return;

    if (!__searchIndex) {
        searchProgress.style.display = 'flex';
        searchProgress.querySelector('.progress-text').innerText = 'Indexing...';
        await new Promise(r => setTimeout(r, 0));
        __searchIndex = buildSearchIndex(window.currentChatData.messages);
    }

    searchProgress.style.display = 'flex';
    searchProgress.querySelector('.fill').style.width = '0%';
    searchProgress.querySelector('.progress-text').innerText = 'Searching...';
    searchResultsEl.innerHTML = '';
    if (searchResultsEl) searchResultsEl.style.display = 'block';

    const results = await performSearch(q, __searchIndex, (p) => {
        searchProgress.querySelector('.fill').style.width = p + '%';
        searchProgress.querySelector('.progress-text').innerText = `Searching ${p}%`;
    });

    searchProgress.querySelector('.fill').style.width = '100%';
    searchProgress.querySelector('.progress-text').innerText = `Found ${results.length} matches`;
    setTimeout(()=>{ searchProgress.style.display = 'none'; }, 800);

    if (!results.length) {
        searchResultsEl.innerHTML = '<div class="search-result-item">No results</div>';
        return;
    }

    const maxResults = Math.min(50, results.length);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < maxResults; i++) {
        const r = results[i];
        const el = document.createElement('div');
        el.className = 'search-result-item';
        el.dataset.idx = r.item.idx;
        const time = new Date(r.item.timestamp).toLocaleString();
        const originalMsg = (window.currentChatData && window.currentChatData.messages && window.currentChatData.messages[r.item.idx]) || null;
        const rawText = originalMsg ? (originalMsg.text || originalMsg.content || '') : (r.item.text || '');
        const rawSnippet = String(rawText).slice(0, 240);
        const highlightedSnippet = highlightText(rawSnippet, q);
        el.innerHTML = `<div class="snippet">${highlightedSnippet}</div><div class="meta">${escapeHtml(r.item.sender)} • ${time}</div>`;
        el.addEventListener('click', () => jumpToMessage(r.item.idx));
        frag.appendChild(el);
    }
    searchResultsEl.appendChild(frag);
    updateHighlightsAcrossDOM(q);
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" })[c]); }

async function jumpToMessage(messageIndex) {
    const chunkIndex = Math.floor(messageIndex / CHUNK_SIZE);
    const chunkContainer = document.querySelector(`.message-chunk[data-chunk-index="${chunkIndex}"]`);
    if (chunkContainer && !renderedMessages.has(chunkIndex)) {
        const start = chunkIndex * CHUNK_SIZE;
        const msgs = window.currentChatData.messages.slice(start, start + CHUNK_SIZE);
        renderChunk(chunkIndex, msgs, document.querySelector('input[name="choice"]:checked').value);
    }

    await new Promise(r => setTimeout(r, 20));

    const msgEl = document.querySelector(`.message[data-msg-index="${messageIndex}"]`);
    if (!msgEl) return;
    await scrollAndHighlight(msgEl);
}

function clearSearch() {
    if (searchInput) searchInput.value = '';
    searchResultsEl.innerHTML = '';
    if (searchResultsEl) searchResultsEl.style.display = 'none';
    if (searchProgress) {
        searchProgress.querySelector('.fill').style.width = '0%';
        searchProgress.querySelector('.progress-text').innerText = translations[document.documentElement.lang || 'en'].idle;
        searchProgress.style.display = 'none';
    }
    updateHighlightsAcrossDOM('');
}

function updateHighlightsAcrossDOM(query) {
    const msgEls = document.querySelectorAll('.message');
    const q = query || '';
    msgEls.forEach(el => {
        const contentEl = el.querySelector('.message-content');
        if (!contentEl) return;
        const clone = contentEl.cloneNode(true);
        const mediaEls = clone.querySelectorAll('.media-preview, audio, .preview, .reaction, .timestamp');
        mediaEls.forEach(n => n.remove());
        const strongs = clone.querySelectorAll('strong');
        strongs.forEach(s => {
            const txt = document.createTextNode(s.textContent);
            s.parentNode.replaceChild(txt, s);
        });
        const plain = clone.textContent || '';
        const newHTML = highlightText(plain, q);
        const originalContent = contentEl;
        const extras = [];
        const seen = new Set();
        originalContent.querySelectorAll('.media-preview, audio, .reaction, .timestamp').forEach(n => {
            const html = n.outerHTML;
            if (!seen.has(html)) {
                seen.add(html);
                extras.push(html);
            }
        });
        originalContent.innerHTML = newHTML + extras.join('');
    });
}

function scrollIntoViewWithPadding(container, element, padding = 60) {
    const containerRect = container.getBoundingClientRect();
    const elRect = element.getBoundingClientRect();
    const offset = (elRect.top - containerRect.top) - padding;
    container.scrollTop += offset;
}

async function scrollAndHighlight(el) {
    const chatContainer = document.getElementById('chat');
    scrollIntoViewWithPadding(chatContainer, el, 120);
    el.classList.add('highlight-target');
    el.classList.add('temporary-highlight');
    setTimeout(() => { el.classList.remove('temporary-highlight'); }, 2200);
}

function renderChunk(chunkIndex, messages, selectedValue) {
    const chunkContainer = document.querySelector(`.message-chunk[data-chunk-index="${chunkIndex}"]`);
    if (!chunkContainer || renderedMessages.has(chunkIndex)) return;

    const highlightQuery = (searchInput && searchInput.value) ? searchInput.value : '';
    messages.forEach((msg, localIdx) => {
        const globalIdx = chunkIndex * CHUNK_SIZE + localIdx;
        const div = document.createElement("div");
        const sender = msg.senderName || msg.sender_name || "Unknown";
        div.classList.add("message", sender === selectedValue ? "from-me" : "from-them");
        div.dataset.msgIndex = globalIdx;
        try { div.__rawMessage = msg; } catch(e) {}
        div.innerHTML = createMessageHTML(msg, highlightQuery);
        chunkContainer.appendChild(div);
    });

    renderedMessages.set(chunkIndex, true);
    ["showTime", "showMyName", "showTheirName", "showReacts"].forEach(id => {
        document.getElementById(id)?.dispatchEvent(new Event("change"));
    });
}

const globalSettingsBtn = document.getElementById('globalSettingsBtn');
const globalSettingsMenu = document.getElementById('globalSettingsMenu');

globalSettingsBtn?.addEventListener('click', (e) => {
    const isOpen = globalSettingsMenu && globalSettingsMenu.getAttribute('aria-hidden') === 'false';
    if (globalSettingsMenu) globalSettingsMenu.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    if (globalSettingsBtn) globalSettingsBtn.classList.toggle('open', !isOpen);
    globalSettingsBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
});

const exportPdfBtn = document.getElementById('exportPdfBtn');
exportPdfBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!window.currentChatData || !window.currentChatData.messages) {
        alert("Please load a Meta JSON conversation first.");
        return;
    }
    window.print();
});