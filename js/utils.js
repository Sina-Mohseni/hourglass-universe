/* =============================================
   UTILITIES
   ============================================= */

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'sand-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (5 + Math.random() * 10) + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(particle);
    }
}

function restoreActiveSection(pageType) {
    const section = activeSections[pageType];
    if (section) {
        const pageSelector = pageType === 'universe' ? '#universePage' :
                            pageType === 'era' ? '#eraPage' : '#detailPage';
        setActiveButton(pageSelector, section);
    }
}

function setActiveButton(pageSelector, section) {
    const container = document.querySelector(`${pageSelector} .sub-menus-container`);
    const buttons = document.querySelectorAll(`${pageSelector} .sub-menu-btn`);

    let activeIndex = 0;
    buttons.forEach((btn, index) => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-section') === section) {
            btn.classList.add('active');
            activeIndex = index + 1;
        }
    });

    // Update the sliding indicator position
    if (container) {
        container.setAttribute('data-active', activeIndex);
    }
}
