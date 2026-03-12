// İzin verilen partial dosyaları (path traversal / dinamik URL riskine karşı)
var PARTIAL_ALLOWLIST = ['partials/header.html', 'partials/footer.html'];

// İletişim formu: HTML/script enjeksiyonuna (XSS) karşı – veriyi DOM, mailto veya backend'e kullanmadan önce temizle
function sanitizeFormValue(str) {
  if (str == null || typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/&/g, '&amp;')
    .substring(0, 10000);
}
function stripHtmlTags(str) {
  if (str == null || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').substring(0, 10000);
}

function injectPartial(targetId, url, callback) {
  var container = document.getElementById(targetId);
  if (!container) return;
  if (PARTIAL_ALLOWLIST.indexOf(url) === -1) return;

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
    } else if (href === 'tasarim.html' && path === 'tasarim.html') {
      a.classList.add('active');
    } else if (href === 'projelerimiz.html' && path === 'projelerimiz.html') {
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

function initReveal() {
  var elements = document.querySelectorAll('.reveal');
  var stagger = document.querySelectorAll('.stagger-draw');
  if (!elements.length && !stagger.length) return;

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    elements.forEach(function (el) {
      el.classList.add('reveal-visible', 'reveal-no-motion');
    });
    stagger.forEach(function (el) {
      el.classList.add('visible');
    });
    return;
  }

  if (!('IntersectionObserver' in window)) {
    elements.forEach(function (el) {
      el.classList.add('reveal-visible');
    });
    stagger.forEach(function (el) {
      el.classList.add('visible');
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (entry.target.classList.contains('reveal')) {
          entry.target.classList.add('reveal-visible');
        }
        if (entry.target.classList.contains('stagger-draw')) {
          entry.target.classList.add('visible');
        }
      });
    },
    { rootMargin: '0px 0px -40px 0px', threshold: 0.05 }
  );

  elements.forEach(function (el) {
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('reveal-visible');
    } else {
      observer.observe(el);
    }
  });

  stagger.forEach(function (el) {
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    } else {
      observer.observe(el);
    }
  });
}

function initContactForm() {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var success = document.getElementById('form-success');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (form.checkValidity && !form.checkValidity()) {
      return;
    }

    // Tüm alanları al ve XSS riskine karşı temizle (HTML/script hiçbir yerde çalışmasın)
    var rawName = form.querySelector('#contact-name') && form.querySelector('#contact-name').value;
    var rawCompany = form.querySelector('#contact-company') && form.querySelector('#contact-company').value;
    var rawEmail = form.querySelector('#contact-email') && form.querySelector('#contact-email').value;
    var rawPhone = form.querySelector('#contact-phone') && form.querySelector('#contact-phone').value;
    var rawSubject = form.querySelector('#contact-subject') && form.querySelector('#contact-subject').value;
    var rawMessage = form.querySelector('#contact-message') && form.querySelector('#contact-message').value;

    var safe = {
      name: stripHtmlTags(rawName),
      company: stripHtmlTags(rawCompany),
      email: stripHtmlTags(rawEmail),
      phone: stripHtmlTags(rawPhone),
      subject: stripHtmlTags(rawSubject),
      message: stripHtmlTags(rawMessage)
    };

    // Veriyi sadece sanitize edilmiş haliyle kullan (mailto/backend eklenince bu safe objesi kullanılacak)
    // Sayfada asla ham kullanıcı girdisi gösterme; göstereceksen sanitizeFormValue() kullan

    if (success) {
      success.style.display = 'block';
      setTimeout(function () {
        success.style.display = 'none';
      }, 5000);
    }

    form.reset();
  });
}

function initCertBlocks() {
  var blocks = document.querySelectorAll('.cert-block');
  if (!blocks.length) return;

  if (!('IntersectionObserver' in window)) {
    blocks.forEach(function (block) {
      block.classList.add('is-visible');
    });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { rootMargin: '0px 0px -40px 0px', threshold: 0.1 }
  );

  blocks.forEach(function (block) {
    io.observe(block);
  });
}

function initUnicornHero() {
  var container = document.querySelector('[data-us-project]');
  if (!container) return;

  function doInit() {
    if (window.UnicornStudio && window.UnicornStudio.isInitialized) return;
    if (typeof UnicornStudio === 'undefined') return;
    try {
      UnicornStudio.init();
      window.UnicornStudio = window.UnicornStudio || {};
      window.UnicornStudio.isInitialized = true;
    } catch (e) {}
  }

  if (typeof UnicornStudio !== 'undefined') {
    doInit();
    return;
  }

  window.UnicornStudio = { isInitialized: false };
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.3/dist/unicornStudio.umd.js';
  script.onload = doInit;
  (document.head || document.body).appendChild(script);
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
  initReveal();
  initContactForm();
  initCertBlocks();
  initUnicornHero();
});

