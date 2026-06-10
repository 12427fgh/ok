// ui-helpers.js
export function showModal(modal) {
    closeAllModals();
    if (modal) modal.style.display = 'flex';
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = 'block';
}
export function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => {
        m.style.display = 'none';
        m.style.removeProperty('z-index');
    });
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.style.removeProperty('z-index');
    }
    // 确保没有残留的阻塞点击的遮罩层
    const extraOverlays = document.querySelectorAll('.modal-backdrop, .fixed-overlay');
    extraOverlays.forEach(el => el.remove());
    document.body.style.overflow = ''; // 恢复滚动
}
export function bindModalClosers() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => {
            const modalId = btn.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'none';
            const overlay = document.getElementById('overlay');
            if (overlay) overlay.style.display = 'none';
        };
    });
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.onclick = closeAllModals;
}

export function hideModal(modal) {
    if (modal) modal.style.display = 'none';
    const overlay = document.getElementById('overlay');
    if (overlay && !document.querySelector('.modal[style*="display: flex"]')) {
        overlay.style.display = 'none';
    }
}