# Yayın

Yayımlanan dört paket ve yayımlanmayanlar:

| Paket | npm adı | Durum |
|---|---|---|
| `packages/cli` | `@ktlsr/assay` | yayımlanır — `bin: assay` |
| `packages/core` | `@ktlsr/assay-core` | yayımlanır |
| `packages/runner` | `@ktlsr/assay-runner` | yayımlanır |
| `packages/adapters` | `@ktlsr/assay-adapters` | yayımlanır |
| `packages/db` | — | `private: true` |
| `packages/ui` | — | `private: true` |
| `apps/web` | — | `private: true` |

Dördü `.changeset/config.json` içinde `fixed` grubunda: hep aynı sürümü
taşırlar. Sebep, dördünün tek bir SDK'nın parçaları olması —
`@ktlsr/assay@0.2.0` ile `@ktlsr/assay-core@0.1.7`'yi eşleştirmek kullanıcıya
çözecek bir bulmaca vermek olurdu.

## Yayın yolu pnpm, npm değil

`pnpm publish` kullanılır. `npm publish` **kullanılmaz**.

Paketler birbirine `workspace:*` ile bağlı. Bu belirteci gerçek sürüm
numarasına çeviren pnpm'dir; npm onu olduğu gibi bırakır ve tarball
kurulamaz hâlde yayımlanır. Kural `pnpm release` script'inde sabit.

## İlk sürüm (0.1.0) — yayımlandı

2026-09-01'de dört paket olarak yayımlandı, trusted publishing ile,
provenance'lı. Changeset kullanılmadı: manifestolar zaten `0.1.0` diyordu ve
bir `minor` changeset onu `0.2.0`'a çıkarırdı; CHANGELOG'lar elle yazıldı.

Changesets `0.2.0`'dan itibaren devralıyor. Depoda changeset yokken
`changesets/action` yayın moduna geçer ve npm'de **bulunmayan** sürümleri
gönderir; var olanları atlar.

## Sürüm yükseltme

```
pnpm changeset            # değişikliği ve sürüm türünü kaydet
git add .changeset && git commit -m "chore: changeset"
git push
```

`main`'e girdiğinde `release.yml` bir "Version Packages" PR'ı açar. PR
sürümleri ve CHANGELOG'ları taşır. Birleştirmek **yayımlamaz** — yalnızca
sürüm numaralarını main'e alır.

## Yayımlama

Yayın ayrı ve elle bir adımdır:

```
gh workflow run release.yml -f confirm=yayimla
```

Ya da GitHub > Actions > Release > *Run workflow* > `confirm` alanına
`yayimla`.

Push ile yayının ayrılması kasıtlı. Alternatifi — "changeset kalmadıysa
yayımla" — main'e atılan her commit'i bir yayın denemesine çevirirdi; belge
düzelten bir commit bile. npm yayını geri alınamaz, o yüzden tetiği çekmek
açık bir eylem olmalı. Onay metni de bunun için: yanlışlıkla açılan bir
koşum yayımlamaz.

## Yayın öncesi hangi denetimler koşar

Üç katman, üçü de aynı şeyi farklı yerde yakalar:

1. **`pnpm pack:check`** — paketleri gerçekten paketler, tarball içeriğini
   listeler; test dosyası, source map, `src/`, `.env`, `.npmrc`, anahtar veya
   `node_modules` bulursa sıfırdan farklı kodla çıkar. LICENSE, NOTICE ve
   README'nin varlığını da şart koşar.
2. **Her paketin `prepublishOnly`'si** — `pnpm -w run check` (typecheck +
   lint + test) ve ardından temiz bir yayın build'i. `pnpm publish` bunu
   kendi koşar; unutulamaz.
3. **`release.yml`** — aynı ikisini npm'e ulaşmadan önce CI'da koşar.

### Yayın build'i neden ayrı

`tsconfig.build.json` geliştirme yapılandırmasından iki şeyle ayrılıyor: test
dosyalarını hariç tutuyor ve `sourceMap` / `declarationMap` üretmiyor.

