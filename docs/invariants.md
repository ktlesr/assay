# Değişmezler

Bunlar tercih değil, ürünün ölçüm iddiasını ayakta tutan kurallar. Bir
uygulama önerisi bunlardan birini ihlal ediyorsa **uygulamadan önce dur ve
bildir.**

Her değişmez için: kural, neden var, ihlal edildiğinde ne olur.

---

## 1. Verdict üç durumlu

`pass` / `fail` / `unknown`. Sinyal alınamadıysa sonuç `unknown` olur.
Sessiz `pass` yasaktır.

**Neden.** Bir test aracının en tehlikeli hatası, ölçemediğini "geçti"
diye raporlamaktır. Adaptör tetiklenme sinyalini okuyamadıysa, sandbox
çöktüyse, host araç izini vermiyorsa — elde olan şey bilgisizliktir,
başarı değil.

**İhlal edilirse.** Kullanıcı ölçülmemiş bir skill'i ölçülmüş sanır. Assay
bir kez bunu yaparsa ürünün tek satılabilir özelliği — güvenilirlik —
biter.

**Pratikte.** `unknown` bir hata durumu değil, birinci sınıf bir sonuç.
Raporda ayrı sayılır, ayrı gösterilir, CI'da ayrı ele alınır.

---

## 2. Karşılaştırma dört pin ister

Bir koşum kaydı şunları taşımadan başka bir koşumla karşılaştırılamaz:

1. **Skill sürümü** — içerik hash'i veya commit SHA'sı
2. **Model kimliği** — tam model kimliği, "en son" değil
3. **Sistem promptu hash'i** — host ortamının verdiği sistem promptunun
   hash'i
4. **Vaka seti sürümü** — suite dosyasının sürümü/hash'i

**Neden.** Regresyon iddiası "aynı koşullarda sonuç değişti" demektir.
Koşullardan biri sessizce kaydıysa gözlenen fark regresyon değil,
gürültüdür. Skill değişmeden model güncellendiği için düşen bir skor,
regresyon diye raporlanırsa kullanıcı yanlış yeri tamir eder.

**İhlal edilirse.** Regresyon raporları güvenilmez olur; kullanıcı
alarmları görmezden gelmeye başlar.

**Pratikte.** Pinlerden biri eksik veya farklıysa karşılaştırma
yapılmaz, `unknown` üretilir ve hangi pinin kaydığı yazılır.

---

## 3. Tekrar sayısı varsayılanı asla 1 değil

`--repeat` varsayılanı 1'den büyüktür.

**Neden.** Skill davranışı deterministik değil. Tek koşum bir gözlemdir,
ölçüm değil. N=1 ile alınan "geçti" sonucu, %60 geçiş oranına sahip bir
skill için de aynı görünür.

**İhlal edilirse.** Kararsız skill'ler kararlı görünür. Assay'in en
ayırt edici katmanı (flakiness) işlevsiz kalır.

**Pratikte.** Kullanıcı isterse `--repeat 1` yazabilir; varsayılan olarak
alamaz. Tek koşumlu sonuç raporda kararsızlık ölçüsü olmadan işaretlenir.

---

## 4. Hiçbir oran, N ve güven aralığı olmadan gösterilmez

Ekranda, CLI çıktısında, JSON raporunda ve API'de her oran yanında koşum
sayısını ve güven aralığını taşır.

**Neden.** "%80 geçti" cümlesi 5 koşumda ve 500 koşumda aynı görünür ama
bambaşka şeyler söyler. Çıplak yüzde, belirsizliği gizleyerek okuyucuyu
yanıltır.

**İhlal edilirse.** Ürün, ölçüm aracı olmaktan çıkıp güven telkin eden bir
gösterge paneline dönüşür.

**Pratikte.** Görsel biçim: `%80 (N=10, %95 GA: %49–%94)`. N küçükken
aralık geniş çıkar; bu bir kusur değil, dürüstlüktür.

---

## 5. Tetiklenme suite'i negatif ve yakın-komşu vakası içermek zorunda

Yalnızca pozitif vaka içeren bir tetiklenme suite'i **geçersizdir** ve
doğrulayıcı tarafından reddedilir.

**Neden.** Her istekte tetiklenen bir skill, tüm pozitif vakaları geçer ve
mükemmel görünür. Tetiklenme doğruluğunun asıl sorusu ne zaman
tetiklenmediğidir. Yakın komşu vakası — benzeyen ama kapsam dışı istek —
gerçek ayrım gücünü ölçen tek şeydir.

**İhlal edilirse.** Suite, ölçmesi gereken hatayı yapısal olarak
göremez. Yanlış güvenlik hissi üretir.

**Pratikte.** Şema seviyesinde zorlanır: en az bir `expect: not_triggered`
vakası olmayan tetiklenme suite'i doğrulama hatası verir.

---

## 6. v0'da LLM judge yok

Skorlama yalnızca deterministik assertion'larla yapılır: dosya varlığı,
yapı ve şema kontrolü, metin/regex eşleşmesi, araç çağrısı izi, sayısal
eşik.

**Neden.** Bir LLM'i başka bir LLM'in çıktısını yargılamak için kullanmak,
ölçüm zincirine ikinci bir kararsızlık kaynağı ekler. Aracın kendisi flaky
olursa flakiness ölçemez. Ayrıca judge, ölçümü açıklanamaz kılar:
"neden fail" sorusunun cevabı bir modelin görüşü olur.

**İhlal edilirse.** Assay'in deterministik CI aracı konumlandırması çöker;
kalabalık "LLM eval" kategorisine düşer.

**Pratikte.** Judge gerektiren bir ölçüm ihtiyacı çıkarsa v0'da o ölçüm
yapılmaz. Roadmap'e yazılır. Deterministik olarak ifade edilemeyen kabul
kriteri, henüz test edilebilir kriter değildir.
