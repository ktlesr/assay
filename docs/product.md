# Assay — Ürün Tanımı

## Sorun

Agent skill'leri README ile dağıtılıyor. Bir skill "PDF'leri ayrıştırır"
diyor; gerçekte hangi PDF'lerde çalıştığı, hangi istekte tetiklendiği,
yanlış istekte tetiklenip tetiklenmediği, iki gün sonra aynı sonucu verip
vermediği bilinmiyor. Skill ekosisteminde paket yöneticisi var, test
koşucusu yok.

İkinci sorun: skill'lerin doğruluğu deterministik değil. Aynı skill aynı
girdiyle iki farklı sonuç üretebilir. Tek koşumla "çalışıyor" demek
ölçüm değil, gözlem.

Üçüncü sorun: skill'ler yalnız yaşamıyor. Bir kurulumda on skill birlikte
duruyor ve birbirinin tetiklenmesini bozuyor. Kimse bunu ölçmüyor.

## Konumlandırma

**Agent Skills için CI test koşum aracı.** Jest / Playwright ne ise, Assay
skill'ler için o.

Bilinçli olarak *olmadığı* şeyler:

- Genel amaçlı LLM eval platformu değil. Prompt A/B testi yapmıyor.
- Model benchmark'ı değil. Modelleri değil, skill'leri ölçüyor.
- Gözlemlenebilirlik (observability) aracı değil. Üretim trafiğini değil,
  vaka setini koşuyor.
