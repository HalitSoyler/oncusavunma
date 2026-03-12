# Siber Saldırı Kaynakları ve Sitemiz İçin Kontrol Rehberi

Saldırı ve zafiyetlerin paylaşıldığı sayfalar ile sitemizin kullandığı eklenti/bağımlılıkların bu kaynaklarla nasıl kontrol edileceği aşağıda özetlenmiştir.

---

## 1. Zafiyet ve Saldırı Bilgilerinin Paylaşıldığı Kaynaklar

| Kaynak | Adres | Ne için kullanılır |
|--------|--------|---------------------|
| **NVD (National Vulnerability Database)** | https://nvd.nist.gov | ABD NIST; CVE kayıtları, CVSS puanları, arama. |
| **CVE (Common Vulnerabilities and Exposures)** | https://cve.mitre.org | Zafiyet kimlik numaraları (CVE-2023-xxxxx). |
| **NVD REST API** | https://services.nvd.nist.gov/rest/json/cves/2.0 | CVE verisine programatik erişim (rate limit: 5 req/30 sn). |
| **GitHub Advisory Database** | https://github.com/advisories | Açık kaynak paket zafiyetleri (npm, GitHub). |
| **Snyk Vulnerability DB** | https://security.snyk.io | npm/paket zafiyetleri, örnek: PostCSS CVE-2023-44270. |
| **GitLab Advisory** | https://advisories.gitlab.com | Paket zafiyetleri (örn. PostCSS). |
| **OWASP** | https://owasp.org | Web saldırı türleri (XSS, CSRF, injection) ve önlem rehberleri. |
| **Exploit-DB** | https://www.exploit-db.com | Açıklama (exploit) kodları ve zafiyet bilgisi. |

Bu sayfalarda “saldırılar paylaşılıyor” denebilir; aslında **zafiyet bilgisi ve bazen exploit** paylaşılır. Sitemiz için anlamlı olanlar: **NVD/CVE** (paket sürümleri), **Snyk/GitHub Advisory** (npm), **OWASP** (XSS, CSP, form güvenliği).

---

## 2. Sitemizin Kullandığı Bileşenler ve Risk Özeti

| Bileşen | Tür | Nerede kullanılıyor | Saldırıya açıklık notu |
|---------|-----|----------------------|-------------------------|
| **Tailwind CSS** | npm (build) | `npm run build:css` → css/tailwind.css | Sadece build zamanı; canlı sitede çalışmıyor. Zafiyet olsa bile saldırgan doğrudan “eklenti” gibi çalıştıramaz. |
| **PostCSS** | npm (build) | Tailwind’in kullandığı CSS işleyici | CVE-2023-44270 (PostCSS &lt; 8.4.31) biliniyor. **Sizin sürüm: ^8.5.8 → 8.4.31 ve üzeri, düzeltilmiş.** |
| **autoprefixer** | npm (build) | Tailwind ile birlikte | Build zamanı; bilinen kritik CVE yok (NVD/Snyk’te kontrol edilebilir). |
| **Unicorn Studio** | Harici script (CDN) | jsdelivr üzerinden; layout.js ile yükleniyor | **Supply chain riski:** CDN veya upstream repo zararlı güncelleme alırsa tüm ziyaretçiler etkilenir. Eklenti/plugin değil ama “harici eklenti” gibi davranıyor. |
| **Google Fonts** | Harici (CSS/font) | Tüm sayfalar | Sunucu compromise edilirse teorik risk; CSP ile sınırlı. |
| **Unsplash** | Harici (img URL) | Bazı sayfalarda arka plan görseli | Sadece img URL; CSP’de tanımlı. |
| **Vanilla JS (layout.js)** | Kendi kodumuz | Form, partial, navigasyon | innerHTML (partial) ve form verisi için sanitizasyon/whitelist yapıldı; CSP var. |

Özet: **Eklenti/plugin** olarak çalışan tek dış bileşen **Unicorn Studio** (CDN). Diğerleri build-time npm paketleri; canlı sitede “eklenti” gibi çalışan ve doğrudan saldırıya açık olan kısım CDN script’i.

---

## 3. Bilinen Zafiyetler ve Sitemiz

### 3.1 PostCSS CVE-2023-44270

- **Ne:** PostCSS’te CSS parsing hatası; özel karakterli kötü niyetli CSS ile çıktıya istenmeyen kurallar enjekte edilebiliyordu.
- **Etkilenen:** PostCSS **8.4.31 öncesi**.
- **Sizin sürüm:** `package.json` içinde `"postcss": "^8.5.8"` → **8.4.31 ve üzeri, düzeltilmiş.**
- **Yine de:** `npm audit` ve periyodik `npm update` ile güncel kalın.

