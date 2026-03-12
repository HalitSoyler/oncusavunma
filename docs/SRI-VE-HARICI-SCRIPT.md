# SRI (Subresource Integrity) ve Harici Script

Unicorn Studio script’i şu an `cdn.jsdelivr.net` üzerinden yükleniyor; `integrity` attribute’u yok. Supply-chain riskini azaltmak için aşağıdaki seçeneklerden birini uygulayabilirsiniz.

## Seçenek 1: SRI hash eklemek

1. Script dosyasını indirin (veya curl ile alın):
   ```text
   https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js
   ```
2. SHA-384 hash hesaplayın (PowerShell örnek):
   ```powershell
   [System.Convert]::ToBase64String((Get-FileHash -Path .\unicornStudio.umd.js -Algorithm SHA384).Hash)
   ```
   veya çevrimiçi araç: https://www.srihash.org/
3. `js/layout.js` içinde dinamik script eklerken `integrity` ve `crossOrigin` kullanın:
   ```javascript
   script.integrity = 'sha384-...'; // hesaplanan hash
   script.crossOrigin = 'anonymous';
   ```
4. CSP’de `script-src` zaten `https://cdn.jsdelivr.net` içeriyor; SRI kullanırken aynı kalabilir.

Not: CDN dosyayı güncellerse hash değişir; script yüklenmez. O zaman hash’i güncellemeniz veya yeni sürümü kullanmanız gerekir.

## Seçenek 2: Script’i kendi sunucunuza almak

1. `unicornStudio.umd.js` dosyasını indirip projede örn. `js/vendor/unicornStudio.umd.js` altında tutun.
2. `layout.js` içinde `script.src` değerini bu yerel yola çevirin (örn. `js/vendor/unicornStudio.umd.js`).
3. CSP’den `https://cdn.jsdelivr.net` kaldırın; sadece `'self'` kalsın (isteğe bağlı).

Böylece CDN veya GitHub repo’daki bir değişiklik doğrudan sitenizi etkilemez.

Bu belge, `SECURITY-RESEARCH.md` ile birlikte kullanılır.
