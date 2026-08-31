# Assay

AI ajan skill'lerinin gerçekten çalışıp çalışmadığını ölçen değerlendirme
platformu. Agent Skills için CI test koşum aracı — genel amaçlı LLM eval
aracı değil.

## Bağlam

@docs/product.md
@docs/invariants.md
@docs/stack.md
@docs/roadmap.md
@docs/decisions.md

`docs/invariants.md` her şeyin üstündedir. Bir uygulama önerisi oradaki
altı kuraldan birini ihlal ediyorsa **uygulamadan önce dur ve bildir.**

Karar günlüğü boş bırakılmaz. Belirsizlikte verilen her karar
`docs/decisions.md`'ye yazılır.

---

## SÖZLEŞME 1 — Otonom çalışma modu

Bu projede tam yetki var. Soru sorma, onay isteme, seçenek sunma. Karar
ver, uygula, sonucu raporla.

Belirsizlikte: en makul kararı ver → `docs/decisions.md`'ye yaz → devam et.

**Sadece şu üç durumda dur ve bildir:**
1. **Sır gerekiyor** — API anahtarı, OAuth credential, DB şifresi, deploy
   erişimi. Uydurma; placeholder koy ve neyin gerektiğini söyle.
2. **Geri alınamaz git/veri işlemi** — force push, history rewrite,
   branch/tag silme, remote değiştirme, üretim verisi silme, para harcayan
   çağrı.
3. **`docs/invariants.md` ile çelişki.**

Her adımın sonunda kısa uygulama raporu: ne yapıldı, hangi kararlar
verildi, ne doğrulandı, hangi test geçti. Doğrulamadan "tamamlandı" deme.

## SÖZLEŞME 2 — Git disiplini

Checkpoint'lerde commit ve push et, izin isteme: her prompt adımı
bittiğinde, bir adım içindeki bağımsız birim bittiğinde. Faz sonlarında
tag: `faz-0`, `faz-1`, ...

Commit mesajı Conventional Commits; gövdede ne yapıldığı ve verilen
kararlar.

**Push öncesi her seferinde:**
1. typecheck + lint + test geçiyor mu? Geçmiyorsa commit'leme, düzelt.
2. Sır taraması — `.env`, credential, API key, token commit'e girmiş mi?
   Şüphe varsa **PUSH ETME**, bildir.
3. `.gitignore` `.env`, `.env.local`, sandbox dizinleri ve koşum
   artefaktlarını kapsıyor mu?

Faz 0–1 doğrudan `main`. Faz 2'den itibaren her adım için feature branch
ve PR.

## SÖZLEŞME 3 — Veri gerçekliği

Arayüzde, demoda, seed'de ve raporda elle uydurulmuş sahte veri yok.
Ekranda görünen her sayı gerçek bir koşumdan gelir.

Seed script'i sabit dosya okumaz; runner'ı gerçek bir suite üzerinde
koşturur ve çıkan kayıtları yazar. Veri üretmenin yolu ölçüm yapmaktır.

**İstisna:** birim ve entegrasyon testlerinde sahte girdi normaldir.
`MockAdapter` bir test aracıdır; arayüze veya seed'e veri besleyemez.

Gerçek veri yoksa ekran boş bırakılır, `EmptyState` gösterilir.

## SÖZLEŞME 4 — Geliştirme modu

Kullanıcı arayüzü çalışırken izliyor; uygulama her adımda ayakta kalır.

`pnpm dev` çalışır kalsın. Derlemeyi bozan değişiklik sonraki işe
geçmeden düzeltilir. Arayüzü etkileyen her adımdan sonra ekran görüntüsü
al, kendin incele, düzelt, sonra raporla — **koyu ve açık temada.**
Raporda gezilebilir URL'leri listele. Derleme hatası veya çalışmayan sayfa
varsa raporun **en başında** bildir.

`/dev/components` Faz 2'nin ilk gününden ayakta olsun.

---

Sözleşmelerin tam metni: @docs/workflow.md
