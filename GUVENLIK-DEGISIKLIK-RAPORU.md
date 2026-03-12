# Güvenlik Düzeltmeleri ve Değişiklik Raporu

Bu belge, sohbet boyunca yapılan **tüm güvenlik ve yapısal değişiklikleri** dosya dosya, madde madde listeler. İnceleyip neyin nerede değiştiğini görebilirsiniz.

---

## Özet

- **İlk talep:** Genel site taraması ve güvenlik açıklarının temizlenmesi.  
- **İkinci talep:** Devam edilmesi ve daha fazla güvenlik açığı için tarama.  
- **Üçüncü talep:** Sitening neyden yapıldığı ve güvenlik riskleri üzerine araştırma.  
- **Dördüncü talep:** Önerilen iyileştirmeler için hazırlık + tüm yapılanların detaylı raporu.

**Toplam etkilenen dosyalar:**  
`js/layout.js`, `index.html`, `test.html`, `iletisim.html`, `sertifikalar.html`, `kurumsal.html`, `projelerimiz.html`, `uretim-askeri-kablaj.html`, `uretim-sivil-kablaj.html`, ve yeni eklenen dokümantasyon dosyaları.

---

## 1. js/layout.js

### 1.1 Partial yükleme güvenliği (path traversal / dinamik URL)

- **Ne yapıldı:** `injectPartial()` fonksiyonuna **whitelist** eklendi. Sadece `partials/header.html` ve `partials/footer.html` adresleri kabul ediliyor; başka bir URL verilirse fetch hiç yapılmıyor.
- **Sabit eklenen:**  
  `var PARTIAL_ALLOWLIST = ['partials/header.html', 'partials/footer.html'];`  
  ve fonksiyonun başında:  
  `if (PARTIAL_ALLOWLIST.indexOf(url) === -1) return;`
- **Neden:** İleride URL kullanıcıdan veya parametreden gelirse path traversal veya yanlış dosya yükleme riski vardı; whitelist ile kısıtlandı.

### 1.2 initReveal genişletildi (reveal + stagger-draw)

- **Ne yapıldı:** Sadece `.reveal` değil, `.stagger-draw` elemanları da aynı mantıkla (IntersectionObserver) görünür hale getiriliyor. Böylece `test.html` ve benzeri sayfalardaki inline script’e gerek kalmadı.
- **Eklenen davranışlar:**
  - `prefers-reduced-motion` desteği: hem `.reveal` hem `.stagger-draw` için animasyon kapatılıp hemen görünür yapılıyor.
  - IntersectionObserver yoksa (eski tarayıcı) elemanlar yine görünür yapılıyor.
  - Görünür alandaki elemanlar için hemen `reveal-visible` / `visible` sınıfları veriliyor; diğerleri observer ile izleniyor.
- **Neden:** Tüm reveal/stagger mantığı tek yerde toplandı; sayfa içi script kaldırıldı (CSP ve bakım kolaylığı).

### 1.3 initContactForm eklendi

- **Ne yapıldı:** `#contact-form` id’li form bulunursa `submit` olayında:
  - `preventDefault()` ile gerçek form gönderimi engelleniyor.
  - `checkValidity()` ile HTML5 validasyon kontrol ediliyor.
  - `#form-success` elemanı gösterilip 5 saniye sonra gizleniyor, form `reset()` ediliyor.
- **Neden:** İletişim formu davranışı `iletisim.html` içindeki inline `onsubmit` ve `<script>` bloğundan çıkarılıp tek merkezden yönetildi; inline script güvenlik ve CSP açısından kaldırıldı.

### 1.4 initCertBlocks eklendi

- **Ne yapıldı:** `.cert-block` sınıflı elemanlar için IntersectionObserver ile “görünür olunca” `is-visible` sınıfı ekleniyor. Observer yoksa tüm bloklara hemen `is-visible` veriliyor.
- **Neden:** `sertifikalar.html` içindeki inline script kaldırıldı; aynı davranış `layout.js` içinde sağlandı.

### 1.5 initUnicornHero eklendi

