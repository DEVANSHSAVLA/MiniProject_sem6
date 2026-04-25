import base64
import json
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidSignature

class CryptoManager:
    def __init__(self):
        # Generate Server RSA Keypair for E2EE on startup
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        self.public_key = self.private_key.public_key()
        
    def get_server_public_key_pem(self):
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

    def decrypt_e2ee_payload(self, encrypted_aes_key_b64, iv_b64, ciphertext_b64):
        """Decrypts a hybrid RSA+AES payload from the frontend."""
        try:
            # 1. Decrypt AES Key using Server's RSA Private Key
            encrypted_aes_key = base64.b64decode(encrypted_aes_key_b64)
            aes_key = self.private_key.decrypt(
                encrypted_aes_key,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )

            # 2. Decrypt Payload using AES-GCM
            iv = base64.b64decode(iv_b64)
            ciphertext = base64.b64decode(ciphertext_b64)
            aesgcm = AESGCM(aes_key)
            plaintext = aesgcm.decrypt(iv, ciphertext, None)
            
            return json.loads(plaintext.decode('utf-8'))
        except Exception as e:
            print(f"E2EE Decryption Error: {e}")
            return None

    def verify_signature(self, public_key_pem, payload_string, signature_b64):
        """Verifies a client's RSA signature on a transaction payload."""
        try:
            public_key = serialization.load_pem_public_key(public_key_pem.encode('utf-8'))
            signature = base64.b64decode(signature_b64)
            
            public_key.verify(
                signature,
                payload_string.encode('utf-8'),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except InvalidSignature:
            return False
        except Exception as e:
            print(f"Signature Verification Error: {e}")
            return False

# Global Singleton
crypto_manager = CryptoManager()
