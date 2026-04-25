/**
 * Login Page
 * Animated login screen with glassmorphism card and particle background.
 */
const LoginPage = {
    render() {
        return `
        <div class="login-screen" id="login-screen">
            <canvas id="login-particles" class="login-particles"></canvas>
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <div class="login-logo">
                            <div class="login-logo-icon">
                                <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
                                    <path d="M14 2L24 8V20L14 26L4 20V8L14 2Z" stroke="url(#lg)" stroke-width="2" fill="none"/>
                                    <path d="M14 6L20 10V18L14 22L8 18V10L14 6Z" fill="url(#lg)" opacity="0.3"/>
                                    <circle cx="14" cy="14" r="3" fill="url(#lg)"/>
                                    <defs><linearGradient id="lg" x1="4" y1="2" x2="24" y2="26">
                                        <stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#06b6d4"/>
                                    </linearGradient></defs>
                                </svg>
                            </div>
                            <div>
                                <div class="login-brand">AI Chain Guard</div>
                                <div class="login-tagline">Blockchain Security System</div>
                            </div>
                        </div>
                        <h2 class="login-title">Welcome Back</h2>
                        <p class="login-subtitle">Sign in to your secure dashboard</p>
                    </div>

                    <form id="login-form" class="login-form">
                        <div class="login-field">
                            <label class="login-label">Username</label>
                            <div class="login-input-wrap">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                </svg>
                                <input type="text" class="login-input" id="login-username" placeholder="Enter username" required>
                            </div>
                        </div>
                        <div class="login-field">
                            <label class="login-label">Password</label>
                            <div class="login-input-wrap">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                                </svg>
                                <input type="password" class="login-input" id="login-password" placeholder="Enter password" required>
                                <button type="button" class="login-eye" id="toggle-password">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <button type="submit" class="login-btn" id="login-btn">
                            <span class="login-btn-text">Sign In</span>
                            <div class="login-btn-loader" id="login-loader"></div>
                        </button>
                    </form>

                    <div class="login-footer">
                        <div class="login-divider"><span>Demo Credentials</span></div>
                        <div class="login-creds">
                            <button type="button" class="cred-chip" onclick="LoginPage.fillCred('admin','admin123')">
                                <span class="cred-role">Admin</span>
                                admin
                            </button>
                            <button type="button" class="cred-chip" onclick="LoginPage.fillCred('dr.chen','chen123')">
                                <span class="cred-role">Researcher</span>
                                dr.chen
                            </button>
                            <button type="button" class="cred-chip" onclick="LoginPage.fillCred('sarah_ml','sarah123')">
                                <span class="cred-role">Researcher</span>
                                sarah_ml
                            </button>
                        </div>
                    </div>

                    <div class="login-features">
                        <div class="login-feature">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/></svg>
                            <span>End-to-end encrypted</span>
                        </div>
                        <div class="login-feature">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                            <span>Blockchain verified</span>
                        </div>
                        <div class="login-feature">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17"/></svg>
                            <span>AI-driven protection</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    init() {
        const form = document.getElementById('login-form');
        if (!form) return;

        // Particle background
        new ParticleSystem('login-particles');

        // Toggle password visibility
        document.getElementById('toggle-password')?.addEventListener('click', () => {
            const input = document.getElementById('login-password');
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        // Form submit
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('login-btn');
            const loader = document.getElementById('login-loader');
            btn.classList.add('loading');

            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const result = await API.login(username, password);
                API.token = result.token;
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                Toast.success(`Welcome back, ${result.user.username}!`);

                // Transition out
                document.getElementById('login-screen').classList.add('login-exit');
                setTimeout(() => {
                    document.getElementById('login-screen')?.remove();
                    document.querySelector('.app').style.display = 'flex';
                    App.init();
                }, 600);
            } catch (error) {
                Toast.error('Login failed: ' + error.message);
                btn.classList.remove('loading');
            }
        });
    },

    fillCred(user, pass) {
        document.getElementById('login-username').value = user;
        document.getElementById('login-password').value = pass;
        document.getElementById('login-username').focus();
        Toast.info(`Credentials filled for ${user}`);
    }
};
