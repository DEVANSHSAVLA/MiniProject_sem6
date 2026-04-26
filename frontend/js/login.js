/**
 * Login & Signup Page
 * Animated auth screen with glassmorphism card and particle background.
 */
const LoginPage = {
    mode: 'login', // 'login' or 'signup'
    googleInitialized: false,

    render() {
        const isLogin = this.mode === 'login';
        
        return `
        <canvas id="login-particles" class="login-particles"></canvas>
        <div class="login-container">
            <div class="login-card animate-in">
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
                    <h2 class="login-title">${isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p class="login-subtitle">${isLogin ? 'Sign in to your secure dashboard' : 'Join the decentralized security network'}</p>
                </div>

                <form id="auth-form" class="login-form">
                    ${!isLogin ? `
                    <div class="login-field">
                        <label class="login-label">Full Name</label>
                        <div class="login-input-wrap">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            <input type="text" class="login-input" id="auth-fullname" placeholder="Enter your full name" required>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="login-field">
                        <label class="login-label">Username/Email</label>
                        <div class="login-input-wrap">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            <input type="text" class="login-input" id="auth-username" placeholder="Username or email address" required>
                        </div>
                    </div>

                    <div class="login-field">
                        <label class="login-label">Password</label>
                        <div class="login-input-wrap">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                            </svg>
                            <input type="password" class="login-input" id="auth-password" placeholder="Enter password" required>
                            <button type="button" class="login-eye" id="toggle-password">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="login-btn" id="auth-btn">
                        <span class="login-btn-text">${isLogin ? 'Sign In' : 'Register Now'}</span>
                        <div class="login-btn-loader" id="auth-loader"></div>
                    </button>
                </form>

                <div class="login-divider" style="margin:20px 0 16px;"><span>or continue with</span></div>
                
                <div id="google-btn-container" style="display:flex; justify-content:center; width:100%;">
                    <!-- Google Button will be rendered here -->
                    <div id="google-signin-btn"></div>
                </div>

                <div style="text-align:center; margin-top:20px; font-size:0.85rem; color:var(--text-muted);">
                    ${isLogin ? "Don't have an account?" : "Already have an account?"}
                    <a href="#" id="toggle-auth-mode" style="color:var(--accent-primary); font-weight:600; text-decoration:none; margin-left:5px;">
                        ${isLogin ? 'Create Account' : 'Sign In'}
                    </a>
                </div>

                ${isLogin ? `
                <div class="login-footer">
                    <div class="login-divider"><span>Demo Credentials</span></div>
                    <div class="login-creds">
                        <button type="button" class="cred-chip" onclick="LoginPage.fillCred('admin','admin123')">
                            <span class="cred-role">Admin</span> admin
                        </button>
                        <button type="button" class="cred-chip" onclick="LoginPage.fillCred('dr.chen','chen123')">
                            <span class="cred-role">Researcher</span> dr.chen
                        </button>
                    </div>
                </div>
                ` : ''}

                <div class="login-features">
                    <div class="login-feature">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/></svg>
                        <span>E2EE Secure</span>
                    </div>
                    <div class="login-feature">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                        <span>Blockchain Verified</span>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    init() {
        const container = document.getElementById('login-screen');
        if (!container) return;
        
        container.innerHTML = this.render();

        // Particle background
        new ParticleSystem('login-particles');

        // Toggle auth mode
        document.getElementById('toggle-auth-mode')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.mode = this.mode === 'login' ? 'signup' : 'login';
            this.init(); // Re-render and re-init
        });

        // Toggle password visibility
        document.getElementById('toggle-password')?.addEventListener('click', () => {
            const input = document.getElementById('auth-password');
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        // Form submit
        const form = document.getElementById('auth-form');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('auth-btn');
            btn.classList.add('loading');

            const username = document.getElementById('auth-username').value;
            const password = document.getElementById('auth-password').value;

            try {
                let result;
                if (this.mode === 'login') {
                    result = await API.login(username, password);
                } else {
                    const fullName = document.getElementById('auth-fullname').value;
                    result = await API.register(username, password, fullName);
                    Toast.success('Account created successfully!');
                }
                this._completeLogin(result);
            } catch (error) {
                Toast.error((this.mode === 'login' ? 'Login' : 'Registration') + ' failed: ' + error.message);
                btn.classList.remove('loading');
            }
        });

        // Google Sign-In (OAuth2 Token Client — avoids credential_button_library 403)
        const initGoogle = () => {
            if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
                setTimeout(initGoogle, 200);
                return;
            }

            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: '90338982833-i1sg24l3hoh1tl2ot2f659ufj9d06uek.apps.googleusercontent.com',
                scope: 'email profile',
                callback: (response) => {
                    if (response.error) {
                        console.error('[AUTH] Google OAuth2 error:', response.error);
                        Toast.error('Google sign-in failed: ' + response.error);
                        return;
                    }
                    this._handleGoogleOAuth2(response.access_token);
                }
            });

            // Create custom Google button
            const btnContainer = document.getElementById("google-signin-btn");
            if (btnContainer) {
                btnContainer.innerHTML = `
                    <button type="button" id="custom-google-btn" class="login-btn" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); display:flex; align-items:center; justify-content:center; gap:10px; cursor:pointer;">
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        <span class="login-btn-text" style="font-weight:600;">${this.mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
                    </button>
                `;
                document.getElementById('custom-google-btn').addEventListener('click', () => {
                    tokenClient.requestAccessToken({ prompt: 'select_account' });
                });
            }
        };
        initGoogle();
    },

    async _handleGoogleOAuth2(access_token) {
        try {
            console.log("[AUTH] Google OAuth2 access token received, verifying with backend...");
            const result = await API.googleLogin(null, access_token);
            this._completeLogin(result);
        } catch (error) {
            console.error('[AUTH] Google OAuth2 error:', error);
            Toast.error('Google Sign-In failed');
        }
    },

    async _handleGoogleResponse(response) {
        try {
            console.log("[AUTH] Google response received, verifying with backend...");
            const result = await API.googleLogin(response.credential);
            this._completeLogin(result);
        } catch (error) {
            console.error("[AUTH] Google login backend error:", error);
            Toast.error('Google sign-in failed: ' + error.message);
        }
    },

    _completeLogin(result) {
        API.token = result.token;
        const now = Date.now();
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('login_time', now);
        Toast.success(`Welcome, ${result.user.username}!`);

        document.getElementById('login-screen').classList.add('login-exit');
        setTimeout(() => {
            document.getElementById('login-screen')?.remove();
            document.querySelector('.app').style.display = 'flex';
            App.setUser(result.user);
            App.init();
            App.startSessionTimer(15 * 60 * 1000); // 15 minutes
        }, 600);
    },

    fillCred(user, pass) {
        const userInp = document.getElementById('auth-username');
        const passInp = document.getElementById('auth-password');
        if (userInp && passInp) {
            userInp.value = user;
            passInp.value = pass;
            userInp.focus();
            Toast.info(`Credentials filled for ${user}`);
        }
    }
};
