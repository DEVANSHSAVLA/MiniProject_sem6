/**
 * Security Research Lab
 * Interactive attack simulation and defensive research tools.
 */
const LabPage = {
    async render() {
        const content = document.getElementById('content');
        content.innerHTML = this.buildHTML();
        this.attachEvents();
        this.initVisualizers();
    },

    buildHTML() {
        return `
        <div class="page-enter">
            <!-- Header -->
            <div class="section-header">
                <div>
                    <div class="section-title">Security Research Lab</div>
                    <div style="color:var(--text-secondary); font-size:0.9rem; margin-top:4px;">Research-grade threat simulation & defensive model analysis</div>
                </div>
            </div>

            <div class="model-grid" style="grid-template-columns: 3fr 2fr;">
                <!-- Main Simulator -->
                <div class="card" style="padding: 24px;">
                    <div class="card-header" style="margin-bottom: 24px;">
                        <div>
                            <div class="card-title">Threat Simulation Cockpit</div>
                            <div class="card-subtitle">Execute controlled attack patterns to test AI response</div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <!-- Network Attacks -->
                        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:12px; padding:20px;">
                            <div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
                                <i class="fas fa-network-wired" style="color:var(--color-info); margin-right:8px;"></i> NETWORK LAYER
                            </div>
                            <div style="display:flex; flex-direction:column; gap:10px;">
                                <button class="btn btn-secondary btn-sm" onclick="App.simulateAttack('dos')" style="justify-content:space-between; width:100%;">
                                    <span>Distributed Denial of Service (DDoS)</span>
                                    <span class="badge badge-medium">FLOOD</span>
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="App.simulateAttack('brute_force')" style="justify-content:space-between; width:100%;">
                                    <span>Credential Brute Force</span>
                                    <span class="badge badge-medium">AUTH</span>
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="App.simulateAttack('port_scan')" style="justify-content:space-between; width:100%;">
                                    <span>Reconnaissance Port Scan</span>
                                    <span class="badge badge-low">RECON</span>
                                </button>
                            </div>
                        </div>

                        <!-- Application layer -->
                        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:12px; padding:20px;">
                            <div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
                                <i class="fas fa-code" style="color:var(--accent-primary); margin-right:8px;"></i> APPLICATION LAYER
                            </div>
                            <div style="display:flex; flex-direction:column; gap:10px;">
                                <button class="btn btn-secondary btn-sm" onclick="App.simulateAttack('api_abuse')" style="justify-content:space-between; width:100%;">
                                    <span>API Parameter Pollution</span>
                                    <span class="badge badge-high">EXPLOIT</span>
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="App.simulateAttack('sql_injection')" style="justify-content:space-between; width:100%;">
                                    <span>Blind SQL Injection</span>
                                    <span class="badge badge-high">INJECT</span>
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="App.simulateAttack('xss')" style="justify-content:space-between; width:100%;">
                                    <span>Stored XSS Payload</span>
                                    <span class="badge badge-medium">CROSS-SITE</span>
                                </button>
                            </div>
                        </div>

                        <!-- AI Integrity Attacks -->
                        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:12px; padding:20px;">
                            <div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
                                <i class="fas fa-brain" style="color:var(--color-warning); margin-right:8px;"></i> ADVERSARIAL AI
                            </div>
                            <div style="display:flex; flex-direction:column; gap:10px;">
                                <button class="btn btn-secondary btn-sm" onclick="LabPage.simulateAI('poison')" style="justify-content:space-between; width:100%;">
                                    <span>Training Data Poisoning</span>
                                    <span class="badge badge-critical">MODEL DRIFT</span>
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="LabPage.simulateAI('evasion')" style="justify-content:space-between; width:100%;">
                                    <span>Model Evasion (Adversarial)</span>
                                    <span class="badge badge-high">EVASION</span>
                                </button>
                            </div>
                        </div>

                        <!-- Behavioral / Anomaly -->
                        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:12px; padding:20px;">
                            <div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
                                <i class="fas fa-user-secret" style="color:var(--color-success); margin-right:8px;"></i> EXFILTRATION
                            </div>
                            <div style="display:flex; flex-direction:column; gap:10px;">
                                <button class="btn btn-secondary btn-sm" onclick="App.simulateAttack('exfiltration')" style="justify-content:space-between; width:100%;">
                                    <span>Dataset Data Exfiltration</span>
                                    <span class="badge badge-high">LEAK</span>
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="App.simulateAttack('insider')" style="justify-content:space-between; width:100%;">
                                    <span>Insider Behavioral Anomaly</span>
                                    <span class="badge badge-medium">TRUST</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Console Area -->
                    <div style="margin-top:24px; background: #000; border-radius: 8px; padding: 15px; font-family: 'Fira Code', monospace; font-size: 0.75rem; border: 1px solid #1e293b; min-height: 150px; position:relative; overflow-y:auto;" id="lab-console">
                        <div style="color: #4ade80;">[SYSTEM] Research Lab Environment Initialized.</div>
                        <div style="color: #94a3b8;">[READY] Waiting for threat simulation...</div>
                    </div>
                </div>

                <!-- Defense Metrics & Status -->
                <div style="display:flex; flex-direction:column; gap:20px;">
                    <div class="card" style="padding: 20px;">
                        <div class="card-title">Active Response HUD</div>
                        <div class="card-subtitle">Real-time status of security subsystems</div>
                        
                        <div style="margin-top: 15px; display:flex; flex-direction:column; gap:12px;">
                            <div class="defense-status-item" id="def-rate-limit">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.85rem; font-weight:600;">Adaptive Rate Limiter</span>
                                    <span class="badge badge-medium">MONITORING</span>
                                </div>
                                <div style="width:100%; height:4px; background:rgba(255,255,255,0.05); border-radius:2px; margin-top:8px;">
                                    <div class="progress-bar" style="width:12%; background:var(--color-info);"></div>
                                </div>
                            </div>

                            <div class="defense-status-item" id="def-ai-shield">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.85rem; font-weight:600;">AI Integrity Shield</span>
                                    <span class="badge badge-success">ACTIVE</span>
                                </div>
                                <div style="width:100%; height:4px; background:rgba(255,255,255,0.05); border-radius:2px; margin-top:8px;">
                                    <div class="progress-bar" style="width:100%; background:var(--color-success);"></div>
                                </div>
                            </div>

                            <div class="defense-status-item" id="def-block-log">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.85rem; font-weight:600;">Blockchain Security Logger</span>
                                    <span class="badge badge-success">SYNCED</span>
                                </div>
                                <div style="width:100%; height:4px; background:rgba(255,255,255,0.05); border-radius:2px; margin-top:8px;">
                                    <div class="progress-bar" style="width:100%; background:var(--color-success);"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SHAP & ROC Curve Section (Research Grade) -->
                    <div style="margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="card" style="padding: 20px;">
                            <div class="card-title">Explainable AI (XAI): SHAP Importance</div>
                            <div class="card-subtitle">Feature impact ranking for model decisions</div>
                            <div class="table-container" style="margin-top: 15px;">
                                <table style="font-size: 0.75rem; width: 100%;">
                                    <thead>
                                        <tr><th>Feature</th><th style="text-align:right;">Impact (SHAP)</th></tr>
                                    </thead>
                                    <tbody id="shap-tbody">
                                        <tr><td>Tx Amount Deviation</td><td style="text-align:right; font-weight:700; color:var(--accent-primary);">0.421</td></tr>
                                        <tr><td>Geolocation Anomaly</td><td style="text-align:right; font-weight:700; color:var(--accent-primary);">0.274</td></tr>
                                        <tr><td>Device Fingerprint</td><td style="text-align:right; font-weight:700; color:var(--accent-primary);">0.189</td></tr>
                                        <tr><td>Time of Day Drift</td><td style="text-align:right; font-weight:700; color:var(--accent-primary);">0.082</td></tr>
                                        <tr><td>Account Age</td><td style="text-align:right; font-weight:700; color:var(--accent-primary);">0.034</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="card" style="padding: 20px;">
                            <div class="card-title">Model Performance: ROC Curve</div>
                            <div class="card-subtitle">AUC: 0.97 | High Separability Index</div>
                            <div style="margin-top: 15px; border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); aspect-ratio: 16/10; display: flex; align-items: center; justify-content: center;">
                                <img src="/docs/images/roc_curve.png" alt="ROC Curve" style="width: 100%; height: 100%; object-fit: contain;">
                            </div>
                        </div>
                    </div>

                    <!-- Impact Graph -->
                    <div class="card" style="padding: 20px; flex:1;">
                        <div class="card-title">Real-time Anomaly Spike</div>
                        <div class="card-subtitle">Visualization of detected drift during simulation</div>
                        <div style="width:100%; height:180px; margin-top:15px; position:relative; overflow:hidden;">
                            <canvas id="lab-anomaly-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Incident Report Export -->
            <div style="margin-top: 24px; text-align:right;">
                <button class="btn btn-primary" id="btn-export-report">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;margin-right:8px;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Generate Security Audit Report
                </button>
            </div>
        </div>
        `;
    },

    attachEvents() {
        // Listen for attack events to update lab UI
        window.addEventListener('attack-simulation-started', (e) => {
            this.logToConsole(`[ALERT] Inbound ${e.detail.type.toUpperCase()} attack vector detected.`);
            this.triggerUIRipple(e.detail.type);
        });

        document.getElementById('btn-export-report')?.addEventListener('click', () => {
            this.generateReport();
        });
    },

    logToConsole(msg, type = 'info') {
        const consoleEl = document.getElementById('lab-console');
        if (!consoleEl) return;

        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const div = document.createElement('div');
        div.style.marginBottom = '4px';

        const colors = {
            info: '#94a3b8',
            warn: '#fbbf24',
            error: '#f87171',
            success: '#4ade80'
        };

        div.innerHTML = `<span style="color: #64748b;">[${time}]</span> <span style="color: ${colors[type] || colors.info};">${msg}</span>`;
        consoleEl.appendChild(div);
        consoleEl.scrollTop = consoleEl.scrollHeight;

        // Keep last 50 lines
        while (consoleEl.children.length > 50) {
            consoleEl.removeChild(consoleEl.firstChild);
        }
    },

    triggerUIRipple(type) {
        // Find corresponding defense system
        let defId = '';
        if (['dos', 'api_abuse', 'port_scan'].includes(type)) defId = 'def-rate-limit';
        else if (['poison', 'evasion'].includes(type)) defId = 'def-ai-shield';
        else defId = 'def-block-log';

        const el = document.getElementById(defId);
        if (el) {
            el.classList.add('pulse-active');
            const badge = el.querySelector('.badge');
            const bar = el.querySelector('.progress-bar');

            const oldText = badge.textContent;
            const oldColor = badge.className;

            badge.textContent = 'ACTIVE RESPONSE';
            badge.className = 'badge badge-critical';
            if (bar) bar.style.width = '85%';

            this.logToConsole(`[RESPONSE] Defensive protocols engaged for ${defId.split('-').slice(1).join(' ')}.`, 'success');

            setTimeout(() => {
                el.classList.remove('pulse-active');
                badge.textContent = oldText;
                badge.className = oldColor;
                if (bar) bar.style.width = oldText === 'MONITORING' ? '12%' : '100%';
            }, 5000);
        }

        // Add to the chart data
        if (this.chart) {
            this.chartData.push(Math.random() * 0.5 + 0.4);
            this.chartData.shift();
            this.chart.update();
        }
    },

    initVisualizers() {
        const ctx = document.getElementById('lab-anomaly-chart')?.getContext('2d');
        if (!ctx) return;

        this.chartData = Array(30).fill(0).map(() => Math.random() * 0.15 + 0.05);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(30).fill(''),
                datasets: [{
                    data: this.chartData,
                    borderColor: '#6366f1',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { min: 0, max: 1, display: false },
                    x: { display: false }
                },
                animation: { duration: 500 }
            }
        });

        // Slow drift animation
        this.driftInterval = setInterval(() => {
            this.chartData.push(Math.random() * 0.1 + 0.05);
            this.chartData.shift();
            this.chart.update('none');
        }, 2000);
    },

    simulateAI(type) {
        Toast.warning(`Executing AI ${type} simulation...`);
        this.logToConsole(`[EXEC] Adversarial payload injected: ${type}. Scanning weights...`, 'warn');
        window.dispatchEvent(new CustomEvent('attack-simulation-started', { detail: { type } }));

        setTimeout(() => {
            this.logToConsole(`[RESULT] Anomaly detected in latent space. Mitigation triggered.`, 'error');
            Toast.error(`AI ${type} detected! Immutable blockchain log created.`);
        }, 1500);
    },

    async generateReport() {
        Toast.show('📄 Compiling Enterprise Security Audit Report...', 'info');

        try {
            const reportData = await API.getSecurityReport();
            const reportId = Math.random().toString(36).substring(7).toUpperCase();

            // Format as a more readable "Research Report"
            const blob = new Blob([JSON.stringify(reportData, null, 4)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AI_Chain_Guard_Audit_${reportId}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.logToConsole(`[SUCCESS] Enterprise Audit Report ${reportId} generated and exported.`, 'success');
            Toast.success('✅ Audit Report Downloaded.');
        } catch (err) {
            this.logToConsole(`[ERROR] Report generation failed: ${err.message}`, 'error');
            Toast.error('Report generation failed.');
        }
    }
};
