(function () {
  'use strict';

  // ── Styles ────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = `
    #cai-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9000;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #7fa8be;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(127,168,190,.45);
      transition: transform .2s, box-shadow .2s;
    }
    #cai-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(127,168,190,.55);
    }
    #cai-bubble span { font-size: 26px; line-height: 1; }

    #cai-panel {
      position: fixed;
      bottom: 92px;
      right: 24px;
      z-index: 9000;
      width: 370px;
      max-width: calc(100vw - 32px);
      height: 520px;
      max-height: calc(100vh - 110px);
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 12px 48px rgba(42,61,74,.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.9) translateY(12px);
      transform-origin: bottom right;
      opacity: 0;
      pointer-events: none;
      transition: transform .22s cubic-bezier(.34,1.56,.64,1), opacity .18s ease;
    }
    #cai-panel.cai-open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .cai-header {
      background: #7fa8be;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .cai-header-icon {
      width: 34px;
      height: 34px;
      background: rgba(255,255,255,.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cai-header-icon svg { width: 18px; height: 18px; }
    .cai-header-text { flex: 1; min-width: 0; }
    .cai-header-name {
      font-family: 'Lora', Georgia, serif;
      font-size: .95rem;
      font-weight: 600;
      color: #fff;
      line-height: 1.2;
    }
    .cai-header-sub {
      font-family: 'Nunito', sans-serif;
      font-size: .72rem;
      color: rgba(255,255,255,.75);
      line-height: 1.3;
    }
    .cai-close {
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,.8);
      padding: 4px;
      line-height: 1;
      font-size: 1.2rem;
      transition: color .15s;
      flex-shrink: 0;
    }
    .cai-close:hover { color: #fff; }

    .cai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }
    .cai-messages::-webkit-scrollbar { width: 4px; }
    .cai-messages::-webkit-scrollbar-track { background: transparent; }
    .cai-messages::-webkit-scrollbar-thumb { background: #c8dce6; border-radius: 2px; }

    .cai-msg {
      max-width: 84%;
      font-family: 'Nunito', sans-serif;
      font-size: .88rem;
      line-height: 1.55;
      padding: 9px 13px;
      border-radius: 14px;
      word-wrap: break-word;
    }
    .cai-msg-ai {
      background: #eaf3f7;
      color: #2a3d4a;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
    }
    .cai-msg-user {
      background: #7fa8be;
      color: #fff;
      border-bottom-right-radius: 4px;
      align-self: flex-end;
    }

    .cai-typing {
      align-self: flex-start;
      background: #eaf3f7;
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      padding: 10px 14px;
      display: flex;
      gap: 5px;
      align-items: center;
    }
    .cai-typing span {
      width: 7px;
      height: 7px;
      background: #7fa8be;
      border-radius: 50%;
      animation: cai-bounce .9s infinite;
    }
    .cai-typing span:nth-child(2) { animation-delay: .15s; }
    .cai-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes cai-bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: .5; }
      30% { transform: translateY(-5px); opacity: 1; }
    }

    .cai-input-row {
      border-top: 1px solid #eaf3f7;
      padding: 10px 12px;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-shrink: 0;
      background: #fff;
    }
    .cai-input {
      flex: 1;
      border: 1.5px solid #c8dce6;
      border-radius: 50px;
      padding: 9px 14px;
      font-family: 'Nunito', sans-serif;
      font-size: 16px;
      color: #2a3d4a;
      outline: none;
      background: #f7fbfd;
      transition: border-color .15s;
    }
    .cai-input:focus { border-color: #7fa8be; background: #fff; }
    .cai-input::placeholder { color: #a0b8c5; }
    .cai-send {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #7fa8be;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background .15s, transform .15s;
    }
    .cai-send:hover { background: #6998ae; transform: scale(1.05); }
    .cai-send:disabled { background: #c8dce6; cursor: not-allowed; transform: none; }
    .cai-send svg { width: 16px; height: 16px; }

    .cai-powered {
      text-align: center;
      font-family: 'Nunito', sans-serif;
      font-size: .68rem;
      color: #a0b8c5;
      padding: 0 0 8px;
    }

    @media (max-width: 440px) {
      #cai-panel {
        right: 0;
        bottom: 80px;
        width: 100vw;
        max-width: 100vw;
        border-radius: 18px 18px 0 0;
      }
      #cai-bubble { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ── HTML ──────────────────────────────────────────────────────────────────
  var bubble = document.createElement('button');
  bubble.id = 'cai-bubble';
  bubble.setAttribute('aria-label', 'Open Cloud AI chat');
  bubble.innerHTML = `<span aria-hidden="true">☁️</span>`;

  var panel = document.createElement('div');
  panel.id = 'cai-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Cloud AI chat');
  panel.innerHTML = `
    <div class="cai-header">
      <div class="cai-header-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6Z" fill="white"/>
          <circle cx="19" cy="4" r="1.2" fill="rgba(255,255,255,0.7)"/>
          <circle cx="5" cy="18" r="0.9" fill="rgba(255,255,255,0.5)"/>
        </svg>
      </div>
      <div class="cai-header-text">
        <div class="cai-header-name">Cloud AI</div>
        <div class="cai-header-sub">Jay's assistant &middot; Agenti NZ</div>
      </div>
      <button class="cai-close" id="cai-close" aria-label="Close chat">&times;</button>
    </div>
    <div class="cai-messages" id="cai-messages"></div>
    <div class="cai-input-row">
      <input class="cai-input" id="cai-input" type="text" placeholder="Ask about White Cloud…" autocomplete="off" maxlength="500"/>
      <button class="cai-send" id="cai-send" aria-label="Send">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 8L14 8M14 8L9 3M14 8L9 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <div class="cai-powered">Powered by Agenti NZ</div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  // ── State ─────────────────────────────────────────────────────────────────
  var messages = []; // { role: 'user'|'model', parts: [{ text }] }
  var isOpen = false;
  var isWaiting = false;

  var messagesEl = document.getElementById('cai-messages');
  var inputEl    = document.getElementById('cai-input');
  var sendBtn    = document.getElementById('cai-send');
  var closeBtn   = document.getElementById('cai-close');

  // ── Helpers ───────────────────────────────────────────────────────────────
  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(role, text) {
    var div = document.createElement('div');
    div.className = 'cai-msg ' + (role === 'user' ? 'cai-msg-user' : 'cai-msg-ai');
    // Preserve line breaks from the AI response without using innerHTML on untrusted text
    text.split(/\n{2,}/).forEach(function(para, pi) {
      if (pi > 0) { div.appendChild(document.createElement('br')); div.appendChild(document.createElement('br')); }
      para.split('\n').forEach(function(line, li) {
        if (li > 0) div.appendChild(document.createElement('br'));
        div.appendChild(document.createTextNode(line));
      });
    });
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'cai-typing';
    div.id = 'cai-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function removeTyping() {
    var t = document.getElementById('cai-typing');
    if (t) t.remove();
  }

  function setWaiting(val) {
    isWaiting = val;
    sendBtn.disabled = val;
    inputEl.disabled = val;
  }

  // ── Open / close ──────────────────────────────────────────────────────────
  function openPanel() {
    isOpen = true;
    panel.classList.add('cai-open');
    bubble.setAttribute('aria-expanded', 'true');
    inputEl.focus();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('cai-open');
    bubble.setAttribute('aria-expanded', 'false');
  }

  bubble.addEventListener('click', function () {
    isOpen ? closePanel() : openPanel();
  });
  closeBtn.addEventListener('click', closePanel);

  // ── Send message ──────────────────────────────────────────────────────────
  function sendMessage() {
    var text = inputEl.value.trim();
    if (!text || isWaiting) return;

    inputEl.value = '';
    addMessage('user', text);
    messages.push({ role: 'user', parts: [{ text: text }] });

    setWaiting(true);
    showTyping();

    fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      removeTyping();
      var reply = data.reply || 'Sorry, something went wrong. Please try again.';
      addMessage('model', reply);
      messages.push({ role: 'model', parts: [{ text: reply }] });
    })
    .catch(function () {
      removeTyping();
      addMessage('model', 'Sorry, I couldn\'t connect. Please try again in a moment.');
    })
    .finally(function () {
      setWaiting(false);
      inputEl.focus();
    });
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // ── Welcome message ───────────────────────────────────────────────────────
  var welcome = 'Kia ora! I\'m Cloud AI — Jay\'s assistant at White Cloud. I can help you figure out which website package suits your business, or answer any questions about how we work.\n\nWhat kind of business do you run?';
  addMessage('model', welcome);

}());
