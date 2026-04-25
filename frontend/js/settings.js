/**
 * Settings Page
 * API key management, system configuration, user info.
 */
const SettingsPage = {
    async render() {
        const content = document.getElementById('content');
        content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading settings...</p></div>';

        try {
            const [users, contractEvents, bcStats] = await Promise.all([
                API.getUsers(),
                API.getContractEvents(),
                API.getBlockchainStats()
            ]);
            content.innerHTML = this.buildHTML(users, contractEvents, bcStats);
        } catch (error) {
            content.innerHTML = `<div class="empty-state"><p>Failed to load settings: ${error.message}</p></div>`;
        }
    },

    buildHTML(usersData, contractEvents, bcStats) {
        const users = usersData.users || [];
        const events = contractEvents.events || [];

        return `
        <div class="page-enter">
            <div class="grid-2">
                <!-- System Info -->
                <div class="card animate-in stagger-1">
                    <div class="card-header">
                        <div class="card-title">System Configuration</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${this.configRow('Blockchain Difficulty', bcStats.difficulty || 2)}
                        ${this.configRow('Total Blocks', bcStats.total_blocks || 0)}
                        ${this.configRow('Chain Status', bcStats.is_valid ? '✓ Valid' : '✗ Invalid')}
                        ${this.configRow('API Rate Limit', '60 req/min')}
                        ${this.configRow('Block Duration', '300 seconds')}
                        ${this.configRow('Auth Fail Threshold', '10 attempts')}
                        ${this.configRow('JWT Token Expiry', '24 hours')}
                        ${this.configRow('Proof-of-Work', 'SHA-256')}
                    </div>
                </div>

                <!-- Users -->
                <div class="card animate-in stagger-2">
                    <div class="card-header">
                        <div>
                            <div class="card-title">System Users</div>
                            <div class="card-subtitle">${users.length} registered</div>
                        </div>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead><tr><th>User</th><th>Role</th><th>Trust</th><th>Status</th></tr></thead>
                            <tbody>
                                ${users.map(u => `
                                    <tr>
                                        <td>
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <div class="user-avatar" style="width:28px; height:28px; font-size:0.7rem;">
                                                    ${u.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style="font-weight:600; color:var(--text-primary);">${u.username}</div>
                                                    <div style="font-size:0.7rem; color:var(--text-muted);">${u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span class="badge badge-info">${u.role}</span></td>
                                        <td>
                                            <div style="display:flex; align-items:center; gap:6px;">
                                                <span style="font-weight:600; color:var(--text-primary);">${u.trust_score}</span>
                                                <div class="trust-bar" style="width:60px;">
                                                    <div class="trust-fill ${u.trust_score >= 80 ? 'high' : u.trust_score >= 50 ? 'medium' : 'low'}"
                                                         style="width:${u.trust_score}%;"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>${u.is_blocked
                ? '<span class="badge badge-critical">Blocked</span>'
                : '<span class="badge badge-success">Active</span>'
            }</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Smart Contract Events -->
            <div class="card animate-in stagger-3" style="margin-top: var(--spacing-lg);">
                <div class="card-header">
                    <div>
                        <div class="card-title">Smart Contract Events</div>
                        <div class="card-subtitle">Recent contract activity</div>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Event</th><th>Data</th><th>Timestamp</th></tr></thead>
                        <tbody>
                            ${events.slice(0, 20).map(e => `
                                <tr>
                                    <td><span class="badge badge-info">${e.event}</span></td>
                                    <td style="max-width:400px; overflow:hidden; text-overflow:ellipsis;">
                                        ${Object.entries(e.data || {}).map(([k, v]) =>
                `<span class="tag" style="margin-right:4px; margin-bottom:4px; font-size:0.7rem;">${k}: ${v}</span>`
            ).join('')}
                                    </td>
                                    <td>${e.timestamp ? new Date(e.timestamp).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- API Docs -->
            <div class="card animate-in stagger-4" style="margin-top: var(--spacing-lg);">
                <div class="card-header">
                    <div class="card-title">API Endpoints</div>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
                        <tbody>
                            ${this.apiEndpoints().map(e => `
                                <tr>
                                    <td><span class="badge ${e.method === 'GET' ? 'badge-success' : e.method === 'POST' ? 'badge-info' : 'badge-medium'}">${e.method}</span></td>
                                    <td><code class="mono" style="font-size:0.78rem; color:var(--text-accent);">${e.path}</code></td>
                                    <td style="color: var(--text-secondary);">${e.desc}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    },

    configRow(label, value) {
        return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-elevated); border-radius:var(--radius-sm);">
            <span style="font-size:0.82rem; color:var(--text-secondary);">${label}</span>
            <span style="font-size:0.82rem; font-weight:600; color:var(--text-primary);">${value}</span>
        </div>
        `;
    },

    apiEndpoints() {
        return [
            { method: 'POST', path: '/api/auth/login', desc: 'Authenticate user' },
            { method: 'POST', path: '/api/auth/register', desc: 'Register new user' },
            { method: 'GET', path: '/api/models', desc: 'List AI models' },
            { method: 'POST', path: '/api/models', desc: 'Register new model' },
            { method: 'PUT', path: '/api/models/:id', desc: 'Update model' },
            { method: 'POST', path: '/api/models/:id/verify', desc: 'Verify model integrity' },
            { method: 'GET', path: '/api/datasets', desc: 'List datasets' },
            { method: 'POST', path: '/api/datasets', desc: 'Register dataset' },
            { method: 'GET', path: '/api/blockchain/chain', desc: 'View blockchain' },
            { method: 'GET', path: '/api/blockchain/validate', desc: 'Validate chain' },
            { method: 'GET', path: '/api/security/events', desc: 'Security events' },
            { method: 'GET', path: '/api/security/stats', desc: 'Security stats' },
            { method: 'GET', path: '/api/security/trust-scores', desc: 'User trust scores' },
            { method: 'GET', path: '/api/dashboard/stats', desc: 'Dashboard stats' },
        ];
    }
};
