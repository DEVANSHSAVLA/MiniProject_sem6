/**
 * Toast Notification System
 * Animated slide-in toast notifications with icons and auto-dismiss.
 */
const Toast = {
    container: null,

    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed; top: 80px; right: 24px; z-index: 9999;
            display: flex; flex-direction: column; gap: 10px;
            pointer-events: none; max-width: 380px;
        `;
        document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 4000) {
        this.init();

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        const colors = {
            success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#10b981' },
            error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#ef4444' },
            warning: { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', color: '#eab308' },
            info: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', color: '#818cf8' }
        };

        const c = colors[type] || colors.info;
        const toast = document.createElement('div');
        toast.style.cssText = `
            display: flex; align-items: flex-start; gap: 12px;
            padding: 14px 18px; border-radius: 12px;
            background: ${c.bg}; backdrop-filter: blur(20px);
            border: 1px solid ${c.border};
            color: #f1f5f9; font-size: 0.85rem; font-family: 'Inter', sans-serif;
            pointer-events: all; cursor: pointer;
            transform: translateX(120%); opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        `;

        const iconEl = document.createElement('div');
        iconEl.style.cssText = `width:20px; height:20px; flex-shrink:0; color:${c.color};`;
        iconEl.innerHTML = icons[type] || icons.info;

        const msgEl = document.createElement('div');
        msgEl.style.cssText = 'flex:1; line-height:1.4;';
        msgEl.textContent = message;

        const progressEl = document.createElement('div');
        progressEl.style.cssText = `
            position: absolute; bottom: 0; left: 0; height: 2px;
            background: ${c.color}; border-radius: 0 0 12px 12px;
            width: 100%; transform-origin: left;
            animation: toastProgress ${duration}ms linear forwards;
        `;

        toast.style.position = 'relative';
        toast.appendChild(iconEl);
        toast.appendChild(msgEl);
        toast.appendChild(progressEl);
        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        // Click to dismiss
        toast.addEventListener('click', () => this.dismiss(toast));

        // Auto dismiss
        setTimeout(() => this.dismiss(toast), duration);
    },

    dismiss(toast) {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    },

    success(msg, dur) { this.show(msg, 'success', dur); },
    error(msg, dur) { this.show(msg, 'error', dur); },
    warning(msg, dur) { this.show(msg, 'warning', dur); },
    info(msg, dur) { this.show(msg, 'info', dur); }
};

// Add CSS keyframe for progress bar
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes toastProgress {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
    }
`;
document.head.appendChild(toastStyle);
