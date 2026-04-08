/**
 * Local JWT decoder for EP JSON.
 */
(function initJwtDecoder() {
    function normalizeToken(raw) {
        return raw.trim().replace(/^Bearer\s+/i, '');
    }

    function base64UrlToUtf8(input) {
        const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    }

    function formatJson(value) {
        return JSON.stringify(value, null, 2);
    }

    function setStatus(message, isError) {
        const status = document.getElementById('jwt-status');
        status.textContent = message;
        status.style.display = message ? 'block' : 'none';
        status.className = isError ? 'status status-error' : 'status status-success';
    }

    function clearOutput() {
        document.getElementById('jwt-header-output').textContent = '{}';
        document.getElementById('jwt-payload-output').textContent = '{}';
        document.getElementById('jwt-signature-output').textContent = '';
        setStatus('', false);
    }

    function decodeToken() {
        const raw = document.getElementById('jwt-input').value;
        const token = normalizeToken(raw);

        if (!token) {
            clearOutput();
            return;
        }

        const parts = token.split('.');
        if (parts.length !== 3 || !parts[0] || !parts[1]) {
            clearOutput();
            setStatus('Token must be a valid JWT with three dot-separated parts.', true);
            return;
        }

        try {
            const headerText = base64UrlToUtf8(parts[0]);
            const payloadText = base64UrlToUtf8(parts[1]);
            const header = JSON.parse(headerText);
            const payload = JSON.parse(payloadText);

            document.getElementById('jwt-header-output').textContent = formatJson(header);
            document.getElementById('jwt-payload-output').textContent = formatJson(payload);
            document.getElementById('jwt-signature-output').textContent = parts[2] || '(empty signature)';
            setStatus('Decoded locally. No data left your browser.', false);
        } catch (error) {
            clearOutput();
            setStatus('Unable to decode token. Verify it is a valid JWT.', true);
        }
    }

    function init() {
        window.EPTheme.init();

        const input = document.getElementById('jwt-input');
        const decodeBtn = document.getElementById('btn-decode-jwt');
        const clearBtn = document.getElementById('btn-clear-jwt');
        let timer = null;

        decodeBtn.addEventListener('click', decodeToken);
        clearBtn.addEventListener('click', function clearJwtInput() {
            input.value = '';
            clearOutput();
        });

        input.addEventListener('input', function onInput() {
            if (timer) clearTimeout(timer);
            timer = setTimeout(decodeToken, 180);
        });

        clearOutput();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