### 3.2 CDN / Supply chain (jsDelivr, Unicorn Studio)

- **Risk:** Polyfill.io, trojanize jQuery gibi olaylarda CDN üzerinden zararlı script dağıtıldı. jsDelivr üzerinden Unicorn Studio kullandığınız için aynı tür **supply chain** riski var.
- **Sitede “eklenti” gibi saldırıya açık olan:** Bu harici script. CDN veya repo güncellenirse (zararlı olsa bile) tarayıcı o kodu çalıştırır.
- **Önlemler:**  
  - **SRI (Subresource Integrity):** Script’e `integrity` hash ekleyin; dosya değişirse tarayıcı çalıştırmaz.  
  - **Self-host:** Unicorn script’i kendi sunucunuza alın; CDN’e güvenmeyin.  
  - Detay: `docs/SRI-VE-HARICI-SCRIPT.md`.

---

## 4. Statik Sitede Yaygın Saldırı Türleri (OWASP / NVD mantığı)

Bu tür saldırılar “sayfalarda paylaşılan” saldırı türleriyle uyumludur; sitemiz için durum:

| Saldırı | Açıklama | Sitemizde durum |
|---------|----------|------------------|
| **XSS (DOM / Reflected)** | URL veya formdan gelen verinin DOM’a yazılması; script çalışması. | Form verisi stripHtmlTags ile temizleniyor; partial’da innerHTML var ama URL whitelist ve statik dosya. CSP script-src sıkı. |
| **Supply chain** | Harici paket/CDN’den gelen zararlı kod. | Unicorn CDN’den; SRI veya self-host önerilir. |
| **Clickjacking** | Sayfanın iframe’de gösterilip yanıltıcı tıklama. | CSP `frame-ancestors 'self'`; sunucuda X-Frame-Options önerilir (docs/SUNUCU-GUVENLIK-BASLIKLARI.md). |
| **Path traversal** | URL ile sunucuda yanlış dosya okuma. | Partial için sadece whitelist URL’ler kullanılıyor. |

---

## 5. Yapılacaklar (Eklenti ve Bağımlılık Kontrolü)

1. **npm audit (periyodik)**  
   Proje kökünde:
   ```bash
   npm audit
   ```
   Uyarı çıkarsa:
   ```bash
   npm audit fix
   ```
   Kritik/kalan zafiyetleri NVD veya Snyk’te CVE numarasıyla arayıp güncelleyin.

2. **package-lock.json**  
   Versiyonların sabitlenmesi için lock dosyası kullanın; `npm ci` ile kurulum yapın. Böylece “eklenti” gibi kullanılan build araçları bilinen bir sürümde kalır.

3. **Harici script (Unicorn) – eklenti gibi saldırıya açık**  
   - SRI ekleyin veya script’i kendi sunucunuza alın (`docs/SRI-VE-HARICI-SCRIPT.md`).  
   - Yeni sürüm çıktığında NVD/GitHub Advisory’de “unicornstudio” / “jsdelivr” araması yapabilirsiniz (genelde paket adıyla CVE çıkar).

4. **CVE takibi**  
   Yılda birkaç kez şu paket adlarını NVD (nvd.nist.gov) veya Snyk’te arayın:  
   `tailwindcss`, `postcss`, `autoprefixer`.  
   Eklenti ekledikçe (npm veya harici script) listeye ekleyin.

5. **Build’i ayrı ortamda çalıştırma**  
   Tailwind/PostCSS sadece build’de çalışsın; canlı sunucuda `node_modules` veya build script’i çalıştırılmasın. Böylece build araçları “canlıda eklenti” gibi saldırı yüzeyi oluşturmaz.

---

## 6. Özet: “Eklenti / saldırıya açık” nerede?

- **Canlı sitede gerçekten “eklenti” gibi çalışan:** Sadece **Unicorn Studio** (CDN’den gelen script). Saldırıların paylaşıldığı kaynaklarda (NVD, Snyk, supply chain haberleri) CDN ve harici script’lere dikkat edin; bu bileşen için SRI veya self-host yapın.
- **Build tarafı (Tailwind, PostCSS, autoprefixer):** Eklenti gibi doğrudan saldırıya açık değil; zafiyet çıkarsa `npm audit` ve NVD/Snyk ile sürüm güncelleyin. PostCSS şu an güvenli sürümde.
- **Kendi kodunuz (layout.js, form, partial):** XSS ve path traversal için önlemler alındı; OWASP ve “statik site saldırıları” rehberleriyle uyumlu takip için bu dokümandaki kaynakları kullanabilirsiniz.

Bu rehber, saldırıların/zafiyetlerin paylaşıldığı sayfalarla sitemizin eklenti ve bağımlılıklarını eşleştirir; periyodik kontrol için kullanılabilir.
