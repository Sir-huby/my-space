/**
 * 邀请码验证系统
 * 所有页面引入此脚本即可自动启用验证
 * 验证通过后记录在 localStorage，24小时内免重复验证
 */
(function () {
    const VALID_CODES = ['MYSPACE2026', 'HELLO', 'STAR', 'VIP666', 'LETMEIN'];
    const STORAGE_KEY = 'myspace_auth';
    const EXPIRE_HOURS = 24;

    function isAuthenticated() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!data) return false;
            if (Date.now() - data.time > EXPIRE_HOURS * 3600 * 1000) {
                localStorage.removeItem(STORAGE_KEY);
                return false;
            }
            return true;
        } catch { return false; }
    }

    function authenticate(code) {
        if (VALID_CODES.includes(code.trim().toUpperCase())) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ time: Date.now() }));
            return true;
        }
        return false;
    }

    if (isAuthenticated()) return;

    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = `
        <style>
            #auth-overlay {
                position: fixed;
                inset: 0;
                z-index: 99999;
                background: #08080f;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
            }
            #auth-overlay .auth-bg {
                position: absolute;
                inset: 0;
                background-image:
                    linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
                background-size: 60px 60px;
            }
            #auth-overlay .auth-glow {
                position: absolute;
                width: 400px; height: 400px;
                border-radius: 50%;
                filter: blur(100px);
                pointer-events: none;
            }
            #auth-overlay .g1 {
                background: rgba(99,102,241,0.1);
                top: 20%; left: 30%;
                animation: adrift 15s ease-in-out infinite;
            }
            #auth-overlay .g2 {
                background: rgba(236,72,153,0.07);
                bottom: 20%; right: 25%;
                animation: adrift 20s ease-in-out infinite reverse;
            }
            @keyframes adrift { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,30px)} }
            #auth-overlay .auth-card {
                position: relative;
                z-index: 1;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 24px;
                padding: 48px 40px;
                text-align: center;
                max-width: 420px;
                width: 90%;
                backdrop-filter: blur(20px);
            }
            #auth-overlay .lock-icon {
                font-size: 3rem;
                margin-bottom: 16px;
                display: block;
            }
            #auth-overlay h2 {
                color: #e2e8f0;
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 8px;
            }
            #auth-overlay .sub {
                color: #64748b;
                font-size: 0.9rem;
                margin-bottom: 32px;
            }
            #auth-overlay .input-wrap {
                position: relative;
                margin-bottom: 20px;
            }
            #auth-overlay input {
                width: 100%;
                padding: 16px 20px;
                border-radius: 14px;
                border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.04);
                color: #e2e8f0;
                font-size: 1.1rem;
                text-align: center;
                letter-spacing: 4px;
                outline: none;
                font-family: 'Cascadia Code', 'Consolas', monospace;
                transition: border-color 0.3s;
            }
            #auth-overlay input:focus {
                border-color: rgba(99,102,241,0.5);
                box-shadow: 0 0 20px rgba(99,102,241,0.1);
            }
            #auth-overlay input::placeholder {
                letter-spacing: 1px;
                color: #475569;
                font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
            }
            #auth-overlay .auth-btn {
                width: 100%;
                padding: 14px;
                border-radius: 14px;
                border: none;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: #fff;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                font-family: inherit;
            }
            #auth-overlay .auth-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 30px rgba(99,102,241,0.3);
            }
            #auth-overlay .error-msg {
                color: #f43f5e;
                font-size: 0.85rem;
                margin-top: 16px;
                min-height: 20px;
                transition: opacity 0.3s;
            }
            #auth-overlay .shake {
                animation: shake 0.5s ease;
            }
            @keyframes shake {
                0%,100% { transform: translateX(0); }
                20% { transform: translateX(-10px); }
                40% { transform: translateX(10px); }
                60% { transform: translateX(-6px); }
                80% { transform: translateX(6px); }
            }
        </style>
        <div class="auth-bg"></div>
        <div class="auth-glow g1"></div>
        <div class="auth-glow g2"></div>
        <div class="auth-card">
            <span class="lock-icon">🔐</span>
            <h2>需要邀请码</h2>
            <p class="sub">此站点需要邀请码才能访问</p>
            <div class="input-wrap">
                <input type="text" id="auth-code-input" placeholder="请输入邀请码" autocomplete="off" spellcheck="false">
            </div>
            <button class="auth-btn" id="auth-submit-btn">验 证</button>
            <div class="error-msg" id="auth-error"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById('auth-code-input');
    const btn = document.getElementById('auth-submit-btn');
    const error = document.getElementById('auth-error');
    const card = overlay.querySelector('.auth-card');

    function tryAuth() {
        const code = input.value;
        if (!code.trim()) {
            error.textContent = '请输入邀请码';
            return;
        }
        if (authenticate(code)) {
            overlay.style.transition = 'opacity 0.5s';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 500);
        } else {
            error.textContent = '邀请码无效，请重试';
            card.classList.remove('shake');
            void card.offsetWidth;
            card.classList.add('shake');
            input.value = '';
            input.focus();
        }
    }

    btn.addEventListener('click', tryAuth);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryAuth(); });
    setTimeout(() => input.focus(), 100);
})();