- **Ne yapıldı:** Sayfada `[data-us-project]` elemanı varsa Unicorn Studio script’i `cdn.jsdelivr.net` adresinden dinamik olarak yükleniyor; yükleme sonrası `UnicornStudio.init()` çağrılıyor. Zaten yüklüyse tekrar init edilmiyor.
- **Neden:** `index.html` içindeki inline `<script type="text/javascript">...</script>` bloğu kaldırıldı; tüm script davranışı tek dosyada toplandı (CSP uyumu ve bakım).

### 1.6 DOMContentLoaded’da çağrılan fonksiyonlar

- **Eklenen çağrılar:** `initContactForm()`, `initCertBlocks()`, `initUnicornHero()`.
- **Mevcut kalanlar:** `injectPartial` (header/footer), `initMobileNav`, `initUretimDropdown`, `setActiveNavLinks`, `hardenExternalLinks`, `initReveal`.

---

## 2. index.html

- **CSP meta etiketi eklendi:**  
  `Content-Security-Policy` ile `default-src 'self'`; `script-src 'self' https://cdn.jsdelivr.net`; `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`; `font-src`, `img-src`, `connect-src`, `frame-ancestors`, `base-uri`, `form-action`, `object-src` tanımlandı.
- **Inline Unicorn Studio script kaldırıldı:**  
  Hero bölümündeki `<script type="text/javascript">!function(){...}();</script>` tamamen silindi. Unicorn yüklemesi artık `layout.js` içindeki `initUnicornHero()` ile yapılıyor.
- **Not:** Sayfa sonundaki “form eklenirse sunucu tarafı validasyon…” uyarı yorumu zaten vardı; dokunulmadı.

---

## 3. test.html

- **CSP meta etiketi eklendi:** Aynı politika (script, style, font, img, connect, frame-ancestors, base-uri, form-action, object-src) bu sayfaya da eklendi.
- **Inline reveal/stagger script kaldırıldı:** Sayfa sonundaki `<script>(function(){...})();</script>` bloğu (IntersectionObserver ile `.reveal` ve `.stagger-draw` işleyen kod) tamamen kaldırıldı. Davranış `layout.js` içindeki `initReveal()` ile sağlanıyor.

---

## 4. iletisim.html

- **CSP meta etiketi eklendi:** Diğer sayfalarla aynı CSP meta etiketi eklendi.
- **Form değişiklikleri:**
  - `onsubmit="handleSubmit(event)"` kaldırıldı.
  - Forma `id="contact-form"` verildi; `novalidate` eklendi (isterseniz kendi validasyonunuzu kullanabilirsiniz).
  - Form gönderimi artık `layout.js` içindeki `initContactForm()` ile dinleniyor.
- **Inline script kaldırıldı:** Sayfa sonundaki `function handleSubmit(e){...}` içeren `<script>...</script>` bloğu tamamen kaldırıldı.

---

## 5. sertifikalar.html

- **CSP meta etiketi eklendi:** Aynı CSP politikası bu sayfaya da eklendi.
- **Inline script kaldırıldı:** `.cert-block` elemanları için IntersectionObserver kullanan IIFE `<script>...</script>` bloğu kaldırıldı. Davranış `layout.js` içindeki `initCertBlocks()` ile sağlanıyor.

---

## 6. kurumsal.html

- **CSP meta etiketi eklendi:** Aynı CSP politikası (script-src, style-src, font-src, img-src, connect-src, frame-ancestors, base-uri, form-action, object-src) `head` içine eklendi. Başka kod değişikliği yapılmadı.

---

## 7. projelerimiz.html

- **CSP meta etiketi eklendi:** Aynı CSP politikası bu sayfaya da eklendi. Başka kod değişikliği yapılmadı.

---

## 8. uretim-askeri-kablaj.html

- **CSP meta etiketi eklendi:** Aynı CSP politikası bu sayfaya da eklendi. Başka kod değişikliği yapılmadı.

---

## 9. uretim-sivil-kablaj.html

- **CSP meta etiketi eklendi:** Aynı CSP politikası bu sayfaya da eklendi. Başka kod değişikliği yapılmadı.

---

## 10. Yeni oluşturulan dokümantasyon dosyaları

