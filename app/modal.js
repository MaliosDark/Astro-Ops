// app/modal.js

let modal, closeBtn, topHud, bottomHud;

/**
 * Call once at startup to wire up your modal and expose closeModal().
 */
export function setupModal() {
  topHud    = document.getElementById('top-hud');
  bottomHud = document.getElementById('bottom-hud');

  // Create modal container
  modal    = document.createElement('div');
  closeBtn = document.createElement('button');
  closeBtn.textContent = 'CLOSE';
  closeBtn.style.cssText = `
    position: absolute; top: 8px; right: 8px;
    background: #020; border: 2px solid #0f0; color: #0f0;
    padding: 8px; cursor: pointer;
    font-family: 'Press Start 2P', monospace; font-size: 12px;
  `;

  Object.assign(modal.style, {
    position:     'absolute',
    top:          '50%', left: '50%',
    transform:    'translate(-50%, -50%)',
    width:        '80%', maxWidth: '700px',
    maxHeight:    '80%', overflowY: 'auto',
    background:   'rgba(0,0,0,0.9)',
    border:       '4px solid #0f0',
    borderRadius: '8px',
    padding:      '16px',
    fontFamily:   '"Press Start 2P", monospace',
    color:        '#0f0',
    zIndex:       2000,
    display:      'none'
  });

  modal.appendChild(closeBtn);
  document.body.appendChild(modal);

  // local close button logic
  closeBtn.onclick = () => internalCloseModal();

  // expose globally and keep a reference internally
  window.closeModal = internalCloseModal;
}

/**
 * Internal helper to hide the modal and restore HUD.
 */
function internalCloseModal() {
  if (!modal) return;
  modal.style.display = 'none';
  topHud.style.visibility    = 'visible';
  bottomHud.style.visibility = 'visible';
}

/**
 * Opens the modal and injects pageBase.html + pageBase.js into it.
 */
export function showModal(pageBase) {
  // hide only HUD
  topHud.style.visibility    = 'hidden';
  bottomHud.style.visibility = 'hidden';

  fetch(`${pageBase}.html?cb=${Date.now()}`, { cache: 'no-store' })
    .then(r => r.text())
    .then(text => {
      // inject HEAD links/styles
      const headMatch = text.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      if (headMatch) {
        headMatch[1]
          .match(/<link[^>]*>/gi)?.forEach(tag => document.head.insertAdjacentHTML('beforeend', tag));
        headMatch[1]
          .match(/<style[\s\S]*?<\/style>/gi)?.forEach(tag => document.head.insertAdjacentHTML('beforeend', tag));
      }

      // extract body
      const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const content   = bodyMatch ? bodyMatch[1] : text;

      // fill modal
      modal.innerHTML = '';
      modal.appendChild(closeBtn);
      modal.insertAdjacentHTML('beforeend', content);

      // load the corresponding JS module
      const script = document.createElement('script');
      script.type = 'module';
      script.src  = `${pageBase}.js?cb=${Date.now()}`;
      script.onload = () => {
        if (typeof window.pageInit === 'function') {
          window.pageInit();
          delete window.pageInit;
        }
      };
      modal.appendChild(script);

      modal.style.display = 'block';
    })
    .catch(_ => {
      modal.innerHTML = '';
      modal.appendChild(closeBtn);
      modal.insertAdjacentHTML('beforeend',
        `<p style="color:#f00;font-family:'Press Start 2P',monospace;">
           Error loading <strong>${pageBase}.html</strong>
         </p>`
      );
      modal.style.display = 'block';
    });
}

/**
 * Exported alias to the global closeModal() we set up.
 */
export { internalCloseModal as closeModal };
