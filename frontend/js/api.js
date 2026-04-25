/**
 * API Client Module
 * Handles all communication with the Flask backend.
 */
const API = {
    BASE_URL: '/api',
    token: null,

    async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                const err = new Error(data.error || `HTTP ${response.status}`);
                err.responsePayload = data;
                throw err;
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error.message);
            throw error;
        }
    },

    // Auth
    login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    register(username, password, full_name) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, full_name })
        });
    },

    googleLogin(credential) {
        return this.request('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential })
        });
    },

    // Dashboard
    getDashboardStats() {
        return this.request('/dashboard/stats');
    },

    async getSecurityReport() {
        return this.request('/security/report');
    },

    getSecurityAttribution() {
        return this.request('/security/attribution');
    },

    // Models
    getModels() {
        return this.request('/models');
    },

    getModel(id) {
        return this.request(`/models/${id}`);
    },

    createModel(data) {
        return this.request('/models', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateModel(id, data) {
        return this.request(`/models/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    getModelVersions(id) {
        return this.request(`/models/${id}/versions`);
    },

    verifyModel(id) {
        return this.request(`/models/${id}/verify`, { method: 'POST' });
    },

    deployModel(id) {
        return this.request(`/models/${id}/deploy`, { method: 'POST' });
    },

    // Datasets
    getDatasets() {
        return this.request('/datasets');
    },

    getDataset(id) {
        return this.request(`/datasets/${id}`);
    },

    createDataset(data) {
        return this.request('/datasets', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async uploadDataset(file, metadata = {}) {
        const formData = new FormData();
        formData.append('file', file);
        if (metadata.name) formData.append('name', metadata.name);
        if (metadata.description) formData.append('description', metadata.description);
        if (metadata.source) formData.append('source', metadata.source);
        if (metadata.data_type) formData.append('data_type', metadata.data_type);

        const url = `${this.BASE_URL}/datasets/upload`;
        const headers = {};
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData
        });
        const data_resp = await response.json();
        if (!response.ok) throw new Error(data_resp.error || `HTTP ${response.status}`);
        return data_resp;
    },

    // Blockchain
    getChain() {
        return this.request('/blockchain/chain');
    },

    validateChain() {
        return this.request('/blockchain/validate');
    },

    getBlockchainStats() {
        return this.request('/blockchain/stats');
    },

    // Security
    getSecurityEvents(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/security/events${query ? '?' + query : ''}`);
    },

    getSecurityStats() {
        return this.request('/security/stats');
    },

    getTrustScores() {
        return this.request('/security/trust-scores');
    },

    getBlockedIPs() {
        return this.request('/security/blocked-ips');
    },

    getHoneypotTriggers() {
        return this.request('/security/honeypot-triggers');
    },

    getSecurityAttribution() {
        return this.request('/security/attribution');
    },

    // Federated Learning
    startFederatedTraining() {
        return this.request('/federated/train', { method: 'POST' });
    },

    getFederatedStatus() {
        return this.request('/federated/status');
    },

    // Self-Healing
    getHealingStatus() {
        return this.request('/security/healing');
    },

    isolateNode(node, reason) {
        return this.request('/security/isolate', {
            method: 'POST',
            body: JSON.stringify({ node, reason })
        });
    },

    // Model Integrity (Batch 3)
    getModelStatus() {
        return this.request('/security/model/status');
    },

    verifyModelIntegrity(simulateHash) {
        return this.request('/security/model/verify', {
            method: 'POST',
            body: JSON.stringify({ simulate_hash: simulateHash })
        });
    },

    rollbackModel() {
        return this.request('/security/model/rollback', { method: 'POST' });
    },

    // KYC & SSI (Batch 3)
    getKYCStatus() {
        return this.request('/kyc/status');
    },

    verifyKYC(did) {
        return this.request('/kyc/verify', {
            method: 'POST',
            body: JSON.stringify({ did })
        });
    },

    // Bank
    getBankAccounts() {
        return this.request('/bank/accounts');
    },

    createBankAccount(data) {
        return this.request('/bank/account', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    depositFunds(data) {
        return this.request('/bank/deposit', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    withdrawFunds(data) {
        return this.request('/bank/withdraw', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    transferFunds(data) {
        return this.request('/bank/transfer', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getBankTransactions() {
        return this.request('/bank/transactions');
    },

    payBill(data) {
        return this.request('/bank/pay-bill', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getStatement(accountId) {
        return this.request(`/bank/statement/${accountId}`);
    },

    getBeneficiaries() {
        return this.request('/bank/beneficiaries');
    },

    addBeneficiary(data) {
        return this.request('/bank/beneficiaries', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    deleteBeneficiary(id) {
        return this.request(`/bank/beneficiaries/${id}`, {
            method: 'DELETE'
        });
    },

    freezeAccount(data) {
        return this.request('/bank/freeze', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getBankAnalytics() {
        return this.request('/bank/analytics');
    },

    // Users
    getUsers() {
        return this.request('/users');
    },

    // Smart Contracts
    getContractEvents() {
        return this.request('/contracts/events');
    }
};
