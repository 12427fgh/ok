// reply-library.js - 完整修复版（无重复导入，支持拍一拍管理 + 无分组状态库）
import { escapeHtml } from './utils.js';
import * as Data from './data.js';
import { createGroup, moveCardToAnotherGroup, editCardContent, deleteCard, toggleCardHidden, addCardsToGroup } from './group-manager.js';
import { showModal, closeAllModals } from './ui-helpers.js';

let currentSearchKeyword = "";

export function renderGroupList() {
    const container = document.getElementById('groupListContainer');
    if (!container) return;
    container.innerHTML = '';
    const keyword = currentSearchKeyword.trim().toLowerCase();

    for (let group of window.groups) {
        let filteredCards = group.cards;
        let hasMatch = false;
        if (keyword) {
            filteredCards = group.cards.filter(card => card.text.toLowerCase().includes(keyword));
            hasMatch = filteredCards.length > 0;
        } else {
            hasMatch = true;
        }
        if (keyword && !hasMatch) continue;

        const visibleCardsCount = filteredCards.filter(c => !c.hidden).length;
        const totalCards = filteredCards.length;
        const groupDiv = document.createElement('div');
        groupDiv.className = `group-list-item ${group.hidden ? 'hidden-item' : ''}`;
        groupDiv.innerHTML = `
            <div class="group-info">
                <span class="fold-icon" data-group="${group.id}" style="cursor:pointer;">${group.collapsed ? '▸' : '▾'}</span>
                <div class="group-color" style="background:${group.color}"></div>
                <div class="group-title" data-group="${group.id}"><strong>${escapeHtml(group.name)}</strong> (${visibleCardsCount}/${totalCards})</div>
            </div>
            <div class="group-actions">
                <button class="toggle-group-visibility" data-id="${group.id}" title="隐藏/显示">${group.hidden ? '👁️' : '🙈'}</button>
                <button class="edit-group-btn" data-id="${group.id}" title="编辑">✏️</button>
                <button class="delete-group-btn" data-id="${group.id}" title="删除" ${group.name === "未分组" ? 'disabled' : ''}>🗑️</button>
            </div>
        `;
        container.appendChild(groupDiv);

        const cardContainer = document.createElement('div');
        cardContainer.style.marginLeft = '32px';
        cardContainer.style.marginTop = '8px';
        if (!group.hidden) {
            if (!group.collapsed) {
                for (let card of filteredCards) {
                    const cardDiv = document.createElement('div');
                    cardDiv.className = `card-item ${card.hidden ? 'hidden-item' : ''}`;
                    cardDiv.setAttribute('data-group-id', group.id);
                    cardDiv.setAttribute('data-card-id', card.id);
                    cardDiv.innerHTML = `
                        <div class="card-text">${escapeHtml(card.text)}</div>
                        <div class="card-actions">
                            <button class="toggle-card" title="隐藏/显示">${card.hidden ? '👁️' : '🙈'}</button>
                            <button class="move-card" title="移动">📁</button>
                            <button class="edit-card" title="编辑">✏️</button>
                            <button class="delete-card" title="删除">❌</button>
                        </div>
                    `;
                    cardContainer.appendChild(cardDiv);
                }
                if (keyword && filteredCards.length === 0) {
                    cardContainer.innerHTML = '<div style="color:#999; padding:8px;">📁 没有匹配的字卡</div>';
                }
            } else {
                cardContainer.innerHTML = '<div style="color:#999; padding:8px;">📁 分组已折叠，点击 ▸ 展开后即可编辑字卡</div>';
            }
        } else {
            cardContainer.innerHTML = '<div style="color:#999; padding:8px;">📁 分组已隐藏，点击眼睛图标可显示</div>';
        }
        container.appendChild(cardContainer);
    }

    if (keyword && container.children.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">🔍 没有找到包含“'+escapeHtml(keyword)+'”的字卡</div>';
    }

    attachGroupEvents();
    attachCardEvents();
}

