# Öncü Savunma Web Sitesi — Güvenlik Araştırması

## 1. Site Neyden Yapılmış? (Tech Stack)

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| **Sunucu / Hosting** | Yok (statik) | Backend yok; dosyalar doğrudan HTML/CSS/JS olarak sunuluyor. |
| **Sayfalar** | Statik HTML | 8+ sayfa: `index`, `kurumsal`, `test`, `projelerimiz`, `sertifikalar`, `iletisim`, `uretim-askeri-kablaj`, `uretim-sivil-kablaj`. |
| **Stil** | Tailwind CSS + base.css | `npm run build:css` ile `src/tailwind.css` → `css/tailwind.css` derleniyor. PostCSS, autoprefixer kullanılıyor. |
| **Script** | Vanilla JS (ES5-benzeri) | Tek dosya: `js/layout.js`. Framework yok. |
| **Parçalı içerik** | Fetch + innerHTML | Header ve footer `partials/header.html`, `partials/footer.html` olarak fetch edilip DOM’a yazılıyor. |
| **Harici kaynaklar** | Google Fonts, jsDelivr, Unsplash | Fontlar: fonts.googleapis.com / fonts.gstatic.com. Script: cdn.jsdelivr.net (Unicorn Studio). Görseller: images.unsplash.com. |
| **Form** | Sadece istemci tarafı | İletişim formu (`iletisim.html`) `e.preventDefault()` ile gönderimi kesiyor; veri sunucuya gitmiyor, sadece yerel mesaj gösteriliyor. |

**Özet:** Statik, front-end only bir kurumsal site. Build aracı olarak sadece Tailwind (Node) kullanılıyor; canlı sunucuda PHP, Node, Python vb. yok.

---

## 2. Güvenlik Açısından Önemli Noktalar

### 2.1 Yapılan İyileştirmeler (Mevcut Durum)

- **CSP (Content-Security-Policy):** Tüm sayfalarda meta ile tanımlı. `script-src`: yalnızca `self` + `cdn.jsdelivr.net`; inline script yok.
- **Dış linkler:** `hardenExternalLinks()` ile `target="_blank"` linklere `rel="noopener noreferrer"` ekleniyor (tabnabbing azaltılıyor).
- **Inline JS / event handler:** Kaldırıldı; mantık `layout.js` içinde.
- **Form:** `action`/sunucu gönderimi yok; XSS/CSRF riski form verisi sunucuya gitmediği için yok (sadece istemci tarafı davranış).

### 2.2 Potansiyel Güvenlik Riskleri ve Zafiyetler

#### A) **Partial injection (header/footer) — DOM XSS riski**

- **Ne:** `injectPartial()` fetch ile HTML alıyor ve **doğrudan `container.innerHTML = html`** ile yazıyor.
- **Risk:** Eğer `partials/header.html` veya `partials/footer.html` bir şekilde değiştirilir veya sunucu bu dosyaları kullanıcı girdisine göre üretirse (ileride dinamik şablon eklenirse), HTML içinde `<script>` veya `onerror=` gibi ifadeler varsa XSS tetiklenir.
- **Mevcut durum:** URL’ler sabit (`partials/header.html`, `partials/footer.html`); kullanıcı girdisi yok. **Şu an pratik risk düşük.** İleride partial yolu veya içeriği kullanıcıdan/query’den gelirse mutlaka sanitize edilmeli veya innerHTML yerine güvenli yöntem (textContent, güvenli şablon) kullanılmalı.

#### B) **CDN ve harici script (Unicorn Studio)**

- **Ne:** Unicorn Studio script’i `https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js` adresinden yükleniyor.
- **Riskler:**
  - **Supply-chain:** jsDelivr veya GitHub’daki repo zararlı güncelleme alırsa tüm kullanıcılar etkilenir.
  - **SRI yok:** Script’te `integrity` (Subresource Integrity) hash’i yok; dosya değişirse tarayıcı eski içeriği çalıştırabilir.
- **Öneri:** Kritikse script’i kendi sunucunuza alıp CSP’de sadece `self` bırakın; veya SRI hash ekleyin (cdn’deki dosyadan hash hesaplayıp `<script integrity="sha384-..." src="...">`).

#### C) **Google Fonts ve Unsplash**

- **Fontlar:** Google’a istek gidiyor; teorik olarak font sunucusu compromise edilirse kötü niyetli font/CSS servis edilebilir. CSP’de `font-src` ve `style-src` ile sınırlı.
- **Görseller:** Unsplash URL’leri HTML’de sabit; `img-src` CSP’de tanımlı. Unsplash’in kendisi compromise edilirse risk (genelde düşük).

#### D) **İletişim formu — veri sunucuya gitmiyor**

