// ============================================================
// MAIN.JS - Scripts do dashboard CyberCore
// ============================================================

// Efeito de digitação no título (se existir)
document.addEventListener('DOMContentLoaded', () => {

    // Animação de entrada nos cards
    const cards = document.querySelectorAll('.feature-card, .guild-card, .stat-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        observer.observe(card);
    });

    // Confirma ações perigosas (ex: deletar)
    document.querySelectorAll('[data-confirm]').forEach(el => {
        el.addEventListener('click', (e) => {
            if (!confirm(el.dataset.confirm)) e.preventDefault();
        });
    });

    // Auto-hide mensagens de status
    const status = document.getElementById('save-status');
    if (status && status.textContent) {
        setTimeout(() => { status.textContent = ''; }, 3000);
    }

    // Efeito hover neon nos inputs
    document.querySelectorAll('.cyber-input').forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.style.filter = 'drop-shadow(0 0 8px rgba(0,170,255,0.3))';
        });
        input.addEventListener('blur', () => {
            input.parentElement.style.filter = '';
        });
    });
});