export function renderGroupsOnlyList() {
    const container = document.getElementById('groupsOnlyList');
    if (!container) return;
    container.innerHTML = '';
    for (let group of window.groups) {
        const groupItem = document.createElement('div');
        groupItem.className = 'groups-only-item';
        groupItem.innerHTML = `
            <div class="groups-only-info">
                <div class="groups-only-color" style="background:${group.color}"></div>
                <div><strong>${escapeHtml(group.name)}</strong> (${group.cards.length} 张字卡)</div>
            </div>
            <div>
                <button class="edit-group-only" data-id="${group.id}" title="编辑">✏️</button>
                <button class="delete-group-only" data-id="${group.id}" title="删除" ${group.name === "未分组" ? 'disabled' : ''}>🗑️</button>
            </div>
        `;
        container.appendChild(groupItem);
    }
    document.querySelectorAll('.edit-group-only').forEach(btn => {
        btn.onclick = () => editGroup(btn.dataset.id);
    });
    document.querySelectorAll('.delete-group-only').forEach(btn => {
        if (!btn.disabled) btn.onclick = () => deleteGroup(btn.dataset.id);
    });
}

function attachGroupEvents() {
    document.querySelectorAll('.fold-icon').forEach(icon => {
        icon.onclick = (e) => {
            e.stopPropagation();
            toggleGroupCollapse(icon.dataset.group);
        };
    });
    document.querySelectorAll('.toggle-group-visibility').forEach(btn => {
        btn.onclick = () => toggleGroupHidden(btn.dataset.id);
    });
    document.querySelectorAll('.edit-group-btn').forEach(btn => {
        btn.onclick = () => editGroup(btn.dataset.id);
    });
    document.querySelectorAll('.delete-group-btn').forEach(btn => {
        if (!btn.disabled) btn.onclick = () => deleteGroup(btn.dataset.id);
    });
}

function attachCardEvents() {
    document.querySelectorAll('.toggle-card').forEach(btn => {
        btn.onclick = (e) => {
            const cardDiv = btn.closest('.card-item');
            toggleCardHidden(cardDiv.dataset.groupId, cardDiv.dataset.cardId);
        };
    });
    document.querySelectorAll('.move-card').forEach(btn => {
        btn.onclick = (e) => {
            const cardDiv = btn.closest('.card-item');
            moveCardToAnotherGroup(cardDiv.dataset.groupId, cardDiv.dataset.cardId);
        };
    });
    document.querySelectorAll('.edit-card').forEach(btn => {
        btn.onclick = (e) => {
            const cardDiv = btn.closest('.card-item');
            editCardContent(cardDiv.dataset.groupId, cardDiv.dataset.cardId);
        };
    });
    document.querySelectorAll('.delete-card').forEach(btn => {
        btn.onclick = (e) => {
            const cardDiv = btn.closest('.card-item');
            deleteCard(cardDiv.dataset.groupId, cardDiv.dataset.cardId);
        };
    });
}

export function toggleGroupCollapse(groupId) {
    const group = window.groups.find(g => g.id === groupId);
    if (group) {
        group.collapsed = !group.collapsed;
        Data.saveGroups();
        renderGroupList();
    }
}

export function toggleGroupHidden(groupId) {
    const group = window.groups.find(g => g.id === groupId);
    if (group) {
        group.hidden = !group.hidden;
        Data.saveGroups();
        renderGroupList();
        renderGroupsOnlyList();
    }
}

export function editGroup(groupId) {
    const group = window.groups.find(g => g.id === groupId);
    if (!group) return;
    const newName = prompt("编辑分组名", group.name);
    if (newName && newName.trim() && !window.groups.find(g => g.id !== groupId && g.name === newName.trim())) {
        group.name = newName.trim();
        Data.saveGroups();
        renderGroupList();
        renderGroupsOnlyList();
    } else if (newName && window.groups.find(g => g.id !== groupId && g.name === newName.trim())) {
        alert("分组名重复");
    }
    const newColor = prompt("输入颜色(#RRGGBB)", group.color);
    if (newColor && /^#[0-9A-Fa-f]{6}$/.test(newColor)) {
        group.color = newColor;
        Data.saveGroups();
        renderGroupList();
        renderGroupsOnlyList();
    }
}