- LLM-judge tabanlı skorlama motoru değil (v0'da judge yok).

Bu daralma bir kısıt değil, ürünün kendisi. Genel amaçlı eval alanı
kalabalık; skill'in tetiklenip tetiklenmediğini ölçen kimse yok.

## Hedef kullanıcı

**Birincil — skill yazarı.** Bir skill yayımlıyor, sürüm çıkarıyor,
kırmadığından emin olmak istiyor. `assay run` ile yerelde koşuyor,
GitHub Action ile PR'da koşuyor.

**İkincil — skill'e bağımlı ekip.** İç araç akışları belirli skill'lere
dayanıyor. Model güncellendiğinde veya bir skill sürümü yükseldiğinde
neyin bozulduğunu görmek istiyorlar.

**Üçüncül — skill dağıtan platform.** Kataloğuna aldığı skill'ler için
ölçülmüş bir kalite sinyali istiyor.

Üçünde de alıcı, "bu skill iyi mi" değil, **"bu skill dün çalıştığı gibi
bugün de çalışıyor mu"** sorusunu soruyor. Assay bir kalite yargısı değil,
bir regresyon sinyali satıyor.

## İki parçalı mimari

### SDK — ölçen taraf (Apache-2.0)

Vaka setini okur, skill'i bir host ortamında sandbox içinde koşar, ham izi
kanonik bir kayda dönüştürür, assertion'ları uygular, verdict üretir.

Platform olmadan tam çalışır. Yerel dosya sistemine yazar, CI'da koşar,
çıktısını JSON olarak verir. Ücretsiz ve açık kalması stratejik: ölçüm
katmanı kapalı olursa kimse ölçüme güvenmez.

Sınır: SDK **tek koşumu** bilir. Geçmişi bilmez.

### Hosted platform — hatırlayan taraf

Koşumları saklar, sürümler arası karşılaştırır, regresyonu işaretler,
ekibe gösterir. Değeri zamanla birikir: ilk koşumda sıfır, ellinci koşumda
yüksek.

Sınır: platform ölçmez. Ölçümü SDK yapar, platform onu hatırlar. Bu ayrım
kasıtlı; ölçüm mantığı platforma taşınırsa açık kaynak SDK sakat kalır ve
güven kaybolur.

### Sınırın makine seviyesinde zorlanması

`packages/core` hiçbir şeye bağımlı değil. `apps/web` runner'a doğrudan
bağlanmaz. Bu bağımlılık kuralları lint seviyesinde zorlanır, iyi niyete
bırakılmaz.

## Ölçüm katmanları

### 1. Tetiklenme doğruluğu

Skill doğru istekte devreye giriyor, yanlışta girmiyor mu? Bir skill'in en
sık kırıldığı yer burası ve neredeyse hiç test edilmiyor.

Suite üç tür vaka içerir:
- **Pozitif** — tetiklenmesi gereken istek.
- **Negatif** — tetiklenmemesi gereken alakasız istek.
- **Yakın komşu** — tetiklenmemesi gereken ama benzeyen istek. Asıl sinyal
  burada. Negatifsiz bir suite geçersizdir (bkz. invariants).

### 2. Görev tamamlama

İş bittiğinde ortaya çıkan artefakt doğru mu? Dosya oluştu mu, içeriği
beklenen yapıda mı, çıktı şemaya uyuyor mu.

v0'da yalnızca deterministik assertion: dosya varlığı, yapı kontrolü,
şema doğrulama, metin eşleşmesi. LLM judge yok.

### 3. Araç çağrısı izi

Beklenen araçlar beklenen sırada mı çağrıldı? Doğru cevap üreten ama
yanlış yoldan giden skill, yarın kırılacak skill'dir.

### 4. Yan etkiler ve güvenlik

İzin verilmeyen bir dosyaya, ağ adresine, komuta dokundu mu? Sandbox'ın
gözlemlediği her yan etki kayda geçer. Bu katman aynı zamanda bir güvenlik
sinyalidir: prompt injection ile skill'in sınır dışına çıkıp çıkmadığını
ölçer.

### 5. Kararsızlık (flakiness)

Aynı girdi N kez koşulduğunda sonuç ne kadar sapıyor? Tek koşum bir gözlem,
N koşum bir ölçümdür. Bu yüzden tekrar varsayılanı asla 1 değil.

Çıktı: geçiş oranı + N + güven aralığı. Çıplak yüzde gösterilmez.

### 6. Regresyon

Skill'in yeni sürümü eskisine göre nerede geriledi? Dört pin sabitken iki
koşum karşılaştırılabilir; pinlerden biri kayarsa karşılaştırma anlamsızdır
ve `unknown` üretilir.

### 7. Maliyet ve gecikme

Token ve süre bütçesi içinde mi? Doğru ama on kat pahalı skill, üretimde
kullanılamayan skill'dir.

## Roadmap

Fazların tam sırası ve geçiş kriterleri: [roadmap.md](roadmap.md).

### Faz 0 — Fizibilite
Assay'in gerçekte hangi sinyalleri ölçebildiğini belirler. Kritik bilinmez:
host ortamları tetiklenme ve araç izi sinyalini dışarıya veriyor mu? Bu
fazın çıktısı git/gitme kararıdır.

### Faz 1 — CLI ürünü
`assay run` gerçek bir skill'i güvenilir ölçüyor. Sandbox, adaptör, yerel
store, CLI, GitHub Action, kendi üzerinde dogfooding.

### Faz 2 — Hosted katman
Geçmiş, dashboard, hesap. Regresyon karşılaştırması burada anlam kazanır.

### Faz 3 — Sağlamlaştırma
Güvenlik incelemesi, test kapsamı, deploy.

### Sonraki dalga

Faz 3'ten sonra değerlendirilecek, şimdi yapılmayacak:

- **Skill coexistence / collision testing.** On skill bir arada kurulu
  olduğunda tetiklenme doğruluğu nasıl değişiyor? Tek skill'i ölçmek kolay
  kısım; ekosistem sorunu çakışmada.
- **Model update certification.** Model sürümü değiştiğinde skill setinin
  hangi kısmının kırıldığını raporlayan koşum.
- **Çapraz-host uyumluluk matrisi.** Aynı skill farklı host ortamlarında
  aynı sonucu veriyor mu?
- **Skill kalite rozeti.** Ölçülmüş, tarihli, pinlenmiş; pazarlama rozeti
  değil.

Bu dört başlık roadmap'te durur, Faz 0–3 boyunca uygulanmaz.
