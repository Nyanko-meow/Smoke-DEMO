document.addEventListener('DOMContentLoaded', function() {
    const menuToggleBtn = document.querySelector('.menu-toggle-btn');
    const mobileNav = document.getElementById('mobileNav');

    if (menuToggleBtn && mobileNav) {
        menuToggleBtn.addEventListener('click', function() {
            mobileNav.classList.toggle('opacity-0');
            mobileNav.classList.toggle('scale-95');
            mobileNav.classList.toggle('opacity-100');
            mobileNav.classList.toggle('scale-100');
            menuToggleBtn.classList.toggle('menu-active');
        });
    }

    const mobileNavLinks = document.querySelectorAll('#mobileNav .nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                mobileNav.classList.add('opacity-0', 'scale-95');
                mobileNav.classList.remove('opacity-100', 'scale-100');
                menuToggleBtn?.classList.remove('menu-active');
            }
        });
    });

    const endpointRows = document.querySelectorAll('.endpoint-row');
    endpointRows.forEach(row => {
        const toggleBtn = row.querySelector('.toggle-btn');
        const content = row.querySelector('.request-response-content');
        const icon = toggleBtn?.querySelector('svg');
        if (toggleBtn && content && icon) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = content.classList.contains('hidden');
                content.classList.toggle('hidden');
                icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0)';
            });
        }
    });

    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    function highlightCurrentSection() {
        const scrollPosition = window.scrollY;
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active-link');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active-link');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightCurrentSection);
    highlightCurrentSection();

    const methodBadges = document.querySelectorAll('.method-badge');
    methodBadges.forEach(badge => {
        const method = badge.textContent.toLowerCase();
        badge.classList.add(`method-${method}`);
    });

    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('overflow-x-auto');
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active-link'));
            this.classList.add('active-link');
            if (window.innerWidth < 768) {
                mobileNav.classList.remove('opacity-100', 'scale-100');
                mobileNav.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            }
        });
    });

    const toggleButton = document.getElementById('toggleNav');
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const isOpen = mobileNav.classList.contains('opacity-100');
            if (isOpen) {
                mobileNav.classList.remove('opacity-100', 'scale-100');
                mobileNav.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                toggleButton.classList.remove('menu-active');
            } else {
                mobileNav.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                mobileNav.classList.add('opacity-100', 'scale-100');
                toggleButton.classList.add('menu-active');
            }
        });
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function () {
            if (window.innerWidth < 768) {
                mobileNav.classList.remove('opacity-100', 'scale-100');
                mobileNav.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                toggleButton?.classList.remove('menu-active');
            }
        });
    });

    document.addEventListener('click', function (e) {
        const isClickInsideMenu = mobileNav.contains(e.target);
        const isClickOnToggle = toggleButton?.contains(e.target);
        const isMenuOpen = mobileNav.classList.contains('opacity-100');
        if (!isClickInsideMenu && !isClickOnToggle && isMenuOpen) {
            mobileNav.classList.remove('opacity-100', 'scale-100');
            mobileNav.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            toggleButton?.classList.remove('menu-active');
        }
    });

    window.addEventListener('scroll', () => {
        let current = '';
        let minDistance = Infinity;
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const distance = Math.abs(rect.top);
            if (distance < minDistance && rect.top < window.innerHeight) {
                minDistance = distance;
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active-link');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active-link');
            }
        });
    });
});
