/**
 * AI Models Page
 * Model management: register, view, verify integrity, and track versions.
 */
const ModelsPage = {
    async render() {
        const content = document.getElementById('content');
        content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading models...</p></div>';

        try {
            const data = await API.getModels();
            content.innerHTML = this.buildHTML(data);
            this.attachEvents();
        } catch (error) {
            content.innerHTML = `<div class="empty-state"><p>Failed to load models: ${error.message}</p></div>`;
        }
    },

    buildHTML(data) {
        const models = data.models || [];

        return `
        <div class="page-enter">
            <!-- Header -->
            <div class="section-header" style="margin-bottom: var(--spacing-lg);">
                <div>
                    <div class="section-title">${models.length} Registered Models</div>
                </div>
                <div style="display:flex; gap:12px;">
                    <button class="btn btn-secondary" id="btn-export-models">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:6px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export CSV
                    </button>
                    <button class="btn btn-primary" id="btn-register-model">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Register Model
                    </button>
                </div>
            </div>

            <!-- Model Provenance Graph -->
            <div class="card animate-in stagger-1" style="margin-bottom: var(--spacing-xl); overflow: hidden; position: relative; padding: 0;">
                <div class="card-header" style="position: absolute; top: 0; left: 0; right: 0; z-index: 10; padding: 20px; background: linear-gradient(rgba(15,23,42,0.95), transparent); border:none;">
                    <div>
                        <div class="card-title">Model Provenance Lineage</div>
                        <div class="card-subtitle">Transparent tracking of AI model evolution</div>
                    </div>
                </div>
                <div style="width: 100%; height: 250px; background: radial-gradient(circle at center, rgba(99,102,241,0.05) 0%, transparent 70%); display: flex; align-items:center; justify-content:center; position: relative;">
                    <!-- Lineage Lines -->
                    <svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:1;">
                        <path d="M 150,125 Q 300,125 350,125" fill="none" stroke="rgba(99,102,241,0.3)" stroke-width="2" stroke-dasharray="4,4" />
                        <path d="M 350,125 Q 400,125 450,80" fill="none" stroke="rgba(99,102,241,0.3)" stroke-width="2" />
                        <path d="M 350,125 Q 400,125 450,170" fill="none" stroke="rgba(99,102,241,0.3)" stroke-width="2" />
                        <path d="M 550,80 Q 600,80 650,125" fill="none" stroke="rgba(16,185,129,0.3)" stroke-width="2" />
                        <path d="M 550,170 Q 600,170 650,125" fill="none" stroke="rgba(16,185,129,0.3)" stroke-width="2" />
                        <path d="M 750,125 L 850,125" fill="none" stroke="rgba(249,115,22,0.5)" stroke-width="2" />
                        
                        <!-- Animated flow dot -->
                        <circle cx="0" cy="0" r="3" fill="#6366f1" style="filter: drop-shadow(0 0 5px #6366f1)">
                            <animateMotion dur="4s" repeatCount="indefinite" path="M 150,125 Q 300,125 350,125 Q 400,125 450,80 Q 600,80 650,125 L 850,125" />
                        </circle>
                    </svg>

                    <!-- Nodes -->
                    <div style="position:relative; z-index:2; width:100%; max-width:900px; display:flex; justify-content:space-between; align-items:center; padding: 0 40px;">
                        
                        <div style="text-align:center;">
                            <div style="width:100px; height:60px; background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.2); border-radius:8px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.5); backdrop-filter:blur(4px);">
                                <span style="font-size:0.75rem; color:var(--text-secondary);"><i class="fas fa-database"></i> Base Data</span>
                            </div>
                            <div style="font-size:0.65rem; color:var(--text-muted); margin-top:8px;">Block #1042</div>
                        </div>

                        <div style="text-align:center;">
                            <div style="width:100px; height:60px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); border-radius:8px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px rgba(99,102,241,0.1);">
                                <span style="font-size:0.8rem; font-weight:600; color:var(--accent-primary);">v1.0.0</span>
                            </div>
                            <div style="font-size:0.65rem; color:var(--text-muted); margin-top:8px;">Accuracy: 88%</div>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:30px;">
                            <div style="text-align:center;">
                                <div style="width:100px; height:60px; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.5); border-radius:8px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(99,102,241,0.15);">
                                    <span style="font-size:0.8rem; font-weight:600; color:var(--text-primary);">v1.1.0</span>
                                </div>
                                <div style="font-size:0.65rem; color:var(--text-muted); margin-top:8px;">Fine-tuned</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="width:100px; height:60px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:8px; display:flex; align-items:center; justify-content:center;">
                                    <span style="font-size:0.8rem; font-weight:600; color:var(--color-success);">v1.2.0</span>
                                </div>
                                <div style="font-size:0.65rem; color:var(--text-muted); margin-top:8px;">Quantized</div>
                            </div>
                        </div>

                        <div style="text-align:center;">
                            <div style="width:100px; height:60px; background:rgba(249,115,22,0.15); border:1px solid rgba(249,115,22,0.4); border-radius:8px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 25px rgba(249,115,22,0.1);">
                                <span style="font-size:0.85rem; font-weight:700; color:var(--color-high);">v2.0.0</span>
                            </div>
                            <div style="font-size:0.65rem; color:var(--color-high); margin-top:8px; font-weight:600;">Latest Live</div>
                        </div>

                    </div>
                </div>
            </div>

            <!-- Model Cards -->
            <div class="model-grid">
                ${models.map((m, i) => this.modelCard(m, i + 1)).join('')}
            </div>

            <!-- Register Modal -->
            <div class="modal-overlay" id="register-modal">
                <div class="modal">
                    <div class="modal-header">
                        <div class="modal-title">Register New AI Model</div>
                        <button class="modal-close" id="close-register-modal">&times;</button>
                    </div>
                    <form id="register-model-form">
                        <div class="form-group">
                            <label class="form-label">Model Name</label>
                            <input type="text" class="form-input" name="name" placeholder="e.g., FraudDetector-v4" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-textarea" name="description" placeholder="Brief description of the model..." required></textarea>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label class="form-label">Type</label>
                                <select class="form-select" name="model_type">
                                    <option value="classification">Classification</option>
                                    <option value="regression">Regression</option>
                                    <option value="nlp">NLP</option>
                                    <option value="computer_vision">Computer Vision</option>
                                    <option value="anomaly_detection">Anomaly Detection</option>
                                    <option value="recommendation">Recommendation</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Framework</label>
                                <select class="form-select" name="framework">
                                    <option value="tensorflow">TensorFlow</option>
                                    <option value="pytorch">PyTorch</option>
                                    <option value="sklearn">Scikit-learn</option>
                                    <option value="xgboost">XGBoost</option>
                                </select>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label class="form-label">Version</label>
                                <input type="text" class="form-input" name="version" value="1.0.0">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Accuracy</label>
                                <input type="number" class="form-input" name="accuracy" step="0.001" min="0" max="1" placeholder="0.95">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; margin-top: var(--spacing-md);">
                            Register on Blockchain
                        </button>
                    </form>
                </div>
            </div>

            <!-- Version Modal -->
            <div class="modal-overlay" id="version-modal">
                <div class="modal">
                    <div class="modal-header">
                        <div class="modal-title">Version History</div>
                        <button class="modal-close" id="close-version-modal">&times;</button>
                    </div>
                    <div id="version-content">
                        <div class="loading-spinner"><div class="spinner"></div></div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    modelCard(model, index) {
        const statusColors = {
            registered: 'badge-info',
            verified: 'badge-success',
            deployed: 'badge-low',
            deprecated: 'badge-medium'
        };

        return `
        <div class="model-card animate-in stagger-${Math.min(index + 1, 6)}" id="model-card-${model.id}">
            <div class="model-card-header">
                <div>
                    <div class="model-name">${model.name}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">by ${model.owner || 'Unknown'}</div>
                </div>
                <div style="text-align:right;">
                    <span class="badge ${statusColors[model.status] || 'badge-info'}" id="status-badge-${model.id}">${model.status}</span>
                    <div id="tamper-tag-${model.id}" style="font-size:0.6rem; font-weight:800; margin-top:4px; ${model.status === 'verified' ? 'color:var(--color-success)' : 'color:var(--text-muted)'}">${model.status === 'verified' ? 'CLEAN RECORD' : 'UNCERTIFIED'}</div>
                </div>
            </div>

            <!-- Enhanced trust & Integrity HUD -->
            <div style="display:flex; gap:12px; margin: 15px 0;">
                <div style="flex:1; background:rgba(255,255,255,0.03); border-radius:8px; padding:10px; border:1px solid var(--glass-border); text-align:center;">
                    <div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:4px; letter-spacing:0.5px;">TRUST SCORE</div>
                    <div id="trust-score-${model.id}" style="font-size:1.2rem; font-weight:800; color:var(--accent-primary);">${model.trust_score || '70'}</div>
                    <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; margin-top:5px; overflow:hidden;">
                        <div id="trust-bar-${model.id}" style="width:${model.trust_score || 70}%; height:100%; background:var(--accent-primary); transition:width 1s ease;"></div>
                    </div>
                </div>
                <div style="flex:1; background:rgba(255,255,255,0.03); border-radius:8px; padding:10px; border:1px solid var(--glass-border); text-align:center;">
                    <div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:4px; letter-spacing:0.5px;">TAMPER STATUS</div>
                    <div id="tamper-status-${model.id}" style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-top:5px;">${model.tamper_status || 'UNKNOWN'}</div>
                    <div id="integrity-icon-${model.id}" style="margin-top:2px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.3;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                </div>
            </div>

            <div class="model-meta">
                <span class="tag">${model.model_type || 'unknown'}</span>
                <span class="tag">${model.framework || 'unknown'}</span>
                <span class="tag">v${model.version}</span>
            </div>
            <div class="model-desc">${model.description || 'No description'}</div>
            <div class="model-stats">
                <div class="model-stat">
                    <div class="model-stat-value">${model.accuracy ? (model.accuracy * 100).toFixed(1) + '%' : 'N/A'}</div>
                    <div class="model-stat-label">Accuracy</div>
                </div>
                <div class="model-stat">
                    <div class="model-stat-value">${model.file_size ? this.formatSize(model.file_size) : 'N/A'}</div>
                    <div class="model-stat-label">Size</div>
                </div>
                <div class="model-stat">
                    <div class="model-stat-value">${model.version_count || 0}</div>
                    <div class="model-stat-label">Versions</div>
                </div>
            </div>
            <div style="display:flex; gap:8px; margin-top: var(--spacing-md);">
                <button class="btn btn-secondary btn-sm" onclick="ModelsPage.verifyModel(${model.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Integrity Scan
                </button>
                <button class="btn btn-secondary btn-sm" onclick="ModelsPage.showVersions(${model.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;">
                        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    History
                </button>
                <button class="btn btn-secondary btn-sm" onclick="ModelsPage.deployModel(${model.id})" style="${model.status === 'deployed' ? 'opacity:0.5; cursor:not-allowed;' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    Deploy
                </button>
            </div>
            <div style="margin-top: var(--spacing-sm);">
                <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:2px;">Blockchain Fingerprint:</div>
                <span class="hash" title="${model.model_hash}">${model.model_hash ? model.model_hash.substring(0, 32) + '...' : 'N/A'}</span>
            </div>
        </div>
        `;
    },

    attachEvents() {
        // Register modal
        document.getElementById('btn-register-model')?.addEventListener('click', () => {
            document.getElementById('register-modal').classList.add('active');
        });
        document.getElementById('close-register-modal')?.addEventListener('click', () => {
            document.getElementById('register-modal').classList.remove('active');
        });
        document.getElementById('close-version-modal')?.addEventListener('click', () => {
            document.getElementById('version-modal').classList.remove('active');
        });

        // Export Data Handler
        document.getElementById('btn-export-models')?.addEventListener('click', async () => {
            try {
                Toast.show('<div class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-bottom:-2px;margin-right:8px;"></div> Gathering models for export...', 'info');

                const data = await API.getModels();
                const models = data.models || [];

                if (models.length === 0) {
                    Toast.error('No models available to export.');
                    return;
                }

                // Convert to CSV
                const headers = ['ID', 'Name', 'Description', 'Owner', 'Framework', 'Type', 'Accuracy', 'Status', 'File Size', 'Versions', 'Data Hash'];
                const rows = models.map(m => [
                    m.id,
                    `"${(m.name || '').replace(/"/g, '""')}"`,
                    `"${(m.description || '').replace(/"/g, '""')}"`,
                    `"${(m.owner || '').replace(/"/g, '""')}"`,
                    m.framework,
                    m.model_type,
                    m.accuracy ? m.accuracy : 'N/A',
                    m.status,
                    m.file_size || 0,
                    m.version_count || 1,
                    m.model_hash
                ]);

                const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

                // Trigger download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                const dateStr = new Date().toISOString().split('T')[0];
                link.setAttribute('download', 'model_export_' + dateStr + '.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                setTimeout(() => Toast.success('Models exported successfully as CSV.'), 1000);
            } catch (err) {
                Toast.error('Export failed: ' + err.message);
            }
        });

        // Register form
        document.getElementById('register-model-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            data.accuracy = parseFloat(data.accuracy) || null;
            data.owner_id = 1;

            try {
                await API.createModel(data);
                document.getElementById('register-modal').classList.remove('active');
                this.render();
            } catch (error) {
                alert('Failed to register model: ' + error.message);
            }
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.remove('active');
            });
        });
    },

    async verifyModel(id) {
        try {
            Toast.show('🔍 Initiating Cryptographic Integrity Scan...', 'info');
            const result = await API.verifyModel(id);

            // Update UI reflectively
            const trustScoreEl = document.getElementById(`trust-score-${id}`);
            const trustBarEl = document.getElementById(`trust-bar-${id}`);
            const tamperStatusEl = document.getElementById(`tamper-status-${id}`);
            const tamperTagEl = document.getElementById(`tamper-tag-${id}`);
            const iconEl = document.getElementById(`integrity-icon-${id}`);

            if (trustScoreEl) trustScoreEl.textContent = result.trust_score;
            if (trustBarEl) trustBarEl.style.width = `${result.trust_score}%`;

            if (tamperStatusEl) {
                tamperStatusEl.textContent = result.tamper_status;
                tamperStatusEl.style.color = result.is_verified ? 'var(--color-success)' : 'var(--color-danger)';
            }

            if (tamperTagEl) {
                tamperTagEl.textContent = result.is_verified ? 'VERIFIED CLEAN' : 'TAMPER DETECTED';
                tamperTagEl.style.color = result.is_verified ? 'var(--color-success)' : 'var(--color-danger)';
            }

            if (iconEl) {
                iconEl.innerHTML = result.is_verified
                    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>'
                    : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
                iconEl.style.opacity = '1';
            }

            if (result.is_verified) {
                Toast.success('✅ Integrity Verified: Model matches blockchain record.');
            } else {
                Toast.error('❌ TAMPER ALERT: Cryptographic mismatch detected!');
            }
        } catch (error) {
            Toast.error('Scan failed: ' + error.message);
        }
    },

    async deployModel(id) {
        if (!confirm('Deploying this model requires pre-deployment cryptographic integrity verification against the blockchain ledger. Proceed?')) return;
        try {
            const res = await API.deployModel(id);
            if (res.success) {
                alert('✅ SUCCESS: ' + res.message);
                this.render(); // Reload page to update status
            } else {
                alert('❌ BLOCKED: ' + (res.error || 'Deployment blocked by integrity check.'));
            }
        } catch (err) {
            alert('❌ BLOCKED: ' + (err.message || 'Deployment verification failed and was blocked.'));
        }
    },

    async showVersions(id) {
        document.getElementById('version-modal').classList.add('active');
        const container = document.getElementById('version-content');
        container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

        try {
            const data = await API.getModelVersions(id);
            const versions = data.versions || [];

            container.innerHTML = `
                <div style="margin-bottom: 12px; font-size:0.9rem; color:var(--text-secondary);">
                    <strong>${data.model_name}</strong> — ${versions.length} versions
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>Version</th><th>Accuracy</th><th>Verified</th><th>Hash</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                            ${versions.map(v => `
                                <tr>
                                    <td><strong>v${v.version}</strong></td>
                                    <td>${v.accuracy ? (v.accuracy * 100).toFixed(1) + '%' : 'N/A'}</td>
                                    <td>${v.verified ? '<span class="verified-badge">Verified</span>' : '<span class="badge badge-medium">Pending</span>'}</td>
                                    <td><span class="hash">${v.model_hash?.substring(0, 16)}...</span></td>
                                    <td>${v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            container.innerHTML = `<p style="color:var(--color-danger)">Failed to load versions: ${error.message}</p>`;
        }
    },

    formatSize(bytes) {
        if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
        if (bytes >= 1e6) return (bytes / 1e6).toFixed(0) + ' MB';
        if (bytes >= 1e3) return (bytes / 1e3).toFixed(0) + ' KB';
        return bytes + ' B';
    }
};
