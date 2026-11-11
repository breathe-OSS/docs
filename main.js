function motionMs(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) {
    return fallback;
  }
  const value = parseFloat(raw);
  if (Number.isNaN(value)) {
    return fallback;
  }
  if (value <= 1) {
    return 0;
  }
  return value;
}

function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) {
    return;
  }
  toggleBtn.addEventListener('click', () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    root.classList.add('theme-changing');
    window.setTimeout(() => root.classList.remove('theme-changing'), 550);

    root.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch {
      return;
    }
  });
}

function initTopbar() {
  const bar = document.getElementById('topbar');
  if (!bar) {
    return;
  }
  const update = () => {
    bar.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initMobileToc() {
  const toc = document.querySelector('.toc');
  const target = document.getElementById('toc-mobile-body');
  if (!toc || !target) {
    return;
  }
  toc.querySelectorAll('.toc-group').forEach((group) => {
    target.appendChild(group.cloneNode(true));
  });
  target.addEventListener('click', (e) => {
    if (!(e.target instanceof Element) || !e.target.closest('a')) {
      return;
    }
    const details = target.closest('details');
    if (details) {
      details.open = false;
    }
  });
}

function initTocHighlight() {
  const links = Array.from(document.querySelectorAll('.toc a[href^="#"]'));
  if (!links.length) {
    return;
  }
  const targets = links
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  const update = () => {
    const line = 200;
    let current = targets[0];
    for (const el of targets) {
      if (el.getBoundingClientRect().top - line <= 0) {
        current = el;
      }
    }
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      current = targets[targets.length - 1];
    }
    links.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
    });
  };

  let queued = false;
  window.addEventListener(
    'scroll',
    () => {
      if (queued) {
        return;
      }
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        update();
      });
    },
    { passive: true }
  );
  update();
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightJson(text) {
  const pattern =
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\/\/[^\n]*)/g;
  let out = '';
  let last = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    out += escapeHtml(text.slice(last, match.index));
    if (match[1] !== undefined) {
      const cls = match[2] ? 'tok-key' : 'tok-str';
      out += `<span class="${cls}">${escapeHtml(match[1])}</span>`;
      if (match[2]) {
        out += escapeHtml(match[2]);
      }
    } else if (match[3] !== undefined) {
      out += `<span class="tok-lit">${match[3]}</span>`;
    } else if (match[4] !== undefined) {
      out += `<span class="tok-num">${match[4]}</span>`;
    } else {
      out += `<span class="tok-com">${escapeHtml(match[5])}</span>`;
    }
    last = pattern.lastIndex;
  }
  out += escapeHtml(text.slice(last));
  return out;
}

function initHighlight() {
  document.querySelectorAll('pre code.lang-json').forEach((block) => {
    block.innerHTML = highlightJson(block.textContent);
  });
}

function initCopyButtons() {
  document.querySelectorAll('.code').forEach((box) => {
    const head = box.querySelector('.code-head');
    const pre = box.querySelector('pre');
    if (!head || !pre) {
      return;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.textContent.trim());
        btn.textContent = 'Copied';
        btn.classList.add('copied');
      } catch {
        btn.textContent = 'Copy failed';
      }
      window.setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 1600);
    });
    head.appendChild(btn);
  });
}

function initExpanders() {
  document.querySelectorAll('details.expander').forEach((details) => {
    const summary = details.querySelector(':scope > summary');
    const body = details.querySelector(':scope > .expander-body');
    if (!summary || !body) {
      return;
    }
    let running = null;

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      const duration = motionMs('--motion-shape', 350);
      const closing = details.open && !details.classList.contains('closing');
      const from = body.getBoundingClientRect().height;
      if (running) {
        running.cancel();
      }

      if (closing) {
        details.classList.add('closing');
        if (duration === 0) {
          details.open = false;
          details.classList.remove('closing');
          return;
        }
        running = body.animate(
          [
            { height: `${from}px`, opacity: 1 },
            { height: '0px', opacity: 0 },
          ],
          { duration: duration * 0.8, easing: 'cubic-bezier(0.3, 0, 0.8, 0.15)' }
        );
        running.onfinish = () => {
          details.open = false;
          details.classList.remove('closing');
          running = null;
        };
        return;
      }

      details.classList.remove('closing');
      details.open = true;
      if (duration === 0) {
        return;
      }
      const to = body.getBoundingClientRect().height;
      running = body.animate(
        [
          { height: `${from === to ? 0 : from}px`, opacity: 0 },
          { height: `${to}px`, opacity: 1 },
        ],
        { duration, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)' }
      );
      running.onfinish = () => {
        running = null;
      };
    });
  });
}

initThemeToggle();
initTopbar();
initMobileToc();
initTocHighlight();
initHighlight();
initCopyButtons();
initExpanders();
