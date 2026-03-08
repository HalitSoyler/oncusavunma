function injectPartial(targetId, url, callback) {
  var container = document.getElementById(targetId);
  if (!container) return;

  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('Partial yüklenemedi: ' + url);
      return res.text();
    })
    .then(function (html) {
      container.innerHTML = html;
      if (typeof callback === 'function') callback();
    })
    .catch(function () {
      // Sessizce yut, kritik değil
    });
}

function initMobileNav() {
  var toggle = document.querySelector('[data-mobile-nav-toggle]');
  var panel = document.getElementById('mobile-nav-panel');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', function () {
    var open = panel.classList.contains('mobile-nav-open');
    panel.classList.toggle('mobile-nav-open', !open);
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    toggle.setAttribute('aria-label', open ? 'Menüyü aç' : 'Menüyü kapat');
  });

  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      panel.classList.remove('mobile-nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Menüyü aç');
    });
  });
}

function initUretimDropdown() {
  var dropdown = document.getElementById('uretim-dropdown');
  var trigger = document.getElementById('uretim-dropdown-trigger');
  if (!dropdown || !trigger) return;

  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    var open = dropdown.getAttribute('aria-expanded') === 'true';
    dropdown.setAttribute('aria-expanded', !open);
    dropdown.querySelector('.nav-dropdown-panel').setAttribute('aria-hidden', open ? 'true' : 'false');
  });

  document.addEventListener('click', function (e) {
    if (dropdown.contains(e.target)) return;
    dropdown.setAttribute('aria-expanded', 'false');
    var panel = dropdown.querySelector('.nav-dropdown-panel');
    if (panel) panel.setAttribute('aria-hidden', 'true');
  });
}

function setActiveNavLinks() {
  var path = window.location.pathname.split('/').pop() || 'index.html';
  if (!path) path = 'index.html';
  var hash = window.location.hash || '';

  var links = document.querySelectorAll('#primary-navigation a, #mobile-nav-panel a');
  links.forEach(function (a) {
    a.classList.remove('active');
    var href = a.getAttribute('href');
    if (!href) return;

    if (href === 'index.html') {
      if (path === '' || path === 'index.html') {
        if (!hash || ['#uretim', '#test'].indexOf(hash) === -1) {
          a.classList.add('active');
        }
      }
    } else if (href === 'kurumsal.html' && path === 'kurumsal.html') {
      a.classList.add('active');
    } else if (href === 'sertifikalar.html' && path === 'sertifikalar.html') {
      a.classList.add('active');
    } else if (href === 'iletisim.html' && path === 'iletisim.html') {
      a.classList.add('active');
    } else if (href === 'uretim-askeri-kablaj.html' && path === 'uretim-askeri-kablaj.html') {
      a.classList.add('active');
    } else if (href === 'index.html#uretim' && path === 'index.html' && hash === '#uretim') {
      a.classList.add('active');
    } else if (href === 'index.html#test' && path === 'index.html' && hash === '#test') {
      a.classList.add('active');
    }
  });

  if (path === 'uretim-askeri-kablaj.html') {
    var trigger = document.getElementById('uretim-dropdown-trigger');
    if (trigger) trigger.classList.add('active');
  }
}

function hardenExternalLinks() {
  var anchors = document.querySelectorAll('a[href]');
  var origin = window.location.origin;

  anchors.forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    if (!/^https?:\/\//i.test(href)) {
      return;
    }
    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (e) {
      return;
    }
    if (url.origin !== origin) {
      a.setAttribute('target', '_blank');
      var rel = (a.getAttribute('rel') || '').split(/\s+/);
      if (rel.indexOf('noopener') === -1) rel.push('noopener');
      if (rel.indexOf('noreferrer') === -1) rel.push('noreferrer');
      a.setAttribute('rel', rel.join(' ').trim());
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // Sayfa değişince her zaman en üstten başla
  window.scrollTo(0, 0);

  injectPartial('site-header', 'partials/header.html', function () {
    initMobileNav();
    initUretimDropdown();
    setActiveNavLinks();
  });

  injectPartial('site-footer', 'partials/footer.html');
  hardenExternalLinks();
});

