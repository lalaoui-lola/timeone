// Données de l'animation JSON
let loginAnimationData;

// Variables globales
let animation;
let isPasswordVisible = false;

// Initialisation de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimation();
    initializeForm();
    initializeAnimations();
    initializeParticles();
    initializeMobileMenu();
});

// Initialisation de l'animation Lottie
function initializeAnimation() {
    fetch('login.json')
        .then(response => response.json())
        .then(data => {
            const animationContainer = document.getElementById('login-animation');
            
            if (animationContainer && typeof lottie !== 'undefined') {
                try {
                    animation = lottie.loadAnimation({
                        container: animationContainer,
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        animationData: data
                    });

                    // Gestion des erreurs
                    animation.addEventListener('data_failed', function() {
                        console.warn('Échec du chargement de l\'animation, utilisation de l\'animation de fallback');
                        createGradientAnimation();
                    });

                    // Amélioration des performances sur mobile
                    if (window.innerWidth <= 640) {
                        animation.setSpeed(0.8);
                    }

                    // Animation d'entrée
                    setTimeout(() => {
                        animationContainer.style.opacity = '1';
                        animationContainer.style.transform = 'scale(1)';
                    }, 500);

                } catch (error) {
                    console.error('Erreur lors de l\'initialisation de l\'animation:', error);
                    createGradientAnimation();
                }
            } else {
                createGradientAnimation();
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement de l\'animation:', error);
            createGradientAnimation();
        });
}

// Animation de dégradé de couleurs moderne
function createGradientAnimation() {
    const animationContainer = document.getElementById('login-animation');
    if (animationContainer) {
        animationContainer.innerHTML = `
            <div class="gradient-animation">
                <!-- Gradient background -->
            </div>
        `;
        
        // Animation CSS pour le dégradé
        const style = document.createElement('style');
        style.textContent = `
            .gradient-animation {
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, #ff6b6b, #f06595, #845ef7);
                background-size: 200% 200%;
                animation: gradientShift 5s ease infinite;
            }
            
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialisation du formulaire
function initializeForm() {
    const form = document.getElementById('authForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.querySelector('.submit-btn');
    const togglePasswordBtn = document.getElementById('togglePassword');

    // Validation en temps réel
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('input', validateForm);
        input.addEventListener('focus', handleInputFocus);
        input.addEventListener('blur', handleInputBlur);
    });

    // Toggle mot de passe
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePassword);
    }

    // Soumission du formulaire
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Boutons sociaux
    initializeSocialButtons();
}

// Validation du formulaire
function validateForm() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('.submit-btn');
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = password.length >= 6;
    
    if (submitBtn) {
        if (isEmailValid && isPasswordValid) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.6';
        }
    }
}

// Validation email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Gestion du focus sur les inputs
function handleInputFocus(e) {
    const container = e.target.closest('.input-container');
    if (container) {
        container.classList.add('focused');
    }
}

function handleInputBlur(e) {
    const container = e.target.closest('.input-container');
    if (container && !e.target.value) {
        container.classList.remove('focused');
    }
}

// Toggle visibilité du mot de passe
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    
    if (passwordInput && toggleBtn) {
        isPasswordVisible = !isPasswordVisible;
        
        if (isPasswordVisible) {
            passwordInput.type = 'text';
            toggleBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
            `;
        } else {
            passwordInput.type = 'password';
            toggleBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            `;
        }
    }
}

// Gestion de la soumission du formulaire avec Supabase
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    // Affichage du loader
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    submitBtn.disabled = true;
    
    try {
        // Connexion avec Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        console.log('User authenticated:', authData.user.id);

        // Récupérer le profil utilisateur pour obtenir le rôle
        const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', authData.user.id);

        console.log('Profile query result:', profiles, profileError);

        if (profileError) {
            console.error('Profile error:', profileError);
            throw new Error('Erreur lors de la récupération du profil: ' + profileError.message);
        }

        if (!profiles || profiles.length === 0) {
            throw new Error('Aucun profil trouvé pour cet utilisateur. Veuillez contacter l\'administrateur.');
        }

        const profile = profiles[0];

        // Message de succès
        showNotification('Connexion réussie!', 'success');
        
        // Animation de succès
        submitBtn.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
        
        // Redirection selon le rôle
        setTimeout(() => {
            switch (profile.role) {
                case 'admin':
                    window.location.href = 'admin-dashboard.html';
                    break;
                case 'agent':
                    window.location.href = 'agent-dashboard.html';
                    break;
                case 'conseiller':
                    window.location.href = 'conseiller-dashboard.html';
                    break;
                default:
                    showNotification('Rôle non reconnu: ' + profile.role, 'error');
            }
        }, 1000);
        
    } catch (error) {
        // Reset du bouton
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
        
        // Message d'erreur détaillé
        console.error('Login error:', error);
        showNotification('Erreur: ' + error.message, 'error');
    }
}

// Initialisation des boutons sociaux
function initializeSocialButtons() {
    const socialBtns = document.querySelectorAll('.social-btn');
    
    socialBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const provider = this.classList.contains('google-btn') ? 'Google' : 'GitHub';
            
            // Animation de clic
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Simulation de connexion sociale
            showNotification(`Connexion avec ${provider} en cours...`, 'info');
            
            setTimeout(() => {
                showNotification(`Connexion ${provider} réussie!`, 'success');
            }, 1500);
        });
    });
}

// Système de notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styles pour la notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Suppression automatique
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialisation des animations d'entrée
function initializeAnimations() {
    // Animation au scroll (si nécessaire)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observer les éléments animés
    document.querySelectorAll('.form-group, .submit-btn, .social-btn').forEach(el => {
        observer.observe(el);
    });
}

// Effet de particules en arrière-plan
function initializeParticles() {
    const particleCount = 50;
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    particlesContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    `;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: rgba(247, 199, 187, 0.3);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float-particle ${Math.random() * 20 + 10}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        particlesContainer.appendChild(particle);
    }
    
    document.body.appendChild(particlesContainer);
    
    // Ajout de l'animation CSS
    if (!document.querySelector('#particle-styles')) {
        const style = document.createElement('style');
        style.id = 'particle-styles';
        style.textContent = `
            @keyframes float-particle {
                0% {
                    transform: translateY(100vh) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Gestion responsive pour mobile
function initializeMobileMenu() {
    function handleResize() {
        const width = window.innerWidth;
        
        // Ajustement de l'animation selon la taille d'écran
        if (animation && width <= 640) {
            animation.setSpeed(0.8);
        } else if (animation) {
            animation.setSpeed(1);
        }
        
        // Ajustement des éléments flottants
        const floatingCircles = document.querySelectorAll('.floating-circle');
        if (width <= 640) {
            floatingCircles.forEach(circle => circle.style.display = 'none');
        } else {
            floatingCircles.forEach(circle => circle.style.display = 'block');
        }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Exécution initiale
}

// Fonctions utilitaires pour les effets sonores (optionnel)
function playSound(type) {
    // Fonction pour jouer des sons d'interface si nécessaire
    // Implémentation optionnelle selon les besoins
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
});

// Optimisation des performances
function optimizePerformance() {
    // Throttle pour les événements de scroll/resize
    let ticking = false;
    
    function updateAnimations() {
        // Mettre à jour les animations ici si nécessaire
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateAnimations);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
    window.addEventListener('resize', requestTick);
}

// Initialisation des optimisations
document.addEventListener('DOMContentLoaded', function() {
    optimizePerformance();
});

// Export pour utilisation globale si nécessaire
window.AuthPage = {
    showNotification,
    togglePassword,
    validateEmail
};
