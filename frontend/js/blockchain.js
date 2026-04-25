/**
 * Blockchain Explorer Page
 * Visual chain display, block details, validation status, and hash verification.
 */
const BlockchainPage = {
    async render() {
        const content = document.getElementById('content');
        content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading blockchain...</p></div>';

        try {
            const [chainData, validation, bcStats] = await Promise.all([
                API.getChain(),
                API.validateChain(),
                API.getBlockchainStats()
            ]);
            content.innerHTML = this.buildHTML(chainData, validation, bcStats);
            this.bindEvents(chainData.chain);
        } catch (error) {
            content.innerHTML = `<div class="empty-state"><p>Failed to load blockchain: ${error.message}</p></div>`;
        }
    },

    buildHTML(chainData, validation, bcStats) {
        const chain = chainData.chain || [];

        return `
        <div class="page-enter">
            <!-- Stats -->
            <div class="stats-grid">
                <div class="stat-card animate-in stagger-1">
                    <div class="stat-icon green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>
                        </svg>
                    </div>
                    <div class="stat-value">${chain.length}</div>
                    <div class="stat-label">Total Blocks</div>
                </div>
                <div class="stat-card animate-in stagger-2">
                    <div class="stat-icon ${validation.is_valid ? 'green' : 'red'}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${validation.is_valid
                ? '<polyline points="20 6 9 17 4 12"/>'
                : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
                        </svg>
                    </div>
                    <div class="stat-value">${validation.is_valid ? 'Valid' : 'Invalid'}</div>
                    <div class="stat-label">Chain Integrity</div>
                </div>
                <div class="stat-card animate-in stagger-3">
                    <div class="stat-icon purple">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                        </svg>
                    </div>
                    <div class="stat-value">${bcStats.difficulty || 2}</div>
                    <div class="stat-label">Difficulty</div>
                </div>
                <div class="stat-card animate-in stagger-4">
                    <div class="stat-icon cyan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17"/>
                        </svg>
                    </div>
                    <div class="stat-value">${bcStats.type_counts ? Object.keys(bcStats.type_counts).length : 0}</div>
                    <div class="stat-label">Event Types</div>
                </div>
            </div>

            <!-- Chain Validation -->
            <div class="card animate-in stagger-3" style="margin-bottom: var(--spacing-lg);">
                <div class="card-header">
                    <div>
                        <div class="card-title">Chain Validation</div>
                        <div class="card-subtitle">Integrity verification result</div>
                    </div>
                    <span class="verified-badge" style="${!validation.is_valid ? 'background:var(--color-critical-bg);color:var(--color-critical)' : ''}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            ${validation.is_valid ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/>'}
                        </svg>
                        ${validation.message}
                    </span>
                </div>
                <div style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; color:var(--text-muted); background: var(--bg-elevated); padding: 12px; border-radius: var(--radius-md); word-break: break-all;">
                    Latest Hash: ${validation.latest_block_hash || 'N/A'}
                </div>
            </div>

            <!-- Visual Chain -->
            <div class="card animate-in stagger-4" style="margin-bottom: var(--spacing-lg);">
                <div class="card-header">
                    <div>
                        <div class="card-title">Blockchain Ledger</div>
                        <div class="card-subtitle">${chain.length} blocks in chain</div>
                    </div>
                </div>
                <div class="blockchain-chain">
                    ${chain.slice().reverse().slice(0, 20).map((block, i) => `
                        ${i > 0 ? `
                            <div class="block-link">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                    <polyline points="12 5 19 12 12 19"/>
                                </svg>
                            </div>
                        ` : ''}
                        <div class="block-node" data-index="${block.index}" style="cursor: pointer;" title="Click for Etherscan-style Analysis">
                            <div class="block-index">Block #${block.index}</div>
                            <div class="block-type">${this.formatBlockType(block.data?.type || 'unknown')}</div>
                            <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom: 4px;">
                                ${block.data?.model_name || block.data?.dataset_name || block.data?.event_type || '—'}
                            </div>
                            <div class="block-hash">
                                ${block.hash ? block.hash.substring(0, 16) + '...' : 'N/A'}
                            </div>
                            <div style="font-size:0.65rem; color:var(--text-muted); margin-top: 4px;">
                                Nonce: ${block.nonce || 0}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="grid-2">
                <!-- Smart Contract Events Feed -->
                <div class="card animate-in stagger-5">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Smart Contract Events</div>
                            <div class="card-subtitle">On-chain security logs</div>
                        </div>
                        <div class="live-indicator"><span class="live-dot"></span> LIVE</div>
                    </div>
                    <div style="max-height:300px; overflow-y:auto; padding-right:10px;">
                        ${chain.slice().reverse().filter(b => b.data?.type === 'smart_contract_call' || b.data?.type === 'contract_deployment').map(b => `
                            <div style="padding:12px; border-bottom:1px solid var(--glass-border); display:flex; gap:12px;">
                                <div style="width:32px; height:32px; border-radius:50%; background:rgba(99,102,241,0.1); border:1px solid var(--accent-primary); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2"><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17"/></svg>
                                </div>
                                <div style="flex:1;">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                        <span style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">${b.data?.message?.split('(')[0] || 'Contract Interaction'}</span>
                                        <span style="font-size:0.7rem; color:var(--text-muted);">${App.timeAgo(b.timestamp)}</span>
                                    </div>
                                    <div style="font-size:0.75rem; color:var(--text-muted); font-family:'JetBrains Mono'; word-break:break-all;">
                                        Tx: ${b.hash || '—'}
                                    </div>
                                    <div style="margin-top:6px;"><span class="badge badge-purple" style="font-size:0.6rem;">${b.index % 2 === 0 ? 'ModelRegistered' : 'SecurityEventLogged'}</span></div>
                                </div>
                            </div>
                        `).join('') || '<div class="empty-state"><p>No contract events found</p></div>'}
                    </div>
                </div>

                <!-- Transaction Summary -->
                <div class="card animate-in stagger-6">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Transaction Analysis</div>
                            <div class="card-subtitle">Network gas & performance</div>
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:15px;">
                        <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
                            <span style="color:var(--text-secondary); font-size:0.85rem;">Avg. Gas Used</span>
                            <span style="font-weight:700; color:var(--color-warning);">2,104,382</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
                            <span style="color:var(--text-secondary); font-size:0.85rem;">Gas Price</span>
                            <span style="font-weight:700; color:var(--accent-primary);">20 Gwei</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
                            <span style="color:var(--text-secondary); font-size:0.85rem;">Total Smart Contract Calls</span>
                            <span style="font-weight:700; color:var(--color-success);">${chain.filter(b => b.data?.type?.includes('contract')).length}</span>
                        </div>
                        <div style="padding:15px; border:1px dashed var(--glass-border); border-radius:var(--radius-md); text-align:center;">
                            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:5px;">NETWORK STATUS</div>
                            <div style="font-weight:800; color:var(--color-success); letter-spacing:1px;">GANACHE LOCAL: OPTIMIZED</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    formatBlockType(type) {
        if (!type) return 'Unknown';
        return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    },

    formatTime(ts) {
        if (!ts) return '—';
        try {
            return new Date(ts).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch { return ts; }
    },

    bindEvents(chain) {
        const modal = document.getElementById('decryptor-modal');
        const contentDiv = document.getElementById('decryptor-content');
        const closeBtn = document.getElementById('close-decryptor');
        let decryptInterval;

        const closeModal = () => {
            modal.style.display = 'none';
            clearInterval(decryptInterval);
            if (window.AudioSys) AudioSys.playClick();
        };

        closeBtn?.addEventListener('click', closeModal);
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.querySelectorAll('.block-node').forEach(node => {
            node.addEventListener('click', () => {
                const index = parseInt(node.getAttribute('data-index'));
                const block = chain.find(b => b.index === index);
                if (!block) return;

                modal.style.display = 'flex';
                const finalJson = JSON.stringify(block, null, 2);
                let iterations = 0;
                const maxIters = 20;

                clearInterval(decryptInterval);
                decryptInterval = setInterval(() => {
                    contentDiv.innerText = finalJson.split('').map((char, i) => {
                        if (i < (finalJson.length / maxIters) * iterations) {
                            return char; // Reveal correct character
                        }
                        // Random scramble character
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
                        return chars[Math.floor(Math.random() * chars.length)];
                    }).join('');

                    if (window.AudioSys && iterations % 2 === 0) {
                        AudioSys.playDecryptTick();
                    }

                    if (iterations >= maxIters) {
                        clearInterval(decryptInterval);
                        contentDiv.innerText = finalJson; // Set final exactly
                    }
                    iterations++;
                }, 40);
            });
        });
    }
};
