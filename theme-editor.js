// theme-editor.js
import { DEFAULT_THEME } from './config.js';
import { saveTheme, loadTheme } from './data.js';

export function applyTheme(theme) {
    for (let key in theme) {
        document.documentElement.style.setProperty(`--${key}`, theme[key]);
    }
    // 转换强调色为RGB，供词云使用
    const accentHex = theme["accent-color"] || "#ffb7c5";
    let r = parseInt(accentHex.slice(1,3), 16);
    let g = parseInt(accentHex.slice(3,5), 16);
    let b = parseInt(accentHex.slice(5,7), 16);
    document.documentElement.style.setProperty('--accent-color-rgb', `${r},${g},${b}`);
    
    window.currentTheme = theme;
    saveTheme();
    document.querySelectorAll('.avatar').forEach(av => {
        av.style.borderColor = theme["accent-color"];
    });
}

export function initTheme() {
    loadTheme();
    applyTheme(window.currentTheme);
}

export function resetTheme() {
    window.currentTheme = { ...DEFAULT_THEME };
    applyTheme(window.currentTheme);
    const ids = ['bg-page','panel-bg','header-bg','chat-bg','bubble-mine','text-mine','bubble-other','text-other','button-bg','icon-color','accent-color'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = window.currentTheme[id] || DEFAULT_THEME[id];
    });
}

export function syncThemeFromPickers() {
    const ids = ['bg-page','panel-bg','header-bg','chat-bg','bubble-mine','text-mine','bubble-other','text-other','button-bg','icon-color','accent-color'];
    let newTheme = {};
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) newTheme[id] = el.value;
    });
    applyTheme(newTheme);
}

const presetList = [
    { name: "雾粉", "bubble-mine": "#e5c5b4", "button-bg": "#e5c5b4", "accent-color": "#e5c5b4", "bg-page": "#f5f0eb" },
    { name: "薄荷", "bubble-mine": "#b8e0d2", "button-bg": "#b8e0d2", "accent-color": "#b8e0d2", "bg-page": "#e0f2e9" },
    { name: "芋泥", "bubble-mine": "#cdc4e6", "button-bg": "#cdc4e6", "accent-color": "#cdc4e6", "bg-page": "#edeaf5" },
    { name: "奶黄", "bubble-mine": "#fbe5c2", "button-bg": "#fbe5c2", "accent-color": "#fbe5c2", "bg-page": "#fef5e7" }
];

export function renderPresetColors(containerId = 'presetColors') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let p of presetList) {
        const circle = document.createElement('div');
        circle.style.cssText = 'width:40px;height:40px;border-radius:50%;background:' + p["bubble-mine"] + ';cursor:pointer;border:1px solid #ccc;margin:5px;';
        circle.title = p.name;
        circle.onclick = () => {
            const newTheme = { ...DEFAULT_THEME, ...p };
            applyTheme(newTheme);
            const ids = ['bg-page','panel-bg','header-bg','chat-bg','bubble-mine','text-mine','bubble-other','text-other','button-bg','icon-color','accent-color'];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = newTheme[id] || DEFAULT_THEME[id];
            });
        };
        container.appendChild(circle);
    }
}