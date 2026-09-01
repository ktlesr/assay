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

## 2026-09-01 — npm yayını için NPM_TOKEN yok — ÇÖZÜLDÜ (2026-09-01)
Çözüm: Token üretildi ve `NPM_TOKEN` adıyla GitHub repo secret'ı olarak
eklendi. Tür **Granular Access Token** — klasik ("Automation") tokenlar Kasım
2025'te iptal edildiği için tek seçenek bu, ve yazma izinliler en fazla 90 gün
yaşıyor. Bu yüzden düzenli yenileme gerektiriyor: prosedür
[operations.md](operations.md). Aşağısı, engel açıkken yazılmış kayıttır.

Ne gerekiyordu: `@ktlsr/assay*` paketlerine yazma izni olan bir npm access
token.
Ne yapıldı: Yayın hazırlığının tamamı token olmadan bitirildi ve doğrulandı —
paket adları `@ktlsr/*` olarak değiştirildi, sürümler 0.1.0'a çekildi,
changesets kuruldu, `tsconfig.build.json` ile testler ve map'ler tarball'dan
çıkarıldı, LICENSE/NOTICE/README/CHANGELOG her pakete kondu,
`.github/workflows/release.yml` yazıldı. Dört tarball üretildi, içerikleri
`pnpm pack:check` ile denetlendi, geçici bir dizine kurulup `assay` komutu
çalıştırıldı.
Neden izole edildi: Sır uydurulmaz (sözleşme 1). Ayrıca npm yayını geri
alınamaz; tetiği kullanıcı çekmeli.
Açmak için: GitHub > repo > *Settings* > *Secrets and variables* > *Actions* >
*New repository secret*, ad `NPM_TOKEN`. Yerelde `npm login` yeterli; token'la
çalışılacaksa `npm config set //registry.npmjs.org/:_authToken $NPM_TOKEN` —
`.npmrc` elle yazılmaz, `.gitignore` kapsamında ve pre-commit taraması
reddediyor. Secret tanımlanana kadar `release.yml` içindeki `guard` işi
`release` işini hiç koşturmuyor ve loga `::warning::` yazıyor.
Süreç: [releasing.md](releasing.md).

## 2026-09-01 — 0.1.0 yayını 2FA (EOTP) nedeniyle durdu
Ne gerekiyor: Ya bypass-2FA yetkili yeni bir `NPM_TOKEN`, ya da elle yayın
için bir authenticator kodu. İkisi de kullanıcının npm hesabında.
Ne yapıldı: Yayın `workflow_dispatch` ile tetiklendi (koşum `33500616977`).
Token doğrulaması, `pnpm check`, `pack:check` ve provenance imzalama geçti;
publish çağrısı `npm error code EOTP` ile reddedildi. Dört paketin hiçbiri
yayımlanmadı — kısmi yayın yok, registry `npm view` ile doğrulandı.
Neden izole edildi: Sır uydurulmaz ve 2FA kodu ancak kullanıcıda. Yayın
dışındaki her şey hazır ve doğrulanmış durumda.
Açmak için: Seçenekler ve bedelleri [operations.md](operations.md) içinde
"`EOTP` — token 2FA'yı atlayamıyor" başlığı altında. Kalıcı çözüm trusted
publishing ama o paketin var olmasını gerektiriyor, yani ilk sürüm bu iki
yoldan biriyle çıkmalı.
