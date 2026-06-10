// core.js - 完整版（支持拍一拍、随机回复、统计/词云/搜索）
import { escapeHtml, getCurrentTime } from './utils.js';
import { saveMessages, saveNames, saveMyAvatar, saveOtherAvatar, saveSettings } from './data.js';
import { getRandomEmoji } from './sticker-emoji.js';
let messagesDiv, messageInput, sendMsgBtn, askBtn, myAvatarImg, otherAvatarImg, myNameSpan, otherNameSpan;
let currentReplyTo = null;
let autoSpeakTimer = null;
let statusChangeTimer = null;

function formatPokeText(text) { return text; }
function formatPartnerPokeText(text) { return text; }

window._triggerPartnerPoke = function() {
    let pokeAction = null;
    const groups = window.otherPokeGroups || [];
    const allPokes = window.otherPokes || [];
    const enabledGroups = groups.filter(g => !g.disabled && Array.isArray(g.items) && g.items.length > 0);
    const groupedItems = new Set();
    enabledGroups.forEach(g => { g.items.forEach(t => groupedItems.add(t)); });
    const ungroupedPokes = allPokes.filter(t => !groupedItems.has(t));
    if (enabledGroups.length > 0) {
        const pickedGroup = enabledGroups[Math.floor(Math.random() * enabledGroups.length)];
        const groupPool = pickedGroup.items.filter(t => allPokes.includes(t));
        if (groupPool.length > 0) pokeAction = groupPool[Math.floor(Math.random() * groupPool.length)];
    }
    if (!pokeAction && ungroupedPokes.length > 0) {
        pokeAction = ungroupedPokes[Math.floor(Math.random() * ungroupedPokes.length)];
    }
    if (!pokeAction && allPokes.length > 0) {
        pokeAction = allPokes[Math.floor(Math.random() * allPokes.length)];
    }
    if (!pokeAction) pokeAction = "拍了拍你";
    const pokeText = formatPartnerPokeText(`${window.otherName || '对方'} ${pokeAction}`);
    addMessageToHistory(pokeText, 'system');
    if (typeof playSound === 'function') playSound('partner_poke');
    (function(){
        try { if(window._typingIndicatorAutoHideTimer) clearTimeout(window._typingIndicatorAutoHideTimer); } catch(e) {}
        var tiw = document.getElementById('typing-indicator-wrapper');
        if(tiw) tiw.style.display = 'none';
    })();
};

window.sendMyPoke = function(pokeText) {
    if (!pokeText || !pokeText.trim()) return;
    const formatted = formatPokeText(`${window.myName || '我'} ${pokeText}`);
    addMessageToHistory(formatted, 'system');
    if (typeof playSound === 'function') playSound('my_poke');
    const delayRange = (window.settings.replyDelayMax || 7) * 1000;
    const delayMin = (window.settings.replyDelayMin || 3) * 1000;
    const randomDelay = delayMin + Math.random() * (delayRange - delayMin);
    setTimeout(() => { if (typeof sendRandomReply === 'function') sendRandomReply(); }, randomDelay);
};

export function initCoreElements() {
    messagesDiv = document.getElementById('messagesArea');
    messageInput = document.getElementById('messageInput');
    sendMsgBtn = document.getElementById('sendMsgBtn');
    askBtn = document.getElementById('askBtn');
    myAvatarImg = document.getElementById('myAvatar');
    otherAvatarImg = document.getElementById('otherAvatar');
    myNameSpan = document.getElementById('myNameDisplay');
    otherNameSpan = document.getElementById('otherNameDisplay');
    try {
        const saved = localStorage.getItem('chat_settings');
        if (saved) window.settings = JSON.parse(saved);
        else window.settings = {};
    } catch(e) { window.settings = {}; }
    window.settings.replyDelayMin = window.settings.replyDelayMin || 3;
    window.settings.replyDelayMax = window.settings.replyDelayMax || 7;
    window.settings.backgroundNotificationEnabled = window.settings.backgroundNotificationEnabled !== undefined ? window.settings.backgroundNotificationEnabled : false;
}