export function deleteGroup(groupId) {
    const group = window.groups.find(g => g.id === groupId);
    if (!group) return;
    if (group.name === "未分组") {
        alert("不能删除“未分组”");
        return;
    }
    if (confirm(`删除分组「${group.name}」？所有字卡永久删除`)) {
        window.groups = window.groups.filter(g => g.id !== groupId);
        Data.saveGroups();
        renderGroupList();
        renderGroupsOnlyList();
    }
}

export function initSearch() {
    const groupSearchInput = document.getElementById('groupSearchInput');
    if (groupSearchInput) {
        groupSearchInput.addEventListener('input', (e) => {
            currentSearchKeyword = e.target.value;
            renderGroupList();
        });
    }
    const searchIconBtn = document.getElementById('searchIconBtn');
    const searchInputContainer = document.getElementById('searchInputContainer');
    if (searchIconBtn && searchInputContainer) {
        let visible = false;
        searchIconBtn.onclick = () => {
            visible = !visible;
            searchInputContainer.style.display = visible ? 'block' : 'none';
            if (visible) groupSearchInput.focus();
            else {
                currentSearchKeyword = "";
                groupSearchInput.value = "";
                renderGroupList();
            }
        };
    }
}

// ========== 我的拍一拍库管理 ==========
export function renderMyPokeLibrary() {
    const container = document.getElementById('myPokeManageContent');
    if (!container) return;
    const pokes = window.customPokes || [];
    container.innerHTML = '';

    if (pokes.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">暂无拍一拍动作，点击下方按钮添加</div>';
    } else {
        const listDiv = document.createElement('div');
        listDiv.className = 'poke-simple-list';
        pokes.forEach((poke, idx) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'poke-simple-item';
            itemDiv.innerHTML = `
                <span class="poke-text">${escapeHtml(poke)}</span>
                <button class="poke-delete-btn" data-index="${idx}" title="删除">❌</button>
            `;
            listDiv.appendChild(itemDiv);
        });
        container.appendChild(listDiv);

        listDiv.querySelectorAll('.poke-delete-btn').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index);
                if (confirm(`删除“${pokes[idx]}”吗？`)) {
                    window.customPokes.splice(idx, 1);
                    Data.saveCustomPokes();
                    renderMyPokeLibrary();
                }
            };
        });
    }

    const addBatchBtn = document.createElement('button');
    addBatchBtn.className = 'primary';
    addBatchBtn.textContent = '➕ 批量添加拍一拍（一行一个）';
    addBatchBtn.style.marginTop = '16px';
    addBatchBtn.onclick = () => showBatchPokeInput('custom');
    container.appendChild(addBatchBtn);
}

// ========== 对方拍一拍库管理 ==========
function renderOtherPokeManage() {
    const container = document.getElementById('otherPokeManageContent');
    if (!container) return;
    Data.loadOtherPokes();
    const pokes = window.otherPokes || [];
    container.innerHTML = '';

    if (pokes.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">暂无对方拍一拍动作，点击下方按钮添加</div>';
    } else {
        const listDiv = document.createElement('div');
        listDiv.className = 'poke-simple-list';
        pokes.forEach((poke, idx) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'poke-simple-item';
            itemDiv.innerHTML = `
                <span class="poke-text">${escapeHtml(poke)}</span>
                <button class="poke-delete-btn" data-index="${idx}" title="删除">❌</button>
            `;
            listDiv.appendChild(itemDiv);
        });
        container.appendChild(listDiv);

        listDiv.querySelectorAll('.poke-delete-btn').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index);
                if (confirm(`删除“${pokes[idx]}”吗？`)) {
                    window.otherPokes.splice(idx, 1);
                    Data.saveOtherPokes();
                    renderOtherPokeManage();
                }
            };
        });
    }

    const addBatchBtn = document.createElement('button');
    addBatchBtn.className = 'primary';
    addBatchBtn.textContent = '➕ 批量添加对方拍一拍（一行一个）';
    addBatchBtn.style.marginTop = '16px';
    addBatchBtn.onclick = () => showBatchPokeInput('other');
    container.appendChild(addBatchBtn);
}