- **Ne:** Form submit’te `e.preventDefault()` var; veri sadece istemcide işleniyor, sunucuya POST yok.
- **Sonuç:** Gerçek iletişim için bir backend (form → e-posta/veritabanı) yok. Backend eklendiğinde:
  - **Sunucu tarafı:** Validasyon, sanitization, rate limit, CSRF token, güvenli e-posta gönderimi şart.
  - **İstemci:** Mevcut yapı sadece UX (başarı mesajı); asıl güvenlik sunucuda sağlanmalı.

#### E) **CSP `style-src 'unsafe-inline'`**

- **Ne:** Sayfalarda çok miktarda `<style>` bloğu var; bu yüzden CSP’de `'unsafe-inline'` kullanılıyor.
- **Risk:** Inline style, XSS ile birleşirse stiller üzerinden saldırı mümkün (ör. iframe, davranış değiştirme). İçerik statik ve kullanıcı girdisi DOM’a yansımıyorsa risk sınırlı.
- **İleride:** Stilleri harici CSS’e taşıyıp `unsafe-inline` kaldırılırsa CSP daha sıkı olur.

#### F) **Path traversal / partial URL**

- **Ne:** `injectPartial(targetId, url, …)` içinde `url` şu an sabit string; kullanıcı girdisi yok.
- **Risk:** Eğer ileride `url` kullanıcıdan veya URL parametresinden gelirse (örn. `?page=../etc/passwd`) path traversal veya yanlış partial yükleme olabilir.
- **Öneri:** Partial URL’leri asla kullanıcı girdisine bağlamayın; bağlayacaksanız whitelist (sadece izin verilen dosya adları) kullanın.

#### G) **Sunucu / dağıtım ortamı**

- **Ne:** Proje dosyalarında sunucu (IIS, Nginx, Apache, CDN) konfigürasyonu yok.
- **Önemli:** Güvenlik ayrıca sunucuda sağlanır: HTTPS zorunluluğu, güvenlik başlıkları (X-Frame-Options, HSTS, X-Content-Type-Options), dosya yükleme/çalıştırma kısıtları, CORS. Bunlar proje kodu dışında, hosting tarafında yapılmalı.

---

## 3. Özet Tablo: “Neyden yapılmış?” ve “Nerede risk var?”

| Bileşen | Ne? | Güvenlik notu |
|---------|-----|----------------|
| HTML sayfaları | Statik, 8+ sayfa | İçerik sabit; kullanıcı verisi DOM’a yansımıyor → XSS riski düşük. |
| layout.js | Tek JS dosyası, partial inject + nav + form + reveal | innerHTML ile partial kullanımı: kaynak güvenilir olduğu sürece risk düşük; ileride dinamikleşirse sanitize/SRI/whitelist gerekir. |
| Tailwind / PostCSS | Build time; production’da sadece CSS | Sadece derleme; kullanıcıya çalışan kod değil. |
| partials (header/footer) | Fetch + innerHTML | Sabit URL, statik dosya → şu an güvenli. İçerik veya URL dinamikleşirse tekrar değerlendirilmeli. |
| İletişim formu | Sadece client-side | Veri sunucuya gitmiyor; backend eklenince sunucu tarafı güvenlik (validasyon, CSRF, rate limit) şart. |
| Unicorn Studio (jsDelivr) | Harici script | Supply-chain ve SRI riski; isteğe bağlı self-host veya SRI. |
| Google Fonts / Unsplash | Harici kaynaklar | CSP ile sınırlı; font/görsel sağlayıcı riski teorik. |
| CSP (meta) | Tüm sayfalarda | script-src sıkı; style-src’de unsafe-inline var, ileride kaldırılabilir. |

---

## 4. Önerilen Sonraki Adımlar

1. **Form backend eklenirse:** Sunucu tarafı validasyon, CSRF token, rate limit, e-posta/veritabanı güvenliği.
2. **Partial’lar dinamikleşirse:** URL whitelist; innerHTML yerine güvenli şablon veya sanitize kütüphanesi.
3. **Unicorn Studio:** SRI hash eklemek veya script’i kendi domain’inize taşımak.
4. **Hosting:** HTTPS, HSTS, X-Frame-Options, X-Content-Type-Options; gerekirse CSP’yi sunucu header’ından vermek (meta yerine).
5. **Stil sıkılaştırma:** Inline `<style>`’ları azaltıp `style-src`’den `'unsafe-inline'` kaldırmak.

Bu belge, projenin mevcut haliyle “neyden yapıldığını” ve “hangi noktaların güvenlik açığı veya risk taşıyabileceğini” özetler. İleride backend veya dinamik içerik eklenirse bu liste güncellenmeli.