function getRandomDelay() {
    const min = window.settings.replyDelayMin * 1000;
    const max = window.settings.replyDelayMax * 1000;
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function addMessageToHistory(content, sender, replyTo = null) {
    const timeStr = getCurrentTime();
    const dateStr = new Date().toISOString().slice(0,10);
    let msg;
    if (typeof content === 'string') {
        msg = { type: 'text', text: content, sender: sender, time: timeStr, id: Date.now() + Math.random(), replyTo: replyTo, date: dateStr };
    } else if (content.type === 'image') {
        msg = { type: 'image', url: content.url, sender: sender, time: timeStr, id: Date.now() + Math.random(), replyTo: replyTo, date: dateStr };
    } else {
        msg = { type: 'text', text: String(content), sender: sender, time: timeStr, id: Date.now() + Math.random(), replyTo: replyTo, date: dateStr };
    }
    window.messageHistory.push(msg);
    saveMessages();

    // ========== 后台通知 ==========
    if (msg.sender === 'theirs' && window.settings.backgroundNotificationEnabled && document.hidden) {
        let body = msg.type === 'image' ? '[图片消息]' : (msg.text || '[消息]');
        if (body.length > 50) body = body.substring(0, 50) + '…';
        const title = `${window.otherName || '对方'} 发来消息`;
        if (window.Notification && Notification.permission === 'granted') {
            const notification = new Notification(title, { body: body, icon: window.otherAvatarBase64 || undefined });
            notification.onclick = function() { window.focus(); notification.close(); };
        }
    }
    // ========== 通知结束 ==========

    appendMessageDOM(msg);
}
function appendMessageDOM(msg) {
    const div = document.createElement('div');
    if (msg.sender === 'system') {
        div.className = 'system-message';
        div.innerHTML = `<div class="system-bubble">${escapeHtml(msg.text)}</div>`;
        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return;
    }
    div.className = `message ${msg.sender === 'mine' ? 'mine' : 'theirs'}`;
    div.setAttribute('data-msg-id', msg.id);
    const avatarSrc = msg.sender === 'mine' ? (window.myAvatarBase64 || '') : (window.otherAvatarBase64 || '');
    let contentHtml = '';
    if (msg.type === 'image') {
        contentHtml = `<img src="${msg.url}" style="max-width:130px; max-height:130px; border-radius:16px;">`;
    } else {
        contentHtml = escapeHtml(msg.text);
    }
    let replyBubbleHtml = '';
    if (msg.replyTo) {
        const repliedText = msg.replyTo.text || (msg.replyTo.image ? '[图片]' : '[消息]');
        const repliedSender = msg.replyTo.sender === 'mine' ? (window.myName || '我') : (window.otherName || '对方');
        replyBubbleHtml = `<div class="reply-bubble" data-reply-id="${msg.replyTo.id}"><span class="reply-sender">${repliedSender}</span><span class="reply-text">${escapeHtml(repliedText)}</span></div>`;
    }
    const isMine = msg.sender === 'mine';
    const actionsHtml = `<div class="message-actions">
        <button class="action-btn reply-btn" title="引用回复">↩️</button>
        <button class="action-btn delete-btn" title="删除">🗑️</button>
        ${isMine ? `<button class="action-btn recall-btn" title="撤回">⏪</button>` : ''}
    </div>`;
    div.innerHTML = `<img class="msg-avatar" src="${avatarSrc}" onerror="this.src='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fsvg%3E'"><div class="bubble ${msg.type === 'image' ? 'image-bubble' : ''}">${replyBubbleHtml}<div class="msg-content">${contentHtml}</div><div class="time">${msg.time}</div>${actionsHtml}</div>`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    div.querySelector('.reply-btn')?.addEventListener('click', () => replyToMessage(msg));
    div.querySelector('.delete-btn')?.addEventListener('click', () => deleteMessage(msg.id));
    if (isMine) div.querySelector('.recall-btn')?.addEventListener('click', () => recallMessage(msg.id));
    div.querySelector('.reply-bubble')?.addEventListener('click', () => scrollToMessage(msg.replyTo?.id));
}

function replyToMessage(msg) {
    currentReplyTo = { id: msg.id, text: msg.type === 'text' ? msg.text : '[图片]', sender: msg.sender };
    updateReplyPreview();
    messageInput.focus();
}

function deleteMessage(id) {
    if (!confirm('删除这条消息？')) return;
    const idx = window.messageHistory.findIndex(m => m.id === id);
    if (idx !== -1) { window.messageHistory.splice(idx, 1); saveMessages(); renderAllMessages(); }
}

function recallMessage(id) {
    if (!confirm('撤回这条消息？')) return;
    const idx = window.messageHistory.findIndex(m => m.id === id);
    if (idx !== -1 && window.messageHistory[idx].sender === 'mine') {
        window.messageHistory[idx] = { id: id, type: 'system', text: '你撤回了一条消息', sender: 'system', time: getCurrentTime(), date: new Date().toISOString().slice(0,10) };
        saveMessages(); renderAllMessages();
    }
}

function scrollToMessage(id) {
    if (!id) return;
    const el = document.querySelector(`.message[data-msg-id="${id}"]`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.backgroundColor = 'rgba(255,255,0,0.2)'; setTimeout(() => el.style.backgroundColor = '', 1500); }
    else alert('原消息已删除');
}

window.updateReplyPreview = function() {
    const container = document.getElementById('reply-preview-container');
    if (!container) return;
    if (!currentReplyTo) { container.innerHTML = ''; container.style.display = 'none'; return; }
    const senderName = currentReplyTo.sender === 'mine' ? (window.myName || '我') : (window.otherName || '对方');
    const previewText = currentReplyTo.text || '[图片]';
    container.style.display = 'flex';
    container.innerHTML = `<div class="reply-preview"><span>回复 ${senderName}: ${escapeHtml(previewText)}</span><button class="cancel-reply">✕</button></div>`;
    container.querySelector('.cancel-reply')?.addEventListener('click', () => { currentReplyTo = null; updateReplyPreview(); });
};

export function renderAllMessages() {
    if (!messagesDiv) return;
    messagesDiv.innerHTML = '';
    for (let msg of window.messageHistory) { appendMessageDOM(msg); }
}

function getAllVisibleCards() {
    let all = [];
    for (let group of window.groups) {
        if (group.hidden) continue;
        for (let card of group.cards) { if (!card.hidden) all.push(card.text); }
    }
    return all;
}

export function sendRandomReply() {
    try {
        if (Math.random() < 0.1 && typeof window._triggerPartnerPoke === 'function') {
            window._triggerPartnerPoke();
            return;
        }
        const r = Math.random() * 100;
        if (r < 10 && window.otherStickers && window.otherStickers.length > 0) {
            const randomSticker = window.otherStickers[Math.floor(Math.random() * window.otherStickers.length)];
            addMessageToHistory({ type: 'image', url: randomSticker.dataURL }, 'theirs');
            return;
        }
        const shouldAddEmoji = (r >= 10 && r < 40) && window.emojis && window.emojis.length > 0;
        const cards = getAllVisibleCards();
        let cardText = cards.length ? cards[Math.floor(Math.random() * cards.length)] : null;
        if (shouldAddEmoji) {
            const randomEmoji = getRandomEmoji();
            addMessageToHistory(cardText ? cardText + " " + randomEmoji : randomEmoji, 'theirs');
            return;
        }
        if (!cardText) { addMessageToHistory("（当前无字卡）", "theirs"); return; }
        addMessageToHistory(cardText, "theirs");
    } catch(e) { addMessageToHistory("（回复出错）", "theirs"); }
}

export function sendMyMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    addMessageToHistory(text, 'mine', currentReplyTo);
    currentReplyTo = null;
    updateReplyPreview();
    messageInput.value = "";
    setTimeout(() => sendRandomReply(), getRandomDelay());
}

