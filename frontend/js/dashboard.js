/**
 * Dashboard Page (Enhanced)
 * Stat cards with sparklines, Canvas donut + area chart, activity timeline.
 */
const DashboardPage = {
    attachEvents() {
        this.initAttackMap();
    },

    initAttackMap() {
        const layer = document.getElementById('map-attack-layer');
        if (!layer) return;

        // Simulate a new attack line every 3-7 seconds
        this.mapInterval = setInterval(() => {
            this.spawnAttackLine();
        }, 5000);

        // Listen for simulation events
        window.addEventListener('attack-simulation-started', (e) => {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => this.spawnAttackLine(true), i * 300);
            }
        });
    },

    spawnAttackLine(isCritical = false) {
        const layer = document.getElementById('map-attack-layer');
        if (!layer) return;

        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const endX = 30 + Math.random() * 40; // Target center-ish
        const endY = 30 + Math.random() * 40;

        const line = document.createElement('div');
        line.style.position = 'absolute';
        line.style.left = startX + '%';
        line.style.top = startY + '%';
        line.style.width = '2px';
        line.style.height = '2px';
        line.style.background = isCritical ? 'var(--color-danger)' : 'var(--accent-primary)';
        line.style.borderRadius = '50%';
        line.style.boxShadow = `0 0 10px ${isCritical ? 'var(--color-danger)' : 'var(--accent-primary)'}`;
        line.style.transition = 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
        line.style.zIndex = '5';

        layer.appendChild(line);

        // Animate to target
        setTimeout(() => {
            line.style.left = endX + '%';
            line.style.top = endY + '%';
            line.style.opacity = '0';
            line.style.transform = 'scale(2)';
        }, 50);

        // Cleanup
        setTimeout(() => {
            line.remove();
        }, 1600);
    },
    async render() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="page-enter">
                <!-- System Status Panel -->
                <div class="system-status-panel animate-in" style="display:flex; gap:20px; padding:15px 20px; background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.2); border-radius:var(--radius-md); margin-bottom:var(--spacing-xl); font-family:'JetBrains Mono',monospace; font-size:0.85rem;">
                    <div style="display:flex; align-items:center; gap:8px;"><span style="width:8px; height:8px; border-radius:50%; background:var(--color-success); box-shadow:0 0 8px var(--color-success);"></span> <strong>AI Engine:</strong> Active</div>
                    <div style="display:flex; align-items:center; gap:8px;"><span style="width:8px; height:8px; border-radius:50%; background:var(--color-success); box-shadow:0 0 8px var(--color-success);"></span> <strong>Blockchain:</strong> Connected</div>
                    <div style="display:flex; align-items:center; gap:8px;"><span id="model-status-dot" style="width:8px; height:8px; border-radius:50%; background:var(--color-success); box-shadow:0 0 8px var(--color-success);"></span> <strong>Detection Model:</strong> Running</div>
                    <div style="display:flex; align-items:center; gap:8px; margin-left:auto; color:var(--text-muted);"><strong>Last Model Update:</strong> <span id="last-update-time">Just now</span></div>
                </div>

                <!-- Stats Row -->
                <div class="stats-grid" id="dash-stats">
                    ${this.renderStatSkeleton()}
                </div>

                <!-- Enterprise Row: Active Defense & Prediction -->
                <div class="grid-3" style="margin-bottom: var(--spacing-xl); gap: var(--spacing-lg);">
                    <!-- Gauge & Prediction -->
                    <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px; position:relative; overflow:hidden;">
                        <!-- Animated background for high risk -->
                        <div id="risk-alarm-bg" style="position:absolute; inset:0; background:rgba(239,68,68,0.1); display:none; animation: pulse-danger 2s infinite;"></div>
                        
                        <div style="font-size:0.85rem; color:var(--text-muted); letter-spacing:1px; margin-bottom:20px; z-index:1;">REAL-TIME DETECTION GAUGE</div>
                        <div style="position:relative; width:150px; height:75px; overflow:hidden; z-index:1;">
                            <div style="position:absolute; top:0; left:0; width:150px; height:150px; border-radius:50%; border:15px solid var(--glass-border); border-bottom-color:transparent; border-right-color:transparent; transform:rotate(-45deg);"></div>
                            <div id="gauge-fill" style="position:absolute; top:0; left:0; width:150px; height:150px; border-radius:50%; border:15px solid var(--color-danger); border-bottom-color:transparent; border-right-color:transparent; transform:rotate(-45deg); transition:transform 0.5s ease;"></div>
                        </div>
                        <div id="gauge-score" style="font-size:2rem; font-weight:800; margin-top:-10px; z-index:1;">0.00</div>
                        <div id="gauge-label" style="font-size:0.75rem; font-weight:700; color:var(--color-success); margin-top:5px; letter-spacing:1px; z-index:1;">THREAT LEVEL: LOW</div>
                        
                        <!-- Predictive Score HUD Overlay -->
                        <div style="position:absolute; bottom:15px; right:15px; text-align:right; z-index:1;">
                            <div style="font-size:0.6rem; color:var(--text-muted); font-weight:700;">PREDICTIVE RISK</div>
                            <div id="attack-prediction-score" style="font-size:0.9rem; font-weight:800; color:var(--color-warning);">0.0%</div>
                            <div id="attack-prediction-level" style="font-size:0.6rem; font-weight:700; letter-spacing:0.5px;">LOW PROBABILITY</div>
                        </div>
                    </div>

                    <!-- Active Defense Status -->
                    <div class="card">
                        <div class="card-header">
                            <div><div class="card-title">Active Defense Systems</div><div class="card-subtitle">AI & Network protection status</div></div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:12px; padding:5px 0;">
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">
                                <span style="font-size:0.85rem; color:var(--text-secondary);">Rate Limiter</span>
                                <span id="status-rate-limiter" class="badge badge-success" style="font-size:0.65rem;">ACTIVE</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">
                                <span style="font-size:0.85rem; color:var(--text-secondary);">Firewall Engine</span>
                                <span id="status-firewall" class="badge badge-success" style="font-size:0.65rem;">ACTIVE</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">
                                <span style="font-size:0.85rem; color:var(--text-secondary);">AI Detection</span>
                                <span id="status-ai-detection" class="badge badge-success" style="font-size:0.65rem;">ACTIVE</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">
                                <span style="font-size:0.85rem; color:var(--text-secondary);">Blockchain Logger</span>
                                <span id="status-blockchain-logger" class="badge badge-success" style="font-size:0.65rem;">ACTIVE</span>
                            </div>
                        </div>
                    </div>

                    <!-- Top Attack Endpoints -->
                    <div class="card">
                        <div class="card-header">
                            <div><div class="card-title">Top Attack Endpoints</div><div class="card-subtitle">Targeted service vectors</div></div>
                        </div>
                        <div class="table-container" style="max-height: 180px; overflow-y: auto;">
                            <table style="font-size: 0.75rem;">
                                <thead>
                                    <tr><th>Endpoint</th><th style="text-align:right;">Hits</th></tr>
                                </thead>
                                <tbody id="top-endpoints-table">
                                    <tr><td colspan="2" style="text-align:center; color:var(--text-muted); padding:20px;">No critical vectors logged</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <!-- Threat Intelligence Attribution -->
                    <div class="card">
                        <div class="card-header">
                            <div><div class="card-title">Threat Intelligence Attribution</div><div class="card-subtitle">AI-driven attacker profiling</div></div>
                            <span class="badge badge-primary" style="font-size:0.6rem;">REAL-TIME</span>
                        </div>
                        <div class="table-container" style="max-height: 180px; overflow-y: auto;">
                            <table style="font-size: 0.75rem; width:100%;">
                                <thead>
                                    <tr>
                                        <th>Origin / IP</th>
                                        <th>Attack Type</th>
                                        <th>Fingerprint</th>
                                    </tr>
                                </thead>
                                <tbody id="attribution-tbody">
                                    <tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:20px;">Profiling incoming threats...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Global Threat Map Row -->
                <div class="card animate-in stagger-3" style="width: 100%; padding: 0; overflow: hidden; position: relative; height: 350px; margin-bottom: var(--spacing-xl);">
                    <div class="card-header" style="position: absolute; top: 0; left: 0; right: 0; z-index: 10; padding: 20px; background: linear-gradient(to bottom, rgba(15,23,42,0.9), transparent); border:none;">
                        <div>
                            <div class="card-title">Live Global Attack Map</div>
                            <div class="card-subtitle">Real-time source-to-target threat visualization</div>
                        </div>
                    </div>
                    <div id="attack-map-container" style="width: 100%; height: 100%; background: #0b1120; display: flex; align-items: center; justify-content: center; position: relative; background-image: radial-gradient(circle at center, #1e293b 0%, #0b1120 100%);">
                        <!-- Simple Grid & Map representation -->
                        <div style="position:absolute; inset:0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 30px 30px;"></div>
                        
                        <svg viewBox="0 0 800 400" style="width: 90%; height: 70%; opacity: 0.2;">
                            <path d="M150,150 L200,100 L300,120 L400,80 L500,100 L600,150 L700,130 L750,200 L700,280 L600,250 L500,300 L400,280 L300,320 L200,300 L150,250 Z" fill="#6366f1" />
                            <circle cx="200" cy="180" r="100" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.2)" />
                            <circle cx="550" cy="200" r="120" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.2)" />
                        </svg>

                        <!-- Dynamic Attack Lines (Created in JS) -->
                        <div id="map-attack-layer" style="position: absolute; inset: 0; pointer-events: none;"></div>

                        <div style="position: absolute; bottom: 20px; left: 20px; display: flex; gap: 20px; background: rgba(15,23,42,0.8); padding: 10px 15px; border-radius: 8px; border: 1px solid var(--glass-border); backdrop-filter: blur(4px);">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="width:8px; height:8px; border-radius:50%; background:var(--color-danger); box-shadow:0 0 10px var(--color-danger);"></span>
                                <span style="font-size:0.65rem; color:var(--text-secondary); font-weight:600;">ACTIVE EXPLOIT</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="width:8px; height:8px; border-radius:50%; background:var(--color-success); box-shadow:0 0 10px var(--color-success);"></span>
                                <span style="font-size:0.65rem; color:var(--text-secondary); font-weight:600;">SECURE NODE</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Secondary Row: IPs & Map -->
                <div class="grid-2" style="margin-bottom: var(--spacing-xl); gap: var(--spacing-lg);">
                     <!-- Top IPs Table -->
                    <div class="card">
                        <div class="card-header">
                            <div><div class="card-title">Top Attacking IPs</div></div>
                        </div>
                        <table style="width:100%; text-align:left; border-collapse:collapse; font-size:0.85rem;">
                            <thead>
                                <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-muted);">
                                    <th style="padding:10px;">IP ADDRESS</th>
                                    <th style="padding:10px;">TYPE</th>
                                    <th style="padding:10px;">COUNT</th>
                                </tr>
                            </thead>
                            <tbody id="top-ips-tbody">
                                <tr><td colspan="3" style="padding:10px; text-align:center;">Loading...</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Attack Map -->
                    <div class="card">
                         <div class="card-header">
                            <div><div class="card-title">Live Attack Map</div><div class="card-subtitle">Global origin tracking</div></div>
                        </div>
                        <div style="position:relative; width:100%; height:180px; background: radial-gradient(circle at center, rgba(99,102,241,0.1) 0%, transparent 70%); border-radius:var(--radius-md); overflow:hidden; display:flex; align-items:center; justify-content:center;">
                            <!-- Simulated SVG Map -->
                            <svg viewBox="0 0 1000 500" style="position:absolute; width:100%; height:100%; opacity:0.1; fill:#94a3b8;">
                                <circle cx="300" cy="200" r="10" />
                                <circle cx="450" cy="150" r="15" />
                                <circle cx="600" cy="250" r="12" />
                            </svg>
                            <div style="position:absolute; inset:0; background:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><circle cx=%222%22 cy=%222%22 r=%221%22 fill=%22rgba(255,255,255,0.05)%22/></svg>');"></div>
                            
                            <!-- Map Points -->
                            <div class="map-point" style="position:absolute; top:30%; left:20%; width:8px; height:8px; background:var(--color-danger); border-radius:50%; box-shadow:0 0 10px var(--color-danger);"></div>
                            <div class="map-point" style="position:absolute; top:45%; left:50%; width:8px; height:8px; background:var(--color-warning); border-radius:50%; box-shadow:0 0 10px var(--color-warning);"></div>
                            <div class="map-point" style="position:absolute; top:40%; left:75%; width:8px; height:8px; background:var(--color-danger); border-radius:50%; box-shadow:0 0 10px var(--color-danger);"></div>
                            
                            <!-- Overlay Text -->
                            <div style="position:absolute; bottom:10px; right:15px; font-family:'JetBrains Mono'; font-size:0.7rem; color:var(--text-muted);">
                                Active Nodes: 4 | Global Matrix
                            </div>
                        </div>
                    </div>
                </div>


                <!-- Blockchain AI Audit & Charts Row -->
                <div class="grid-2" style="margin-bottom: var(--spacing-xl);">
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-title">Blockchain AI Audit Trail</div>
                                <div class="card-subtitle">Immutable ledger of autonomous model decisions</div>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="badge badge-success" style="font-size:0.6rem;">VERIFIED</span>
                            </div>
                        </div>
                        <div class="table-container" style="max-height: 250px; overflow-y: auto;">
                            <table style="font-size: 0.75rem; width:100%;">
                                <thead>
                                    <tr>
                                        <th>Block / Hash</th>
                                        <th>Decision Payload</th>
                                        <th>Network Status</th>
                                    </tr>
                                </thead>
                                <tbody id="blockchain-audit-tbody">
                                    <tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:20px;">Synchronizing with Ethereum Testnet...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-title">Live Intercept Terminal</div>
                                <div class="card-subtitle">Real-time security logs</div>
                            </div>
                            <div class="live-indicator">
                                <span class="live-dot"></span>
                                LIVE
                            </div>
                        </div>
                        <div class="hacker-terminal" style="height: 250px;">
                            <div class="terminal-scanline"></div>
                            <div class="terminal-content" id="hacker-terminal">
                                <div class="term-line info"><span class="term-prefix">[SYS]</span> Secure connection established. Waiting for packets...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid-2" style="margin-bottom: var(--spacing-xl);">
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-title">Threat Distribution</div>
                                <div class="card-subtitle">By severity level</div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:24px; justify-content:center; padding: 20px;">
                            <canvas id="threat-donut-chart" class="chart-canvas"></canvas>
                            <div id="donut-legend" style="min-width:100px;"></div>
                        </div>
                    </div>

                    <!-- Federated Learning Matrix -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-title">Federated AI Training Matrix</div>
                                <div class="card-subtitle">Decentralized model refinement across nodes</div>
                            </div>
                            <button class="btn btn-primary" style="font-size:0.6rem; padding:4px 10px;" onclick="DashboardPage.startTraining()">START ROUND</button>
                        </div>
                        <div id="federated-status-container" style="padding: 15px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                                <div class="stat-mini">
                                    <div class="stat-mini-label">Active Nodes</div>
                                    <div class="stat-mini-value" id="fl-nodes-count">...</div>
                                </div>
                                <div class="stat-mini">
                                    <div class="stat-mini-label">Rounds</div>
                                    <div class="stat-mini-value" id="fl-rounds-count">...</div>
                                </div>
                                <div class="stat-mini">
                                    <div class="stat-mini-label">Trust Delta</div>
                                    <div class="stat-mini-value" style="color:var(--color-success);">+1.2%</div>
                                </div>
                            </div>
                            <div style="font-size:0.65rem; color:var(--text-muted); font-family:'JetBrains Mono'; margin-bottom:5px;">GLOBAL WEIGHT HASH:</div>
                            <div id="fl-global-hash" style="font-size:0.7rem; color:var(--accent-primary); font-family:'JetBrains Mono'; background:rgba(255,255,255,0.03); padding:8px; border-radius:4px; word-break:break-all;">...</div>
                        </div>
                    </div>
                </div>

                <!-- Self-Healing Row -->
                <div class="grid-2" style="margin-bottom: var(--spacing-xl);">
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-title">Autonomous Self-Healing Log</div>
                                <div class="card-subtitle">AI-driven node isolation and restoration events</div>
                            </div>
                            <div class="live-indicator"><span class="live-dot"></span>HEALING ACTIVE</div>
                        </div>
                        <div class="table-container" style="max-height: 200px; overflow-y: auto;">
                            <table style="font-size: 0.75rem; width:100%;">
                                <thead>
                                    <tr>
                                        <th>Node</th>
                                        <th>Operation</th>
                                        <th>Result</th>
                                    </tr>
                                </thead>
                                <tbody id="healing-log-tbody">
                                    <tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:20px;">Monitoring network nodes...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="card">
                         <div class="card-header">
                            <div>
                                <div class="card-title">Network Connectivity</div>
                                <div class="card-subtitle">Node clusters & bridge status</div>
                            </div>
                        </div>
                        <div style="padding:20px; text-align:center;">
                            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
                                <div style="background:rgba(16,185,129,0.1); border:1px solid var(--color-success); border-radius:8px; padding:10px;">
                                    <div style="font-size:0.6rem; color:var(--color-success);">GATEWAY-A</div>
                                    <div style="font-size:0.8rem; font-weight:600;">STABLE</div>
                                </div>
                                <div style="background:rgba(16,185,129,0.1); border:1px solid var(--color-success); border-radius:8px; padding:10px;">
                                    <div style="font-size:0.6rem; color:var(--color-success);">BRANCH-001</div>
                                    <div style="font-size:0.8rem; font-weight:600;">ACTIVE</div>
                                </div>
                                <div style="background:rgba(16,185,129,0.1); border:1px solid var(--color-success); border-radius:8px; padding:10px;">
                                    <div style="font-size:0.6rem; color:var(--color-success);">SEC-VAULT</div>
                                    <div style="font-size:0.8rem; font-weight:600;">ENCRYPTED</div>
                                </div>
                            </div>
                            <div style="margin-top:15px; font-size:0.7rem; color:var(--text-muted);">
                                Layer-2 Peer-to-Peer Bridges: 12 Active
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Model Integrity Lab Row (Batch 3) -->
                <div class="card" style="margin-bottom: var(--spacing-xl);">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Model Integrity & Poisoning Protection Lab</div>
                            <div class="card-subtitle">Cryptographic fingerprint verification via Blockchain</div>
                        </div>
                        <div id="integrity-status-badge" class="badge badge-success">INTEGRITY SECURE</div>
                    </div>
                    <div class="grid-2" style="padding: 20px; gap: 40px;">
                        <div>
                            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:10px;">ACTIVE MODEL ARCHITECTURE</div>
                            <div id="model-arch-display" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:15px; font-family:'JetBrains Mono'; font-size:0.75rem; color:var(--color-success);">
                                Loading model signature...
                            </div>
                        </div>
                        <div>
                            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:15px;">INTEGRITY TELEMETRY</div>
                            <div style="display:flex; flex-direction:column; gap:12px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.8rem;">Blockchain Fingerprint Match</span>
                                    <span id="fingerprint-match" style="color:var(--color-success); font-weight:600;">VERIFIED</span>
                                </div>
                                <div class="progress-bar" style="height:6px;"><div id="integrity-progress" class="progress-fill" style="width:100%; background:var(--color-success);"></div></div>
                                <div style="display:flex; gap:10px; margin-top:10px;">
                                    <button class="btn btn-outline" style="flex:1; font-size:0.7rem;" onclick="DashboardPage.verifyModel()">VERIFY HASH</button>
                                    <button id="rollback-btn" class="btn btn-danger" style="flex:1; font-size:0.7rem; display:none;" onclick="DashboardPage.rollbackModel()">ROLLBACK TO LEDGER</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Row -->
                <div class="grid-2">
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-title">Recent Security Events</div>
                                <div class="card-subtitle" id="events-subtitle">Loading...</div>
                            </div>
                            <div class="live-indicator">
                                <span class="live-dot"></span>
                                LIVE
                            </div>
                        </div>
                        <div class="event-feed" id="event-feed" style="max-height: 320px; overflow-y: auto;">
                            <div class="loading-spinner" style="height:200px;">
                                <div class="spinner"></div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-title">Attack Timeline</div>
                                <div class="card-subtitle">Chronological visualization of threats</div>
                            </div>
                        </div>
                        <canvas id="attack-timeline-chart" class="chart-canvas"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.loadData();
    },

    renderStatSkeleton() {
        return Array(4).fill(0).map(() => `
            <div class="stat-card stat-card-enhanced animate-in">
                <div class="skeleton skeleton-avatar" style="margin-bottom:12px;"></div>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text" style="width:40%"></div>
            </div>
        `).join('');
    },

    async loadData() {
        try {
            const [stats, events, models, attribution, chain, flStatus, healingStatus, modelStatus] = await Promise.all([
                API.getDashboardStats(),
                API.getSecurityEvents({ limit: 15 }),
                API.getModels(),
                API.getSecurityAttribution(),
                API.getChain(),
                API.getFederatedStatus(),
                API.getHealingStatus(),
                API.getModelStatus()
            ]);

            this.renderStats(stats);
            this.renderEvents(events.events || []);
            this.renderCharts(stats, events.events || [], models.models || []);
            this.initTerminal(events.events || []);
            this.renderAttribution(attribution.profiles || []);
            this.renderBlockchainAudit(chain.chain || []);
            this.renderFederatedStatus(flStatus);
            this.renderHealingStatus(healingStatus);
            this.renderModelIntegrity(modelStatus);
        } catch (err) {
            console.error(err);
            Toast.error('Failed to load dashboard data');
        }
    },

    renderStats(stats) {
        const cards = [
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17"/></svg>',
                value: stats.overview?.total_models || 0,
                label: 'AI Models',
                color: 'purple',
                sparkData: [3, 4, 5, 6, 5, 7, 8],
                sparkColor: '#818cf8'
            },
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19C3 20.66 7 22 12 22C17 22 21 20.66 21 19V5"/></svg>',
                value: stats.overview?.total_datasets || 0,
                label: 'Datasets',
                color: 'cyan',
                sparkData: [2, 3, 3, 4, 5, 5, 6],
                sparkColor: '#06b6d4'
            },
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
                value: stats.overview?.total_blocks || 0,
                label: 'Blockchain Blocks',
                color: 'green',
                sparkData: [10, 14, 16, 18, 20, 22, 26],
                sparkColor: '#10b981'
            },
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/></svg>',
                value: stats.overview?.security_risk_score ?? 100,
                label: 'Security Risk Score (/100)',
                color: 'red',
                sparkData: [stats.security?.critical_events || 0, stats.security?.high_events || 0, stats.security?.unresolved_events || 0, stats.security?.total_events || 0],
                sparkColor: '#ef4444'
            }
        ];

        const statsEl = document.getElementById('dash-stats');
        if (!statsEl) return;
        statsEl.innerHTML = cards.map((c, i) => `
            <div class="stat-card stat-card-enhanced animate-in stagger-${i + 1}">
                <div class="stat-icon ${c.color}">${c.icon}</div>
                <div class="stat-value">${c.value}</div>
                <div class="stat-label">${c.label}</div>
                <div class="sparkline-container">
                    <canvas id="spark-${i}" class="chart-canvas"></canvas>
                </div>
            </div>
        `).join('');

        // Draw sparklines
        requestAnimationFrame(() => {
            cards.forEach((c, i) => {
                Charts.sparkline(`spark-${i}`, c.sparkData, {
                    width: 80, height: 32, color: c.sparkColor
                });
            });
        });

        // Fast UI Updates: Gauge
        const gaugeScoreEl = document.getElementById('gauge-score');
        const gaugeFill = document.getElementById('gauge-fill');
        const gaugeLabel = document.getElementById('gauge-label');
        if (gaugeScoreEl && gaugeFill && gaugeLabel) {
            const avgScore = stats.overview?.avg_anomaly_score || 0;
            gaugeScoreEl.textContent = avgScore.toFixed(2);

            // Map 0-1 to degrees (-45 to 135) -> 180 degree span
            let deg = -45 + (Math.min(avgScore, 1) * 180);
            gaugeFill.style.transform = `rotate(${deg}deg)`;

            if (avgScore > 0.8) {
                gaugeLabel.textContent = "THREAT LEVEL: HIGH";
                gaugeLabel.style.color = "var(--color-danger)";
                gaugeFill.style.borderColor = "var(--color-danger)";
            } else if (avgScore > 0.4) {
                gaugeLabel.textContent = "THREAT LEVEL: MEDIUM";
                gaugeLabel.style.color = "var(--color-warning)";
                gaugeFill.style.borderColor = "var(--color-warning)";
            } else {
                gaugeLabel.textContent = "THREAT LEVEL: LOW";
                gaugeLabel.style.color = "var(--color-success)";
                gaugeFill.style.borderColor = "var(--color-success)";
            }
        }

        // Update Attack Prediction Score & Level
        const predictionScoreEl = document.getElementById('attack-prediction-score');
        const predictionLevelEl = document.getElementById('attack-prediction-level');
        const riskAlarmBg = document.getElementById('risk-alarm-bg');

        if (predictionScoreEl && predictionLevelEl) {
            const pred = stats.overview?.attack_prediction || { probability: 0, level: 'LOW' };
            predictionScoreEl.textContent = `${pred.probability}%`;
            predictionLevelEl.textContent = `${pred.level} PROBABILITY`;

            if (pred.level === 'HIGH') {
                predictionScoreEl.style.color = "var(--color-danger)";
                predictionLevelEl.style.color = "var(--color-danger)";
                if (riskAlarmBg) riskAlarmBg.style.display = 'block';
            } else if (pred.level === 'MEDIUM') {
                predictionScoreEl.style.color = "var(--color-warning)";
                predictionLevelEl.style.color = "var(--color-warning)";
                if (riskAlarmBg) riskAlarmBg.style.display = 'none';
            } else {
                predictionScoreEl.style.color = "var(--color-success)";
                predictionLevelEl.style.color = "var(--color-success)";
                if (riskAlarmBg) riskAlarmBg.style.display = 'none';
            }
        }

        // Update Active Defense Status Indicators
        const defense = stats.overview?.active_defense || {};
        if (defense.rate_limiter) document.getElementById('status-rate-limiter').textContent = defense.rate_limiter;
        if (defense.firewall_engine) document.getElementById('status-firewall').textContent = defense.firewall_engine;
        if (defense.ai_detection) document.getElementById('status-ai').textContent = defense.ai_detection;
        if (defense.blockchain_logger) document.getElementById('status-blockchain').textContent = defense.blockchain_logger;

        // Populate Top Endpoints
        const topEndpointsTbody = document.getElementById('top-endpoints-tbody');
        if (topEndpointsTbody && stats.overview?.top_endpoints) {
            if (stats.overview.top_endpoints.length === 0) {
                topEndpointsTbody.innerHTML = `<tr><td colspan="2" style="padding:20px; text-align:center; color:var(--text-muted);">No suspicious activity detected</td></tr>`;
            } else {
                topEndpointsTbody.innerHTML = stats.overview.top_endpoints.map(e => `
                    <tr>
                        <td style="padding:10px;"><span style="font-family:'JetBrains Mono'; color:var(--accent-primary);">${e.endpoint}</span></td>
                        <td style="padding:10px; text-align:right;"><b>${e.count}</b></td>
                    </tr>
                `).join('');
            }
        }
    },

    renderEvents(events) {
        const feed = document.getElementById('event-feed');
        const subtitle = document.getElementById('events-subtitle');
        const unresolved = events.filter(e => e.status !== 'resolved').length;
        if (subtitle) subtitle.textContent = `${unresolved} unresolved`;

        // Update Top IPs Table dynamically based on recent events
        const topIpsTbody = document.getElementById('top-ips-tbody');
        if (topIpsTbody) {
            const ipCounts = {};
            events.forEach(e => {
                if (e.source_ip) {
                    if (!ipCounts[e.source_ip]) ipCounts[e.source_ip] = { type: e.event_type.replace('_', ' ').toUpperCase(), count: 0 };
                    ipCounts[e.source_ip].count++;
                }
            });
            const topIps = Object.entries(ipCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 3);
            if (topIps.length === 0) {
                topIpsTbody.innerHTML = `<tr><td colspan="3" style="padding:10px; text-align:center;">No active attacking IPs</td></tr>`;
            } else {
                topIpsTbody.innerHTML = topIps.map(([ip, data]) => `
                    <tr>
                        <td style="padding:10px;"><span style="font-family:'JetBrains Mono';">${ip}</span></td>
                        <td style="padding:10px;">${data.type}</td>
                        <td style="padding:10px;"><b>${data.count}</b></td>
                    </tr>
                `).join('');
            }
        }

        feed.innerHTML = events.map(e => {
            const severity = e.severity || 'low';
            return `
            <div class="event-item animate-in">
                <div class="event-dot ${severity}"></div>
                <div class="event-content">
                    <div class="event-desc">${e.description}</div>
                    <div class="event-meta">
                        <span class="badge badge-${severity}">${severity}</span>
                        <span>${e.source_ip || '—'}</span>
                        <span>${App.timeAgo(e.created_at)}</span>
                    </div>
                </div>
                <button class="btn btn-outline" style="font-size:0.6rem; padding:4px 8px; border-radius:4px; margin-left:10px;" onclick='DashboardPage.replayAttack(${JSON.stringify(e)})'>REPLAY</button>
            </div>`;
        }).join('') || '<div class="empty-state"><p>No events</p></div>';
    },

    renderBlockchainAudit(chain) {
        const tbody = document.getElementById('blockchain-audit-tbody');
        if (!tbody) return;

        if (!chain || chain.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:20px;">No blockchain audits found.</td></tr>';
            return;
        }

        // Only show last 10 blocks for performance
        const recentChain = [...chain].reverse().slice(0, 10);

        tbody.innerHTML = recentChain.map(block => {
            const isAI = block.data && block.data.type === 'ai_fraud_audit';
            const rowStyle = isAI ? 'background: rgba(99,102,241,0.05); border-left: 2px solid var(--accent-primary);' : '';

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); ${rowStyle}">
                    <td style="padding:12px 10px;">
                        <div style="font-weight:600; color:var(--text-primary);">Block #${block.index}</div>
                        <div style="font-size:0.65rem; color:var(--text-muted); font-family:'JetBrains Mono';">${block.hash.substring(0, 16)}...</div>
                    </td>
                    <td style="padding:12px 10px;">
                        <div style="font-size:0.85rem; color:${isAI ? 'var(--accent-primary)' : 'var(--text-primary)'}; font-weight:${isAI ? '600' : '400'};">
                            ${block.data ? block.data.message : 'System Maintenance'}
                        </div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">${App.timeAgo(block.timestamp)}</div>
                    </td>
                    <td style="padding:12px 10px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span class="live-dot" style="margin:0; background:var(--color-success);"></span>
                            <span style="font-size:0.7rem; color:var(--text-secondary);">CONFIRMED</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderAttribution(profiles) {
        const tbody = document.getElementById('attribution-tbody');
        if (!tbody) return;

        if (profiles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:20px;">No critical threats profiled yet.</td></tr>';
            return;
        }

        tbody.innerHTML = profiles.map(p => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding:10px 5px;">
                    <div style="font-weight:600; color:var(--text-primary);">${p.geo_location}</div>
                    <div style="font-size:0.7rem; color:var(--text-muted); font-family:'JetBrains Mono';">${p.ip}</div>
                </td>
                <td style="padding:10px 5px;">
                    <span class="badge ${p.severity === 'critical' ? 'badge-danger' : 'badge-warning'}" style="font-size:0.6rem; margin-bottom:4px; display:inline-block;">
                        ${p.attack_pattern.toUpperCase()}
                    </span>
                    <div style="font-size:0.7rem; color:var(--text-secondary); max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.description}</div>
                </td>
                <td style="padding:10px 5px;">
                    <div style="color:var(--accent-primary); font-weight:600;">${p.threat_actor_fingerprint}</div>
                    <div style="font-size:0.65rem; color:var(--text-muted);">${App.timeAgo(p.timestamp)}</div>
                </td>
            </tr>
        `).join('');
    },

    initTerminal(events) {
        const term = document.getElementById('hacker-terminal');
        if (!term) return;

        clearInterval(this.termInterval);

        const lines = [
            '<div class="term-line info"><span class="term-prefix">[SYS]</span> Initializing core subsystems...</div>',
            '<div class="term-line info"><span class="term-prefix">[NET]</span> Bound to 0.0.0.0:5000</div>',
            '<div class="term-line info"><span class="term-prefix">[LEDGER]</span> Verifying local chain integrity... OK (Hash matches)</div>'
        ];

        // Add some random events
        events.slice(0, 5).forEach(e => {
            const time = new Date(e.created_at).toISOString().split('T')[1].substring(0, 8);
            let cls = 'info';
            if (e.severity === 'critical') cls = 'critical';
            else if (e.severity === 'high') cls = 'warning';
            lines.push(`<div class="term-line ${cls}"><span class="term-prefix">[${time}]</span> ${e.event_type.toUpperCase()} from ${e.source_ip || 'unknown'}. Action: ${e.action_taken || 'none'}</div>`);
        });

        term.innerHTML = lines.reverse().join('');

        // Simulate live typing
        this.termInterval = setInterval(() => {
            const now = new Date().toISOString().split('T')[1].substring(0, 8);
            const eventsList = [
                () => `<div class="term-line info"><span class="term-prefix">[${now}]</span> Net heartbeat OK (latency 12ms)</div>`,
                () => `<div class="term-line info"><span class="term-prefix">[${now}]</span> [CHAIN] Verified Block 0x${Math.random().toString(16).substr(2, 8)}</div>`,
                () => `<div class="term-line info"><span class="term-prefix">[${now}]</span> Scan engine updated. Signatures: ${Math.floor(Math.random() * 2000) + 15000}</div>`,
                () => `<div class="term-line warning"><span class="term-prefix">[${now}]</span> Dropping malformed packet from 192.168.1.${Math.floor(Math.random() * 255)}</div>`
            ];
            const msg = eventsList[Math.floor(Math.random() * eventsList.length)]();

            term.insertAdjacentHTML('afterbegin', msg);

            // Limit lines
            while (term.children.length > 50) {
                term.removeChild(term.lastChild);
            }
        }, 3500);
    },

    renderCharts(stats, events, models) {
        // Threat Distribution Donut - Now using aggregate stats for "Correct Data"
        const severityCounts = stats.security?.severity_counts || { critical: 0, high: 0, medium: 0, low: 0 };
        const totalEvents = stats.security?.total_events || 0;

        Charts.donut('threat-donut-chart', [
            { value: severityCounts.critical, color: '#ef4444' },
            { value: severityCounts.high, color: '#f97316' },
            { value: severityCounts.medium, color: '#eab308' },
            { value: severityCounts.low, color: '#22c55e' }
        ], { size: 160, label: 'TOTAL' });

        document.getElementById('donut-legend').innerHTML = [
            { l: 'Critical', c: '#ef4444', v: severityCounts.critical },
            { l: 'High', c: '#f97316', v: severityCounts.high },
            { l: 'Medium', c: '#eab308', v: severityCounts.medium },
            { l: 'Low', c: '#22c55e', v: severityCounts.low }
        ].map(d => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <div style="width:10px;height:10px;border-radius:50%;background:${d.c};"></div>
                <span style="font-size:0.8rem;color:var(--text-secondary);flex:1;">${d.l}</span>
                <span style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">${d.v}</span>
            </div>
        `).join('');

        // Attack Timeline Area/Bar Chart (using Canvas)
        const timelineCanvas = document.getElementById('attack-timeline-chart');
        if (timelineCanvas && events.length > 0) {
            const ctx = timelineCanvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const w = timelineCanvas.parentElement.clientWidth - 48 || 400;
            const h = 180;
            timelineCanvas.width = w * dpr;
            timelineCanvas.height = h * dpr;
            timelineCanvas.style.width = w + 'px';
            timelineCanvas.style.height = h + 'px';
            ctx.scale(dpr, dpr);

            const barPad = 40;
            const maxEvents = 10;
            const timelineEvents = events.slice(0, maxEvents).reverse(); // Oldest first for timeline
            const barW = Math.min(40, (w - barPad * 2) / timelineEvents.length - 8);

            // Score severity based on event
            const getSeverityScore = (sev) => {
                if (sev === 'critical') return 100;
                if (sev === 'high') return 75;
                if (sev === 'medium') return 50;
                return 25;
            };

            const colors = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };

            let anim = 0;
            const dur = 1200;
            const start = performance.now();

            function drawBars(now) {
                anim = Math.min((now - start) / dur, 1);
                const eased = 1 - Math.pow(1 - anim, 3);
                ctx.clearRect(0, 0, w, h);

                // Grid
                for (let i = 0; i < 5; i++) {
                    const y = barPad + ((h - barPad * 2) / 4) * i;
                    ctx.beginPath();
                    ctx.moveTo(barPad, y);
                    ctx.lineTo(w - barPad, y);
                    ctx.strokeStyle = 'rgba(148,163,184,0.06)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                timelineEvents.forEach((m, i) => {
                    const sevScore = getSeverityScore(m.severity);
                    const color = colors[m.severity] || colors.low;

                    const x = barPad + (i * (w - barPad * 2)) / timelineEvents.length + barW / 2;
                    const barH = (sevScore / 100) * (h - barPad * 2) * eased;
                    const y = h - barPad - barH;

                    // Bar gradient
                    const grad = ctx.createLinearGradient(x, y, x, h - barPad);
                    grad.addColorStop(0, color);
                    grad.addColorStop(1, color + '44');

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.roundRect(x - barW / 2, y, barW, barH, [4, 4, 0, 0]);
                    ctx.fill();

                    // Label (Time)
                    ctx.fillStyle = '#64748b';
                    ctx.font = "500 9px 'Inter'";
                    const timeLabel = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    ctx.fillText(timeLabel, x, h - barPad + 14);

                    // Attack Type Label vertically if possible or just short
                    ctx.fillStyle = color;
                    ctx.font = "600 8px 'Inter'";
                    ctx.textAlign = 'center';
                    let shortType = m.event_type.replace('_attack', '').replace('_', ' ').substring(0, 8);
                    ctx.fillText(shortType.toUpperCase(), x, y - 6);
                });

                if (anim < 1) requestAnimationFrame(drawBars);
            }
            requestAnimationFrame(drawBars);
        }
    },

    replayAttack(event) {
        console.log("Replaying event:", event);
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'display:flex; align-items:center; justify-content:center; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:300; backdrop-filter:blur(15px);';

        modal.innerHTML = `
            <div class="card" style="width:500px; padding:30px; border:1px solid var(--accent-primary); box-shadow:0 0 50px rgba(99,102,241,0.3);">
                <div style="font-size:0.75rem; font-weight:700; color:var(--accent-primary); letter-spacing:2px; margin-bottom:20px; text-align:center;">SOC TIMELINE REPLAY</div>
                <div id="replay-steps" style="display:flex; flex-direction:column; gap:20px;">
                    <div class="replay-step" id="step-1" style="opacity:0; transform:translateX(-20px); transition:all 0.5s ease; display:flex; gap:15px; align-items:center;">
                        <div style="width:30px; height:30px; border-radius:50%; background:rgba(99,102,241,0.1); border:1px solid var(--accent-primary); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:800; color:var(--accent-primary);">1</div>
                        <div>
                            <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">Traffic Ingress</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">Request identified from source IP: ${event.source_ip || '127.0.0.1'}</div>
                        </div>
                    </div>
                    <div class="replay-step" id="step-2" style="opacity:0; transform:translateX(-20px); transition:all 0.5s ease; display:flex; gap:15px; align-items:center;">
                        <div style="width:30px; height:30px; border-radius:50%; background:rgba(234,179,8,0.1); border:1px solid var(--color-warning); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:800; color:var(--color-warning);">2</div>
                        <div>
                            <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">Behavioral Profiling</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">Analyzing entropy, request rate, and endpoint patterns...</div>
                        </div>
                    </div>
                    <div class="replay-step" id="step-3" style="opacity:0; transform:translateX(-20px); transition:all 0.5s ease; display:flex; gap:15px; align-items:center;">
                        <div style="width:30px; height:30px; border-radius:50%; background:rgba(239,68,68,0.1); border:1px solid var(--color-danger); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:800; color:var(--color-danger);">3</div>
                        <div>
                            <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">AI Consensus Reached</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">Ensemble Result: Isolation Forest[-1] + One-Class SVM[-1]</div>
                        </div>
                    </div>
                    <div class="replay-step" id="step-4" style="opacity:0; transform:translateX(-20px); transition:all 0.5s ease; display:flex; gap:15px; align-items:center;">
                        <div style="width:30px; height:30px; border-radius:50%; background:rgba(16,185,129,0.1); border:1px solid var(--color-success); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:800; color:var(--color-success);">4</div>
                        <div>
                            <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">Automated Mitigation</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">Action Execution: ${event.action_taken || 'BLOCKED'}</div>
                        </div>
                    </div>
                </div>
                <button class="btn btn-outline" style="width:100%; margin-top:30px;" onclick="this.closest('.modal-overlay').remove()">CLOSE ANALYSIS</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Sequence animation
        setTimeout(() => { document.getElementById('step-1').style.opacity = '1'; document.getElementById('step-1').style.transform = 'translateX(0)'; }, 500);
        setTimeout(() => { document.getElementById('step-2').style.opacity = '1'; document.getElementById('step-2').style.transform = 'translateX(0)'; }, 1500);
        setTimeout(() => { document.getElementById('step-3').style.opacity = '1'; document.getElementById('step-3').style.transform = 'translateX(0)'; }, 2500);
        setTimeout(() => { document.getElementById('step-4').style.opacity = '1'; document.getElementById('step-4').style.transform = 'translateX(0)'; }, 3500);
    },

    renderFederatedStatus(status) {
        const nodesEl = document.getElementById('fl-nodes-count');
        const roundsEl = document.getElementById('fl-rounds-count');
        const hashEl = document.getElementById('fl-global-hash');

        if (nodesEl) nodesEl.textContent = status.active_nodes.length;
        if (roundsEl) roundsEl.textContent = status.rounds_completed;
        if (hashEl) hashEl.textContent = status.current_global_model_hash;
    },

    renderHealingStatus(status) {
        const tbody = document.getElementById('healing-log-tbody');
        if (!tbody) return;

        if (status.recent_actions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:20px;">No healing actions required.</td></tr>';
            return;
        }

        tbody.innerHTML = status.recent_actions.reverse().map(action => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding:10px 5px;">
                    <div style="font-weight:600; color:var(--text-primary);">${action.node}</div>
                    <div style="font-size:0.65rem; color:var(--text-muted);">${App.timeAgo(action.timestamp)}</div>
                </td>
                <td style="padding:10px 5px;">
                    <span class="badge ${action.action === 'ISOLATE' ? 'badge-danger' : 'badge-success'}" style="font-size:0.6rem;">
                        ${action.action}
                    </span>
                </td>
                <td style="padding:10px 5px;">
                    <div style="font-size:0.75rem; color:var(--text-secondary);">${action.status}</div>
                </td>
            </tr>
        `).join('');
    },

    async startTraining() {
        try {
            Toast.info('Initiating Federated Learning Round...');
            const result = await API.startFederatedTraining();
            Toast.success(`Global Round ${result.summary.round_id} Completed.`);
            this.loadData();
        } catch (err) {
            Toast.error('Training round failed.');
        }
    },

    renderModelIntegrity(status) {
        const archEl = document.getElementById('model-arch-display');
        const badgeEl = document.getElementById('integrity-status-badge');
        const matchEl = document.getElementById('fingerprint-match');
        const progressEl = document.getElementById('integrity-progress');
        const rollbackBtn = document.getElementById('rollback-btn');

        if (archEl) {
            archEl.innerHTML = `
                <div>MODEL: ${status.active_model.name}</div>
                <div>VER: ${status.active_model.version}</div>
                <div style="color:var(--text-muted); margin-top:5px; font-size:0.6rem;">HASH: ${status.active_model.hash.substring(0, 32)}...</div>
                <div style="color:var(--text-muted); font-size:0.6rem;">SIG: ${status.active_model.fingerprint}</div>
            `;
        }

        if (status.active_model.status === 'poisoned') {
            badgeEl.className = 'badge badge-danger';
            badgeEl.textContent = 'POISONING DETECTED';
            matchEl.textContent = 'MISMATCH';
            matchEl.style.color = 'var(--color-danger)';
            progressEl.style.width = '20%';
            progressEl.style.background = 'var(--color-danger)';
            rollbackBtn.style.display = 'block';
        } else {
            badgeEl.className = 'badge badge-success';
            badgeEl.textContent = 'INTEGRITY SECURE';
            matchEl.textContent = 'VERIFIED';
            matchEl.style.color = 'var(--color-success)';
            progressEl.style.width = '100%';
            progressEl.style.background = 'var(--color-success)';
            rollbackBtn.style.display = 'none';
        }
    },

    async verifyModel() {
        try {
            Toast.info('Running Cryptographic Verification...');
            // In a real demo, we might prompt for a file, but here we just trigger the check
            const result = await API.verifyModelIntegrity();
            if (result.success) {
                Toast.success(result.message);
            } else {
                Toast.error(result.message);
            }
            this.loadData();
        } catch (err) {
            Toast.error('Verification failed.');
        }
    },

    async rollbackModel() {
        if (!confirm('INITIATE BLOCKCHAIN ROLLBACK?\n\nThis will restore the model weights to the last known-good state on the Ethereum ledger.')) return;

        try {
            Toast.info('Restoring model from blockchain...');
            const result = await API.rollbackModel();
            Toast.success(result.message);
            this.loadData();
        } catch (err) {
            Toast.error('Rollback failed.');
        }
    }
};