// 通用的批量输入弹窗
function showBatchPokeInput(type) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    const dialog = document.createElement('div');
    dialog.style.cssText = 'background:white;border-radius:20px;width:90%;max-width:400px;padding:20px;box-shadow:0 4px 20px rgba(0,0,0,0.2);';
    dialog.innerHTML = `
        <h3 style="margin-bottom:12px;">批量添加拍一拍</h3>
        <p style="font-size:13px; color:#666;">每行一个动作，按回车换行</p>
        <textarea id="batchPokeText" rows="6" style="width:100%; padding:10px; border-radius:12px; border:1px solid #ccc; font-family:monospace;"></textarea>
        <div style="display:flex; gap:10px; margin-top:16px;">
            <button id="batchConfirmBtn" class="primary" style="flex:1;">确认添加</button>
            <button id="batchCancelBtn" class="primary" style="background:#ccc; color:#333; flex:1;">取消</button>
        </div>
    `;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const textarea = dialog.querySelector('#batchPokeText');
    const confirmBtn = dialog.querySelector('#batchConfirmBtn');
    const cancelBtn = dialog.querySelector('#batchCancelBtn');

    const close = () => overlay.remove();

    confirmBtn.onclick = () => {
        const raw = textarea.value;
        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
        if (lines.length === 0) {
            alert('请输入至少一个动作');
            return;
        }
        let added = 0;
        let duplicates = 0;
        for (let line of lines) {
            if (type === 'custom') {
                if (!window.customPokes.includes(line)) {
                    window.customPokes.push(line);
                    added++;
                } else {
                    duplicates++;
                }
            } else if (type === 'other') {
                if (!window.otherPokes.includes(line)) {
                    window.otherPokes.push(line);
                    added++;
                } else {
                    duplicates++;
                }
            }
        }
        if (added > 0) {
            if (type === 'custom') Data.saveCustomPokes();
            else Data.saveOtherPokes();
            if (type === 'custom') renderMyPokeLibrary();
            else renderOtherPokeManage();
            alert(`成功添加 ${added} 个拍一拍动作${duplicates ? `，${duplicates} 个重复已忽略` : ''}`);
        } else {
            alert('没有添加任何新动作（可能全部重复或为空）');
        }
        close();
    };
    cancelBtn.onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
}