export function sendStickerMessage(dataURL) {
    addMessageToHistory({ type: 'image', url: dataURL }, 'mine', currentReplyTo);
    currentReplyTo = null;
    updateReplyPreview();
    setTimeout(() => sendRandomReply(), getRandomDelay());
}

export function setupAvatarUpload(imgElement, isSelf) {
    imgElement.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const base64 = ev.target.result;
                    imgElement.src = base64;
                    if (isSelf) {
                        window.myAvatarBase64 = base64;
                        saveMyAvatar(base64);
                        document.querySelectorAll('.message.mine .msg-avatar').forEach(av => av.src = base64);
                    } else {
                        window.otherAvatarBase64 = base64;
                        saveOtherAvatar(base64);
                        document.querySelectorAll('.message.theirs .msg-avatar').forEach(av => av.src = base64);
                    }
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });
}

export function editName(target) {
    let newName = prompt("输入新名字", target === 'my' ? window.myName : window.otherName);
    if (newName && newName.trim()) {
        if (target === 'my') { window.myName = newName.trim(); myNameSpan.innerText = window.myName; }
        else { window.otherName = newName.trim(); otherNameSpan.innerText = window.otherName; }
        saveNames();
    }
}

export function bindCoreEvents() {
    sendMsgBtn.onclick = sendMyMessage;
    askBtn.onclick = () => {
        const delay = getRandomDelay();
        setTimeout(() => {
            const count = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < count; i++) { setTimeout(() => { sendRandomReply(); }, i * 200); }
        }, delay);
    };
    messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMyMessage(); });
    myNameSpan.onclick = () => editName('my');
    otherNameSpan.onclick = () => editName('other');
    setupAvatarUpload(myAvatarImg, true);
    setupAvatarUpload(otherAvatarImg, false);
    window.settings.autoSpeakEnabled = window.settings.autoSpeakEnabled !== undefined ? window.settings.autoSpeakEnabled : true;
    window.settings.autoSpeakInterval = window.settings.autoSpeakInterval || 30;
    startAutoSpeakTimer();
    startStatusTimer();
    updatePartnerStatusUI();  
}

