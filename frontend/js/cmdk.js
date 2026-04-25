/**
 * Command Palette (Ctrl+K / Cmd+K)
 * Elite power-user feature for quick navigation and actions.
 */
const CmdK = {
    commands: [
        { id: 'nav-dash', title: 'Dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', action: () => window.location.hash = '#dashboard' },
        { id: 'nav-block', title: 'Blockchain Explorer', icon: 'M1 4h8v6H1zM15 4h8v6h-8zM8 14h8v6H8z', action: () => window.location.hash = '#blockchain' },
        { id: 'nav-models', title: 'AI Models Registry', icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5', action: () => window.location.hash = '#models' },
        { id: 'nav-sec', title: 'Security Monitoring', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', action: () => window.location.hash = '#security' },
        { id: 'nav-data', title: 'Datasets', icon: 'M21 12c0 1.66-4 3-9 3s-9-1.34-9-3 M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5 M12 5c-4.97 0-9-1.34-9-3s4.03-3 9-3 9 1.34 9 3-4.03 3-9 3z', action: () => window.location.hash = '#datasets' },
        { id: 'nav-set', title: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z', action: () => window.location.hash = '#settings' },
        { id: 'act-sim', title: 'Simulate Cyber Attach', icon: 'M13 2L3 14h9l-1 10 10-12h-9l1-10z', type: 'danger', action: () => document.getElementById('simulate-attack-btn')?.click() },
        { id: 'act-logout', title: 'Logout', icon: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9', type: 'danger', action: () => document.getElementById('logout-btn')?.click() }
    ],

    init() {
        const overlay = document.createElement('div');
        overlay.id = 'cmdk-overlay';
        overlay.className = 'cmdk-overlay';
        overlay.innerHTML = `
            <div class="cmdk-modal" id="cmdk-modal">
                <div class="cmdk-header">
                    <svg class="cmdk-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" id="cmdk-input" class="cmdk-input" placeholder="Search commands, navigate... (Esc to close)">
                    <div class="cmdk-badge">CTRL+K</div>
                </div>
                <div class="cmdk-body" id="cmdk-results"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.input = document.getElementById('cmdk-input');
        this.results = document.getElementById('cmdk-results');
        this.overlay = document.getElementById('cmdk-overlay');
        this.modal = document.getElementById('cmdk-modal');

        // Event listeners
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape' && this.isOpen()) this.close();
        });

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        this.input.addEventListener('input', () => this.filter(this.input.value));
        this.input.addEventListener('keydown', (e) => this.handleKeyNavigation(e));

        // Initial render
        this.filter('');
    },

    isOpen() {
        return this.overlay.classList.contains('active');
    },

    toggle() {
        if (this.isOpen()) this.close();
        else {
            this.overlay.classList.add('active');
            this.modelIn();
            this.input.value = '';
            this.filter('');
            setTimeout(() => this.input.focus(), 100);
        }
    },

    close() {
        this.modal.style.transform = 'scale(0.95)';
        this.modal.style.opacity = '0';
        setTimeout(() => {
            this.overlay.classList.remove('active');
            this.modal.style.transform = '';
            this.modal.style.opacity = '';
        }, 150);
    },

    modelIn() {
        this.modal.animate([
            { transform: 'scale(0.95)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1 }
        ], { duration: 150, easing: 'ease-out' });
    },

    filter(query) {
        let matches = this.commands;
        if (query) {
            const q = query.toLowerCase();
            matches = this.commands.filter(c => c.title.toLowerCase().includes(q));
        }

        this.renderResults(matches);
    },

    renderResults(items) {
        if (!items.length) {
            this.results.innerHTML = '<div class="cmdk-empty">No commands found.</div>';
            return;
        }

        this.results.innerHTML = items.map((item, i) => `
            <div class="cmdk-item ${i === 0 ? 'selected' : ''}" data-index="${i}" onclick="CmdK.execute(${i})">
                <svg class="cmdk-icon ${item.type === 'danger' ? 'text-danger' : 'text-primary'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="${item.icon}"/>
                </svg>
                <div class="cmdk-text">${item.title}</div>
                <div class="cmdk-shortcut">↵</div>
            </div>
        `).join('');

        this.currentItems = items;
        this.selectedIndex = 0;
    },

    handleKeyNavigation(e) {
        if (!this.currentItems || !this.currentItems.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.currentItems.length;
            this.updateSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.currentItems.length) % this.currentItems.length;
            this.updateSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.execute(this.selectedIndex);
        }
    },

    updateSelection() {
        const items = this.results.querySelectorAll('.cmdk-item');
        items.forEach((it, i) => {
            it.classList.toggle('selected', i === this.selectedIndex);
            if (i === this.selectedIndex) it.scrollIntoView({ block: 'nearest' });
        });
    },

    execute(index) {
        const item = this.currentItems[index];
        if (item && item.action) {
            this.close();
            item.action();
        }
    }
};