### 10.1 SECURITY-RESEARCH.md (proje kökü)

- **İçerik:** Site “neyden yapılmış” (tech stack) ve “nerede güvenlik riski var” araştırması.
- **Bölümler:** Tech stack tablosu, yapılan iyileştirmeler, potansiyel riskler (partial injection, CDN/SRI, form, CSP unsafe-inline, path traversal, sunucu), özet tablo, önerilen sonraki adımlar.

### 10.2 docs/BACKEND-FORM-CHECKLIST.md

- **İçerik:** İletişim formu için backend eklendiğinde uyulması önerilen güvenlik kontrol listesi (sunucu validasyon, sanitization, rate limit, CSRF, e-posta güvenliği, hata yönetimi; istemci tarafı önerileri; örnek güvenli akış).

### 10.3 docs/SRI-VE-HARICI-SCRIPT.md

- **İçerik:** Unicorn Studio gibi harici script’ler için SRI (Subresource Integrity) kullanımı ve script’i kendi sunucunuza alma seçenekleri. Hash hesaplama ve `layout.js`’te `integrity`/`crossOrigin` kullanımına kısa örnek.

### 10.4 docs/SUNUCU-GUVENLIK-BASLIKLARI.md

- **İçerik:** Sunucuda kullanılabilecek güvenlik başlıkları (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) ve Nginx, Apache, IIS örnek konfigürasyonları.

### 10.5 GUVENLIK-DEGISIKLIK-RAPORU.md (bu dosya)

- **İçerik:** Sohbet boyunca yapılan tüm değişikliklerin dosya bazlı, madde madde detaylı raporu.

---

## 11. Değiştirilmeyen / dokunulmayan dosyalar

- **partials/header.html** – İçerik veya URL değişmedi; sadece `layout.js` tarafında partial whitelist’e alındı.
- **partials/footer.html** – Aynı şekilde dokunulmadı.
- **css/base.css**, **css/tailwind.css**, **src/tailwind.css** – Stil değişikliği yapılmadı.
- **package.json** – Build script’leri ve bağımlılıklar aynı bırakıldı.

---

## 12. Güvenlik açısından özet (ne düzeltildi / ne eklendi)

| Konu | Yapılan |
|------|--------|
| Inline script | Tüm sayfalardan kaldırıldı; mantık `layout.js`’e taşındı. |
| Inline event handler | `iletisim.html` formundaki `onsubmit` kaldırıldı; form JS ile dinleniyor. |
| CSP | Tüm ilgili HTML sayfalarına aynı Content-Security-Policy meta etiketi eklendi. |
| Dış linkler | Zaten `hardenExternalLinks()` ile `noopener`/`noreferrer` ekleniyordu; dokunulmadı. |
| Partial yükleme | `injectPartial` için URL whitelist eklendi; sadece header/footer partial’larına izin veriliyor. |
| Form | Backend yok; form sadece istemci tarafında. Backend eklenecekse `docs/BACKEND-FORM-CHECKLIST.md` kullanılabilir. |
| Harici script (Unicorn) | SRI ve self-host seçenekleri `docs/SRI-VE-HARICI-SCRIPT.md` içinde anlatıldı. |
| Sunucu başlıkları | Örnekler `docs/SUNUCU-GUVENLIK-BASLIKLARI.md` içinde verildi. |

---

## 13. Dosya listesi (değişen + yeni)

**Değiştirilen:**  
`js/layout.js`, `index.html`, `test.html`, `iletisim.html`, `sertifikalar.html`, `kurumsal.html`, `projelerimiz.html`, `uretim-askeri-kablaj.html`, `uretim-sivil-kablaj.html`

**Yeni eklenen:**  
`SECURITY-RESEARCH.md`, `GUVENLIK-DEGISIKLIK-RAPORU.md`, `docs/BACKEND-FORM-CHECKLIST.md`, `docs/SRI-VE-HARICI-SCRIPT.md`, `docs/SUNUCU-GUVENLIK-BASLIKLARI.md`

Bu rapor, sohbet sırasında yapılan tüm düzeltme ve eklemeleri tek yerde toplar; ileride denetim veya dokümantasyon için kullanılabilir.
