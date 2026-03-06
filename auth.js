/**
 * 邀请码验证系统（Firebase 版）
 * 功能：远程验证邀请码 / 管理员可踢人 / 会话持久化
 */
(function () {
    const STORAGE_KEY = 'myspace_session';
    const DB_BASE = typeof firebaseConfig !== 'undefined' && firebaseConfig.databaseURL
        ? firebaseConfig.databaseURL : null;

    if (!DB_BASE) {
        console.warn('[Auth] Firebase 未配置，跳过验证');
        return;
    }

    function getSession() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
        catch { return null; }
    }

    function saveSession(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function clearSession() {
        localStorage.removeItem(STORAGE_KEY);
    }

    async function fbGet(path) {
        const r = await fetch(`${DB_BASE}/${path}.json`);
        return r.json();
    }

    async function fbSet(path, data) {
        await fetch(`${DB_BASE}/${path}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    async function checkSession() {
        const session = getSession();
        if (!session || !session.id) return false;
        const remote = await fbGet(`sessions/${session.id}`);
        if (!remote || remote.revoked) {
            clearSession();
            return false;
        }
        return true;
    }

    async function tryAuth(code) {
        const upperCode = code.trim().toUpperCase();
        const codes = await fbGet('codes');
        if (!codes) return { ok: false, msg: '系统未初始化，请联系管理员' };

        const codeData = codes[upperCode];
        if (!codeData) return { ok: false, msg: '邀请码无效' };
        if (!codeData.active) return { ok: false, msg: '此邀请码已被停用' };
        if (codeData.maxUses && codeData.usedCount >= codeData.maxUses) {
            return { ok: false, msg: '此邀请码已达使用上限' };
        }

        const sessionId = 'S' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const sessionData = {
            code: upperCode,
            time: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 100),
            revoked: false
        };

        await fbSet(`sessions/${sessionId}`, sessionData);

        const newUsedCount = (codeData.usedCount || 0) + 1;
        await fbSet(`codes/${upperCode}/usedCount`, newUsedCount);
        await fbSet(`codes/${upperCode}/lastUsed`, new Date().toISOString());

        saveSession({ id: sessionId, code: upperCode, time: Date.now() });
        return { ok: true };
    }

    function showOverlay() {
        document.body.style.overflow = 'hidden';
        const overlay = document.createElement('div');
        overlay.id = 'auth-overlay';
        overlay.innerHTML = `
            <style>
                #auth-overlay {
                    position: fixed; inset: 0; z-index: 99999;
                    background: #08080f;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
                }
                #auth-overlay .auth-bg {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
                    background-size: 60px 60px;
                }
                #auth-overlay .auth-glow {
                    position: absolute; width: 400px; height: 400px;
                    border-radius: 50%; filter: blur(100px); pointer-events: none;
                }
                #auth-overlay .g1 { background: rgba(99,102,241,0.1); top: 20%; left: 30%; animation: adrift 15s ease-in-out infinite; }
                #auth-overlay .g2 { background: rgba(236,72,153,0.07); bottom: 20%; right: 25%; animation: adrift 20s ease-in-out infinite reverse; }
                @keyframes adrift { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,30px)} }
                #auth-overlay .auth-card {
                    position: relative; z-index: 1;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 24px; padding: 48px 40px;
                    text-align: center; max-width: 420px; width: 90%;
                    backdrop-filter: blur(20px);
                }
                #auth-overlay .lock-icon { font-size: 3rem; margin-bottom: 16px; display: block; }
                #auth-overlay h2 { color: #e2e8f0; font-size: 1.5rem; font-weight: 600; margin-bottom: 8px; }
                #auth-overlay .sub { color: #64748b; font-size: 0.9rem; margin-bottom: 32px; }
                #auth-overlay input {
                    width: 100%; padding: 16px 20px; border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.04); color: #e2e8f0;
                    font-size: 1.1rem; text-align: center; letter-spacing: 4px;
                    outline: none; font-family: 'Cascadia Code', 'Consolas', monospace;
                    transition: border-color 0.3s; margin-bottom: 20px;
                }
                #auth-overlay input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 20px rgba(99,102,241,0.1); }
                #auth-overlay input::placeholder { letter-spacing: 1px; color: #475569; font-family: 'Segoe UI','Microsoft YaHei',sans-serif; }
                #auth-overlay .auth-btn {
                    width: 100%; padding: 14px; border-radius: 14px; border: none;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: #fff; font-size: 1rem; font-weight: 600;
                    cursor: pointer; transition: all 0.3s; font-family: inherit;
                }
                #auth-overlay .auth-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.3); }
                #auth-overlay .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
                #auth-overlay .error-msg { color: #f43f5e; font-size: 0.85rem; margin-top: 16px; min-height: 20px; }
                #auth-overlay .shake { animation: shake 0.5s ease; }
                @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
            </style>
            <div class="auth-bg"></div>
            <div class="auth-glow g1"></div>
            <div class="auth-glow g2"></div>
            <div class="auth-card">
                <span class="lock-icon">🔐</span>
                <h2>需要邀请码</h2>
                <p class="sub">此站点需要邀请码才能访问</p>
                <input type="text" id="auth-code-input" placeholder="请输入邀请码" autocomplete="off" spellcheck="false">
                <button class="auth-btn" id="auth-submit-btn">验 证</button>
                <div class="error-msg" id="auth-error"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = document.getElementById('auth-code-input');
        const btn = document.getElementById('auth-submit-btn');
        const error = document.getElementById('auth-error');
        const card = overlay.querySelector('.auth-card');

        async function handleAuth() {
            const code = input.value;
            if (!code.trim()) { error.textContent = '请输入邀请码'; return; }
            btn.disabled = true;
            btn.textContent = '验证中...';
            error.textContent = '';
            try {
                const result = await tryAuth(code);
                if (result.ok) {
                    overlay.style.transition = 'opacity 0.5s';
                    overlay.style.opacity = '0';
                    setTimeout(() => { overlay.remove(); document.body.style.overflow = ''; }, 500);
                } else {
                    error.textContent = result.msg;
                    card.classList.remove('shake');
                    void card.offsetWidth;
                    card.classList.add('shake');
                    input.value = '';
                    input.focus();
                }
            } catch (e) {
                error.textContent = '网络错误，请稍后重试';
            }
            btn.disabled = false;
            btn.textContent = '验 证';
        }

        btn.addEventListener('click', handleAuth);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAuth(); });
        setTimeout(() => input.focus(), 100);
    }

    async function init() {
        const valid = await checkSession();
        if (!valid) showOverlay();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
