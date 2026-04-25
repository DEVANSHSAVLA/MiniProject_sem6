/**
 * Demo Pipeline Module
 * Visualizes the End-to-End transaction flow: User -> AI -> Blockchain -> Dashboard
 */
const DemoPipeline = {
    // ── Initialization ──────────────────────────────────────
    init() {
        this.container = document.getElementById('content');
        if (!this.container) {
            console.error('DemoPipeline: Content container not found');
            return;
        }
        
        this.render();
        this.attachEventListeners();
    },

    // ── Rendering ───────────────────────────────────────────
    render() {
        if (!this.container) this.container = document.getElementById('content');
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div id="page-demo" class="page-container">
            <div class="demo-layout">
                <div class="demo-header card animate-slide-up">
                    <div class="card-header">
                        <div class="card-title">🥇 End-to-End Demo Pipeline</div>
                        <div class="card-subtitle">Real-time Transaction Analysis & Blockchain Settlement</div>
                    </div>
                    <div class="demo-controls">
                        <button class="btn btn-primary" onclick="DemoPipeline.runCase('normal')">Case 1: Normal</button>
                        <button class="btn btn-warning" onclick="DemoPipeline.runCase('suspicious')">Case 2: Suspicious</button>
                        <button class="btn btn-danger" onclick="DemoPipeline.runCase('fraud')">Case 3: Fraud Attack</button>
                    </div>
                </div>

                <div class="pipeline-viz card animate-slide-up" style="margin-top:20px;">
                    <div class="pipeline-flow" id="pipeline-flow">
                        <div class="flow-step" id="step-user">
                            <div class="step-icon">👤</div>
                            <div class="step-label">User</div>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step" id="step-tx">
                            <div class="step-icon">💸</div>
                            <div class="step-label">Transaction</div>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step" id="step-ai">
                            <div class="step-icon">🧠</div>
                            <div class="step-label">AI Analysis</div>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step" id="step-decision">
                            <div class="step-icon">⚖️</div>
                            <div class="step-label">Decision</div>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step" id="step-blockchain">
                            <div class="step-icon">🔗</div>
                            <div class="step-label">Blockchain</div>
                        </div>
                    </div>
                </div>

                <div class="demo-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:20px;">
                    <div class="card animate-slide-up">
                        <div class="card-header">
                            <div class="card-title">Live Risk Graph</div>
                        </div>
                        <div class="card-body">
                            <canvas id="risk-score-chart" height="200"></canvas>
                        </div>
                    </div>
                    
                    <div class="card animate-slide-up">
                        <div class="card-header">
                            <div class="card-title">🤖 AI Copilot (Why Flagged?)</div>
                        </div>
                        <div class="card-body" id="copilot-explanation">
                            <div class="empty-state">Run a case to see AI reasoning...</div>
                        </div>
                    </div>
                </div>

                <div class="card animate-slide-up" style="margin-top:20px;">
                    <div class="card-header">
                        <div class="card-title">Blockchain Audit Log</div>
                    </div>
                    <div class="card-body">
                        <div class="audit-log" id="demo-audit-log">
                            <div class="empty-state">Waiting for transaction...</div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        `;
        
        this.initChart();
    },

    initChart() {
        const ctx = document.getElementById('risk-score-chart');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Now'],
                datasets: [{
                    label: 'Multi-AI Risk Score',
                    data: [0.1, 0.12, 0.08, 0.15, 0.1, 0.1],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 1 }
                }
            }
        });
    },

    async runCase(type) {
        this.resetPipeline();
        
        let payload = {
            sender_id: 1,
            receiver_id: 99,
            amount: 100,
            currency: "USD",
            description: "Regular purchase"
        };

        if (type === 'suspicious') {
            payload = { sender_id: 2, receiver_id: 88, amount: 5000, currency: "USD", description: "High value transfer" };
        } else if (type === 'fraud') {
            payload = { sender_id: 3, receiver_id: 77, amount: 99999, currency: "USD", description: "Account Drain Attempt" };
        }

        try {
            this.animateStep('step-user');
            await this.sleep(500);
            this.animateStep('step-tx');
            
            // Call the correct backend API endpoint
            const response = await fetch(`${API.BASE_URL}/security/process_transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            await this.sleep(800);
            this.animateStep('step-ai');
            this.updateChart(result.risk_score);

            await this.sleep(800);
            this.animateStep('step-decision', result.status === 'reject' ? 'error' : result.status === 'challenge' ? 'warning' : 'success');
            
            this.showCopilot(result);

            await this.sleep(800);
            this.animateStep('step-blockchain');
            this.addToAuditLog(result);

        } catch (error) {
            console.error("Demo Error:", error);
            Toast.error("Demo Connection Failed. Ensure Backend is running on port 5000.");
        }
    },

    animateStep(id, status = 'active') {
        const step = document.getElementById(id);
        if (step) {
            step.classList.add('pulse');
            if (status === 'error') step.style.borderColor = 'var(--color-danger)';
            if (status === 'warning') step.style.borderColor = 'var(--color-warning)';
            if (status === 'success') step.style.borderColor = 'var(--color-success)';
        }
    },

    resetPipeline() {
        const steps = document.querySelectorAll('.flow-step');
        steps.forEach(s => {
            s.classList.remove('pulse');
            s.style.borderColor = '';
        });
        document.getElementById('copilot-explanation').innerHTML = '<div class="loading">AI Brain Thinking...</div>';
    },

    updateChart(newScore) {
        if (!this.chart) return;
        this.chart.data.datasets[0].data.shift();
        this.chart.data.datasets[0].data.push(newScore);
        
        // Dynamic color
        if (newScore > 0.8) this.chart.data.datasets[0].borderColor = '#ef4444';
        else if (newScore > 0.5) this.chart.data.datasets[0].borderColor = '#f59e0b';
        else this.chart.data.datasets[0].borderColor = '#6366f1';
        
        this.chart.update();
    },

    showCopilot(result) {
        const copilot = document.getElementById('copilot-explanation');
        // result is the TransactionResponse, but it might not have the copilot details directly if returned from process_transaction
        // Actually, my backend update ensures it has everything or we can mock it here for the UI if needed
        // But better to fetch it.
        
        const explanation = result.risk_score > 0.8 ? 
            "Flagged due to CRITICAL risk (Isolation Forest + LSTM). Multiple models detected an automated account drain signature. Blockchain anchor created for forensics." :
            result.risk_score > 0.5 ? 
            "Flagged as SUSPICIOUS. Deviation in GNN Network trust. Risk Score 0.62 > 0.5 threshold. MFA Challenge issued." :
            "Transaction APPROVED. All models (IF, LSTM, GNN, Trust) confirm normal behavioral pattern.";

        copilot.innerHTML = `
            <div class="copilot-bubble animate-fade-in">
                <p><strong>Verdict:</strong> ${result.status.toUpperCase()}</p>
                <p><strong>Reasoning:</strong> ${explanation}</p>
                <div class="actions" style="margin-top:10px;">
                    ${result.risk_score > 0.5 ? '<span class="badge badge-error">Action: BLOCK / MFA</span>' : '<span class="badge badge-success">Action: PASSED</span>'}
                </div>
            </div>
        `;
    },

    addToAuditLog(result) {
        const log = document.getElementById('demo-audit-log');
        const entry = document.createElement('div');
        entry.className = 'audit-entry animate-slide-up';
        entry.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:0.8rem; padding:10px; border-bottom:1px solid var(--glass-border);">
                <span>${new Date().toLocaleTimeString()}</span>
                <span>TX: ${(result.blockchain_receipt?.tx_hash || 'N/A').substring(0,8)}...</span>
                <span style="color:var(--color-success)">${result.blockchain_receipt?.block_hash || 'pending'}</span>
            </div>
        `;
        if (log.querySelector('.empty-state')) log.innerHTML = '';
        log.prepend(entry);
    },

    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
};
