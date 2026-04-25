/**
 * Authentication Modal - Displayed when unauthenticated users try to perform auth-required actions
 */

export async function showAuthModal(action = 'feature') {
    // Determine action-specific messaging
    const messages = {
        like: {
            title: 'Like Your Favorite Music',
            description: 'Create a Free Audivo account to like songs and build your music library.',
            action: 'like songs',
        },
        playlist: {
            title: 'Create Playlists',
            description: 'Sign in or create a Free Audivo account to organize and save your playlists.',
            action: 'create playlists',
        },
        sync: {
            title: 'Save Your Music Progress',
            description:
                'Sign in to save your liked songs, playlists, and recent listening history across devices.',
            action: 'save your music progress',
        },
        default: {
            title: 'Unlock Audivo',
            description: 'Create a Free Audivo account to access this feature.',
            action: 'use this feature',
        },
    };

    const config = messages[action] || messages.default;

    return new Promise((resolve) => {
        // Create modal structure
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay';

        modal.innerHTML = `
            <div class="auth-modal-container">
                <button class="auth-modal-close" aria-label="Close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                <div class="auth-modal-content">
                    <!-- Icon -->
                    <div class="auth-modal-icon">
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>

                    <!-- Title -->
                    <h2 class="auth-modal-title">${config.title}</h2>

                    <!-- Description -->
                    <p class="auth-modal-description">${config.description}</p>

                    <!-- Action Buttons -->
                    <div class="auth-modal-actions">
                        <button class="auth-modal-btn auth-modal-btn-primary" id="auth-modal-signup">
                            <span>Create Free Account</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </button>
                        <button class="auth-modal-btn auth-modal-btn-secondary" id="auth-modal-login">
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        if (!document.getElementById('auth-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'auth-modal-styles';
            styles.textContent = getAuthModalStyles();
            document.head.appendChild(styles);
        }

        // Handle close
        const closeModal = () => {
            modal.classList.remove('auth-modal-show');
            document.body.style.overflow = '';
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.auth-modal-close').addEventListener('click', () => {
            closeModal();
            resolve(null);
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
                resolve(null);
            }
        });

        // Handle signup
        modal.querySelector('#auth-modal-signup').addEventListener('click', () => {
            closeModal();
            // Navigate to account page
            if (window.navigate) {
                window.navigate('/account');
            } else {
                window.location.href = '/account';
            }
            resolve('signup');
        });

        // Handle login
        modal.querySelector('#auth-modal-login').addEventListener('click', () => {
            closeModal();
            if (window.navigate) {
                window.navigate('/account');
            } else {
                window.location.href = '/account';
            }
            resolve('login');
        });

        // Append and animate
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Trigger animation
        requestAnimationFrame(() => {
            modal.classList.add('auth-modal-show');
        });
    });
}

function getAuthModalStyles() {
    return `
        .auth-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 1rem;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .auth-modal-overlay.auth-modal-show {
            opacity: 1;
        }

        .auth-modal-container {
            position: relative;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 2rem;
            max-width: 420px;
            width: 100%;
            box-shadow: var(--shadow-xl);
            animation: auth-modal-slide-up 0.3s ease;
            max-height: 90vh;
            overflow-y: auto;
        }

        @keyframes auth-modal-slide-up {
            from {
                transform: translateY(2rem);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .auth-modal-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            cursor: pointer;
            color: var(--muted-foreground);
            border-radius: var(--radius-md);
            transition: all 0.2s ease;
            padding: 0;
        }

        .auth-modal-close:hover {
            background: var(--muted);
            color: var(--foreground);
        }

        .auth-modal-content {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
        }

        .auth-modal-icon {
            display: flex;
            justify-content: center;
            color: var(--primary);
            animation: auth-modal-bounce 0.6s ease;
        }

        @keyframes auth-modal-bounce {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-0.5rem);
            }
        }

        .auth-modal-title {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--foreground);
            line-height: 1.3;
        }

        .auth-modal-description {
            margin: 0;
            font-size: 0.9375rem;
            color: var(--muted-foreground);
            line-height: 1.6;
        }

        .auth-modal-actions {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .auth-modal-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            border: none;
            border-radius: var(--radius-md);
            font-size: 0.9375rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: var(--font-family);
        }

        .auth-modal-btn-primary {
            background: var(--primary);
            color: var(--card);
            border: 1px solid var(--primary);
        }

        .auth-modal-btn-primary:hover {
            background: var(--primary);
            box-shadow: 0 0 20px rgba(0, 100, 200, 0.3);
            transform: translateY(-2px);
        }

        .auth-modal-btn-primary:active {
            transform: translateY(0);
        }

        .auth-modal-btn-secondary {
            background: var(--muted);
            color: var(--foreground);
            border: 1px solid var(--border);
        }

        .auth-modal-btn-secondary:hover {
            background: var(--secondary);
            border-color: var(--highlight);
        }

        .auth-modal-btn-secondary:active {
            transform: scale(0.98);
        }

        @media (max-width: 480px) {
            .auth-modal-container {
                padding: 1.5rem;
            }

            .auth-modal-title {
                font-size: 1.25rem;
            }

            .auth-modal-btn {
                padding: 0.65rem 1rem;
                font-size: 0.875rem;
            }
        }
    `;
}
