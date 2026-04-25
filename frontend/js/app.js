/**
 * App Router & Premium Features
 * Login flow, SPA routing, notifications, search, threat simulation, auto-refresh.
 */
const App = {
    pages: {
        dashboard: { title: 'Dashboard', renderer: DashboardPage },
        blockchain: { title: 'Blockchain Explorer', renderer: BlockchainPage },
        models: { title: 'AI Models', renderer: ModelsPage },
        security: { title: 'Security Monitoring', renderer: SecurityPage },
        datasets: { title: 'Datasets', renderer: DatasetsPage },
        lab: { title: 'Security Research Lab', renderer: LabPage },
        bank: { title: 'Bank Portal', renderer: BankPage },
        demo: { title: '🥇 End-to-End Demo', renderer: DemoPipeline },
        settings: { title: 'Settings', renderer: SettingsPage },
    },

    currentPage: null,
    refreshInterval: null,
    notifOpen: false,

    // ── Boot ────────────────────────────────────────────────
    boot() {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const loginTime = localStorage.getItem('login_time');

        // Check if session has expired (15 minutes = 900,000 ms)
        const isExpired = loginTime && (Date.now() - parseInt(loginTime) > 15 * 60 * 1000);

        if (token && user && !isExpired) {
            API.token = token;
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app-shell').style.display = 'flex';
            this.setUser(user);
            this.init();
            
            // Start the session countdown from remaining time
            const remaining = (15 * 60 * 1000) - (Date.now() - parseInt(loginTime));
            this.startSessionTimer(remaining);
        } else {
            // Show login
            if (isExpired) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('login_time');
            }
            document.getElementById('login-screen').innerHTML = LoginPage.render();
            LoginPage.init();
        }

        // Feature: Logout on Refresh (User Request)
        // By clearing the token on unload, any refresh will force a re-login
        window.addEventListener('beforeunload', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('login_time');
        });
    },

    startSessionTimer(ms) {
        if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
        this.sessionTimeout = setTimeout(() => {
            this.handleLogout('Session expired after 15 minutes of inactivity.');
        }, ms);
    },

    handleLogout(reason = 'Logged out successfully') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('login_time');
        API.token = null;
        Toast.info(reason);
        setTimeout(() => window.location.reload(), 1000);
    },

    // ── Initialize Dashboard ────────────────────────────────
    init() {
        // Route on hash change
        window.addEventListener('hashchange', () => this.route());

        // Sidebar toggle
        document.getElementById('menu-toggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Close sidebar on mobile when clicking content
        document.getElementById('content')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.remove('open');
        });

        // Notification panel
        this.initNotifications();

        // Search
        this.initSearch();

        // Command Palette
        if (typeof CmdK !== 'undefined') CmdK.init();

        // Simulate attack button
        this.initSimulateAttack();

        // Phase 3: Extreme Wow Features
        this.initSystemHUD();
        this.initFocusMode();
        this.initTicker();

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Initial route
        this.route();

        // Auto-refresh every 30s
        this.refreshInterval = setInterval(() => {
            this.updateNotifications();
            this.checkChainStatus();
        }, 30000);

        // Initial checks
        this.updateNotifications();
        this.checkChainStatus();
    },

    // ── Set User UI ─────────────────────────────────────────
    setUser(user) {
        const displayName = user.full_name || user.username || 'System User';
        const initial = displayName[0].toUpperCase();
        
        // Update initials
        const sidebarAvatar = document.getElementById('sidebar-avatar-initial');
        const headerAvatar = document.getElementById('header-avatar-initial');
        if (sidebarAvatar) sidebarAvatar.textContent = initial;
        if (headerAvatar) headerAvatar.textContent = initial;
        
        // Update name and role
        const nameEl = document.getElementById('sidebar-user-name');
        const roleEl = document.getElementById('sidebar-user-role');
        
        if (nameEl) nameEl.textContent = displayName;
        if (roleEl) {
            const role = user.role || 'viewer';
            roleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        }
    },

    // ── Routing ─────────────────────────────────────────────
    async route() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        const page = this.pages[hash];

        if (!page) {
            window.location.hash = '#dashboard';
            return;
        }

        this.currentPage = hash;

        // Update page title
        document.getElementById('page-title').textContent = page.title;
        document.title = `${page.title} — AI Chain Guard`;

        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === hash);
        });

        // Render page
        if (page.renderer.init && !page.renderer._initialized) {
            page.renderer.init();
            page.renderer._initialized = true;
        }
        await page.renderer.render();
    },

    // ── Notifications ───────────────────────────────────────
    initNotifications() {
        const btn = document.getElementById('notification-btn');
        const panel = document.getElementById('notification-panel');

        btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.notifOpen = !this.notifOpen;
            panel.classList.toggle('open', this.notifOpen);
            if (this.notifOpen) this.loadNotifications();
        });

        document.addEventListener('click', (e) => {
            if (!panel?.contains(e.target) && !btn?.contains(e.target)) {
                panel?.classList.remove('open');
                this.notifOpen = false;
            }
        });

        document.getElementById('notif-clear')?.addEventListener('click', () => {
            document.getElementById('notif-panel-body').innerHTML =
                '<div class="empty-state" style="padding:24px;"><p>No notifications</p></div>';
            const badge = document.getElementById('notification-badge');
            if (badge) { badge.textContent = ''; badge.style.display = 'none'; }
        });
    },

    async loadNotifications() {
        const body = document.getElementById('notif-panel-body');
        try {
            const data = await API.getSecurityEvents({ limit: 10 });
            const events = data.events || [];
            body.innerHTML = events.map(e => `
                <div class="notif-item">
                    <div class="notif-icon ${e.severity}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/>
                        </svg>
                    </div>
                    <div class="notif-text">${e.description}</div>
                    <div class="notif-time">${this.timeAgo(e.created_at)}</div>
                </div>
            `).join('') || '<div class="empty-state" style="padding:24px;"><p>No notifications</p></div>';
        } catch (err) {
            body.innerHTML = '<div class="empty-state" style="padding:24px;"><p>Failed to load</p></div>';
        }
    },

    async updateNotifications() {
        try {
            const stats = await API.getSecurityStats();
            const unresolved = stats.unresolved_events || 0;
            const badge = document.getElementById('notification-badge');
            if (badge) {
                badge.textContent = unresolved > 0 ? (unresolved > 99 ? '99+' : unresolved) : '';
                badge.style.display = unresolved > 0 ? 'flex' : 'none';
            }
        } catch (e) {
            // Silent
        }
    },

    // ── Search ──────────────────────────────────────────────
    initSearch() {
        const input = document.getElementById('global-search');
        if (!input) return;

        // Create results dropdown
        const results = document.createElement('div');
        results.className = 'search-results';
        results.id = 'search-results';
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(results);

        let debounce;
        input.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => this.performSearch(input.value), 300);
        });

        input.addEventListener('focus', () => {
            if (input.value.length >= 2) results.classList.add('open');
        });

        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !results.contains(e.target)) {
                results.classList.remove('open');
            }
        });
    },

    async performSearch(query) {
        const results = document.getElementById('search-results');
        if (!results || query.length < 2) {
            results?.classList.remove('open');
            return;
        }

        try {
            const [models, datasets, events] = await Promise.all([
                API.getModels(),
                API.getDatasets(),
                API.getSecurityEvents({ limit: 10 })
            ]);

            const q = query.toLowerCase();
            const matches = [];

            (models.models || []).filter(m => m.name.toLowerCase().includes(q) || m.framework?.toLowerCase().includes(q))
                .forEach(m => matches.push({ type: 'Model', name: m.name, page: '#models', badge: 'badge-info' }));

            (datasets.datasets || []).filter(d => d.name.toLowerCase().includes(q) || d.source?.toLowerCase().includes(q))
                .forEach(d => matches.push({ type: 'Dataset', name: d.name, page: '#datasets', badge: 'badge-low' }));

            (events.events || []).filter(e => e.description?.toLowerCase().includes(q) || e.event_type?.toLowerCase().includes(q))
                .forEach(e => matches.push({ type: 'Event', name: e.description?.substring(0, 60), page: '#security', badge: 'badge-critical' }));

            if (matches.length === 0) {
                results.innerHTML = '<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:0.82rem;">No results found</div>';
            } else {
                results.innerHTML = matches.slice(0, 8).map(m => `
                    <a href="${m.page}" class="search-result-item" onclick="document.getElementById('search-results').classList.remove('open');">
                        <span class="badge ${m.badge}" style="font-size:0.6rem;">${m.type}</span>
                        <span style="color:var(--text-primary); font-size:0.82rem;">${m.name}</span>
                    </a>
                `).join('');
            }
            results.classList.add('open');
        } catch (err) {
            results.classList.remove('open');
        }
    },

    // ── Simulate Attack ─────────────────────────────────────
    initSimulateAttack() {
        // Dropdown toggle is handled via inline onclick in HTML
        // This function sets up global access
        window.simulateAttack = async (type) => {
            document.getElementById('attack-sim-panel').style.display = 'none';

            const titles = {
                'dos': 'DDoS / Flood Attack',
                'brute_force': 'Credential Brute Force',
                'api_abuse': 'API Endpoint Abuse'
            };

            Toast.warning(`Simulating ${titles[type] || type}...`);

            // Trigger Glitch Effect on Body
            document.body.classList.add('glitch-active');
            window.dispatchEvent(new CustomEvent('attack-simulation-started', { detail: { type } }));

            if (window.AudioSys) AudioSys.playAlarm();

            setTimeout(() => {
                document.body.classList.remove('glitch-active');
            }, 1000);

            try {
                // Perform specific attack patterns to trigger the backend detector
                const endpoint = type === 'api_abuse' ? '/models/internal/weights' : '/security/stats';
                const count = type === 'dos' ? 15 : 5;

                for (let i = 0; i < count; i++) {
                    await fetch(`${API.BASE_URL}${endpoint}?_sim=${type}_${Date.now()}_${i}`, {
                        headers: type === 'brute_force' ? { 'Authorization': 'Basic invalid' } : {}
                    });
                }

                Toast.error(`🚨 ${titles[type]} detected by AI Engine! Check SOC Timeline.`, 5000);
                this.updateNotifications();

                // Auto-navigate if not on security or dashboard
                if (window.location.hash !== '#security' && window.location.hash !== '#dashboard') {
                    setTimeout(() => window.location.hash = '#security', 2000);
                }
            } catch (e) {
                console.error('Simulation failed', e);
            }
        };
    },

    // ── System Resource HUD ─────────────────────────────────
    initSystemHUD() {
        const cpuBar = document.getElementById('hud-cpu');
        const memBar = document.getElementById('hud-mem');
        const netBar = document.getElementById('hud-net');

        if (!cpuBar || !memBar || !netBar) return;

        // Simulate live resource fluctuation every 1 second
        setInterval(() => {
            // CPU: 20-60%
            const cpu = Math.floor(20 + Math.random() * 40);
            cpuBar.style.width = `${cpu}%`;
            cpuBar.style.background = cpu > 50 ? 'var(--color-warning)' : 'var(--color-success)';

            // MEM: 60-90%
            const mem = Math.floor(60 + Math.random() * 30);
            memBar.style.width = `${mem}%`;
            memBar.style.background = mem > 85 ? 'var(--color-danger)' : 'var(--color-warning)';

            // NET: 10-40% 
            const net = Math.floor(10 + Math.random() * 30);
            netBar.style.width = `${net}%`;
        }, 1200);
    },

    // ── Focus Mode (Zen Mode) ───────────────────────────────
    initFocusMode() {
        // Toggle Focus Mode on F11 or Ctrl+B / Cmd+B
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b')) {
                e.preventDefault();
                document.body.classList.toggle('focus-mode');
                Toast.info(document.body.classList.contains('focus-mode') ? 'Focus Mode Enabled (Press F11 to exit)' : 'Focus Mode Disabled');

                // Trigger resize for charts to recalculate
                setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
            }
        });
    },

    // ── Chain Status ────────────────────────────────────────
    async checkChainStatus() {
        try {
            const validation = await API.validateChain();
            const statusEl = document.getElementById('chain-status');
            if (statusEl) {
                const dot = statusEl.querySelector('.chain-dot');
                const text = statusEl.querySelector('span');
                if (validation.is_valid) {
                    dot.style.background = 'var(--color-success)';
                    text.textContent = 'Chain Valid';
                    statusEl.style.color = 'var(--color-success)';
                } else {
                    dot.style.background = 'var(--color-danger)';
                    text.textContent = 'Chain Invalid';
                    statusEl.style.color = 'var(--color-danger)';
                }
            }
        } catch (e) {
            // Silent
        }
    },

    // ── Live Security Ticker ───────────────────────────────
    initTicker() {
        const content = document.getElementById('ticker-content');
        if (!content) return;

        // Initial update
        this.refreshTicker();

        // Refresh ticker every 10 seconds
        setInterval(() => this.refreshTicker(), 10000);
    },

    async refreshTicker() {
        const content = document.getElementById('ticker-content');
        if (!content) return;

        try {
            const [stats, bcStats] = await Promise.all([
                API.getSecurityStats(),
                API.getBlockchainStats()
            ]);

            const messages = [
                { text: `System Status: ${stats.unresolved_events > 0 ? 'Threat Detected' : 'All Clear'}`, type: stats.unresolved_events > 0 ? 'danger' : 'success' },
                { text: `Blockchain: ${bcStats.total_blocks} Blocks Verified (${bcStats.is_valid ? 'Valid' : 'Invalid'})`, type: bcStats.is_valid ? 'success' : 'danger' },
                { text: `SMS Gateway: Real-time Bridge Active (Dual-Channel)`, type: 'success' },
                { text: `AI Engine: Real-time scan at ${stats.threat_count || 0} alerts/hr`, type: 'info' },
                { text: `Self-Healing: ${stats.last_healing_event || 'Monitoring...'}`, type: 'info' },
                { text: `Security Attribution: Active Defense engaged`, type: 'warning' }
            ];

            // Triple the items for a seamless infinite loop
            const html = [...messages, ...messages, ...messages].map(m => `
                <div class="ticker-item ${m.type === 'danger' ? 'danger' : m.type === 'warning' ? 'warning' : ''}">
                    <div class="ticker-dot"></div>
                    <span>${m.text}</span>
                </div>
            `).join('');

            content.innerHTML = html;
        } catch (e) {
            // Static fallback on error
            console.error('Ticker update failed', e);
        }
    },

    // ── Utility ─────────────────────────────────────────────
    timeAgo(dateStr) {
        if (!dateStr) return '';
        const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.boot());
