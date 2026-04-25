/**
 * Bank Portal Interface – Premium Banking System
 * AI Chain Guard integrated | Blockchain TX Hash display | Bill Payments | Beneficiaries
 */
const BankPage = {
    accounts: [],
    beneficiaries: [],
    activeTab: 'overview',

    async render() {
        const content = document.getElementById('content');
        content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Synchronizing with Banking Ledger...</p></div>';
        try {
            content.innerHTML = this.buildHTML();
            await this.init();
        } catch (error) {
            content.innerHTML = `<div class="empty-state"><p>Bank Portal Error: ${error.message}</p></div>`;
        }
    },

    buildHTML() {
        return `
            <div class="page-enter">
                <!-- Premium Bank Header -->
                <div class="bank-header animate-in" style="margin-bottom: var(--spacing-xl); padding: 30px; background: linear-gradient(135deg, rgba(30, 64, 175, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: var(--radius-lg); position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: 30%; width: 150px; height: 150px; background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%); border-radius: 50%;"></div>
                    <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1;">
                        <div>
                            <div style="font-size: 0.75rem; color: var(--accent-primary); font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">AI Chain Guard · Secure Banking</div>
                            <h2 style="font-size: 2rem; font-weight: 800; margin: 8px 0 0; background: linear-gradient(to right, #fff, var(--text-muted)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Financial Command Center</h2>
                            <p style="color: var(--text-muted); margin-top: 6px; font-size: 0.9rem;">Every transaction is blockchain-verified with AI fraud protection.</p>
                            <div id="crypto-status" style="margin-top:8px; font-size:0.7rem; color:var(--text-muted);">Initializing cryptographic modules...</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.65rem; color: var(--text-muted); letter-spacing: 1px;">BLOCKCHAIN BLOCKS</div>
                            <div id="bank-block-count" style="font-size: 1.8rem; font-weight: 800; color: var(--accent-secondary);">—</div>
                        </div>
                    </div>
                    <!-- Quick Actions -->
                    <div style="display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;">
                        <button class="btn btn-primary" id="btn-open-account-modal" style="font-size:0.8rem; padding: 10px 18px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:6px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Open Account
                        </button>
                        <button class="btn btn-secondary" onclick="document.getElementById('transfer-section').scrollIntoView({behavior:'smooth'})" style="font-size:0.8rem; padding: 10px 18px;">Wire Transfer</button>
                        <button class="btn btn-secondary" onclick="document.getElementById('bill-section').scrollIntoView({behavior:'smooth'})" style="font-size:0.8rem; padding: 10px 18px;">Pay Bill</button>
                        <button class="btn btn-secondary" onclick="BankPage.downloadStatement()" style="font-size:0.8rem; padding: 10px 18px;">Export Ledger</button>
                    </div>
                </div>

                <!-- AI Chain Guard + KYC + Blockchain HUD -->
                <div class="grid-3" style="margin-bottom: var(--spacing-xl); gap: var(--spacing-lg);">
                    <div id="kyc-container" class="card animate-in stagger-1" style="padding: 22px; border-left: 4px solid var(--color-warning);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="stat-icon orange" style="width:36px;height:36px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                            <div>
                                <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; letter-spacing:1px;">IDENTITY VERIFICATION</div>
                                <div id="kyc-status-text" style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-top:2px;">SSI PENDING</div>
                            </div>
                        </div>
                        <div id="kyc-action-area" style="margin-top: 12px;">
                            <button id="btn-verify-kyc" class="btn btn-outline btn-sm" style="width: 100%; border-color: rgba(245, 158, 11, 0.3); font-size:0.75rem;" onclick="BankPage.verifyKYC()">VERIFY BIOMETRICS</button>
                        </div>
                    </div>
                    <div class="card animate-in stagger-2" style="padding: 22px; border-left: 4px solid var(--color-success);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="stat-icon green" style="width:36px;height:36px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                            <div>
                                <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; letter-spacing:1px;">AI CHAIN GUARD</div>
                                <div style="font-size: 0.95rem; font-weight: 700; color: var(--color-success); margin-top:2px;">SHIELD ACTIVE</div>
                                <div style="font-size: 0.6rem; color: var(--text-muted); margin-top:2px;">Anomaly Detection + Risk Scoring</div>
                            </div>
                        </div>
                    </div>
                    <div class="card animate-in stagger-3" style="padding: 22px; border-left: 4px solid var(--accent-secondary);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="stat-icon purple" style="width:36px;height:36px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="8" height="6" rx="1"/><rect x="15" y="4" width="8" height="6" rx="1"/><rect x="8" y="14" width="8" height="6" rx="1"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="5" y1="10" x2="12" y2="14"/></svg></div>
                            <div>
                                <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; letter-spacing:1px;">BLOCKCHAIN LEDGER</div>
                                <div style="font-size: 0.95rem; font-weight: 700; color: var(--accent-secondary); margin-top:2px;">IMMUTABLE</div>
                                <div style="font-size: 0.6rem; color: var(--text-muted); margin-top:2px;">SHA-256 · Proof-of-Work</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Accounts -->
                <div class="section-header"><div class="section-title">Accounts</div></div>
                <div id="bank-accounts-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-lg); margin-bottom: 35px;">
                    <div class="loading-spinner" style="grid-column: 1 / -1;"><div class="spinner"></div></div>
                </div>

                <!-- Operations Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); margin-bottom: 35px;">
                    <!-- Deposit / Withdraw -->
                    <div class="card animate-in stagger-4" style="padding: 22px;">
                        <div class="card-header" style="margin-bottom: 18px;"><div class="card-title">Fund Operations</div></div>
                        <form id="fund-form" style="display:flex; flex-direction:column; gap:14px;">
                            <div class="form-group"><label class="form-label">Account</label><select id="fund-account" class="form-input" required></select></div>
                            <div class="form-group"><label class="form-label">Action</label>
                                <select id="fund-type" class="form-input" required><option value="deposit">DEPOSIT</option><option value="withdraw">WITHDRAW</option></select>
                            </div>
                            <div class="form-group"><label class="form-label">Amount ($)</label>
                                <div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);">$</span>
                                <input type="number" id="fund-amount" class="form-input" style="padding-left:25px;" placeholder="0.00" min="0.01" step="0.01" required></div>
                            </div>
                            <div class="form-group"><label class="form-label">Description / Note</label>
                                <input type="text" id="fund-description" class="form-input" placeholder="e.g. Salary deposit, ATM withdrawal" maxlength="200">
                            </div>
                            <button type="submit" class="btn btn-primary" style="width:100%;">Execute Transaction</button>
                        </form>
                    </div>

                    <!-- Transfer -->
                    <div id="transfer-section" class="card animate-in stagger-5" style="padding: 22px;">
                        <div class="card-header" style="margin-bottom: 18px;"><div class="card-title">Peer-to-Peer Transfer</div></div>
                        <form id="transfer-form" style="display:flex; flex-direction:column; gap:14px;">
                            <div class="form-group"><label class="form-label">Source Account</label><select id="transfer-from" class="form-input" required></select></div>
                            <div class="form-group"><label class="form-label">Destination Account No.</label>
                                <input type="text" id="transfer-to" class="form-input" placeholder="Enter account number" required>
                                <div id="beneficiary-quick" style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;"></div>
                            </div>
                            <div class="form-group"><label class="form-label">Amount ($)</label>
                                <div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);">$</span>
                                <input type="number" id="transfer-amount" class="form-input" style="padding-left:25px;" placeholder="0.00" min="0.01" step="0.01" required></div>
                            </div>
                            <div class="form-group"><label class="form-label">Transfer Note / Reference</label>
                                <input type="text" id="transfer-description" class="form-input" placeholder="e.g. Rent payment, Invoice #1234" maxlength="200">
                            </div>
                            <button type="submit" class="btn btn-warning" style="width:100%;">Authorize Wire</button>
                        </form>
                    </div>
                </div>

                <!-- Bill Payment -->
                <div id="bill-section" class="card animate-in" style="padding: 22px; margin-bottom: 35px;">
                    <div class="card-header" style="margin-bottom: 18px;"><div class="card-title">Bill Payment</div><div class="card-subtitle">Blockchain-verified utility payments</div></div>
                    <form id="bill-form" style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap:14px; align-items:end;">
                        <div class="form-group"><label class="form-label">Account</label><select id="bill-account" class="form-input" required></select></div>
                        <div class="form-group"><label class="form-label">Category</label>
                            <select id="bill-category" class="form-input" required>
                                <option value="electricity">⚡ Electricity</option><option value="water">💧 Water</option><option value="gas">🔥 Gas</option>
                                <option value="internet">🌐 Internet</option><option value="mobile">📱 Mobile</option><option value="insurance">🛡️ Insurance</option>
                            </select>
                        </div>
                        <div class="form-group"><label class="form-label">Provider</label><input type="text" id="bill-provider" class="form-input" placeholder="Provider name" required></div>
                        <div class="form-group"><label class="form-label">Amount ($)</label>
                            <div style="position:relative;"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);">$</span>
                            <input type="number" id="bill-amount" class="form-input" style="padding-left:25px;" placeholder="0.00" min="0.01" step="0.01" required></div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="height:42px;">Pay Bill</button>
                    </form>
                </div>

                <!-- Beneficiaries -->
                <div class="card animate-in" style="padding: 22px; margin-bottom: 35px;">
                    <div class="card-header" style="margin-bottom: 18px;">
                        <div><div class="card-title">Saved Beneficiaries</div></div>
                        <button class="btn btn-outline btn-sm" id="btn-add-ben">+ Add</button>
                    </div>
                    <div id="beneficiary-list" style="display:flex; gap:12px; flex-wrap:wrap;"><span style="color:var(--text-muted); font-size:0.85rem;">Loading...</span></div>
                </div>

                <!-- Transaction Ledger -->
                <div class="card animate-in" style="padding: 0; overflow: hidden; margin-bottom: 35px;">
                    <div class="card-header" style="padding: 22px 22px 14px;">
                        <div><div class="card-title">Blockchain Transaction Ledger</div><div class="card-subtitle">Immutable audit trail with full SHA-256 hashes</div></div>
                    </div>
                    <div style="padding:0 22px 14px; display:flex; gap:10px; align-items:center;">
                        <input type="text" id="tx-search" class="form-input" placeholder="Search by hash, type, or description..." style="flex:1; font-size:0.8rem; padding:8px 14px;" oninput="BankPage.filterTransactions(this.value)">
                        <select id="tx-filter-type" class="form-input" style="width:140px; font-size:0.8rem; padding:8px;" onchange="BankPage.filterTransactions(document.getElementById('tx-search').value)">
                            <option value="">All Types</option>
                            <option value="deposit">Deposits</option>
                            <option value="withdrawal">Withdrawals</option>
                            <option value="transfer">Transfers</option>
                            <option value="bill_payment">Bill Payments</option>
                        </select>
                    </div>
                    <div id="transaction-history" style="max-height: 500px; overflow-y: auto;">
                        <div class="loading-spinner" style="padding: 40px;"><div class="spinner"></div></div>
                    </div>
                </div>
            </div>

            <!-- Blockchain Receipt Modal -->
            <div id="bc-receipt-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:300; align-items:center; justify-content:center; backdrop-filter:blur(12px);">
                <div class="card" style="width:520px; max-width:92vw; padding:0; border:1px solid var(--accent-primary); box-shadow: 0 0 60px rgba(99,102,241,0.2); overflow:hidden;">
                    <div style="padding:24px 24px 16px; border-bottom:1px solid var(--glass-border);">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:40px;height:40px;border-radius:50%;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;">
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-primary)" stroke-width="2" fill="none"><rect x="1" y="4" width="8" height="6" rx="1"/><rect x="15" y="4" width="8" height="6" rx="1"/><rect x="8" y="14" width="8" height="6" rx="1"/><line x1="9" y1="7" x2="15" y2="7"/></svg>
                            </div>
                            <div>
                                <div style="font-size:1.1rem; font-weight:700; color:var(--text-primary);">Blockchain Transaction Receipt</div>
                                <div style="font-size:0.7rem; color:var(--text-muted);">Immutable proof-of-transaction</div>
                            </div>
                        </div>
                    </div>
                    <div id="bc-receipt-body" style="padding:20px 24px; font-family:'JetBrains Mono',monospace; font-size:0.78rem;"></div>
                    <div style="padding:16px 24px; border-top:1px solid var(--glass-border); display:flex; gap:10px;">
                        <button class="btn btn-primary" style="flex:1; font-size:0.8rem;" onclick="BankPage.copyReceipt()">Copy Full Receipt</button>
                        <button class="btn btn-outline" style="flex:1; font-size:0.8rem;" onclick="document.getElementById('bc-receipt-modal').style.display='none'">Close</button>
                    </div>
                </div>
                </div>
            </div>

            <!-- MFA Challenge Modal -->
            <div id="mfa-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:10000; align-items:center; justify-content:center; backdrop-filter:blur(6px);">
                <div class="card" style="max-width:420px; width:90%; padding:30px; border:1px solid var(--color-warning); box-shadow:0 0 60px rgba(245,158,11,0.2);">
                    <div style="text-align:center; margin-bottom:20px;">
                        <div style="font-size:2.5rem;">🔐</div>
                        <h3 style="color:var(--color-warning); margin:12px 0 6px;">Multi-Factor Authentication Required</h3>
                        <p style="color:var(--text-muted); font-size:0.8rem;">This transfer requires additional verification due to high value or elevated risk score.</p>
                    </div>
                    <div style="background:rgba(0,0,0,0.3); padding:16px; border-radius:8px; margin-bottom:16px;">
                        <div style="font-size:0.65rem; color:var(--text-muted); letter-spacing:1px; margin-bottom:8px;">ENTER 6-DIGIT MFA CODE</div>
                        <input id="mfa-code-input" type="text" maxlength="6" placeholder="000000" style="width:100%; text-align:center; font-size:1.5rem; font-family:'JetBrains Mono',monospace; letter-spacing:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); color:var(--text-primary); padding:12px; border-radius:8px;" />
                        <div style="font-size:0.6rem; color:var(--text-muted); margin-top:8px; text-align:center;">Demo code: <strong style="color:var(--accent-secondary);">000000</strong></div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button id="mfa-submit-btn" class="btn btn-primary" style="flex:1;">Verify & Authorize</button>
                        <button class="btn btn-outline" style="flex:1;" onclick="document.getElementById('mfa-modal').style.display='none'">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Open Account Modal -->
            <div id="open-account-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:10000; align-items:center; justify-content:center; backdrop-filter:blur(6px);">
                <div class="card" style="max-width:480px; width:92%; padding:0; border:1px solid var(--accent-primary); box-shadow:0 0 60px rgba(99,102,241,0.2); overflow:hidden;">
                    <div style="padding:24px 24px 16px; border-bottom:1px solid var(--glass-border); display:flex; align-items:center; gap:14px;">
                        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(6,182,212,0.15));display:flex;align-items:center;justify-content:center;font-size:1.4rem;">🏦</div>
                        <div>
                            <div style="font-size:1.1rem; font-weight:700; color:var(--text-primary);">Open New Account</div>
                            <div style="font-size:0.7rem; color:var(--text-muted);">Blockchain-verified account creation with AI security</div>
                        </div>
                    </div>
                    <form id="open-account-form" style="padding:20px 24px; display:flex; flex-direction:column; gap:16px;">
                        <!-- Step 1: Account Info -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div class="form-group">
                                <label class="form-label">Account Type</label>
                                <select id="new-account-type" class="form-input" required>
                                    <option value="" disabled selected>Select</option>
                                    <option value="checking">Checking</option>
                                    <option value="savings" selected>Savings</option>
                                    <option value="business">Business</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Currency</label>
                                <select id="new-account-currency" class="form-input">
                                    <option value="USD" data-symbol="$">🇺🇸 USD</option>
                                    <option value="EUR" data-symbol="€">🇪🇺 EUR</option>
                                    <option value="GBP" data-symbol="£">🇬🇧 GBP</option>
                                    <option value="INR" data-symbol="₹">🇮🇳 INR</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Full Name (KYC)</label>
                            <input type="text" id="new-account-holder" class="form-input" placeholder="Legal name as per ID" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Initial Deposit (<span id="new-account-currency-symbol" style="color:var(--accent-primary); font-weight:700;">$</span>)</label>
                            <input type="number" id="new-account-deposit" class="form-input" placeholder="Min. 100" min="100" step="1" required>
                        </div>

                        <hr style="border:0; border-top:1px solid var(--glass-border); margin:4px 0;">

                        <!-- Step 2: Identity Verification -->
                        <div id="kyc-doc-section">
                            <div class="form-group">
                                <label class="form-label">Identity Document</label>
                                <div style="display:flex; gap:8px;">
                                    <select id="new-account-doc-type" class="form-input" style="flex:0.4;">
                                        <option value="Passport">Passport</option>
                                        <option value="SSN">SSN (US)</option>
                                        <option value="Aadhaar">Aadhaar (IN)</option>
                                    </select>
                                    <input type="text" id="new-account-doc-id" class="form-input" style="flex:0.6;" placeholder="Enter ID number" required>
                                </div>
                            </div>
                        </div>

                        <!-- Step 3: Contact Verification -->
                        <div class="form-group">
                            <label class="form-label">Verification Email</label>
                            <div style="display:flex; gap:8px;">
                                <input type="email" id="new-account-email" class="form-input" style="flex:1;" placeholder="email@example.com" required>
                                <button type="button" id="btn-send-otp" class="btn btn-outline btn-sm" style="padding:0 12px; white-space:nowrap;">Send OTP</button>
                            </div>
                        </div>
                        <div id="otp-section" style="display:none;" class="form-group animate-in">
                            <label class="form-label">Enter 6-Digit OTP</label>
                            <input type="text" id="new-account-otp" class="form-input" style="text-align:center; letter-spacing:8px; font-weight:700;" maxlength="6" placeholder="000000">
                        </div>

                        <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.15); border-radius:8px; padding:10px; font-size:0.65rem; color:var(--text-muted);">
                            <strong style="color:var(--color-success);">🛡️ AI Chain Guard:</strong> Identity documents are hashed & logged on blockchain for non-repudiation.
                        </div>
                    </form>
                    <div style="padding:16px 24px; border-top:1px solid var(--glass-border); display:flex; gap:10px;">
                        <button id="btn-submit-account" class="btn btn-primary" style="flex:1;">Authorize & Create</button>
                        <button class="btn btn-outline" style="flex:1;" onclick="document.getElementById('open-account-modal').style.display='none'">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    },

    async init() {
        await Promise.all([
            this.loadAccounts(),
            this.loadKYCStatus(),
            this.loadTransactions(),
            this.loadBeneficiaries(),
            this.loadBlockCount()
        ]);
        this.bindEvents();
        // Initialize cryptography module (E2EE + Digital Signatures)
        try {
            const cryptoReady = await CryptoModule.init();
            const indicator = document.getElementById('crypto-status');
            if (indicator) {
                indicator.innerHTML = cryptoReady
                    ? '<span style="color:var(--color-success);font-weight:700;">🔐 E2EE + DSig ACTIVE</span>'
                    : '<span style="color:var(--color-warning);">⚠️ Crypto Unavailable</span>';
            }
        } catch (e) { console.error('CryptoModule init failed:', e); }
    },

    async loadBlockCount() {
        try {
            const stats = await API.getBlockchainStats();
            const el = document.getElementById('bank-block-count');
            if (el) el.textContent = stats.total_blocks || '—';
        } catch (e) { /* ignore */ }
    },

    lastReceipt: null,

    showReceipt(receipt, tx, aiGuard) {
        this.lastReceipt = { receipt, tx, aiGuard };
        const body = document.getElementById('bc-receipt-body');
        if (!body) return;

        const verdictColor = aiGuard?.verdict === 'clean' ? 'var(--color-success)' : aiGuard?.verdict === 'suspicious' ? 'var(--color-warning)' : 'var(--color-danger)';
        const verdictIcon = aiGuard?.scan_passed ? '✅' : '⚠️';

        body.innerHTML = `
            <div style="display:grid; gap:14px;">
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <div style="color:var(--text-muted); font-size:0.65rem; letter-spacing:1px;">TRANSACTION HASH</div>
                        <button onclick="const el=document.getElementById('tx-hash-val'); el.innerText='${receipt.tx_hash}'; el.style.color='var(--accent-secondary)'; el.style.letterSpacing='normal'; this.style.display='none';" style="background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); color:var(--accent-primary); border-radius:4px; font-size:0.6rem; padding:2px 6px; cursor:pointer; transition:all 0.2s;">🔓 DECRYPT</button>
                    </div>
                    <div id="tx-hash-val" style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px; word-break:break-all; color:var(--text-muted); cursor:pointer; border:1px solid rgba(255,255,255,0.05); letter-spacing:3px; transition:all 0.3s;" onclick="if(this.innerText!=='*'.repeat(64)){navigator.clipboard.writeText(this.innerText);Toast.success('TX Hash copied!')}">${'*'.repeat(64)}</div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                    <div><div style="color:var(--text-muted); font-size:0.65rem; letter-spacing:1px; margin-bottom:4px;">BLOCK INDEX</div>
                        <div style="font-size:1.3rem; font-weight:700; color:var(--text-primary);">#${receipt.block_index}</div></div>
                    <div><div style="color:var(--text-muted); font-size:0.65rem; letter-spacing:1px; margin-bottom:4px;">TIMESTAMP</div>
                        <div style="color:var(--text-primary);">${new Date(receipt.timestamp).toLocaleString()}</div></div>
                </div>
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <div style="color:var(--text-muted); font-size:0.65rem; letter-spacing:1px;">BLOCK HASH</div>
                        <button onclick="const el=document.getElementById('block-hash-val'); el.innerText='${receipt.block_hash}'; el.style.color='var(--color-success)'; el.style.letterSpacing='normal'; this.style.display='none';" style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); color:var(--color-success); border-radius:4px; font-size:0.6rem; padding:2px 6px; cursor:pointer; transition:all 0.2s;">🔓 DECRYPT</button>
                    </div>
                    <div id="block-hash-val" style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px; word-break:break-all; color:var(--text-muted); border:1px solid rgba(255,255,255,0.05); cursor:pointer; letter-spacing:3px; transition:all 0.3s;" onclick="if(this.innerText!=='*'.repeat(64)){navigator.clipboard.writeText(this.innerText);Toast.success('Block hash copied!')}">${'*'.repeat(64)}</div>
                </div>
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <div style="color:var(--text-muted); font-size:0.65rem; letter-spacing:1px;">PREVIOUS BLOCK HASH</div>
                        <button onclick="const el=document.getElementById('prev-hash-val'); el.innerText='${receipt.prev_block_hash}'; el.style.letterSpacing='normal'; this.style.display='none';" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:var(--text-muted); border-radius:4px; font-size:0.6rem; padding:2px 6px; cursor:pointer; transition:all 0.2s;">🔓 DECRYPT</button>
                    </div>
                    <div id="prev-hash-val" style="background:rgba(0,0,0,0.2); padding:8px; border-radius:6px; word-break:break-all; color:var(--text-muted); font-size:0.7rem; border:1px solid rgba(255,255,255,0.03); letter-spacing:3px; transition:all 0.3s;">${'*'.repeat(64)}</div>
                </div>
                ${tx ? `<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; padding-top:10px; border-top:1px solid var(--glass-border);">
                    <div><div style="color:var(--text-muted); font-size:0.65rem; margin-bottom:3px;">AMOUNT</div><div style="font-weight:700; color:var(--text-primary);">$${tx.amount?.toFixed(2)}</div></div>
                    <div><div style="color:var(--text-muted); font-size:0.65rem; margin-bottom:3px;">TYPE</div><div style="font-weight:600; text-transform:uppercase; color:var(--text-primary);">${tx.type}</div></div>
                    <div><div style="color:var(--text-muted); font-size:0.65rem; margin-bottom:3px;">STATUS</div><div style="font-weight:600; text-transform:uppercase; color:${tx.status==='completed'?'var(--color-success)':'var(--color-danger)'}">${tx.status}</div></div>
                </div>` : ''}
                ${aiGuard ? `<div style="padding:12px; background:rgba(0,0,0,0.25); border-radius:8px; border:1px solid ${verdictColor}30; margin-top:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-size:0.7rem; font-weight:700; letter-spacing:1px; color:var(--text-muted);">AI CHAIN GUARD VERDICT</div>
                        <div style="font-weight:700; color:${verdictColor};">${verdictIcon} ${aiGuard.verdict?.toUpperCase()} (${aiGuard.risk_score}/100)</div>
                    </div>
                </div>` : ''}
            </div>`;
        document.getElementById('bc-receipt-modal').style.display = 'flex';
    },

    copyReceipt() {
        if (!this.lastReceipt) return;
        const r = this.lastReceipt.receipt;
        const text = `BLOCKCHAIN TRANSACTION RECEIPT\nTX Hash: ${r.tx_hash}\nBlock #${r.block_index}\nBlock Hash: ${r.block_hash}\nPrev Hash: ${r.prev_block_hash}\nTimestamp: ${r.timestamp}`;
        navigator.clipboard.writeText(text);
        Toast.success('Full receipt copied to clipboard!');
    },

    async loadTransactions() {
        try {
            const res = await API.getBankTransactions();
            this._allTransactions = res.transactions || [];
            this.renderTransactions(this._allTransactions);
        } catch (err) {
            const c = document.getElementById('transaction-history');
            if (c) c.innerHTML = '<div class="empty-state" style="padding:30px;">No transaction records found.</div>';
        }
    },

    filterTransactions(searchText) {
        const typeFilter = document.getElementById('tx-filter-type')?.value || '';
        const query = (searchText || '').toLowerCase();
        const filtered = (this._allTransactions || []).filter(t => {
            const matchesType = !typeFilter || t.type === typeFilter;
            const matchesSearch = !query || 
                (t.description || '').toLowerCase().includes(query) ||
                (t.tx_hash || '').toLowerCase().includes(query) ||
                (t.type || '').toLowerCase().includes(query);
            return matchesType && matchesSearch;
        });
        this.renderTransactions(filtered);
    },

    renderTransactions(txs) {
        const container = document.getElementById('transaction-history');
        if (!container) return;
        if (txs.length === 0) {
            container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);"><p style="font-size:0.85rem;">No immutable records found.</p></div>';
            return;
        }
        container.innerHTML = txs.map(t => {
            const isOut = t.type === 'withdrawal' || t.type === 'bill_payment' || t.sender_id;
            const amtColor = t.type === 'deposit' ? 'var(--color-success)' : (t.ai_verdict === 'flagged' ? 'var(--color-danger)' : 'var(--text-primary)');
            const verdictBadge = t.ai_verdict === 'flagged' ? '<span style="background:rgba(239,68,68,0.15);color:var(--color-danger);padding:2px 8px;border-radius:10px;font-size:0.6rem;font-weight:700;">FLAGGED</span>'
                : t.ai_verdict === 'suspicious' ? '<span style="background:rgba(245,158,11,0.15);color:var(--color-warning);padding:2px 8px;border-radius:10px;font-size:0.6rem;font-weight:700;">SUSPICIOUS</span>'
                : '<span style="background:rgba(16,185,129,0.1);color:var(--color-success);padding:2px 8px;border-radius:10px;font-size:0.6rem;font-weight:700;">CLEAN</span>';
            const hashDisplay = t.tx_hash || '—';
            const receiptData = JSON.stringify({
                receipt: {
                    tx_hash: t.tx_hash || 'Pending',
                    block_index: t.block_index || '—',
                    block_hash: t.block_hash || 'Pending',
                    prev_block_hash: t.prev_block_hash || '—',
                    timestamp: t.created_at
                },
                tx: { amount: t.amount, type: t.type, status: t.status },
                aiGuard: { verdict: t.ai_verdict || 'clean', risk_score: t.ai_risk_score || 0, scan_passed: t.ai_verdict !== 'flagged' }
            }).replace(/"/g, '&quot;');
            return `
            <div onclick="const d = JSON.parse(this.dataset.receipt); BankPage.showReceipt(d.receipt, d.tx, d.aiGuard);" data-receipt="${receiptData}" style="padding:14px 22px; border-bottom:1px solid rgba(255,255,255,0.03); display:grid; grid-template-columns: 1fr auto; gap:10px; align-items:center; cursor:pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                <div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${t.description || t.type}</span>
                        ${verdictBadge}
                        ${t.type === 'bill_payment' ? '<span style="background:rgba(99,102,241,0.1);color:var(--accent-primary);padding:2px 8px;border-radius:10px;font-size:0.6rem;font-weight:600;">BILL</span>' : ''}
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:0.62rem; color:var(--text-muted); font-family:'JetBrains Mono',monospace;">TX: ${hashDisplay.substring(0, 20)}...</span>
                        <button style="background:none; border:none; cursor:pointer; padding:2px; color:var(--text-muted); font-size:0.6rem;" onclick="event.stopPropagation(); navigator.clipboard.writeText('${hashDisplay}'); Toast.success('TX hash copied!');" title="Copy full hash">📋</button>
                        ${t.block_index != null ? `<span style="font-size:0.6rem; color:var(--accent-secondary); font-family:'JetBrains Mono';">Block #${t.block_index}</span>` : ''}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.95rem; font-weight:700; color:${amtColor};">${isOut ? '-' : '+'}$${t.amount.toFixed(2)}</div>
                    <div style="font-size:0.6rem; color:var(--text-muted);">${new Date(t.created_at).toLocaleDateString()}</div>
                </div>
            </div>`;
        }).join('');
    },

    // downloadStatement is defined at the end of BankPage alongside other utility methods

    async loadKYCStatus() {
        try {
            const status = await API.getKYCStatus();
            this.renderKYC(status);
        } catch (err) { /* ignore */ }
    },

    async loadAccounts() {
        try {
            const res = await API.getBankAccounts();
            this.accounts = res.accounts || [];
            this.renderAccounts();
            this.updateSelects();
        } catch (error) {
            Toast.error('Failed to load accounts: ' + error.message);
        }
    },

    renderAccounts() {
        const grid = document.getElementById('bank-accounts-grid');
        if (!grid) return;
        if (this.accounts.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1; padding:40px;"><p>No active accounts. Click "Open Account" to create one.</p></div>';
            return;
        }
        grid.innerHTML = this.accounts.map(acc => {
            const frozen = acc.status === 'frozen';
            const borderColor = frozen ? 'var(--color-danger)' : 'var(--accent-primary)';
            return `
            <div class="card" style="padding:20px; border-left:4px solid ${borderColor}; ${frozen ? 'opacity:0.7;' : ''}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                    <div>
                        <div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px; margin-bottom:3px;">${acc.account_type} ACCOUNT</div>
                        <div style="font-family:'JetBrains Mono',monospace; font-size:1rem;">${acc.account_number}</div>
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <span class="badge ${acc.status === 'active' ? 'success' : 'danger'}" style="font-size:0.6rem;">${acc.status.toUpperCase()}</span>
                        <button style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.7rem;padding:4px;" onclick="BankPage.toggleFreeze(${acc.id}, '${acc.status}')" title="${frozen ? 'Unfreeze' : 'Freeze'}">${frozen ? '🔓' : '🔒'}</button>
                    </div>
                </div>
                <div>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:3px;">Available Balance</div>
                    <div style="font-size:1.8rem; font-weight:700; color:var(--text-primary);">$${acc.balance.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                        <span style="font-size:0.75rem; color:var(--text-muted);">${acc.currency}</span>
                        <span style="font-size:0.55rem; background:rgba(16,185,129,0.1); color:var(--color-success); padding:3px 8px; border-radius:10px; font-weight:600;">AI SECURED</span>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    async toggleFreeze(accountId, currentStatus) {
        const action = currentStatus === 'active' ? 'freeze' : 'unfreeze';
        try {
            const res = await API.freezeAccount({ account_id: accountId, action });
            Toast.success(`Account ${action}d successfully.`);
            if (res.blockchain_receipt) this.showReceipt(res.blockchain_receipt, null, null);
            this.loadAccounts();
        } catch (err) { Toast.error(err.message); }
    },

    renderKYC(status) {
        const container = document.getElementById('kyc-container');
        const statusText = document.getElementById('kyc-status-text');
        const actionArea = document.getElementById('kyc-action-area');
        if (!container || !statusText || !actionArea) return;
        if (status.status === 'verified') {
            container.style.borderLeftColor = 'var(--color-success)';
            statusText.innerHTML = `<span style="color:var(--color-success); font-weight:600;">VERIFIED</span><br><span style="font-family:'JetBrains Mono'; font-size:0.55rem;">DID: ${status.did.substring(0,28)}...</span>`;
            actionArea.innerHTML = '<div class="badge success" style="padding:6px 12px; font-size:0.7rem;">IDENTITY ANCHORED</div>';
        }
    },

    async verifyKYC() {
        try {
            Toast.info('Initiating DID Generation...');
            const result = await API.verifyKYC();
            Toast.success('Decentralized Identity Verified.');
            this.renderKYC({ status: 'verified', did: result.did });
        } catch (err) { Toast.error('Verification Failed: ' + err.message); }
    },

    async loadBeneficiaries() {
        try {
            const res = await API.getBeneficiaries();
            this.beneficiaries = res.beneficiaries || [];
            this.renderBeneficiaries();
            this.renderBeneficiaryQuickPicks();
        } catch (err) { /* ignore */ }
    },

    renderBeneficiaries() {
        const list = document.getElementById('beneficiary-list');
        if (!list) return;
        if (this.beneficiaries.length === 0) {
            list.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;">No saved beneficiaries yet.</span>';
            return;
        }
        list.innerHTML = this.beneficiaries.map(b => `
            <div style="background:var(--bg-card); border:1px solid var(--glass-border); border-radius:var(--radius-md); padding:12px 16px; display:flex; align-items:center; gap:12px; min-width:220px;">
                <div style="width:32px;height:32px;border-radius:50%;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--accent-primary);font-size:0.8rem;">${b.name.charAt(0).toUpperCase()}</div>
                <div style="flex:1;">
                    <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${b.nickname || b.name}</div>
                    <div style="font-size:0.65rem; color:var(--text-muted); font-family:'JetBrains Mono';">${b.account_number}</div>
                </div>
                <button style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.7rem;" onclick="BankPage.removeBeneficiary(${b.id})" title="Remove">✕</button>
            </div>
        `).join('');
    },

    renderBeneficiaryQuickPicks() {
        const el = document.getElementById('beneficiary-quick');
        if (!el || this.beneficiaries.length === 0) return;
        el.innerHTML = this.beneficiaries.slice(0,4).map(b => `
            <button type="button" style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:3px 10px;font-size:0.65rem;color:var(--accent-primary);cursor:pointer;" onclick="document.getElementById('transfer-to').value='${b.account_number}'">${b.nickname || b.name}</button>
        `).join('');
    },

    async removeBeneficiary(id) {
        try {
            await API.deleteBeneficiary(id);
            Toast.success('Beneficiary removed.');
            this.loadBeneficiaries();
        } catch (err) { Toast.error(err.message); }
    },

    updateSelects() {
        const selects = ['fund-account', 'transfer-from', 'bill-account'];
        const opts = this.accounts.filter(a => a.status === 'active').map(a =>
            `<option value="${a.id}">${a.account_type.toUpperCase()} - ${a.account_number} ($${a.balance.toFixed(2)})</option>`
        ).join('');
        selects.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = opts || '<option disabled selected>No Accounts</option>';
        });
    },

    bindEvents() {
        // Dynamic Currency Symbol & Doc Type
        document.getElementById('new-account-currency')?.addEventListener('change', (e) => {
            const opt = e.target.options[e.target.selectedIndex];
            const symbol = opt.dataset.symbol;
            document.getElementById('new-account-currency-symbol').innerText = symbol;
            
            // Auto-select document type based on currency
            const docType = document.getElementById('new-account-doc-type');
            if (opt.value === 'INR') docType.value = 'Aadhaar';
            else if (opt.value === 'USD') docType.value = 'SSN';
            else docType.value = 'Passport';
        });

        // OTP Verification Flow
        document.getElementById('btn-send-otp')?.addEventListener('click', async () => {
            const email = document.getElementById('new-account-email').value;
            if (!email || !email.includes('@')) { Toast.error('Please enter a valid email.'); return; }
            
            const btn = document.getElementById('btn-send-otp');
            btn.disabled = true; btn.textContent = 'Sending...';
            try {
                const res = await API.request('/kyc/send-otp', {
                    method: 'POST',
                    body: JSON.stringify({ email })
                });
                Toast.success(res.message);
                document.getElementById('otp-section').style.display = 'block';
                if (res.demo_code) {
                    console.log(`[KYC DEMO] OTP: ${res.demo_code}`);
                    document.getElementById('new-account-otp').value = res.demo_code;
                }
            } catch (err) { Toast.error(err.message); }
            finally { btn.textContent = 'Resend'; btn.disabled = false; }
        });

        // Open Account Modal
        document.getElementById('btn-open-account-modal')?.addEventListener('click', () => {
            document.getElementById('open-account-modal').style.display = 'flex';
        });

        document.getElementById('btn-submit-account')?.addEventListener('click', async () => {
            const data = {
                account_type: document.getElementById('new-account-type').value,
                holder_name: document.getElementById('new-account-holder').value.trim(),
                initial_deposit: parseFloat(document.getElementById('new-account-deposit').value),
                currency: document.getElementById('new-account-currency').value,
                otp: document.getElementById('new-account-otp').value,
                kyc_document_type: document.getElementById('new-account-doc-type').value,
                kyc_document_id: document.getElementById('new-account-doc-id').value.trim()
            };

            if (!data.account_type) return Toast.error('Select account type.');
            if (data.holder_name.length < 2) return Toast.error('Enter valid holder name.');
            if (isNaN(data.initial_deposit) || data.initial_deposit < 100) return Toast.error('Min deposit 100.');
            if (!data.otp) return Toast.error('Verify your email with OTP.');
            if (!data.kyc_document_id) return Toast.error('Provide identity document ID.');

            const btn = document.getElementById('btn-submit-account');
            btn.disabled = true; btn.textContent = 'Verifying KYC...';
            try {
                const res = await API.request('/bank/accounts', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                Toast.success('Account verified and created successfully!');
                if (res.blockchain_receipt) this.showReceipt(res.blockchain_receipt, null, null);
                document.getElementById('open-account-modal').style.display = 'none';
                document.getElementById('open-account-form').reset();
                document.getElementById('otp-section').style.display = 'none';
                this.loadAccounts();
                this.loadTransactions();
            } catch (err) { Toast.error(err.message); }
            finally { btn.disabled = false; btn.textContent = 'Authorize & Create'; }
        });

        document.getElementById('fund-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const accountId = document.getElementById('fund-account').value;
            const type = document.getElementById('fund-type').value;
            const amount = parseFloat(document.getElementById('fund-amount').value);
            const description = document.getElementById('fund-description')?.value || '';
            if (!accountId || isNaN(amount) || amount <= 0) return;
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Processing...';
            try {
                const payload = { account_id: accountId, amount, description };
                const res = type === 'deposit'
                    ? await API.depositFunds(payload)
                    : await API.withdrawFunds(payload);
                Toast.success(`${type === 'deposit' ? 'Deposited' : 'Withdrew'} $${amount.toFixed(2)}`);
                if (res.blockchain_receipt) this.showReceipt(res.blockchain_receipt, res.transaction, res.ai_chain_guard);
                e.target.reset();
                this.loadAccounts();
                this.loadTransactions();
            } catch (err) { Toast.error(err.message); }
            finally { btn.disabled = false; btn.textContent = 'Execute Transaction'; }
        });

        document.getElementById('transfer-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fromId = document.getElementById('transfer-from').value;
            const toNum = document.getElementById('transfer-to').value;
            const amount = parseFloat(document.getElementById('transfer-amount').value);
            if (!fromId || !toNum || isNaN(amount) || amount <= 0) return;
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Encrypting & Signing...';
            try {
                await this._executeTransfer(fromId, toNum, amount, null);
                e.target.reset();
            } catch (err) {
                // Handle MFA requirement
                if (err.responsePayload?.requires_mfa) {
                    Toast.info('MFA verification required for this transfer.');
                    this._pendingTransfer = { fromId, toNum, amount };
                    document.getElementById('mfa-modal').style.display = 'flex';
                    document.getElementById('mfa-code-input').value = '';
                    document.getElementById('mfa-code-input').focus();
                } else if (err.responsePayload?.blockchain_receipt) {
                    this.showReceipt(err.responsePayload.blockchain_receipt, err.responsePayload.transaction, { verdict: 'flagged', risk_score: err.responsePayload.risk_score, scan_passed: false });
                } else if (err.responsePayload?.xai_explanations) {
                    const p = err.responsePayload;
                    const reasonsHtml = p.xai_explanations.map(r => `<li style="display:flex;gap:8px;"><span style="color:var(--color-danger)">⚠️</span>${r}</li>`).join('');
                    document.body.insertAdjacentHTML('beforeend', `
                        <div id="xai-modal" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
                            <div class="card" style="max-width:500px;width:90%;padding:30px;border:1px solid var(--color-danger);box-shadow:0 0 40px rgba(239,68,68,0.2);">
                                <h2 style="color:var(--color-danger);margin:0 0 16px;">AI Chain Guard: Transaction Blocked</h2>
                                <div style="background:var(--bg-dark);padding:16px;border-radius:8px;margin-bottom:20px;border:1px solid var(--glass-border);">
                                    <div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:var(--text-muted);">Risk Score</span><strong style="color:var(--color-danger);">${p.risk_score}/100</strong></div>
                                    <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;font-size:0.9rem;color:var(--text-primary);">${reasonsHtml}</ul>
                                </div>
                                <p style="font-size:0.75rem;color:var(--text-muted);text-align:center;">Decision anchored to blockchain audit trail.</p>
                                <button class="btn" style="width:100%;border:1px solid var(--glass-border);margin-top:16px;background:transparent;padding:10px;" onclick="document.getElementById('xai-modal').remove()">Acknowledge</button>
                            </div>
                        </div>`);
                } else { Toast.error(err.message); }
            } finally { btn.disabled = false; btn.textContent = 'Authorize Wire'; }
        });

        // MFA Submit Handler
        document.getElementById('mfa-submit-btn')?.addEventListener('click', async () => {
            const mfaCode = document.getElementById('mfa-code-input').value;
            if (!mfaCode || mfaCode.length !== 6) { Toast.error('Enter a valid 6-digit code.'); return; }
            const pending = this._pendingTransfer;
            if (!pending) return;
            document.getElementById('mfa-modal').style.display = 'none';
            try {
                await this._executeTransfer(pending.fromId, pending.toNum, pending.amount, mfaCode);
                Toast.success('MFA verified. Transfer authorized!');
            } catch (err) { Toast.error(err.message); }
            this._pendingTransfer = null;
        });

        document.getElementById('bill-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const accountId = document.getElementById('bill-account').value;
            const category = document.getElementById('bill-category').value;
            const provider = document.getElementById('bill-provider').value;
            const amount = parseFloat(document.getElementById('bill-amount').value);
            if (!accountId || !provider || isNaN(amount) || amount <= 0) return;
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Paying...';
            try {
                const res = await API.payBill({ account_id: accountId, amount, category, provider });
                Toast.success(`${category} bill paid: $${amount.toFixed(2)}`);
                if (res.blockchain_receipt) this.showReceipt(res.blockchain_receipt, res.transaction, res.ai_chain_guard);
                e.target.reset();
                this.loadAccounts();
                this.loadTransactions();
            } catch (err) { Toast.error(err.message); }
            finally { btn.disabled = false; btn.textContent = 'Pay Bill'; }
        });

        document.getElementById('btn-add-ben')?.addEventListener('click', () => {
            const name = prompt('Beneficiary name:');
            if (!name) return;
            const acctNum = prompt('Account number:');
            if (!acctNum) return;
            const nickname = prompt('Nickname (optional):') || '';
            API.addBeneficiary({ name, account_number: acctNum, nickname })
                .then(() => { Toast.success('Beneficiary added!'); this.loadBeneficiaries(); })
                .catch(err => Toast.error(err.message));
        });
    },

    _pendingTransfer: null,

    /**
     * Execute a transfer with full cryptographic pipeline:
     * 1. Digital Signature (RSA-PSS) for non-repudiation
     * 2. End-to-End Encryption (RSA-OAEP + AES-GCM) for payload confidentiality
     * 3. MFA code (if required by server)
     */
    async _executeTransfer(fromId, toNum, amount, mfaCode) {
        const plainPayload = {
            from_account_id: fromId,
            to_account_number: toNum,
            amount: amount
        };
        if (mfaCode) plainPayload.mfa_code = mfaCode;

        let requestBody;

        if (CryptoModule.isReady()) {
            // 1. Sign the payload
            const payloadString = `${fromId}:${toNum}:${amount}`;
            const signature = await CryptoModule.signPayload(payloadString);

            // 2. Encrypt the payload with hybrid RSA+AES
            const encrypted = await CryptoModule.encryptPayload(plainPayload);

            requestBody = {
                encrypted_aes_key: encrypted.encrypted_aes_key,
                iv: encrypted.iv,
                encrypted_payload: encrypted.encrypted_payload,
                signature: signature
            };
            Toast.info('🔐 Payload encrypted (AES-256-GCM) & signed (RSA-PSS)');
        } else {
            // Fallback: send plaintext (crypto not initialized)
            requestBody = plainPayload;
        }

        const res = await API.transferFunds(requestBody);
        Toast.success('Transfer complete!');
        if (res.blockchain_receipt) this.showReceipt(res.blockchain_receipt, res.transaction, res.ai_chain_guard);
        this.loadAccounts();
        this.loadTransactions();
        return res;
    },

    /**
     * Admin SecOps: Load flagged incidents
     */
    async loadIncidents() {
        try {
            const res = await API.request('/bank/admin/incidents');
            const container = document.getElementById('secops-incidents');
            if (!container) return;
            const incidents = res.incidents || [];
            if (incidents.length === 0) {
                container.innerHTML = '<div style="padding:30px; text-align:center; color:var(--text-muted);">No active incidents. All clear.</div>';
                return;
            }
            container.innerHTML = incidents.map(t => `
                <div style="padding:14px 20px; border-bottom:1px solid rgba(255,255,255,0.03); display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <span style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${t.description || t.type}</span>
                            <span style="background:rgba(239,68,68,0.15);color:var(--color-danger);padding:2px 8px;border-radius:10px;font-size:0.6rem;font-weight:700;">FLAGGED</span>
                        </div>
                        <div style="font-size:0.65rem; color:var(--text-muted); font-family:'JetBrains Mono',monospace;">TX: ${(t.tx_hash || '').substring(0,24)}... | Risk: ${t.ai_risk_score}/100</div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-primary" style="font-size:0.65rem; padding:4px 10px;" onclick="BankPage.resolveIncident(${t.id}, 'approve')">Approve</button>
                        <button class="btn btn-outline" style="font-size:0.65rem; padding:4px 10px; border-color:var(--color-danger); color:var(--color-danger);" onclick="BankPage.resolveIncident(${t.id}, 'reject')">Reject</button>
                    </div>
                </div>
            `).join('');
        } catch (err) { console.error('SecOps load error:', err); }
    },

    async resolveIncident(txId, action) {
        try {
            await API.request('/bank/admin/resolve', {
                method: 'POST',
                body: JSON.stringify({ transaction_id: txId, action })
            });
            Toast.success(`Incident ${action}d successfully.`);
            this.loadIncidents();
        } catch (err) { Toast.error(err.message); }
    },

    async downloadStatement() {
        if (this.accounts.length === 0) { Toast.error('No accounts found.'); return; }
        const acc = this.accounts[0];
        try {
            const res = await API.getStatement(acc.id);
            const csv = 'Type,Amount,Status,Hash,Date\n' + (res.transactions || []).map(t =>
                `${t.type},${t.amount},${t.status},${t.tx_hash},${t.created_at}`
            ).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `statement_${acc.account_number}.csv`; a.click();
            URL.revokeObjectURL(url);
        } catch (err) { Toast.error(err.message); }
    }
};
