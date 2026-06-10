// state.js
import { DEFAULT_THEME } from './config.js';

export let groups = [];
export let messageHistory = [];
export let myAvatarBase64 = "";
export let otherAvatarBase64 = "";
export let myName = "我 🌸";
export let otherName = "梦角 ✨";
export let currentTheme = { ...DEFAULT_THEME };
export let myStickers = [];
export let otherStickers = [];
export let emojis = [];
export let currentSearchKeyword = "";

// 拍一拍、状态等数据
export let customPokes = [];
export let otherPokes = [];
export let otherPokeGroups = [];
export let customStatuses = [];
export let customMottos = [];
export let customIntros = [];
export let customReplyGroups = [];
export let customPokeGroups = [];
export let customStatusGroups = [];

// 从 localStorage 加载已有的数据（如果有）
try {
    const savedPokes = JSON.parse(localStorage.getItem('customPokes') || '[]');
    if (savedPokes.length) customPokes.push(...savedPokes);
    const savedStatuses = JSON.parse(localStorage.getItem('customStatuses') || '[]');
    if (savedStatuses.length) customStatuses.push(...savedStatuses);
    const savedMottos = JSON.parse(localStorage.getItem('customMottos') || '[]');
    if (savedMottos.length) customMottos.push(...savedMottos);
    const savedIntros = JSON.parse(localStorage.getItem('customIntros') || '[]');
    if (savedIntros.length) customIntros.push(...savedIntros);
    const savedReplyGroups = JSON.parse(localStorage.getItem('customReplyGroups') || '[]');
    if (savedReplyGroups.length) customReplyGroups.push(...savedReplyGroups);
    const savedPokeGroups = JSON.parse(localStorage.getItem('customPokeGroups') || '[]');
    if (savedPokeGroups.length) customPokeGroups.push(...savedPokeGroups);
    const savedStatusGroups = JSON.parse(localStorage.getItem('customStatusGroups') || '[]');
    if (savedStatusGroups.length) customStatusGroups.push(...savedStatusGroups);
} catch(e) { /* 忽略解析错误 */ }

// 挂载到 window 上，方便其他文件使用
window.otherPokes = otherPokes;
window.otherPokeGroups = otherPokeGroups;
window.groups = groups;
window.messageHistory = messageHistory;
window.myAvatarBase64 = myAvatarBase64;
window.otherAvatarBase64 = otherAvatarBase64;
window.myName = myName;
window.otherName = otherName;
window.currentTheme = currentTheme;
window.myStickers = myStickers;
window.otherStickers = otherStickers;
window.emojis = emojis;
window.currentSearchKeyword = currentSearchKeyword;
window.customPokes = customPokes;
window.customStatuses = customStatuses;
window.customMottos = customMottos;
window.customIntros = customIntros;
window.customReplyGroups = customReplyGroups;
window.customPokeGroups = customPokeGroups;
window.customStatusGroups = customStatusGroups;