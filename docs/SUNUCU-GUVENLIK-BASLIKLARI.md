# Sunucu Güvenlik Başlıkları (Örnek)

Site statik dosyalardan oluşuyor; asıl güvenlik sunucu/hosting tarafında da sağlanmalı. Aşağıda örnek HTTP başlıkları ve kısa açıklamaları var. Ortamınıza (IIS, Nginx, Apache, CDN) göre uyarlayın.

## Önerilen başlıklar

| Başlık | Örnek değer | Amaç |
|--------|-------------|------|
| **Strict-Transport-Security** | `max-age=31536000; includeSubDomains` | Tarayıcıyı yalnızca HTTPS kullanmaya zorlar (HSTS). |
| **X-Frame-Options** | `SAMEORIGIN` veya `DENY` | Sayfanın iframe içinde gösterilmesini kısıtlar (clickjacking). |
| **X-Content-Type-Options** | `nosniff` | MIME type sniffing’i kapatır. |
| **Content-Security-Policy** | (Zaten HTML meta’da var; isteğe bağlı sunucu header’da da verilebilir) | Script/style kaynaklarını kısıtlar. |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Referrer bilgisini sınırlar. |
| **Permissions-Policy** | `geolocation=(), microphone=(), camera=()` | Gereksinim yoksa tarayıcı özelliklerini kapatır. |

## Örnek: Nginx

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Örnek: Apache (.htaccess)

```apache
Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-Content-Type-Options "nosniff"
Header set Referrer-Policy "strict-origin-when-cross-origin"
```

## Örnek: IIS (web.config)

```xml
<system.webServer>
  <httpProtocol>
    <customHeaders>
      <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
      <add name="X-Frame-Options" value="SAMEORIGIN" />
      <add name="X-Content-Type-Options" value="nosniff" />
      <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
    </customHeaders>
  </httpProtocol>
</system.webServer>
```

HTTPS’i sunucu/barındırma tarafında zorunlu tutun; bu başlıklar HTTP üzerinden de eklenebilir ama HSTS’in anlamı HTTPS ile kullanıldığında ortaya çıkar.

Bu belge, `SECURITY-RESEARCH.md` ile birlikte kullanılır.