Map'ler kapalı, çünkü `files` alanı `src`'yi taşımıyor: yayımlanan bir map
dosyası olmayan bir kaynağı gösterir. `src`'yi tarball'a eklemek yerine
map'i hiç üretmemek hem tarball'ı küçültüyor hem kırık map bırakmıyor.

Denetimin gerçekten yakaladığı ölçüldü: geliştirme build'iyle paketlenen
`@ktlsr/assay-core` 84 dosya ve 65.7 KB, `pack:check` reddediyor. Yayın
build'iyle 27 dosya ve 32.3 KB, geçiyor.

## Kimlik doğrulama

**Saklanan token yok.** Yayın trusted publishing (OIDC) ile: npm, GitHub'ın
verdiği kısa ömürlü ve bu iş akışına özgü kimliği doğruluyor. Yenilenecek bir
secret olmadığı için token döngüsü de yok.

İş akışına bir `NPM_TOKEN` geri eklenirse `changesets/action` OIDC yerine onu
kullanır ve provenance ile 2FA sorunları geri gelir. Ayrıntı:
[operations.md](operations.md).

## Elle yayın

CI tercih edilir. Elle yayımlaman gerekirse:

```
npm login                 # veya: npm config set //registry.npmjs.org/:_authToken $NPM_TOKEN
pnpm install --frozen-lockfile
pnpm --filter @ktlsr/assay-db exec prisma generate
pnpm check
pnpm pack:check
pnpm release              # pnpm -r --filter "./packages/*" publish --access public
```

`.npmrc` dosyasını elle yazma: `.gitignore` kapsamında ve pre-commit taraması
onu reddediyor. `npm config set` kullan.

`--access public` şart: scoped bir paket varsayılan olarak private yayımlanmak
ister ve ücretsiz hesapta bu hata verir. Değer ayrıca her pakette
`publishConfig` içinde de duruyor.

**Elle yayın artık pratikte mümkün değil ve bu iyi.** Trusted publishing
yalnızca yapılandırılmış iş akışından gelen yayınları kabul ediyor; geliştirme
makinesinden yapılan bir `pnpm publish` OIDC kimliği sunamaz. Ayrıca
`publishConfig.provenance: true` da CI dışında çalışmaz.

Yani yayının tek yolu `release.yml`. Bir aracın kendi dağıtım zincirinde
denetlenmemiş bir kaçış yolu bırakmaması, ölçüm dürüstlüğü iddiasıyla tutarlı.

## Provenance

Depo public olduğu için yayımlanan her tarball'a imzalı bir kaynak kanıtı
ekleniyor: hangi commit'ten, hangi iş akışıyla, hangi koşumda derlendiği.
npm paket sayfasında doğrulanabilir bir rozet olarak görünür.

Gereken üç şey de yerinde: public depo, `permissions.id-token: write`, ve
`publishConfig.provenance: true`. Üçünden biri eksikse npm sessizce
provenance'sız yayımlamaz — hata verir, ki doğrusu budur.

0.1.0'da dört paketin dördünde de doğrulandı: `npm view <paket> dist.attestations`
her birinde `https://slsa.dev/provenance/v1` döndürüyor.

## İlk yayından sonra

`@ktlsr` scope'u npm'de mevcut değilse ilk `pnpm publish` onu otomatik
oluşturur; ayrıca org açmak gerekmez.

Yayımlanan bir sürüm silinemez. 72 saat içinde `npm unpublish` mümkün ama aynı
sürüm numarası bir daha kullanılamaz — düzeltme yolu yeni bir yama sürümüdür.

Yayın yarıda kalırsa panik gerekmiyor: `pnpm publish` registry'de zaten olan
sürümleri atlar, yani iş akışını yeniden koşturmak eksikleri tamamlar. Ayrıntı
ve yayın sonrası doğrulama: [operations.md](operations.md).