export function initReplyLibrary() {
    window.refreshGroupUI = () => {
        renderGroupList();
        renderGroupsOnlyList();
    };
    
    const showCardsViewBtn = document.getElementById('showCardsViewBtn');
    const groupsOnlyIconBtn = document.getElementById('groupsOnlyIconBtn');
    const manageStickersBtn = document.getElementById('manageStickersBtn');
    const manageEmojisBtn = document.getElementById('manageEmojisBtn');
    const cardsViewDiv = document.getElementById('cardsView');
    const groupsOnlyViewDiv = document.getElementById('groupsOnlyView');
    const stickersViewDiv = document.getElementById('stickersView');
    const emojisViewDiv = document.getElementById('emojisView');
    const backToCardsViewBtn = document.getElementById('backToCardsViewBtn');
    const backToCardsFromStickers = document.getElementById('backToCardsFromStickers');
    const backToCardsFromEmojis = document.getElementById('backToCardsFromEmojis');
    const createGroupOnlyBtn = document.getElementById('createGroupOnlyBtn');
    const newGroupNameOnly = document.getElementById('newGroupNameOnly');
    const newGroupColorOnly = document.getElementById('newGroupColorOnly');
    const floatingNewCardBtn = document.getElementById('floatingNewCardBtn');
    const newCardText = document.getElementById('newCardText');
    const newCardGroupSelect = document.getElementById('newCardGroupSelect');
    const confirmAddCardBtn = document.getElementById('confirmAddCardBtn');
    
    function refreshGroupSelect() {
        if (!newCardGroupSelect) return;
        newCardGroupSelect.innerHTML = '';
        for (let g of window.groups) {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = g.name;
            newCardGroupSelect.appendChild(opt);
        }
    }
    
    const showCardsView = () => {
        cardsViewDiv.style.display = 'flex';
        groupsOnlyViewDiv.style.display = 'none';
        stickersViewDiv.style.display = 'none';
        emojisViewDiv.style.display = 'none';
        if (showCardsViewBtn) showCardsViewBtn.classList.add('active');
        if (manageStickersBtn) manageStickersBtn.classList.remove('active');
        if (manageEmojisBtn) manageEmojisBtn.classList.remove('active');
        renderGroupList();
    };
    const showGroupsOnlyView = () => {
        cardsViewDiv.style.display = 'none';
        groupsOnlyViewDiv.style.display = 'block';
        stickersViewDiv.style.display = 'none';
        emojisViewDiv.style.display = 'none';
        if (showCardsViewBtn) showCardsViewBtn.classList.remove('active');
        if (manageStickersBtn) manageStickersBtn.classList.remove('active');
        if (manageEmojisBtn) manageEmojisBtn.classList.remove('active');
        renderGroupsOnlyList();
    };
    const showStickersView = () => {
        cardsViewDiv.style.display = 'none';
        groupsOnlyViewDiv.style.display = 'none';
        stickersViewDiv.style.display = 'block';
        emojisViewDiv.style.display = 'none';
        if (showCardsViewBtn) showCardsViewBtn.classList.remove('active');
        if (manageStickersBtn) manageStickersBtn.classList.add('active');
        if (manageEmojisBtn) manageEmojisBtn.classList.remove('active');
        if (window.renderMyStickersList) window.renderMyStickersList();
        if (window.renderOtherStickersList) window.renderOtherStickersList();
    };
    const showEmojisView = () => {
        cardsViewDiv.style.display = 'none';
        groupsOnlyViewDiv.style.display = 'none';
        stickersViewDiv.style.display = 'none';
        emojisViewDiv.style.display = 'block';
        if (showCardsViewBtn) showCardsViewBtn.classList.remove('active');
        if (manageStickersBtn) manageStickersBtn.classList.remove('active');
        if (manageEmojisBtn) manageEmojisBtn.classList.add('active');
        if (window.renderEmojisList) window.renderEmojisList();
    };
    
    if (showCardsViewBtn) showCardsViewBtn.onclick = showCardsView;
    if (groupsOnlyIconBtn) groupsOnlyIconBtn.onclick = showGroupsOnlyView;
    if (manageStickersBtn) manageStickersBtn.onclick = showStickersView;
    if (manageEmojisBtn) manageEmojisBtn.onclick = showEmojisView;
    if (backToCardsViewBtn) backToCardsViewBtn.onclick = showCardsView;
    if (backToCardsFromStickers) backToCardsFromStickers.onclick = showCardsView;
    if (backToCardsFromEmojis) backToCardsFromEmojis.onclick = showCardsView;
    
    if (createGroupOnlyBtn) {
        createGroupOnlyBtn.onclick = () => {
            const name = newGroupNameOnly.value.trim();
            const color = newGroupColorOnly.value;
            if (name) {
                createGroup(name, color);
                newGroupNameOnly.value = '';
                renderGroupsOnlyList();
            } else {
                alert("请输入分组名");
            }
        };
    }
    
    if (floatingNewCardBtn) {
        floatingNewCardBtn.onclick = () => {
            refreshGroupSelect();
            showModal(document.getElementById('addCardModal'));
        };
    }
    
    if (confirmAddCardBtn) {
        confirmAddCardBtn.onclick = () => {
            const rawText = newCardText.value;
            const lines = rawText.split(/\r?\n/);
            const groupId = newCardGroupSelect.value;
            if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === "")) {
                alert("请至少输入一条字卡内容");
                return;
            }
            const { addedCount, duplicates } = addCardsToGroup(groupId, lines);
            if (addedCount > 0) {
                newCardText.value = '';
                closeAllModals();
                if (duplicates.length > 0) {
                    alert(`成功添加 ${addedCount} 张字卡。\n重复未添加：${duplicates.join(", ")}`);
                } else {
                    alert(`成功添加 ${addedCount} 张字卡！`);
                }
                renderGroupList();
                renderGroupsOnlyList();
            } else {
                alert("没有添加任何新字卡（可能全部重复或为空）");
            }
        };
    }
    
    // 自定义回复模态框的按钮
    const customReplyModal = document.getElementById('customReplyModal');
    if (customReplyModal) {
        const modalContent = customReplyModal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <button id="groupManageSubBtn" class="primary">📁 字卡分组管理（含搜索）</button>
            <div style="margin: 16px 0; border-top:1px solid #eee;"></div>
            <button id="otherPokeManageBtn" class="primary">👤 对方拍一拍库管理</button>
            <div style="margin: 8px 0;"></div>
            <button id="myPokeManageBtn" class="primary">😊 我的拍一拍库管理</button>
        `;
        document.getElementById('groupManageSubBtn').onclick = () => showModal(document.getElementById('groupManageModal'));
        document.getElementById('otherPokeManageBtn').onclick = () => {
            renderOtherPokeManage();
            showModal(document.getElementById('otherPokeManageModal'));
        };
        document.getElementById('myPokeManageBtn').onclick = () => {
            renderMyPokeLibrary();
            showModal(document.getElementById('myPokeManageModal'));
        };
    }
    
    showCardsView();
    initSearch();
}

// 导出供外部使用
window.renderOtherPokeManage = renderOtherPokeManage;
window.renderMyPokeLibrary = renderMyPokeLibrary;

// ========== 状态库管理（无分组，简单增删改） ==========
export function renderStatusLibrary() {
    const container = document.getElementById('statusLibraryContent');
    if (!container) return;
    
    if (!window.customStatuses) window.customStatuses = ["在线", "忙碌", "想你", "开心", "发呆", "听歌中"];
    
    function refreshList() {
        container.innerHTML = '';
        
        const listDiv = document.createElement('div');
        listDiv.className = 'status-simple-list';
        listDiv.style.maxHeight = '300px';
        listDiv.style.overflowY = 'auto';
        
        window.customStatuses.forEach((status, idx) => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;';
            item.innerHTML = `
                <span style="flex:1;">${escapeHtml(status)}</span>
                <div>
                    <button class="edit-status-btn" data-index="${idx}" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">✏️</button>
                    <button class="delete-status-btn" data-index="${idx}" style="background:none; border:none; font-size:1.2rem; cursor:pointer; margin-left:8px;">❌</button>
                </div>
            `;
            listDiv.appendChild(item);
        });
        container.appendChild(listDiv);
        
        const addForm = document.createElement('div');
        addForm.style.cssText = 'margin-top: 16px; display: flex; gap: 8px;';
        addForm.innerHTML = `
            <input type="text" id="newStatusInput" placeholder="输入新状态" style="flex:2; padding: 8px; border-radius: 20px; border:1px solid #ccc;">
            <button id="addStatusBtn" class="primary" style="flex:1; padding: 8px;">添加</button>
        `;
        container.appendChild(addForm);
        
        listDiv.querySelectorAll('.edit-status-btn').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index);
                const newVal = prompt('编辑状态', window.customStatuses[idx]);
                if (newVal && newVal.trim() && !window.customStatuses.includes(newVal.trim())) {
                    window.customStatuses[idx] = newVal.trim();
                    Data.saveCustomStatuses();
                    refreshList();
                } else if (newVal && window.customStatuses.includes(newVal.trim())) {
                    alert('状态重复');
                }
            };
        });
        
        listDiv.querySelectorAll('.delete-status-btn').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index);
                if (confirm(`删除“${window.customStatuses[idx]}”吗？`)) {
                    window.customStatuses.splice(idx, 1);
                    Data.saveCustomStatuses();
                    refreshList();
                }
            };
        });
        
        const addBtn = document.getElementById('addStatusBtn');
        const newInput = document.getElementById('newStatusInput');
        if (addBtn) {
            addBtn.onclick = () => {
                const newStatus = newInput.value.trim();
                if (newStatus === '') return;
                if (window.customStatuses.includes(newStatus)) {
                    alert('状态已存在');
                    return;
                }
                window.customStatuses.push(newStatus);
                Data.saveCustomStatuses();
                newInput.value = '';
                refreshList();
            };
        }
    }
    refreshList();
}

// 挂载到 window 供全局调用
window.renderStatusLibrary = renderStatusLibrary;