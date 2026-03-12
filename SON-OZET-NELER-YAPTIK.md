# Sohbet Boyunca Neler Yaptık? — Öğretici Özet

Bu belge, tüm konuşmada yapılan işleri **neden yaptığımızı** da açıklayarak özetler. Hem ne yaptığımızı hem de güvenlik mantığını öğrenmek için kullanabilirsiniz.

---

## 1. Genel site taraması ve güvenlik açıklarının temizlenmesi

**İstediğiniz:** Sitenin genel taraması ve güvenlik açıklarının giderilmesi.

**Yaptıklarımız:**

### 1.1 Inline script’lerin kaldırılması

- **Ne:** Sayfaların içine gömülü `<script>...</script>` blokları ve `onclick`, `onsubmit` gibi HTML üzerindeki olay tanımları vardı.
- **Neden risk:** Bu tür kodlar XSS (Cross-Site Scripting) saldırılarına daha açıktır; ayrıca Content Security Policy (CSP) ile “sadece güvendiğimiz script’ler çalışsın” kuralı koyduğumuzda inline script’ler çalışmaz.
- **Ne yaptık:** Tüm bu mantığı tek bir dosyaya taşıdık: **`js/layout.js`**. Böylece:
  - Script’ler tek yerden yönetiliyor.
  - CSP ile “sadece kendi script dosyamız + güvendiğimiz CDN” kuralı tutarlı çalışıyor.

**Örnekler:**
- **index.html:** Unicorn Studio’yu yükleyen inline script kaldırıldı → `layout.js` içinde `initUnicornHero()` fonksiyonu eklendi.
- **test.html:** Reveal/stagger animasyonu yapan inline script kaldırıldı → `initReveal()` genişletildi.
- **iletisim.html:** Formu işleyen `handleSubmit` ve `onsubmit` kaldırıldı → `initContactForm()` eklendi.
- **sertifikalar.html:** Sertifika bloklarını gösteren inline script kaldırıldı → `initCertBlocks()` eklendi.

---

### 1.2 Content Security Policy (CSP) eklenmesi

- **Ne:** Tarayıcıya “hangi kaynaklardan script, stil, font, resim yüklensin; form nereye gidebilir?” kurallarını söyleyen bir güvenlik başlığı.
- **Neden:** Saldırgan bir script enjekte etse bile CSP, izin verilmeyen kaynaktan gelen script’in çalışmasını engelleyebilir.
- **Ne yaptık:** Tüm HTML sayfalarının `<head>` kısmına aynı **CSP meta etiketi** ekledik. Örnek kurallar:
  - `script-src 'self' https://cdn.jsdelivr.net` → Sadece kendi sitemiz ve Unicorn için kullandığımız CDN.
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` → Kendi stillerimiz ve Google Fonts.
  - `form-action 'self'` → Formlar sadece kendi sitemize gönderilebilir.
  - `frame-ancestors 'self'` → Sayfamız başka sitelerin iframe’inde gösterilemez (clickjacking azaltılır).
  - `object-src 'none'` → Eski eklenti/object kullanımı kapalı.

**Sonuç:** Script ve kaynaklar sınırlandı; saldırı yüzeyi küçüldü.

---

### 1.3 Dış linklerin güvenli hale getirilmesi

- **Ne:** Zaten `layout.js` içinde **`hardenExternalLinks()`** vardı: siteden dışarı giden linklere `target="_blank"` ile birlikte `rel="noopener noreferrer"` ekleniyor.
- **Neden:** `_blank` ile açılan pencerede açan sayfa `window.opener` ile yeni sayfayı kontrol edebilir; saldırgan sizi yanıltıcı sayfaya yönlendirebilir (tabnabbing). `noopener` ve `noreferrer` bu riski azaltır.
- **Durum:** Bu zaten vardı; dokunmadık ama güvenlik önlemi olarak önemli olduğu için raporlarda yer verdik.

---

## 2. Partial (header/footer) yükleme güvenliği

- **Ne:** Header ve footer, `fetch` ile `partials/header.html` ve `partials/footer.html` dosyalarından alınıp `innerHTML` ile sayfaya yazılıyordu.
- **Risk:** İleride bu URL kullanıcıdan veya parametreden gelirse (örn. `?page=../etc/passwd`) path traversal veya yanlış dosya yükleme olabilirdi.
- **Ne yaptık:** **Whitelist** ekledik. Sadece `partials/header.html` ve `partials/footer.html` adresleri kabul ediliyor; başka URL verilirse `injectPartial` hiç istek atmıyor.

**Öğretici not:** “Kullanıcıdan gelen veya dışarıdan gelen veriyi doğrudan kullanma; sadece izin verilen değerlerle (whitelist) çalış” prensibi birçok güvenlik senaryosunda geçerli.

---

## 3. İletişim formu: XSS ve e-posta

### 3.1 Form verisinin hiçbir yere gitmemesi

- **Durum:** Form “Gönder”e basıldığında veri sunucuya veya e-postaya gitmiyordu; sadece yeşil “Mesajınız alındı” kutusu gösterilip form temizleniyordu.
- **Ne yaptık:** E-posta gönderimi eklemedik; sadece güvenlik tarafını güçlendirdik. İleride mailto veya backend eklerseniz diye **`docs/BACKEND-FORM-CHECKLIST.md`** hazırladık.

### 3.2 Formdan HTML/script ile saldırı (XSS) engelleme

- **Risk:** Birisi form alanına `<script>alert(1)</script>` veya `<img onerror="...">` gibi kod yazıp gönderebilir. Bu veri ileride e-postada veya bir sayfada HTML olarak gösterilirse script çalışabilir (XSS).
- **Ne yaptık:**
  - **`stripHtmlTags(str)`:** Tüm `<...>` etiketlerini siliyor; metin düz kalıyor.
  - **`sanitizeFormValue(str)`:** `<`, `>`, `"`, `'`, `&` karakterlerini güvenli karşılıklara çeviriyor (HTML’de gösterecekseniz kullanılır).
  - Form gönderilirken tüm alanlar bu fonksiyonlarla temizlenip bir **`safe`** objesinde toplanıyor. İleride mailto veya backend’e gönderirken bu temizlenmiş değerler kullanılacak; sayfada asla ham kullanıcı girdisi göstermiyoruz.

