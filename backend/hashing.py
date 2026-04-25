import hashlib
import os

def hash_file(file_path, chunk_size=8192):
    """
    Generate SHA256 cryptographic hash of a file incrementally
    to support large AI models and datasets without exhausting RAM.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(chunk_size), b""):
            sha256_hash.update(byte_block)
            
    return sha256_hash.hexdigest()

def hash_model(file_path):
    """Generate SHA256 hash for an AI model file."""
    return hash_file(file_path)

def hash_dataset(file_path):
    """Generate SHA256 hash for a training dataset file."""
    return hash_file(file_path)
