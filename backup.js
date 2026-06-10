// backup.js 完整版（含导入时补充日期）
import {
    saveGroups, saveMessages, saveMyStickers, saveOtherStickers,
    saveEmojis, saveNames, saveMyAvatar, saveOtherAvatar, saveTheme
} from './data.js';
import { renderAllMessages } from './core.js';
import { renderMyStickersList, renderOtherStickersList, renderEmojisList } from './sticker-emoji.js';
import { renderGroupList, renderGroupsOnlyList } from './reply-library.js';

export function collectFullBackupData() {
    const backup = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        messageHistory: window.messageHistory || [],
        groups: window.groups || [],
        myStickers: window.myStickers || [],
        otherStickers: window.otherStickers || [],
        emojis: window.emojis || [],
        customPokes: window.customPokes || [],
        customStatuses: window.customStatuses || [],
        customMottos: window.customMottos || [],
        customIntros: window.customIntros || [],
        customReplyGroups: window.customReplyGroups || [],
        customPokeGroups: window.customPokeGroups || [],
        customStatusGroups: window.customStatusGroups || [],
        myAvatarBase64: window.myAvatarBase64 || '',
        otherAvatarBase64: window.otherAvatarBase64 || '',
        myName: window.myName || '我 🌸',
        otherName: window.otherName || '梦角 ✨',
        currentTheme: window.currentTheme || {}
    };
    return backup;
}

export function exportFullBackup() {
    const data = collectFullBackupData();
    downloadJson(data, `full-backup-${getTimestamp()}.json`);
}

export function exportMessagesOnly() {
    const messages = window.messageHistory || [];
    const exportData = {
        exportTime: new Date().toISOString(),
        type: 'messages-only',
        messages: messages
    };
    downloadJson(exportData, `chat-messages-${getTimestamp()}.json`);
}

export function exportGroupsOnly() {
    downloadJson({ groups: window.groups || [] }, `backup-groups-${getTimestamp()}.json`);
}
export function exportMyStickersOnly() {
    downloadJson({ myStickers: window.myStickers || [] }, `backup-mystickers-${getTimestamp()}.json`);
}
export function exportOtherStickersOnly() {
    downloadJson({ otherStickers: window.otherStickers || [] }, `backup-otherstickers-${getTimestamp()}.json`);
}
export function exportEmojisOnly() {
    downloadJson({ emojis: window.emojis || [] }, `backup-emojis-${getTimestamp()}.json`);
}
export function exportCustomPokesOnly() {
    downloadJson({ customPokes: window.customPokes || [] }, `backup-pokes-${getTimestamp()}.json`);
}
export function exportCustomStatusesOnly() {
    downloadJson({ 
        customStatuses: window.customStatuses || [],
        customStatusGroups: window.customStatusGroups || []
    }, `backup-statuses-${getTimestamp()}.json`);
}
export function exportCustomMottosOnly() {
    downloadJson({ customMottos: window.customMottos || [] }, `backup-mottos-${getTimestamp()}.json`);
}
export function exportCustomIntrosOnly() {
    downloadJson({ customIntros: window.customIntros || [] }, `backup-intros-${getTimestamp()}.json`);
}
export function exportAvatarsOnly() {
    downloadJson({
        myAvatarBase64: window.myAvatarBase64 || '',
        otherAvatarBase64: window.otherAvatarBase64 || ''
    }, `backup-avatars-${getTimestamp()}.json`);
}
export function exportNamesOnly() {
    downloadJson({ myName: window.myName, otherName: window.otherName }, `backup-names-${getTimestamp()}.json`);
}
export function exportThemeOnly() {
    downloadJson({ currentTheme: window.currentTheme || {} }, `backup-theme-${getTimestamp()}.json`);
}

function downloadJson(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function getTimestamp() {
    return new Date().toISOString().slice(0,19).replace(/:/g, '-');
}

export async function importFullBackup(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                if (!backup.version && !backup.messageHistory) {
                    throw new Error('不是有效的备份文件');
                }
                if (backup.messageHistory) {
                    window.messageHistory = backup.messageHistory;
                    const today = new Date().toISOString().slice(0,10);
                    for (let msg of window.messageHistory) if (!msg.date) msg.date = today;
                    saveMessages();
                }
                if (backup.groups) {
                    window.groups = backup.groups;
                    saveGroups();
                }
                if (backup.myStickers) {
                    window.myStickers = backup.myStickers;
                    saveMyStickers();
                }
                if (backup.otherStickers) {
                    window.otherStickers = backup.otherStickers;
                    saveOtherStickers();
                }
                if (backup.emojis) {
                    window.emojis = backup.emojis;
                    saveEmojis();
                }
                if (backup.customPokes) {
                    window.customPokes = backup.customPokes;
                    localStorage.setItem('customPokes', JSON.stringify(window.customPokes));
                }
                if (backup.customStatuses) {
                    window.customStatuses = backup.customStatuses;
                    localStorage.setItem('customStatuses', JSON.stringify(window.customStatuses));
                }
                if (backup.customMottos) {
                    window.customMottos = backup.customMottos;
                    localStorage.setItem('customMottos', JSON.stringify(window.customMottos));
                }
                if (backup.customIntros) {
                    window.customIntros = backup.customIntros;
                    localStorage.setItem('customIntros', JSON.stringify(window.customIntros));
                }
                if (backup.customReplyGroups) {
                    window.customReplyGroups = backup.customReplyGroups;
                    localStorage.setItem('customReplyGroups', JSON.stringify(window.customReplyGroups));
                }
                if (backup.customPokeGroups) {
                    window.customPokeGroups = backup.customPokeGroups;
                    localStorage.setItem('customPokeGroups', JSON.stringify(window.customPokeGroups));
                }
                if (backup.customStatusGroups) {
                    window.customStatusGroups = backup.customStatusGroups;
                    localStorage.setItem('customStatusGroups', JSON.stringify(window.customStatusGroups));
                }
                if (backup.myAvatarBase64) {
                    window.myAvatarBase64 = backup.myAvatarBase64;
                    saveMyAvatar(backup.myAvatarBase64);
                }
                if (backup.otherAvatarBase64) {
                    window.otherAvatarBase64 = backup.otherAvatarBase64;
                    saveOtherAvatar(backup.otherAvatarBase64);
                }
                if (backup.myName) window.myName = backup.myName;
                if (backup.otherName) window.otherName = backup.otherName;
                saveNames();
                if (backup.currentTheme) {
                    window.currentTheme = backup.currentTheme;
                    saveTheme();
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}

export function importMessagesOnly(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.type === 'messages-only' && Array.isArray(data.messages)) {
                    window.messageHistory = data.messages;
                    const today = new Date().toISOString().slice(0,10);
                    for (let msg of window.messageHistory) if (!msg.date) msg.date = today;
                    saveMessages();
                    renderAllMessages();
                    resolve();
                } else {
                    reject(new Error('不是有效的聊天记录备份文件'));
                }
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}

export function importStatusesOnly(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.customStatuses) {
                    window.customStatuses = data.customStatuses;
                    localStorage.setItem('customStatuses', JSON.stringify(window.customStatuses));
                }
                if (data.customStatusGroups) {
                    window.customStatusGroups = data.customStatusGroups;
                    localStorage.setItem('customStatusGroups', JSON.stringify(window.customStatusGroups));
                }
                resolve();
            } catch(err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}