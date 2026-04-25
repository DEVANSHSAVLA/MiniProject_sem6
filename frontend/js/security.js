/**
 * Security Monitoring Page
 * Live event feed, threat stats, trust scores, attack breakdown, blocked IPs.
 */
const SecurityPage = {
    async render() {
        const content = document.getElementById('content');
        content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading security data...</p></div>';

        try {
            const [events, stats, trustScores, blockedIPs] = await Promise.all([
                API.getSecurityEvents({ limit: 30 }),
                API.getSecurityStats(),
                API.getTrustScores(),
                API.getBlockedIPs()
            ]);
            content.innerHTML = this.buildHTML(events, stats, trustScores, blockedIPs);
            this.initMap(events.events || []);
        } catch (error) {
            content.innerHTML = `<div class="empty-state"><p>Failed to load security data: ${error.message}</p></div>`;
        }
    },

    buildHTML(eventsData, stats, trustData, blockedData) {
        const events = eventsData.events || [];
        const scores = trustData.trust_scores || [];
        const blocked = blockedData.blocked_ips || {};

        return `
        <div class="page-enter">

            <!-- Global Threat Map -->
            <div class="card animate-in stagger-1" style="margin-bottom: var(--spacing-xl); position: relative; overflow: hidden; padding: 0;">
                <div class="card-header" style="position: absolute; top: 0; left: 0; right: 0; z-index: 10; padding: 20px; background: linear-gradient(rgba(15,23,42,0.9), transparent); border:none;">
                    <div>
                        <div class="card-title">Global Threat Intelligence</div>
                        <div class="card-subtitle">Live origin tracing of malicious network activity</div>
                    </div>
                    <div class="live-indicator"><span class="live-dot"></span>LIVE DEFENSE</div>
                </div>
                <!-- Stylized SVG World Map -->
                <div id="threat-map-container" style="width: 100%; height: 350px; background: radial-gradient(circle at center, rgba(16,185,129,0.05) 0%, transparent 60%); position: relative; display: flex; align-items:center; justify-content:center;">
                    <svg viewBox="0 0 1000 500" style="width: 100%; height: 100%; opacity: 0.15; stroke: #10b981; stroke-width: 0.5; fill: none; pointer-events:none;">
                        <!-- Very simplified world map outline -->
                        <path d="M 200,100 Q 250,50 350,150 T 450,250 T 600,100 T 700,200 T 800,100 T 900,200 T 950,50" />
                        <path d="M 150,200 Q 200,300 300,400 T 500,450 T 650,350 T 750,450 T 850,300" />
                        <path d="M 250,150 Q 300,250 400,200 T 550,300 T 600,200" />
                        <!-- Grid lines -->
                        <line x1="0" y1="250" x2="1000" y2="250" stroke-dasharray="2,5"/>
                        <line x1="500" y1="0" x2="500" y2="500" stroke-dasharray="2,5"/>
                    </svg>
                    <!-- Threat nodes injected here -->
                    <div id="threat-nodes"></div>
                </div>
            </div>

            <!-- Security Stats -->
            <div class="stats-grid">
                <div class="stat-card animate-in stagger-2">
                    <div class="stat-icon red">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <div class="stat-value">${stats.total_events || 0}</div>
                    <div class="stat-label">Total Threats</div>
                </div>
                <div class="stat-card animate-in stagger-3">
                    <div class="stat-icon orange">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/>
                            <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                    <div class="stat-value">${stats.unresolved_events || 0}</div>
                    <div class="stat-label">Unresolved</div>
                </div>
                <div class="stat-card animate-in stagger-4">
                    <div class="stat-icon purple">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                    </div>
                    <div class="stat-value">${Object.keys(blocked).length}</div>
                    <div class="stat-label">Blocked IPs</div>
                </div>
                <div class="stat-card animate-in stagger-5">
                    <div class="stat-icon green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="8.5" cy="7" r="4"/>
                            <polyline points="17 11 19 13 23 9"/>
                        </svg>
                    </div>
                    <div class="stat-value">${stats.engine?.avg_trust_score || 100}</div>
                    <div class="stat-label">Avg Trust Score</div>
                </div>
            </div>

            <div class="grid-2">
                <!-- Event Feed -->
                <div class="card animate-in stagger-4">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Security Event Feed</div>
                            <div class="card-subtitle">${eventsData.total || 0} total events</div>
                        </div>
                        <div class="live-indicator">
                            <span class="live-dot"></span>
                            <span>Monitoring</span>
                        </div>
                    </div>
                    <div class="event-feed" style="max-height: 500px; overflow-y: auto;">
                        ${events.map(e => this.eventItem(e)).join('')}
                        ${events.length === 0 ? '<div class="empty-state"><p>No security events detected</p></div>' : ''}
                    </div>
                </div>

                <div>
                    <!-- Attack Type Breakdown -->
                    <div class="card animate-in stagger-5" style="margin-bottom: var(--spacing-lg);">
                        <div class="card-header">
                            <div>
                                <div class="card-title">Attack Types</div>
                                <div class="card-subtitle">Detected threat categories</div>
                            </div>
                        </div>
                        ${this.attackTypeChart(stats.event_counts || {})}
                    </div>

                    <!-- Trust Scores -->
                    <div class="card animate-in stagger-6">
                        <div class="card-header">
                            <div>
                                <div class="card-title">User Trust Scores</div>
                                <div class="card-subtitle">Dynamic trust evaluation</div>
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            ${scores.map(s => this.trustScoreItem(s)).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Blocked IPs -->
            ${Object.keys(blocked).length > 0 ? `
            <div class="card animate-in stagger-7" style="margin-top: var(--spacing-lg);">
                <div class="card-header">
                    <div>
                        <div class="card-title">Blocked IP Addresses</div>
                        <div class="card-subtitle">${Object.keys(blocked).length} currently blocked</div>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>IP Address</th><th>Blocked Until</th><th>Remaining</th></tr></thead>
                        <tbody>
                            ${Object.entries(blocked).map(([ip, info]) => `
                                <tr>
                                    <td><strong>${ip}</strong></td>
                                    <td>${info.blocked_until ? new Date(info.blocked_until).toLocaleString() : '—'}</td>
                                    <td><span class="badge badge-critical">${info.remaining_seconds || 0}s</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}
        </div>
        `;
    },

    eventItem(event) {
        const sevClass = event.severity || 'medium';
        const typeIcon = {
            dos_attack: '🛡️', ddos_attack: '🛡️', model_poisoning: '☠️',
            unauthorized_access: '🔒', api_abuse: '⚠️', credential_attack: '🔑',
            data_manipulation: '📊', honeypot_trigger: '🍯', anomaly_detected: '📡',
            rate_limit_exceeded: '🚦'
        };

        return `
        <div class="event-item">
            <div class="event-dot ${sevClass}"></div>
            <div class="event-content">
                <div class="event-desc">
                    <span style="margin-right:4px;">${typeIcon[event.event_type] || '⚡'}</span>
                    ${event.description}
                </div>
                <div class="event-meta">
                    <span class="badge badge-${sevClass}">${event.severity}</span>
                    <span class="tag" style="font-size:0.7rem;">${event.event_type?.replace(/_/g, ' ')}</span>
                    <span>${event.source_ip || 'N/A'}</span>
                    <span>${event.action_taken || ''}</span>
                    <span>${this.timeAgo(event.created_at)}</span>
                    ${event.is_resolved ? '<span class="verified-badge" style="font-size:0.65rem;">Resolved</span>' : ''}
                </div>
            </div>
        </div>
        `;
    },

    attackTypeChart(counts) {
        const maxCount = Math.max(...Object.values(counts), 1);
        const colors = [
            'var(--color-critical)', 'var(--color-high)', 'var(--color-medium)',
            'var(--accent-primary)', 'var(--accent-secondary)', 'var(--color-info)',
            'var(--color-success)', '#a855f7', '#ec4899', '#14b8a6'
        ];

        return `
        <div style="display:flex; flex-direction:column; gap: 10px;">
            ${Object.entries(counts).map(([type, count], i) => `
                <div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span style="font-size:0.78rem; color:var(--text-secondary); text-transform:capitalize;">${type.replace(/_/g, ' ')}</span>
                        <span style="font-size:0.78rem; font-weight:600; color:var(--text-primary);">${count}</span>
                    </div>
                    <div style="height:8px; background:rgba(148,163,184,0.1); border-radius:4px; overflow:hidden;">
                        <div style="height:100%; width:${(count / maxCount) * 100}%; background:${colors[i % colors.length]}; border-radius:4px; transition:width 0.8s ease;"></div>
                    </div>
                </div>
            `).join('')}
        </div>
        `;
    },

    trustScoreItem(user) {
        const score = user.trust_score;
        const level = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';
        return `
        <div style="display:flex; align-items:center; gap:12px;">
            <div class="user-avatar" style="width:32px; height:32px; font-size:0.75rem; flex-shrink:0;">
                ${user.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div style="flex:1; min-width:0;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.82rem; font-weight:600; color:var(--text-primary);">${user.username}</span>
                    <span style="font-size:0.82rem; font-weight:700; color:var(--text-primary);">${score}</span>
                </div>
                <div class="trust-bar">
                    <div class="trust-fill ${level}" style="width:${score}%;"></div>
                </div>
            </div>
            <span class="badge badge-${level === 'high' ? 'success' : level === 'medium' ? 'medium' : 'critical'}" style="flex-shrink:0;">${user.role}</span>
        </div>
        `;
    },

    timeAgo(dateStr) {
        if (!dateStr) return '';
        const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    },

    initMap(events) {
        const container = document.getElementById('threat-nodes');
        if (!container) return;

        // Clean previous
        container.innerHTML = '';
        if (this.mapInterval) clearInterval(this.mapInterval);

        // Predefined coordinates for dramatic effect
        const regions = [
            { x: 250, y: 150 }, { x: 300, y: 120 }, { x: 220, y: 200 }, // Americas
            { x: 500, y: 120 }, { x: 550, y: 100 }, { x: 480, y: 150 }, // Europe
            { x: 750, y: 150 }, { x: 800, y: 250 }, { x: 650, y: 180 }, // Asia
            { x: 450, y: 300 }, { x: 550, y: 350 }, { x: 850, y: 400 }  // South
        ];

        // Draw initial recent threats
        events.slice(0, 5).forEach((e, i) => {
            if (e.severity === 'critical' || e.severity === 'high') {
                this.spawnThreatNode(container, regions[i % regions.length], e.severity);
            }
        });

        // Simulate live incoming attacks
        this.mapInterval = setInterval(() => {
            if (Math.random() > 0.4) {
                const region = regions[Math.floor(Math.random() * regions.length)];
                const severity = Math.random() > 0.8 ? 'critical' : (Math.random() > 0.5 ? 'high' : 'medium');
                this.spawnThreatNode(container, region, severity);
            }
        }, 2000);
    },

    spawnThreatNode(container, pos, severity) {
        const colors = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
        const color = colors[severity] || colors.medium;

        // Add random scatter to position
        const rx = pos.x + (Math.random() * 40 - 20);
        const ry = pos.y + (Math.random() * 40 - 20);

        const node = document.createElement('div');
        node.style.position = 'absolute';
        node.style.left = `${(rx / 1000) * 100}%`;
        node.style.top = `${(ry / 500) * 100}%`;
        node.style.width = '6px';
        node.style.height = '6px';
        node.style.background = color;
        node.style.borderRadius = '50%';
        node.style.boxShadow = `0 0 10px ${color}`;
        node.style.transform = 'translate(-50%, -50%)';
        node.style.zIndex = '20';

        // Ripple element
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.width = '100%';
        ripple.style.height = '100%';
        ripple.style.borderRadius = '50%';
        ripple.style.border = `1px solid ${color}`;
        ripple.style.pointerEvents = 'none';

        node.appendChild(ripple);
        container.appendChild(node);

        // Animate
        ripple.animate([
            { width: '0px', height: '0px', opacity: 1 },
            { width: '60px', height: '60px', opacity: 0 }
        ], { duration: 2000, easing: 'ease-out' });

        node.animate([
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.1 },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.9 },
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' }
        ], { duration: 4000, easing: 'ease-in-out' });

        // Cleanup
        setTimeout(() => {
            if (container.contains(node)) container.removeChild(node);
        }, 4000);
    }
};
