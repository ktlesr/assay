# Engeller

Üç denemede çözülemeyen ve izole edilerek geçilen sorunlar. Her kayıt: ne
denendi, neden çözülmedi, ne izole edildi, açmak için ne gerekiyor.

Boşsa engel yok demektir.

---

*(henüz kayıt yok)*

## 2026-08-31 — Google ile giriş yapılandırılmadı
Ne gerekiyor: `AUTH_GOOGLE_ID` ve `AUTH_GOOGLE_SECRET` (Google Cloud Console →
OAuth 2.0 istemci kimliği, yönlendirme adresi
`<site>/api/auth/callback/google`).
Ne yapıldı: Sağlayıcı kodda duruyor ama yalnızca iki değişken de doluyken
etkinleşiyor. Boşken giriş ekranı "Google sign-in is not configured on this
instance." yazıyor — düğme gösterilip çalışmaması yerine.
Neden izole edildi: Sır uydurulmaz (sözleşme 1). Parola ile giriş yolu tam
çalışıyor ve doğrulandı.
Açmak için: iki değişkeni `.env`e yaz, sunucuyu yeniden başlat. Kod değişikliği
gerekmiyor.

## 2026-08-31 — E-posta gönderimi (SMTP) yok
Ne gerekiyor: SMTP kimlik bilgileri.
Ne yapıldı: E-posta doğrulama ve parola sıfırlama akışı yazılmadı.
`User.emailVerified` alanı şemada duruyor ve boş kalıyor.
Neden izole edildi: Gönderilemeyen bir doğrulama e-postası, kullanıcıyı hesabına
sokmayan bir akış demek.
Açmak için: SMTP bilgileri geldiğinde Auth.js'in `Nodemailer` sağlayıcısı ve bir
parola sıfırlama akışı eklenir.

## 2026-09-01 — Konteyner imajı bu makinede derlenmedi
Ne gerekiyor: çalışan bir Docker daemon'ı.
Ne yapıldı: `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh` ve
`docs/deploy.md` yazıldı; `/api/health` uygulandı ve yerelde 200 dönüyor.
Neden izole edildi: Docker Desktop kapalı (`open //./pipe/dockerDesktopLinuxEngine`)
ve Next'in standalone çıktısı Windows'ta sembolik bağ yetkisi istiyor (EPERM).
Bu yüzden `output: 'standalone'` yalnızca `NEXT_STANDALONE=1` iken açık;
bayraksız `pnpm build` geliştirme makinesinde çalışmaya devam ediyor.
Açmak için: CI ubuntu üzerinde `NEXT_STANDALONE=1` ile derliyor ve
`apps/web/.next/standalone/apps/web/server.js` dosyasının varlığını denetliyor.
İmajın kendisi ilk dağıtımda doğrulanacak.

## 2026-09-01 — CI koşumunun sonucu uzaktan doğrulanamadı
Ne gerekiyor: `gh auth login` veya `GH_TOKEN`.
Ne yapıldı: CI adımlarının tamamı yerelde aynı sırayla koşturuldu ve geçti
(temiz `generated` dizininden `prisma generate` + typecheck, lint, kapsam
eşikleriyle test, derleme).
Neden izole edildi: `gh` kimlik doğrulaması yok; sır uydurulmaz.
Açmak için: `gh auth login` sonrası `gh run list`.