function startAutoSpeakTimer() {
    if (autoSpeakTimer) clearInterval(autoSpeakTimer);
    if (!window.settings.autoSpeakEnabled) return;
    const intervalMs = (window.settings.autoSpeakInterval || 30) * 60 * 1000;
    autoSpeakTimer = setInterval(() => {
        const delay = getRandomDelay();
        setTimeout(() => {
            const count = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < count; i++) { setTimeout(() => { sendRandomReply(); }, i * 200); }
        }, delay);
    }, intervalMs);
}

export function restartAutoSpeakTimer() { startAutoSpeakTimer(); }
window.restartAutoSpeakTimer = restartAutoSpeakTimer;
window.sendStickerMessage = sendStickerMessage;
window.simulateReply = sendRandomReply;

window._triggerStatusChange = function() {
    let newStatus = null;
    const groups = window.customStatusGroups || [];
    const allStatuses = (window.customStatuses && window.customStatuses.length) ? window.customStatuses : [];
    const enabledGroups = groups.filter(g => !g.disabled && Array.isArray(g.items) && g.items.length > 0);
    const groupedItems = new Set();
    enabledGroups.forEach(g => { g.items.forEach(t => groupedItems.add(t)); });
    const ungroupedStatuses = allStatuses.filter(t => !groupedItems.has(t));
    if (enabledGroups.length > 0) {
        const pickedGroup = enabledGroups[Math.floor(Math.random() * enabledGroups.length)];
        const groupPool = pickedGroup.items.filter(t => allStatuses.includes(t));
        if (groupPool.length > 0) newStatus = groupPool[Math.floor(Math.random() * groupPool.length)];
    }
    if (!newStatus && ungroupedStatuses.length > 0) {
        newStatus = ungroupedStatuses[Math.floor(Math.random() * ungroupedStatuses.length)];
    }
    if (!newStatus && allStatuses.length > 0) {
        newStatus = allStatuses[Math.floor(Math.random() * allStatuses.length)];
    }
    if (!newStatus) return;
    window.settings.partnerStatus = newStatus;
    const statusDiv = document.getElementById('partnerStatusText');
    if (statusDiv) statusDiv.innerText = newStatus;
    addMessageToHistory(`对方的状态变为了「${newStatus}」`, 'system');
    window.settings.lastStatusChange = Date.now();
    let nextHours = 1 + Math.random() * 6;
    window.settings.nextStatusChange = nextHours * 60 * 60 * 1000;
    saveSettings();
};

