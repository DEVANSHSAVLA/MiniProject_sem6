/**
 * Datasets Page
 * Dataset registry, provenance tracking, integrity verification.
 */
const DatasetsPage = {
    async render() {
        const content = document.getElementById('content');
        content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading datasets...</p></div>';

        try {
            const data = await API.getDatasets();
            content.innerHTML = this.buildHTML(data);
            this.attachEvents();
        } catch (error) {
            content.innerHTML = `<div class="empty-state"><p>Failed to load datasets: ${error.message}</p></div>`;
        }
    },

    buildHTML(data) {
        const datasets = data.datasets || [];

        return `
        <div class="page-enter">
            <div class="section-header" style="margin-bottom: var(--spacing-lg);">
                <div>
                    <div class="section-title">${datasets.length} Registered Datasets</div>
                </div>
                <div style="display:flex; gap:12px;">
                    <button class="btn btn-secondary" id="btn-export-datasets">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:6px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export CSV
                    </button>
                    <button class="btn btn-secondary" id="btn-import-dataset" style="border-color:var(--color-success);color:var(--color-success);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:6px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Import CSV
                    </button>
                    <button class="btn btn-primary" id="btn-register-dataset">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Register Dataset
                    </button>
                </div>
            </div>

            <!-- Dataset Table -->
            <div class="card animate-in stagger-1">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Dataset Name</th>
                                <th>Type</th>
                                <th>Source</th>
                                <th>Records</th>
                                <th>Size</th>
                                <th>Integrity</th>
                                <th>Transformations</th>
                                <th>Hash</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${datasets.map((d, i) => `
                                <tr class="animate-in stagger-${Math.min(i + 1, 6)}" style="cursor:pointer;" onclick="DatasetsPage.showDetails(${d.id})">
                                    <td>
                                        <div style="font-weight: 600; color: var(--text-primary);">${d.name}</div>
                                        <div style="font-size: 0.72rem; color: var(--text-muted); max-width: 250px; overflow:hidden; text-overflow: ellipsis;">${d.description || ''}</div>
                                    </td>
                                    <td><span class="tag">${d.data_type || 'unknown'}</span></td>
                                    <td style="max-width: 160px; overflow:hidden; text-overflow:ellipsis; color: var(--text-secondary);">${d.source || 'N/A'}</td>
                                    <td style="font-weight:600; color:var(--text-primary);">${d.record_count ? d.record_count.toLocaleString() : 'N/A'}</td>
                                    <td>${d.file_size ? this.formatSize(d.file_size) : 'N/A'}</td>
                                    <td>${d.integrity_verified
                ? '<span class="verified-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px;"><polyline points="20 6 9 17 4 12"/></svg> Verified</span>'
                : '<span class="badge badge-critical">Failed</span>'
            }</td>
                                    <td><span class="badge badge-info">${d.transformation_count || 0}</span></td>
                                    <td><span class="hash">${d.data_hash?.substring(0, 12)}...</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Register Modal -->
            <div class="modal-overlay" id="dataset-modal">
                <div class="modal">
                    <div class="modal-header">
                        <div class="modal-title">Register New Dataset</div>
                        <button class="modal-close" id="close-dataset-modal">&times;</button>
                    </div>
                    <form id="register-dataset-form">
                        <div class="form-group">
                            <label class="form-label">Dataset Name</label>
                            <input type="text" class="form-input" name="name" placeholder="e.g., Customer-Transactions-2024" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-textarea" name="description" placeholder="Description of the dataset..." required></textarea>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label class="form-label">Data Type</label>
                                <select class="form-select" name="data_type">
                                    <option value="tabular">Tabular</option>
                                    <option value="text">Text</option>
                                    <option value="image">Image</option>
                                    <option value="audio">Audio</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Record Count</label>
                                <input type="number" class="form-input" name="record_count" placeholder="100000">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Source</label>
                            <input type="text" class="form-input" name="source" placeholder="e.g., Internal Data Warehouse">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; margin-top: var(--spacing-md);">
                            Register on Blockchain
                        </button>
                    </form>
                </div>
            </div>

            <!-- Import CSV Modal -->
            <div class="modal-overlay" id="import-modal">
                <div class="modal" style="max-width:620px;">
                    <div class="modal-header">
                        <div class="modal-title">Import Dataset from CSV</div>
                        <button class="modal-close" id="close-import-modal">&times;</button>
                    </div>
                    <div id="import-dropzone" style="border:2px dashed var(--glass-border);border-radius:var(--radius-md);padding:40px 20px;text-align:center;cursor:pointer;transition:all .2s;margin-bottom:16px;background:rgba(255,255,255,0.02);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:12px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <div style="font-weight:600;margin-bottom:4px;">Drag & drop your CSV file here</div>
                        <div style="font-size:0.78rem;color:var(--text-muted);">or click to browse · Max 50MB</div>
                        <input type="file" id="csv-file-input" accept=".csv" style="display:none;">
                    </div>
                    <div id="import-file-info" style="display:none;padding:12px;background:var(--bg-elevated);border-radius:var(--radius-sm);margin-bottom:16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div><span id="import-filename" style="font-weight:600;"></span> <span id="import-filesize" style="font-size:0.75rem;color:var(--text-muted);margin-left:8px;"></span></div>
                            <button class="btn btn-outline" id="import-clear-file" style="font-size:0.65rem;padding:2px 8px;">Remove</button>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                        <div class="form-group" style="margin:0;"><label class="form-label">Name (optional)</label><input type="text" class="form-input" id="import-name" placeholder="Auto-detected from filename"></div>
                        <div class="form-group" style="margin:0;"><label class="form-label">Source</label><input type="text" class="form-input" id="import-source" placeholder="CSV Upload"></div>
                    </div>
                    <div id="import-preview" style="display:none;margin-bottom:16px;"></div>
                    <button class="btn btn-primary" id="btn-do-import" style="width:100%;justify-content:center;" disabled>Upload & Register on Blockchain</button>
                </div>
            </div>

            <!-- Details Modal -->
            <div class="modal-overlay" id="dataset-detail-modal">
                <div class="modal" style="max-width: 600px;">
                    <div class="modal-header">
                        <div class="modal-title">Dataset Details</div>
                        <button class="modal-close" id="close-detail-modal">&times;</button>
                    </div>
                    <div id="dataset-detail-content">
                        <div class="loading-spinner"><div class="spinner"></div></div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    _selectedFile: null,

    attachEvents() {
        document.getElementById('btn-register-dataset')?.addEventListener('click', () => {
            document.getElementById('dataset-modal').classList.add('active');
        });
        document.getElementById('close-dataset-modal')?.addEventListener('click', () => {
            document.getElementById('dataset-modal').classList.remove('active');
        });
        document.getElementById('close-detail-modal')?.addEventListener('click', () => {
            document.getElementById('dataset-detail-modal').classList.remove('active');
        });

        // Import CSV Modal
        document.getElementById('btn-import-dataset')?.addEventListener('click', () => {
            this._selectedFile = null;
            document.getElementById('import-modal').classList.add('active');
            document.getElementById('import-file-info').style.display = 'none';
            document.getElementById('import-preview').style.display = 'none';
            document.getElementById('btn-do-import').disabled = true;
            document.getElementById('import-dropzone').style.display = '';
        });
        document.getElementById('close-import-modal')?.addEventListener('click', () => {
            document.getElementById('import-modal').classList.remove('active');
        });

        // Drag-and-drop
        const dropzone = document.getElementById('import-dropzone');
        const fileInput = document.getElementById('csv-file-input');
        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());
            dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--accent-primary)'; dropzone.style.background = 'rgba(99,102,241,0.05)'; });
            dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = ''; dropzone.style.background = ''; });
            dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.style.borderColor = ''; dropzone.style.background = ''; if (e.dataTransfer.files[0]) this._handleFile(e.dataTransfer.files[0]); });
            fileInput.addEventListener('change', () => { if (fileInput.files[0]) this._handleFile(fileInput.files[0]); });
        }
        document.getElementById('import-clear-file')?.addEventListener('click', () => {
            this._selectedFile = null;
            document.getElementById('import-file-info').style.display = 'none';
            document.getElementById('import-preview').style.display = 'none';
            document.getElementById('btn-do-import').disabled = true;
            document.getElementById('import-dropzone').style.display = '';
        });

        // Upload button
        document.getElementById('btn-do-import')?.addEventListener('click', async () => {
            if (!this._selectedFile) return;
            const btn = document.getElementById('btn-do-import');
            btn.disabled = true; btn.textContent = 'Uploading...';
            try {
                const meta = { name: document.getElementById('import-name').value, source: document.getElementById('import-source').value };
                const result = await API.uploadDataset(this._selectedFile, meta);
                document.getElementById('import-modal').classList.remove('active');
                Toast.success(`Dataset "${result.dataset.name}" imported — ${result.profile.total_rows} rows, ${result.profile.total_columns} columns`);
                this.render();
            } catch (err) {
                Toast.error('Import failed: ' + err.message);
                btn.disabled = false; btn.textContent = 'Upload & Register on Blockchain';
            }
        });

        // Export Data Handler
        document.getElementById('btn-export-datasets')?.addEventListener('click', async () => {
            try {
                Toast.show('<div class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-bottom:-2px;margin-right:8px;"></div> Gathering datasets for export...', 'info');
                const data = await API.getDatasets();
                const datasets = data.datasets || [];
                if (datasets.length === 0) { Toast.error('No datasets available to export.'); return; }
                const headers = ['ID', 'Name', 'Type', 'Record Count', 'Source', 'Integrity Verified', 'Hash', 'Created At'];
                const rows = datasets.map(d => [
                    d.id, `"${d.name.replace(/"/g, '""')}"`, d.data_type, d.record_count,
                    `"${(d.source || '').replace(/"/g, '""')}"`, d.integrity_verified ? 'Yes' : 'No', d.data_hash, new Date(d.created_at).toISOString()
                ]);
                const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', 'dataset_export_' + new Date().toISOString().split('T')[0] + '.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link); link.click(); document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setTimeout(() => Toast.success('Datasets exported successfully as CSV.'), 1000);
            } catch (err) { Toast.error('Export failed: ' + err.message); }
        });

        document.getElementById('register-dataset-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            data.record_count = parseInt(data.record_count) || 0;
            data.owner_id = 1;
            try {
                await API.createDataset(data);
                document.getElementById('dataset-modal').classList.remove('active');
                this.render();
            } catch (error) { alert('Failed to register dataset: ' + error.message); }
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.remove('active');
            });
        });
    },

    _handleFile(file) {
        if (!file.name.toLowerCase().endsWith('.csv')) { Toast.error('Please select a CSV file'); return; }
        if (file.size > 50 * 1024 * 1024) { Toast.error('File too large (max 50MB)'); return; }
        this._selectedFile = file;
        document.getElementById('import-dropzone').style.display = 'none';
        document.getElementById('import-filename').textContent = file.name;
        document.getElementById('import-filesize').textContent = this.formatSize(file.size);
        document.getElementById('import-file-info').style.display = '';
        document.getElementById('btn-do-import').disabled = false;
        document.getElementById('btn-do-import').textContent = 'Upload & Register on Blockchain';
        // Parse preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const lines = e.target.result.split('\n').filter(l => l.trim());
            if (lines.length < 2) return;
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1, 6).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
            const preview = document.getElementById('import-preview');
            preview.style.display = '';
            preview.innerHTML = `
                <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;font-weight:600;">PREVIEW · ${lines.length - 1} rows · ${headers.length} columns</div>
                <div style="overflow-x:auto;max-height:160px;border:1px solid var(--glass-border);border-radius:var(--radius-sm);">
                    <table style="font-size:0.72rem;min-width:100%;">
                        <thead><tr>${headers.map(h => `<th style="padding:6px 10px;white-space:nowrap;background:var(--bg-elevated);position:sticky;top:0;">${h}</th>`).join('')}</tr></thead>
                        <tbody>${rows.map(r => `<tr>${r.map(c => `<td style="padding:4px 10px;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;">${c}</td>`).join('')}</tr>`).join('')}</tbody>
                    </table>
                </div>`;
        };
        reader.readAsText(file);
    },

    async showDetails(id) {
        document.getElementById('dataset-detail-modal').classList.add('active');
        const container = document.getElementById('dataset-detail-content');
        container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

        try {
            const data = await API.getDataset(id);
            const ds = data.dataset;
            const transforms = data.transformations || [];
            const lineage = data.lineage;

            container.innerHTML = `
                <div style="margin-bottom:16px;">
                    <h3 style="font-weight:700; margin-bottom:4px;">${ds.name}</h3>
                    <p style="font-size:0.82rem; color:var(--text-secondary);">${ds.description}</p>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px;">
                    <div style="padding:12px; background:var(--bg-elevated); border-radius:var(--radius-md);">
                        <div style="font-size:0.72rem; color:var(--text-muted);">Type</div>
                        <div style="font-weight:600;">${ds.data_type}</div>
                    </div>
                    <div style="padding:12px; background:var(--bg-elevated); border-radius:var(--radius-md);">
                        <div style="font-size:0.72rem; color:var(--text-muted);">Records</div>
                        <div style="font-weight:600;">${ds.record_count?.toLocaleString() || 'N/A'}</div>
                    </div>
                    <div style="padding:12px; background:var(--bg-elevated); border-radius:var(--radius-md);">
                        <div style="font-size:0.72rem; color:var(--text-muted);">Source</div>
                        <div style="font-weight:600; font-size:0.82rem;">${ds.source || 'N/A'}</div>
                    </div>
                    <div style="padding:12px; background:var(--bg-elevated); border-radius:var(--radius-md);">
                        <div style="font-size:0.72rem; color:var(--text-muted);">Integrity</div>
                        <div style="font-weight:600; color:${ds.integrity_verified ? 'var(--color-success)' : 'var(--color-danger)'};">
                            ${ds.integrity_verified ? '✓ Verified' : '✗ Failed'}
                        </div>
                    </div>
                </div>
                <div style="margin-bottom:12px;">
                    <div style="font-size:0.8rem; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">Data Hash</div>
                    <div class="hash" style="word-break:break-all; padding:8px;">${ds.data_hash}</div>
                </div>
                ${transforms.length > 0 ? `
                    <div style="margin-top:16px;">
                        <div style="font-size:0.9rem; font-weight:700; margin-bottom:8px;">Transformation History</div>
                        ${transforms.map(t => `
                            <div style="padding:8px 12px; border-left:3px solid var(--accent-primary); margin-bottom:8px; background:var(--bg-elevated); border-radius:0 var(--radius-sm) var(--radius-sm) 0;">
                                <div style="font-weight:600; font-size:0.82rem; text-transform:capitalize;">${t.transformation_type}</div>
                                <div style="font-size:0.75rem; color:var(--text-secondary);">${t.description}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;
        } catch (error) {
            container.innerHTML = `<p style="color:var(--color-danger)">Failed to load: ${error.message}</p>`;
        }
    },

    formatSize(bytes) {
        if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
        if (bytes >= 1e6) return (bytes / 1e6).toFixed(0) + ' MB';
        if (bytes >= 1e3) return (bytes / 1e3).toFixed(0) + ' KB';
        return bytes + ' B';
    }
};
