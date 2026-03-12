# İletişim Formu Backend Eklendiğinde Güvenlik Kontrol Listesi

İletişim formu şu an sadece istemci tarafında çalışıyor; veri sunucuya gönderilmiyor. Backend (PHP, Node, .NET vb.) eklediğinizde aşağıdakileri uygulayın.

## Sunucu tarafı (zorunlu)

- [ ] **Validasyon:** Tüm alanları sunucuda tekrar doğrulayın (tip, uzunluk, format). İstemci validasyonu atlanabilir.
- [ ] **Sanitization:** Girdiyi saklamadan veya e-posta ile göndermeden önce HTML/script etiketlerini temizleyin (XSS).
- [ ] **Rate limiting:** Aynı IP’den dakikada/saatte maksimum istek sınırı (spam / DoS).
- [ ] **CSRF token:** Formda gizli token; sunucuda doğrula (POST’un sizin sayfanızdan geldiğini garanti eder).
- [ ] **E-posta güvenliği:** To/From/Subject’i sabit veya whitelist’ten seçin; kullanıcı girdisini doğrudan header’da kullanmayın (injection).
- [ ] **Hata mesajları:** Kullanıcıya detaylı hata (stack trace, path) göstermeyin; loglara yazın.

## İstemci tarafı (önerilen)

- [ ] Form `action` URL’ini backend endpoint’ine yönlendirin.
- [ ] Gönderim sonrası başarı/hata mesajını sunucu yanıtına göre gösterin (mevcut `#form-success` benzeri).
- [ ] İsteğe bağlı: reCAPTCHA veya benzeri bot koruması.

## Örnek güvenli akış

1. Sayfa yüklenir → sunucu formu CSRF token ile render eder.
2. Kullanıcı gönderir → POST ile token + form verisi gider.
3. Sunucu: token doğru mu, rate limit aşıldı mı, alanlar geçerli mi diye bakar.
4. Geçerliyse: veriyi sanitize et → e-posta gönder veya veritabanına yaz; başarı yanıtı dön.
5. Geçersizse: genel hata mesajı dön (ör. "Gönderilemedi, lütfen tekrar deneyin").

Bu checklist, `SECURITY-RESEARCH.md` ve `GUVENLIK-DEGISIKLIK-RAPORU.md` ile birlikte kullanılabilir.
