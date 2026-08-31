# Çalışma Sözleşmeleri

Dört blok. Tam metinleri burada; `CLAUDE.md` bu dosyayı import eder.

---

## 1. Otonom çalışma modu

```
Bu projede tam yetki var. Kullanıcıya soru sorma, onay isteme, seçenek
sunma. Karar ver, uygula, sonucu raporla.

Belirsizlikle karşılaşınca:
1. Mevcut bilgiyle en makul kararı ver.
2. Kararı ve gerekçesini docs/decisions.md'ye yaz.
3. Devam et.

docs/decisions.md formatı — her karar için:
  ## <tarih> — <karar başlığı>
  Bağlam: neden bir karar gerekti
  Seçenekler: değerlendirilenler
  Karar: seçilen
  Gerekçe: neden
  Geri dönüş maliyeti: düşük / orta / yüksek

Her adımın sonunda kısa bir uygulama raporu: ne yapıldı, hangi kararlar
verildi, ne doğrulandı, hangi test geçti.

SADECE ŞU ÜÇ DURUMDA DUR VE BİLDİR:
1. Sır gerekiyor — API anahtarı, OAuth credential, veritabanı şifresi,
   deploy erişimi. Uydurma; placeholder koy ve neyin gerektiğini söyle.
2. Geri alınamaz işlem — force push, history rewrite, branch/tag silme,
   remote değiştirme, üretim verisi silme, harici servise gerçek para
   harcayan çağrı.
3. docs/invariants.md ile çelişki.

Bunların dışında hiçbir şey için durma.

Her adımdan sonra kendi işini doğrula: testleri koş, tip kontrolü yap,
lint çalıştır, mümkünse ekran görüntüsü al ve incele. Doğrulamadan
"tamamlandı" deme.
```

---

## 2. Git disiplini

```
Checkpoint noktalarında commit ve push et, izin isteme:
- Her prompt adımı tamamlandığında
- Bir adım içinde bağımsız çalışan bir birim bittiğinde
- Faz sonlarında ayrıca tag at: faz-0, faz-1, ...

Commit mesajı Conventional Commits. Gövdede ne yapıldığı ve verilen
kararlar.

Push öncesi her seferinde:
1. typecheck, lint ve testler geçiyor mu? Geçmiyorsa commit'leme, düzelt.
2. Sır taraması: .env, credential, API key, token commit'e girmiş mi?
   Şüpheli bir şey varsa PUSH ETME ve bildir.
3. .gitignore'un .env, .env.local, sandbox dizinleri ve koşum
   artefaktlarını kapsadığını doğrula.

Faz 0 ve 1 boyunca doğrudan main'e çalışılır. Faz 2'den itibaren her adım
için feature branch ve PR.
```

---

## 3. Veri gerçekliği

```
Arayüzde, demolarda, seed'lerde ve raporlarda elle uydurulmuş sahte veri
kullanma. Ekranda görünen her sayı gerçek bir koşumdan gelmeli.

- Hardcoded örnek koşum, elle yazılmış JSON fixture, uydurma yüzde yok.
- UI için veriye ihtiyaç olduğunda runner gerçekten çalıştırılır ve çıkan
  kayıtlar seed olarak kullanılır. Veri üretmenin yolu ölçüm yapmaktır.
- Seed script'i sabit dosya okumaz; runner'ı bir örnek suite üzerinde
  koşturur ve sonucu yazar.
- Tanıtım sayfasında gerçek olmayan müşteri sayısı, test sayısı, logo veya
  referans yok. Örnek çıktı gösterilecekse gerçek bir koşumun çıktısı
  gösterilir.

İSTİSNA — test kodu:
Birim ve entegrasyon testlerinde sahte girdi normaldir. MockAdapter bir
test aracıdır; asla arayüze veya seed'e veri beslemek için kullanılmaz.

Gerçek veri henüz üretilemiyorsa ekran boş bırakılır ve EmptyState
gösterilir. Boş ekran, uydurma veriden iyidir.
```

---

## 4. Geliştirme modu

```
Kullanıcı arayüzü çalışırken izliyor. Uygulama her adımda ayakta kalmalı.

- pnpm dev tek komutla çalışsın ve çalışır kalsın. Derlemeyi bozan bir
  değişiklik yapıldıysa sonraki işe geçmeden düzeltilir.
- Arayüzü etkileyen her adımdan sonra ekran görüntüsü alınır, incelenir,
  düzeltilir, sonra raporlanır. Koyu ve açık temada.
- Raporda hangi URL'lerin gezilebilir olduğu listelenir.
- Yarım kalan ekranda beyaz sayfa veya çökme bırakılmaz.
- Yeni sayfa navigasyondan erişilebilir yapılır.
- Port çakışması, derleme hatası veya çalışmayan sayfa varsa raporun en
  başında bildirilir.

/dev/components sayfası Faz 2'nin ilk gününden ayakta olsun.
```
