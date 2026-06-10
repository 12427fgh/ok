// js/group-manager.js
// 管理字卡分组：新建、编辑、删除分组，移动卡片，折叠/展开分组等

import { escapeHtml, isDuplicateCard, normalizeCardIds } from './utils.js';
import { saveGroups } from './data.js';

// 创建新分组
export function createGroup(name, color) {
    if (!name.trim()) return false;
    if (window.groups.find(g => g.name === name)) {
        alert("分组名重复");
        return false;
    }
    window.groups.push({
        id: Date.now().toString(),
        name: name.trim(),
        color: color,
        hidden: false,
        collapsed: false,
        cards: []
    });
    saveGroups();
    if (window.refreshGroupUI) window.refreshGroupUI();
    return true;
}

// 移动卡片到另一个分组
export function moveCardToAnotherGroup(sourceGroupId, cardId) {
    const sourceGroup = window.groups.find(g => g.id === sourceGroupId);
    if (!sourceGroup) return;
    const cardIndex = sourceGroup.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const card = sourceGroup.cards[cardIndex];
    const otherGroups = window.groups.filter(g => g.id !== sourceGroupId);
    if (otherGroups.length === 0) {
        alert("无其他分组");
        return;
    }

    const dialogDiv = document.createElement('div');
    dialogDiv.className = 'move-card-dialog';
    dialogDiv.innerHTML = `
        <div style="font-weight:bold; margin-bottom:10px;">选择目标分组</div>
        <select id="moveSelect">
            ${otherGroups.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('')}
        </select>
        <div style="margin-top:15px;">
            <button class="confirm-btn" id="moveConfirmBtn">确认移动</button>
            <button class="cancel-btn" id="moveCancelBtn">取消</button>
        </div>
    `;
    document.body.appendChild(dialogDiv);
    const tempOverlay = document.createElement('div');
    tempOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:1999';
    document.body.appendChild(tempOverlay);
    const closeDialog = () => {
        dialogDiv.remove();
        tempOverlay.remove();
    };
    document.getElementById('moveConfirmBtn').onclick = () => {
        const targetGroupId = document.getElementById('moveSelect').value;
        const targetGroup = window.groups.find(g => g.id === targetGroupId);
        if (targetGroup) {
            sourceGroup.cards.splice(cardIndex, 1);
            targetGroup.cards.push(card);
            saveGroups();
            if (window.refreshGroupUI) window.refreshGroupUI();
            closeDialog();
        } else {
            alert("分组不存在");
            closeDialog();
        }
    };
    document.getElementById('moveCancelBtn').onclick = closeDialog;
    tempOverlay.onclick = closeDialog;
}

// 批量添加字卡到分组
export function addCardsToGroup(groupId, lines) {
    let addedCount = 0, duplicates = [];
    for (let line of lines) {
        line = line.trim();
        if (line === "") continue;
        if (isDuplicateCard(line)) {
            duplicates.push(line);
            continue;
        }
        const group = window.groups.find(g => g.id === groupId);
        if (group) {
            group.cards.push({
                id: String(Date.now()) + '_' + Math.random(),
                text: line,
                hidden: false
            });
            addedCount++;
        }
    }
    if (addedCount > 0) saveGroups();
    return { addedCount, duplicates };
}

// 编辑卡片内容
export function editCardContent(groupId, cardId) {
    const group = window.groups.find(g => g.id === groupId);
    if (!group) return;
    const card = group.cards.find(c => c.id === cardId);
    if (!card) return;
    const newText = prompt("编辑字卡", card.text);
    if (newText && newText.trim() && newText !== card.text) {
        if (isDuplicateCard(newText.trim(), groupId, cardId)) {
            alert("内容重复");
            return;
        }
        card.text = newText.trim();
        saveGroups();
        if (window.refreshGroupUI) window.refreshGroupUI();
    }
}

// 删除卡片
export function deleteCard(groupId, cardId) {
    if (!confirm("删除字卡？")) return;
    const group = window.groups.find(g => g.id === groupId);
    if (group) {
        group.cards = group.cards.filter(c => c.id !== cardId);
        saveGroups();
        if (window.refreshGroupUI) window.refreshGroupUI();
    }
}

// 切换卡片隐藏/显示
export function toggleCardHidden(groupId, cardId) {
    const group = window.groups.find(g => g.id === groupId);
    if (group) {
        const card = group.cards.find(c => c.id === cardId);
        if (card) card.hidden = !card.hidden;
        saveGroups();
        if (window.refreshGroupUI) window.refreshGroupUI();
    }
}