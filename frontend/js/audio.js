/**
 * Cyber Acoustic Engine
 * Generates procedural sci-fi sound effects using Web Audio API.
 */
class CyberAudio {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.4; // 40% master volume
        this.masterGain.connect(this.ctx.destination);
    }

    _playTone(freq, type, duration, vol) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // High-pitched quick holographic click
    playClick() {
        this._playTone(1200, 'sine', 0.1, 0.2); // First tick
        setTimeout(() => this._playTone(1800, 'sine', 0.05, 0.1), 50); // Echo tick
    }

    // Matrix-style decryption character swap sound
    playDecryptTick() {
        this._playTone(Math.random() * 400 + 400, 'square', 0.03, 0.05);
    }

    // Deep drone/alarm for attack simulation
    playAlarm() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this._playTone(200, 'sawtooth', 0.5, 0.4);
                this._playTone(210, 'sawtooth', 0.5, 0.3); // Dissonance
            }, i * 600);
        }
    }
}

// Global Singleton
const AudioSys = new CyberAudio();

// Auto-bind clicks to any buttons/links in the interface
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('button, a, .block-node, .nav-item');
        if (target && !target.classList.contains('simulate-attack')) {
            AudioSys.playClick();
        }
    });
});
