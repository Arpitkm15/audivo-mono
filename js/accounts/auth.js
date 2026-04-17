// js/accounts/auth.js
import { auth, getSupabaseAnonKey, getSupabaseUrl, normalizeSupabaseUser, supabase } from './config.js';

export class AuthManager {
    constructor() {
        this.user = null;
        this.authListeners = [];
        this._subscription = null;
        this.init().catch(console.error);
    }

    async init() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const isOAuthRedirect = params.get('oauth') === '1';

        if (code) {
            try {
                await auth.exchangeCodeForSession(code);
            } catch (error) {
                console.warn('OAuth session handoff failed:', error.message);
            } finally {
                window.history.replaceState({}, '', window.location.pathname);
            }
        } else if (isOAuthRedirect) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            window.history.replaceState({}, '', window.location.pathname);
        }

        await this.refreshUser();

        this._subscription = supabase.auth.onAuthStateChange((_event, session) => {
            this.user = normalizeSupabaseUser(session?.user || null);
            this.updateUI(this.user);
            this.authListeners.forEach((listener) => listener(this.user));
        });
    }

    async refreshUser() {
        try {
            this.user = await auth.get();
        } catch {
            this.user = null;
        }

        this.updateUI(this.user);
        this.authListeners.forEach((listener) => listener(this.user));
    }

    onAuthStateChanged(callback) {
        this.authListeners.push(callback);
        if (this.user !== null) {
            callback(this.user);
        }
    }

    async signInWithGoogle() {
        try {
            await auth.createOAuth2Session('google', window.location.origin + '/index.html?oauth=1');
        } catch (error) {
            console.error('Login failed:', error);
            alert(`Login failed: ${error.message}`);
        }
    }

    async signInWithGitHub() {
        try {
            await auth.createOAuth2Session('github', window.location.origin + '/index.html?oauth=1');
        } catch (error) {
            console.error('Login failed:', error);
            alert(`Login failed: ${error.message}`);
        }
    }

    async signInWithSpotify() {
        try {
            await auth.createOAuth2Session('spotify', window.location.origin + '/index.html?oauth=1');
        } catch (error) {
            console.error('Login failed:', error);
            alert(`Login failed: ${error.message}`);
        }
    }

    async signInWithDiscord() {
        try {
            await auth.createOAuth2Session('discord', window.location.origin + '/index.html?oauth=1');
        } catch (error) {
            console.error('Login failed:', error);
            alert(`Login failed: ${error.message}`);
        }
    }

    async signInWithEmail(email, password) {
        try {
            this.user = await auth.createEmailPasswordSession(email, password);
            this.updateUI(this.user);
            this.authListeners.forEach((listener) => listener(this.user));
            return this.user;
        } catch (error) {
            console.error('Email Login failed:', error);
            alert(`Login failed: ${error.message}`);
            throw error;
        }
    }

    async signUpWithEmail(email, password) {
        try {
            await auth.create(email, email, password);
            try {
                // If email confirmation is disabled, this logs in immediately.
                this.user = await auth.createEmailPasswordSession(email, password);
                this.updateUI(this.user);
                this.authListeners.forEach((listener) => listener(this.user));
                return this.user;
            } catch (signInError) {
                const msg = String(signInError?.message || '').toLowerCase();
                if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
                    alert('Account created. Please verify your email, then sign in.');
                    return null;
                }
                throw signInError;
            }
        } catch (error) {
            console.error('Sign Up failed:', error);
            alert(`Sign Up failed: ${error.message}`);
            throw error;
        }
    }

    async sendPasswordReset(email) {
        try {
            const redirectUrl = new URL(window.location.origin + '/reset-password');
            redirectUrl.searchParams.set('supabaseUrl', getSupabaseUrl());
            redirectUrl.searchParams.set('supabaseAnonKey', getSupabaseAnonKey());
            await auth.createRecovery(email, redirectUrl.toString());
            alert(`Password reset email sent to ${email}`);
        } catch (error) {
            console.error('Password reset failed:', error);
            alert(`Failed to send reset email: ${error.message}`);
            throw error;
        }
    }

    async signOut() {
        try {
            await auth.deleteSession('current');
            this.user = null;
            this.updateUI(null);
            this.authListeners.forEach((listener) => listener(null));

            if (window.__AUTH_GATE__) {
                window.location.href = '/login';
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    }

    updateUI(user) {
        const connectBtn = document.getElementById('auth-connect-btn');
        const clearDataBtn = document.getElementById('auth-clear-cloud-btn');
        const statusText = document.getElementById('auth-status');
        const emailContainer = document.getElementById('email-auth-container');
        const emailToggleBtn = document.getElementById('toggle-email-auth-btn');
        const githubBtn = document.getElementById('auth-github-btn');
        const discordBtn = document.getElementById('auth-discord-btn');

        if (!connectBtn) return;

        if (window.__AUTH_GATE__) {
            connectBtn.textContent = 'Sign Out';
            connectBtn.classList.add('danger');
            connectBtn.onclick = () => this.signOut();
            if (clearDataBtn) clearDataBtn.style.display = 'none';
            if (emailContainer) emailContainer.style.display = 'none';
            if (emailToggleBtn) emailToggleBtn.style.display = 'none';
            if (githubBtn) githubBtn.style.display = 'none';
            if (discordBtn) discordBtn.style.display = 'none';
            if (statusText) statusText.textContent = user ? `Signed in as ${user.email}` : 'Signed in';

            const accountPage = document.getElementById('page-account');
            if (accountPage) {
                const title = accountPage.querySelector('.section-title');
                if (title) title.textContent = 'Account';
                accountPage.querySelectorAll('.account-content > p, .account-content > div').forEach((el) => {
                    if (el.id !== 'auth-status' && el.id !== 'auth-buttons-container') {
                        el.style.display = 'none';
                    }
                });
            }

            const customDbBtn = document.getElementById('custom-db-btn');
            if (customDbBtn) {
                const supabaseFromEnv = !!(window.__SUPABASE_URL__ && window.__SUPABASE_ANON_KEY__);
                if (supabaseFromEnv) {
                    const settingItem = customDbBtn.closest('.setting-item');
                    if (settingItem) settingItem.style.display = 'none';
                }
            }

            return;
        }

        if (user) {
            connectBtn.textContent = 'Sign Out';
            connectBtn.classList.add('danger');
            connectBtn.onclick = () => this.signOut();

            if (clearDataBtn) clearDataBtn.style.display = 'block';
            if (emailContainer) emailContainer.style.display = 'none';
            if (emailToggleBtn) emailToggleBtn.style.display = 'none';
            if (githubBtn) githubBtn.style.display = 'none';
            if (discordBtn) discordBtn.style.display = 'none';
            if (statusText) statusText.textContent = `Signed in as ${user.email}`;
        } else {
            connectBtn.textContent = 'Connect with Google';
            connectBtn.classList.remove('danger');
            connectBtn.onclick = () => this.signInWithGoogle();

            if (clearDataBtn) clearDataBtn.style.display = 'none';
            if (emailToggleBtn) emailToggleBtn.style.display = 'inline-block';
            if (githubBtn) {
                githubBtn.style.display = 'inline-block';
                githubBtn.onclick = () => this.signInWithGitHub();
            }
            if (discordBtn) {
                discordBtn.style.display = 'inline-block';
                discordBtn.onclick = () => this.signInWithDiscord();
            }
            if (statusText) statusText.textContent = 'Sync your library across devices';
        }
    }
}

export const authManager = new AuthManager();
