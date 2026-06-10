// sticker-emoji.js - 修复导入重复弹窗
import { escapeHtml, readFileAsBase64 } from './utils.js';
import { saveMyStickers, saveOtherStickers, saveEmojis } from './data.js';
import { showModal, closeAllModals } from './ui-helpers.js';

// 防止重复导入的标志
let isImporting = false;

export async function addMyStickers(files) {
    if (isImporting) {
        alert('正在处理上一组图片，请稍后再试');
        return;
    }
    if (!files || files.length === 0) {
        alert('没有选择文件');
        return;
    }
    isImporting = true;
    try {
        let added = 0;
        let errors = 0;
        for (let file of files) {
            if (!file.type.startsWith('image/')) continue;
            try {
                const base64 = await readFileAsBase64(file);
                window.myStickers.push({
                    id: Date.now() + '_' + Math.random(),
                    dataURL: base64
                });
                added++;
            } catch(e) {
                console.warn(e);
                errors++;
            }
        }
        if (added > 0) {
            saveMyStickers();
            renderMyStickersList();
            const pickerModal = document.getElementById('stickerPickerModal');
            if (pickerModal && pickerModal.style.display === 'flex') renderStickerPicker();
            alert(`✅ 成功添加 ${added} 张表情包` + (errors ? `，${errors} 张失败` : ''));
        } else {
            alert('❌ 没有有效的图片文件，或文件无法读取');
        }
    } finally {
        isImporting = false;
    }
}

export async function addOtherStickers(files) {
    if (isImporting) {
        alert('正在处理上一组图片，请稍后再试');
        return;
    }
    if (!files || files.length === 0) {
        alert('没有选择文件');
        return;
    }
    isImporting = true;
    try {
        let added = 0;
        for (let file of files) {
            if (!file.type.startsWith('image/')) continue;
            try {
                const base64 = await readFileAsBase64(file);
                window.otherStickers.push({
                    id: Date.now() + '_' + Math.random(),
                    dataURL: base64
                });
                added++;
            } catch(e) { console.warn(e); }
        }
        if (added > 0) {
            saveOtherStickers();
            renderOtherStickersList();
            alert(`✅ 成功添加 ${added} 张对方表情包`);
        } else {
            alert('❌ 没有有效的图片文件');
        }
    } finally {
        isImporting = false;
    }
}

export function deleteMySticker(id) {
    if (confirm("确定删除这张表情包吗？")) {
        window.myStickers = window.myStickers.filter(s => s.id !== id);
        saveMyStickers();
        renderMyStickersList();
        const pickerModal = document.getElementById('stickerPickerModal');
        if (pickerModal && pickerModal.style.display === 'flex') renderStickerPicker();
    }
}

export function deleteOtherSticker(id) {
    if (confirm("删除对方表情包？")) {
        window.otherStickers = window.otherStickers.filter(s => s.id !== id);
        saveOtherStickers();
        renderOtherStickersList();
    }
}

export function renderMyStickersList() {
    const container = document.getElementById('myStickersList');
    if (!container) return;
    container.innerHTML = '';
    if (!window.myStickers.length) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">暂无表情包，点击「新增」添加</div>';
        return;
    }
    for (let s of window.myStickers) {
        const div = document.createElement('div');
        div.className = 'sticker-item';
        const img = document.createElement('img');
        img.src = s.dataURL;
        img.onclick = (e) => {
            e.stopPropagation();
            deleteMySticker(s.id);
        };
        div.appendChild(img);
        container.appendChild(div);
    }
}

export function renderOtherStickersList() {
    const container = document.getElementById('otherStickersList');
    if (!container) return;
    container.innerHTML = '';
    if (!window.otherStickers.length) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">暂无对方表情包</div>';
        return;
    }
    for (let s of window.otherStickers) {
        const div = document.createElement('div');
        div.className = 'sticker-item';
        const img = document.createElement('img');
        img.src = s.dataURL;
        img.onclick = (e) => {
            e.stopPropagation();
            deleteOtherSticker(s.id);
        };
        div.appendChild(img);
        container.appendChild(div);
    }
}

export function renderStickerPicker() {
    const container = document.getElementById('stickerPickerContent');
    if (!container) return;
    container.innerHTML = '';
    if (!window.myStickers.length) {
        container.innerHTML = '<div style="text-align:center; color:#999;">还没有我的表情包，请先导入😊</div>';
        return;
    }
    for (let s of window.myStickers) {
        const img = document.createElement('img');
        img.src = s.dataURL;
        img.style.width = '60px';
        img.style.height = '60px';
        img.style.objectFit = 'cover';
        img.style.margin = '6px';
        img.style.cursor = 'pointer';
        img.style.borderRadius = '12px';
        img.onclick = () => {
            if (window.sendStickerMessage) {
                window.sendStickerMessage(s.dataURL);
            } else {
                console.warn('sendStickerMessage 未定义');
            }
            closeAllModals();
        };
        container.appendChild(img);
    }
}

export function renderEmojisList() {
    const container = document.getElementById('emojisList');
    if (!container) return;
    container.innerHTML = '';
    for (let e of window.emojis) {
        const div = document.createElement('div');
        div.className = 'emoji-item';
        const emojiSpan = document.createElement('div');
        emojiSpan.className = 'emoji-char';
        emojiSpan.textContent = e.char;
        emojiSpan.style.cursor = 'pointer';
        emojiSpan.onclick = (function(id, char) {
            return function() {
                if (confirm(`删除 "${char}" 吗？`)) deleteEmoji(id);
            };
        })(e.id, e.char);
        div.appendChild(emojiSpan);
        container.appendChild(div);
    }
}

export function addEmoji(char) {
    if (!char.trim()) return;
    if (window.emojis.some(e => e.char === char)) {
        alert("已存在");
        return;
    }
    window.emojis.push({
        id: Date.now() + '_' + Math.random(),
        char: char
    });
    saveEmojis();
    renderEmojisList();
}

export function deleteEmoji(id) {
    window.emojis = window.emojis.filter(e => e.id !== id);
    saveEmojis();
    renderEmojisList();
}

export function getRandomEmoji() {
    if (window.emojis.length === 0) return null;
    return window.emojis[Math.floor(Math.random() * window.emojis.length)].char;
}