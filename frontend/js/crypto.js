/**
 * Frontend Cryptography Module — AI Chain Guard
 * Uses the Web Crypto API for:
 *   1. RSA-OAEP key generation for E2EE (encrypting AES session keys)
 *   2. RSA-PSS key generation for Digital Signatures (non-repudiation)
 *   3. AES-GCM symmetric encryption for payload encryption
 */

const CryptoModule = {
    signingKeyPair: null,   // RSA-PSS for Digital Signatures
    serverPublicKey: null,  // Server's RSA-OAEP public key (for E2EE)

    /**
     * Initialize: Generate client signing keypair & fetch server's E2EE public key.
     */
    async init() {
        try {
            // 1. Generate client RSA-PSS keypair for Digital Signatures
            this.signingKeyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'RSA-PSS',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256',
                },
                true,  // extractable (so we can export the public key)
                ['sign', 'verify']
            );

            // 2. Export the public key as PEM and register it with the backend
            const pubKeyDer = await window.crypto.subtle.exportKey('spki', this.signingKeyPair.publicKey);
            const pubKeyPem = this._arrayBufferToPem(pubKeyDer, 'PUBLIC KEY');
            
            await API.request('/bank/register-key', {
                method: 'POST',
                body: JSON.stringify({ public_key: pubKeyPem })
            });

            // 3. Fetch server's RSA public key for E2EE
            const res = await API.request('/bank/public-key');
            if (res.public_key) {
                const pemBody = res.public_key
                    .replace('-----BEGIN PUBLIC KEY-----', '')
                    .replace('-----END PUBLIC KEY-----', '')
                    .replace(/\s/g, '');
                const binaryDer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
                
                this.serverPublicKey = await window.crypto.subtle.importKey(
                    'spki',
                    binaryDer.buffer,
                    { name: 'RSA-OAEP', hash: 'SHA-256' },
                    false,
                    ['encrypt']
                );
            }

            console.log('🔐 CryptoModule initialized: RSA-PSS (Signing) + RSA-OAEP (E2EE) ready');
            return true;
        } catch (err) {
            console.error('CryptoModule init error:', err);
            return false;
        }
    },

    /**
     * Sign a transfer payload string using the client's RSA-PSS private key.
     * @param {string} payloadString - e.g. "accountId:recipientAccNum:amount"
     * @returns {string} Base64-encoded signature
     */
    async signPayload(payloadString) {
        if (!this.signingKeyPair) throw new Error('Signing keys not initialized');
        
        const encoder = new TextEncoder();
        const data = encoder.encode(payloadString);
        
        const signature = await window.crypto.subtle.sign(
            { name: 'RSA-PSS', saltLength: 32 },
            this.signingKeyPair.privateKey,
            data
        );
        
        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    },

    /**
     * Encrypt a JSON payload using Hybrid RSA+AES for E2EE.
     * @param {Object} payload - The JSON object to encrypt
     * @returns {Object} { encrypted_aes_key, iv, encrypted_payload } all Base64
     */
    async encryptPayload(payload) {
        if (!this.serverPublicKey) throw new Error('Server public key not available');

        // 1. Generate random 256-bit AES key
        const aesKey = await window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt']
        );

        // 2. Generate random IV (12 bytes for AES-GCM)
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // 3. Encrypt payload with AES-GCM
        const encoder = new TextEncoder();
        const plaintext = encoder.encode(JSON.stringify(payload));
        const ciphertext = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            aesKey,
            plaintext
        );

        // 4. Export AES key as raw bytes
        const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

        // 5. Encrypt AES key with Server's RSA-OAEP public key
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            this.serverPublicKey,
            rawAesKey
        );

        return {
            encrypted_aes_key: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey))),
            iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
            encrypted_payload: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
        };
    },

    /**
     * Convert ArrayBuffer to PEM string.
     */
    _arrayBufferToPem(buffer, label) {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const lines = base64.match(/.{1,64}/g).join('\n');
        return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
    },

    /**
     * Check if crypto module is ready.
     */
    isReady() {
        return !!(this.signingKeyPair && this.serverPublicKey);
    }
};