**Öğretici not:** “Kullanıcıdan gelen her şeyi güvenilir kabul etme; gösterirken veya gönderirken mutlaka temizle (sanitize) veya escape et.”

---

## 4. Dokümantasyon ve araştırma

### 4.1 Site neyden yapılmış, nerede risk var?

- **Ne yaptık:** **`SECURITY-RESEARCH.md`** dosyasını yazdık.
- **İçerik:** Tech stack (HTML, Tailwind, layout.js, partial’lar, form, harici script/CDN), mevcut güvenlik önlemleri, potansiyel riskler (partial injection, CDN, form backend, CSP unsafe-inline, path traversal, sunucu), özet tablo ve önerilen sonraki adımlar.

### 4.2 Yapılan tüm değişikliklerin raporu

- **Ne yaptık:** **`GUVENLIK-DEGISIKLIK-RAPORU.md`** dosyasını yazdık.
- **İçerik:** Her değiştirdiğimiz dosyayı tek tek listeledik (layout.js, index, test, iletisim, sertifikalar, kurumsal, projelerimiz, üretim sayfaları). Her dosyada “ne eklendi, ne kaldırıldı” madde madde yazılı.

### 4.3 İleride kullanılacak rehberler

- **`docs/BACKEND-FORM-CHECKLIST.md`:** Forma backend eklendiğinde sunucu tarafı validasyon, CSRF, rate limit, e-posta güvenliği kontrol listesi.
- **`docs/SRI-VE-HARICI-SCRIPT.md`:** Unicorn Studio gibi harici script’ler için SRI (hash ile bütünlük kontrolü) veya script’i kendi sunucunuza alma adımları.
- **`docs/SUNUCU-GUVENLIK-BASLIKLARI.md`:** Sunucuda kullanılabilecek güvenlik başlıkları (HSTS, X-Frame-Options, X-Content-Type-Options) ve Nginx, Apache, IIS örnekleri.

---

## 5. Siber saldırı kaynakları ve “eklenti” riski