function checkStatusChange() {
    if (!window.settings.lastStatusChange) {
        window.settings.lastStatusChange = Date.now();
        window.settings.nextStatusChange = (1 + Math.random() * 6) * 60 * 60 * 1000;
        saveSettings();
        return;
    }
    let elapsed = Date.now() - window.settings.lastStatusChange;
    if (elapsed >= window.settings.nextStatusChange) {
        window._triggerStatusChange();
    }
}

function startStatusTimer() {
    if (statusChangeTimer) clearInterval(statusChangeTimer);
    statusChangeTimer = setInterval(() => {
        checkStatusChange();
    }, 10 * 60 * 1000);
}

function updatePartnerStatusUI() {
    let status = window.settings.partnerStatus || '在线';
    const statusDiv = document.getElementById('partnerStatusText');
    if (statusDiv) statusDiv.innerText = status;
}

window.startStatusTimer = startStatusTimer;
window.updatePartnerStatusUI = updatePartnerStatusUI;
window.checkStatusChange = checkStatusChange;
console.log('✅ core.js 加载完成，拍一拍功能已就绪');

// ======================== 统计、词云、搜索功能 ========================
(function() {
    const STOP_WORDS = new Set([
        '的','了','是','我','你','他','她','它','们','这','那','有','在','就','也','都',
        '和','与','或','但','不','没','很','太','更','最','已','被','让','把','对','从',
        '到','于','以','为','之','其','而','则','所','等','啊','哦','嗯','哈','呢','吧',
        '吗','嘛','呀','哇','哎','唉','嗯嗯','哈哈','嘻嘻','呵呵','哦哦','啊啊','哈哈哈',
        '一','二','三','四','五','六','七','八','九','十','个','次','条','件','种',
        '好','行','可以','可','又','再','还','来','去','说','想','知道','觉得','感觉',
        '什么','怎么','为什么','哪','谁','哪里','怎样','如何','这么','那么',
        '然后','因为','所以','如果','虽然','但是','而且','不过','只是','只有',
        '没有','不是','还是','就是','真的','对啊','好的','好吧','那个','这个',
        '今天','昨天','明天','现在','以前','以后','时候','时间','一下','一直','一个',
        'ok','OK','Ok','yes','no','hh','hhhh','hhh','嗯','额','图片','表情','语音'
    ]);

    function tokenizeWords(text) {
        if (!text || typeof text !== 'string') return [];
        const chinese = text.replace(/[^\u4e00-\u9fa5]/g, '');
        const words = [];
        for (let i = 0; i < chinese.length; i++) {
            for (let len = 2; len <= 4; len++) {
                if (i + len <= chinese.length) {
                    const w = chinese.slice(i, i + len);
                    if (!STOP_WORDS.has(w)) words.push(w);
                }
            }
        }
        return words;
    }

    function countWords(messages, senderFilter) {
        const freq = {};
        for (let msg of messages) {
            if (msg.type === 'system' || msg.type === 'call-event') continue;
            if (senderFilter && msg.sender !== senderFilter) continue;
            if (!msg.text) continue;
            const words = tokenizeWords(msg.text);
            for (let w of words) freq[w] = (freq[w] || 0) + 1;
        }
        return freq;
    }

    function getTopWords(freq, n=5) {
        const arr = Object.entries(freq);
        arr.sort((a,b) => b[1]-a[1]);
        const top = arr.slice(0,n);
        const max = top.length ? top[0][1] : 0;
        return { top, max };
    }

    function renderTopWords(containerId, freq) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const { top, max } = getTopWords(freq,5);
        if (top.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);">暂无数据</div>';
            return;
        }
        container.innerHTML = '';
        for (let [word, count] of top) {
            const percent = max>0 ? (count/max)*100 : 0;
            const div = document.createElement('div');
            div.style.marginBottom = '12px';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span>${word}</span><span>${count}次</span>
                </div>
                <div style="background:var(--border-color); border-radius:10px; overflow:hidden;">
                    <div style="width:${percent}%; height:6px; background:var(--accent-color); border-radius:10px;"></div>
                </div>
            `;
            container.appendChild(div);
        }
    }

    function updateStatNumbers() {
        const all = window.messageHistory || [];
        const my = all.filter(m => m.sender === 'mine' && m.type !== 'system' && m.type !== 'call-event');
        const partner = all.filter(m => m.sender === 'theirs' && m.type !== 'system' && m.type !== 'call-event');
        document.getElementById('statTotal').innerText = (my.length + partner.length);
        document.getElementById('statMy').innerText = my.length;
        document.getElementById('statPartner').innerText = partner.length;
        const myFreq = countWords(all, 'mine');
        const partnerFreq = countWords(all, 'theirs');
        renderTopWords('myTopWords', myFreq);
        renderTopWords('partnerTopWords', partnerFreq);
    }

    let currentCloud = 'all';
    function drawCloud() {
        const canvas = document.getElementById('wordcloudCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr,0,0,dpr,0,0);
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--primary-bg') || '#fff';
        ctx.fillStyle = bg;
        ctx.fillRect(0,0,w,h);
        let freq = {};
        const allMsgs = window.messageHistory || [];
        if (currentCloud === 'me') freq = countWords(allMsgs, 'mine');
        else if (currentCloud === 'partner') freq = countWords(allMsgs, 'theirs');
        else freq = countWords(allMsgs);
        const words = Object.entries(freq).map(([word,count])=> ({word,count}));
        words.sort((a,b)=>b.count-a.count);
        if (words.length === 0) {
            ctx.fillStyle = '#888';
            ctx.font = '14px sans-serif';
            ctx.fillText('暂无词云', w/2-30, h/2);
            return;
        }
        const maxC = words[0].count;
        const minC = words[words.length-1].count;
        const getSize = (c) => maxC===minC ? 18 : 12 + (c-minC)/(maxC-minC)*32;
        const accentRgb = getComputedStyle(document.documentElement).getPropertyValue('--accent-color-rgb') || '180,140,100';
        const placed = [];
        for (let i=0; i<Math.min(words.length,80); i++) {
            const {word, count} = words[i];
            const size = getSize(count);
            ctx.font = `${size}px "PingFang SC","Microsoft YaHei",sans-serif`;
            const m = ctx.measureText(word);
            const ww = m.width;
            const wh = size*1.2;
            let ok = false;
            for (let t=0; t<200; t++) {
                const x = 10 + Math.random() * (w - ww - 20);
                const y = size + Math.random() * (h - wh - 20);
                let overlap = false;
                for (let p of placed) {
                    if (x < p.x+p.w+6 && x+ww+6 > p.x && y < p.y+p.h+6 && y+wh+6 > p.y) {
                        overlap = true; break;
                    }
                }
                if (!overlap) {
                    ctx.fillStyle = `rgba(${accentRgb}, ${0.5 + count/maxC*0.5})`;
                    ctx.fillText(word, x, y);
                    placed.push({x,y,w:ww,h:wh});
                    ok = true; break;
                }
            }
            if (!ok) {
                ctx.fillStyle = `rgba(${accentRgb},0.4)`;
                ctx.fillText(word, 10+Math.random()*(w-ww-20), size+Math.random()*(h-wh-20));
            }
        }
        const rankDiv = document.getElementById('wordcloudRank');
        if (rankDiv) {
            rankDiv.innerHTML = '<div style="font-weight:600; margin-bottom:6px;">📊 高频词 TOP 10</div>';
            words.slice(0,10).forEach(({word,count})=>{
                const d = document.createElement('div');
                d.style.display = 'flex'; d.style.justifyContent = 'space-between'; d.style.fontSize = '12px'; d.style.padding = '4px 0';
                d.innerHTML = `<span>${word}</span><span>${count}次</span>`;
                rankDiv.appendChild(d);
            });
        }
    }

    function switchCloud(view) {
        currentCloud = view;
        drawCloud();
        document.querySelectorAll('.wcViewBtn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    }

    function runSearch() {
        const keyword = document.getElementById('searchKeyword')?.value.trim().toLowerCase() || '';
        const fromDate = document.getElementById('searchFrom')?.value;
        const toDate = document.getElementById('searchTo')?.value;
        const resultsDiv = document.getElementById('searchResults');
        if (!resultsDiv) return;
        resultsDiv.innerHTML = '';
        let msgs = window.messageHistory || [];
        let filtered = msgs.filter(msg => {
            if (msg.type === 'system') return false;
            if (keyword && !msg.text?.toLowerCase().includes(keyword)) return false;
            if (fromDate && msg.date < fromDate) return false;
            if (toDate && msg.date > toDate) return false;
            return true;
        });
        if (filtered.length === 0) {
            resultsDiv.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-secondary);">未找到相关消息</div>';
            return;
        }
        const myName = window.myName || '我';
        const partnerName = window.otherName || '对方';
        for (let msg of filtered) {
            const sender = msg.sender === 'mine' ? myName : partnerName;
            let content = msg.text || '[图片]';
            if (keyword) {
                const re = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
                content = content.replace(re, '<mark style="background:rgba(var(--accent-color-rgb),0.3);padding:0 2px;border-radius:4px;">$1</mark>');
            }
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.style.cssText = 'padding:10px; background:var(--primary-bg); border-radius:12px; border:1px solid var(--border-color); cursor:pointer;';
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-secondary); margin-bottom:6px;">
                    <span>${sender}</span><span>${msg.date || ''} ${msg.time || ''}</span>
                </div>
                <div style="font-size:13px; color:var(--text-primary);">${content}</div>
            `;
            item.onclick = (function(id) {
                return function() {
                    const el = document.querySelector(`.message[data-msg-id="${id}"]`);
                    if (el) { el.scrollIntoView({behavior:'smooth',block:'center'}); el.style.backgroundColor='rgba(var(--accent-color-rgb),0.2)'; setTimeout(()=>el.style.backgroundColor='',1500); }
                };
            })(msg.id);
            resultsDiv.appendChild(item);
        }
    }

    window.openStatsModal = function() {
        const modal = document.getElementById('statsModal');
        if (!modal) return;
        updateStatNumbers();
        drawCloud();
        const tabs = document.querySelectorAll('.stats-tab-btn');
        const panels = {
            stats: document.getElementById('statsPanel'),
            wordcloud: document.getElementById('wordcloudPanel'),
            search: document.getElementById('searchPanel')
        };
        tabs.forEach(btn => {
            btn.onclick = () => {
                const tab = btn.dataset.tab;
                tabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (panels.stats) panels.stats.style.display = tab === 'stats' ? 'block' : 'none';
                if (panels.wordcloud) panels.wordcloud.style.display = tab === 'wordcloud' ? 'block' : 'none';
                if (panels.search) panels.search.style.display = tab === 'search' ? 'block' : 'none';
                if (tab === 'wordcloud') drawCloud();
            };
        });
        document.querySelectorAll('.wcViewBtn').forEach(btn => {
            btn.onclick = () => switchCloud(btn.dataset.view);
        });
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) searchBtn.onclick = runSearch;
        const closeBtn = document.getElementById('closeStatsModal');
        if (closeBtn) closeBtn.onclick = () => { if (typeof hideModal === 'function') hideModal(modal); else modal.style.display = 'none'; };
        if (typeof showModal === 'function') showModal(modal);
        else modal.style.display = 'flex';
    };
})();