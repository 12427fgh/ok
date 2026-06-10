// utils.js
export function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

export function getCurrentTime() {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
}

export function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function normalizeCardIds() {
    for (let g of window.groups) {
        if (g.cards) {
            for (let c of g.cards) {
                if (c.id === undefined || typeof c.id !== 'string') {
                    c.id = String(Date.now()) + '_' + Math.random();
                }
            }
        }
    }
}

export function isDuplicateCard(text, excludeGroupId = null, excludeCardId = null) {
    for (let group of window.groups) {
        for (let card of group.cards) {
            if (card.text === text && !(group.id === excludeGroupId && card.id === excludeCardId)) {
                return true;
            }
        }
    }
    return false;
}