- **İstediğiniz:** Saldırıların paylaşıldığı sayfaları araştırıp, sitedeki eklenti/bağımlılıkların saldırıya açık olup olmadığını incelemek.
- **Ne yaptık:** **`docs/SIBER-SALDIRI-KAYNAKLARI-VE-SITE-KONTROLU.md`** dosyasını yazdık.
- **İçerik:**
  - Zafiyet/saldırı bilgisi paylaşılan kaynaklar: NVD, CVE, GitHub Advisory, Snyk, GitLab Advisory, OWASP, Exploit-DB.
  - Sitenin kullandığı her bileşen (Tailwind, PostCSS, autoprefixer, Unicorn CDN, Google Fonts, Unsplash) ve hangisinin “saldırıya açık eklenti” gibi davrandığı.
  - PostCSS CVE-2023-44270: Sizin sürümünüzün (8.5.8) düzeltilmiş olduğunun notu.
  - CDN/supply chain riski: Unicorn’un jsDelivr’dan gelmesi; SRI veya self-host önerisi.
  - Statik sitede yaygın saldırı türleri (XSS, supply chain, clickjacking) ve sitede nasıl azaltıldığı.
  - Yapılacaklar: periyodik `npm audit`, CVE takibi, Unicorn için SRI/self-host.

Ayrıca **`package.json`** içine `npm run audit` ve `npm run audit:fix` script’lerini ekledik; projede **`npm audit`** çalıştırdık ve şu an **0 vulnerability** çıktı.

---

## 6. Kısa tablo: Ne yaptık, neden?

| Konu | Ne yaptık | Neden (öğretici) |
|------|-----------|-------------------|
| Inline script | Hepsi kaldırıldı, mantık layout.js’e taşındı | CSP ile uyum, tek merkezden yönetim, XSS yüzeyini azaltma |
| CSP | Tüm sayfalara meta CSP eklendi | Hangi script/stil/kaynağın yükleneceğini tarayıcıya söyleyerek saldırıları sınırlama |
| Partial URL | Whitelist (sadece header/footer) | Path traversal ve keyfi dosya yükleme riskini kapatma |
| Form verisi | stripHtmlTags / sanitizeFormValue + safe objesi | Formdan gelen HTML/script’in hiçbir yerde çalışmaması (XSS) |
| Dokümantasyon | SECURITY-RESEARCH, GUVENLIK-DEGISIKLIK-RAPORU, docs/* | Ne yaptığımızı ve ileride ne yapılacağını kayıt altına alma |
| Saldırı kaynakları | SIBER-SALDIRI-KAYNAKLARI-VE-SITE-KONTROLU.md | Zafiyet nerede paylaşılıyor, sitede neresi “eklenti” gibi riskli, nasıl takip edilir |
| npm audit | Script eklendi, çalıştırıldı (0 açık) | Bağımlılıklarda bilinen zafiyet var mı periyodik kontrol |

---

## 7. Değişen ve eklenen dosyalar (liste)

**Güncellenen:**  
`js/layout.js`, `index.html`, `test.html`, `iletisim.html`, `sertifikalar.html`, `kurumsal.html`, `projelerimiz.html`, `uretim-askeri-kablaj.html`, `uretim-sivil-kablaj.html`, `package.json`

**Yeni eklenen:**  
`SECURITY-RESEARCH.md`, `GUVENLIK-DEGISIKLIK-RAPORU.md`, `SON-OZET-NELER-YAPTIK.md` (bu dosya),  
`docs/BACKEND-FORM-CHECKLIST.md`, `docs/SRI-VE-HARICI-SCRIPT.md`, `docs/SUNUCU-GUVENLIK-BASLIKLARI.md`, `docs/SIBER-SALDIRI-KAYNAKLARI-VE-SITE-KONTROLU.md`

---

## 8. Özet cümleyle

- **Güvenlik:** Inline script’leri kaldırdık, CSP ekledik, partial’a whitelist koyduk, form verisini XSS’e karşı temizliyoruz, dış linkleri güvence altına aldık.
- **Dokümantasyon:** Sitenin neyden yapıldığını, nerede risk olduğunu, hangi dosyada ne değiştiğini ve ileride form/script/sunucu için neler yapılacağını yazdık.
- **Saldırı kaynakları:** Zafiyetlerin nerede paylaşıldığını ve sitedeki “eklenti”/bağımlılık riskini (özellikle CDN script’i) açıklayan bir rehber hazırladık; npm audit ile bağımlılıkları taradık.

Bu özet, “son olarak neler yaptık?” sorusunun cevabı ve bunları neden yaptığımızın kısa öğretici açıklamasıdır.
