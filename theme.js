/**
 * Shared theme utilities for EP JSON pages.
 */
(function initTheme() {
    function getCurrentTheme() {
        return document.body.className.includes('theme-light') ? 'light' : 'dark';
    }

    function setTheme(theme) {
        document.body.className = `theme-${theme}`;
        localStorage.setItem('ep-json-theme', theme);
        const icon = document.querySelector('.theme-icon');
        if (icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('ep-json-theme') || 'dark';
        setTheme(savedTheme);
    }

    window.EPTheme = {
        init: function init() {
            loadTheme();
            const toggle = document.getElementById('theme-toggle');
            if (!toggle) return;
            toggle.addEventListener('click', function onToggleTheme() {
                const next = getCurrentTheme() === 'light' ? 'dark' : 'light';
                setTheme(next);
            });
        },
    };
})();
