// data.js
import { STORAGE_KEYS, DEFAULT_THEME } from './config.js';
import { normalizeCardIds, getCurrentTime } from './utils.js';

export function saveGroups() {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(window.groups));
}

export function loadGroups() {
    const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (saved) {
        window.groups = JSON.parse(saved);
        normalizeCardIds();
        for (let g of window.groups) {
            if (g.hidden === undefined) g.hidden = false;
            if (g.collapsed === undefined) g.collapsed = false;
            if (!g.cards) g.cards = [];
        }
    } else {
        window.groups = [
            {
                id: "ungrouped",
                name: "未分组",
                color: "#ffb7c5",
                hidden: false,
                collapsed: false,
                cards: [
                    { id: "c1", text: "❤️ 天天开心", hidden: false },
                    { id: "c2", text: "🌞 早安", hidden: false },
                    { id: "c3", text: "🍵 记得休息", hidden: false }
                ]
            }
        ];
    }
}

export function saveMessages() {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(window.messageHistory));
}

export function loadMessages() {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (saved) {
        window.messageHistory = JSON.parse(saved);
        // 给旧消息补上日期（如果没有）
        const today = new Date().toISOString().slice(0,10);
        for (let msg of window.messageHistory) {
            if (!msg.date) msg.date = today;
        }
    } else {
        window.messageHistory = [
            { type: 'text', text: "你好呀！点📦自定义回复管理字卡~", sender: "theirs", time: getCurrentTime(), date: new Date().toISOString().slice(0,10) }
        ];
    }
}

export function saveMyAvatar(base64) {
    window.myAvatarBase64 = base64;
    localStorage.setItem(STORAGE_KEYS.MY_AVATAR, base64 || '');
}

export function loadMyAvatar() {
    const saved = localStorage.getItem(STORAGE_KEYS.MY_AVATAR);
    if (saved) window.myAvatarBase64 = saved;
}

export function saveOtherAvatar(base64) {
    window.otherAvatarBase64 = base64;
    localStorage.setItem(STORAGE_KEYS.OTHER_AVATAR, base64 || '');
}

export function loadOtherAvatar() {
    const saved = localStorage.getItem(STORAGE_KEYS.OTHER_AVATAR);
    if (saved) window.otherAvatarBase64 = saved;
}

export function saveNames() {
    localStorage.setItem(STORAGE_KEYS.MY_NAME, window.myName);
    localStorage.setItem(STORAGE_KEYS.OTHER_NAME, window.otherName);
}

export function loadNames() {
    const my = localStorage.getItem(STORAGE_KEYS.MY_NAME);
    if (my) window.myName = my;
    const other = localStorage.getItem(STORAGE_KEYS.OTHER_NAME);
    if (other) window.otherName = other;
}

export function saveTheme() {
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(window.currentTheme));
}

export function loadTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved) {
        try {
            window.currentTheme = JSON.parse(saved);
        } catch(e) {
            window.currentTheme = { ...DEFAULT_THEME };
        }
    } else {
        window.currentTheme = { ...DEFAULT_THEME };
    }
}

export function saveMyStickers() {
    localStorage.setItem(STORAGE_KEYS.MY_STICKERS, JSON.stringify(window.myStickers));
}

export function loadMyStickers() {
    const saved = localStorage.getItem(STORAGE_KEYS.MY_STICKERS);
    if (saved) window.myStickers = JSON.parse(saved);
    else window.myStickers = [];
}

export function saveOtherStickers() {
    localStorage.setItem(STORAGE_KEYS.OTHER_STICKERS, JSON.stringify(window.otherStickers));
}

export function loadOtherStickers() {
    const saved = localStorage.getItem(STORAGE_KEYS.OTHER_STICKERS);
    if (saved) window.otherStickers = JSON.parse(saved);
    else window.otherStickers = [];
}

export function saveEmojis() {
    localStorage.setItem(STORAGE_KEYS.EMOJIS, JSON.stringify(window.emojis));
}

export function loadEmojis() {
    const saved = localStorage.getItem(STORAGE_KEYS.EMOJIS);
    if (saved) window.emojis = JSON.parse(saved);
    else window.emojis = [
        { id: "e1", char: "😊" },
        { id: "e2", char: "❤️" },
        { id: "e3", char: "🎉" }
    ];
}

export function saveSettings() {
    localStorage.setItem('chat_settings', JSON.stringify(window.settings));
}

export function loadSettings() {
    const saved = localStorage.getItem('chat_settings');
    if (saved) {
        window.settings = JSON.parse(saved);
    } else {
        window.settings = {};
    }
    if (!window.settings.partnerStatus) window.settings.partnerStatus = '在线';
    if (!window.settings.myStatus) window.settings.myStatus = '在线';
    // 👇 新增这一行：确保后台通知开关默认是关闭的
    if (window.settings.backgroundNotificationEnabled === undefined) {
        window.settings.backgroundNotificationEnabled = false;
    }
}
// ========== 拍一拍库 ==========
export function saveCustomPokes() {
    localStorage.setItem('customPokes', JSON.stringify(window.customPokes || []));
}

export function loadCustomPokes() {
    const saved = localStorage.getItem('customPokes');
    if (saved) window.customPokes = JSON.parse(saved);
    else window.customPokes = [];
}

export function saveCustomPokeGroups() {
    localStorage.setItem('customPokeGroups', JSON.stringify(window.customPokeGroups || []));
}

export function loadCustomPokeGroups() {
    const saved = localStorage.getItem('customPokeGroups');
    if (saved) window.customPokeGroups = JSON.parse(saved);
    else window.customPokeGroups = [];
}

// ========== 对方拍一拍库 ==========
export function saveOtherPokes() {
    localStorage.setItem('otherPokes', JSON.stringify(window.otherPokes || []));
}

export function loadOtherPokes() {
    const saved = localStorage.getItem('otherPokes');
    if (saved) window.otherPokes = JSON.parse(saved);
    else window.otherPokes = [];
}

export function saveOtherPokeGroups() {
    localStorage.setItem('otherPokeGroups', JSON.stringify(window.otherPokeGroups || []));
}

export function loadOtherPokeGroups() {
    const saved = localStorage.getItem('otherPokeGroups');
    if (saved) window.otherPokeGroups = JSON.parse(saved);
    else window.otherPokeGroups = [];
}

// ========== 对方状态库 ==========
export function saveCustomStatuses() {
    localStorage.setItem('customStatuses', JSON.stringify(window.customStatuses || []));
}

export function loadCustomStatuses() {
    const saved = localStorage.getItem('customStatuses');
    if (saved) {
        window.customStatuses = JSON.parse(saved);
    } else {
        window.customStatuses = ["在线", "忙碌", "想你", "开心", "发呆", "听歌中"];
    }
}

// ========== 对方状态分组 ==========
export function saveCustomStatusGroups() {
    localStorage.setItem('customStatusGroups', JSON.stringify(window.customStatusGroups || []));
}

export function loadCustomStatusGroups() {
    const saved = localStorage.getItem('customStatusGroups');
    if (saved) window.customStatusGroups = JSON.parse(saved);
    else window.customStatusGroups = [];
}
