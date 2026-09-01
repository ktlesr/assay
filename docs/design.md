# Tasarım Dili

**Adım:** 2.2 · Tokenlar `packages/ui/src/tokens.css`, tema geçişi
`packages/ui/src/theme.ts`.

## Konsept — tahlil sertifikası

Metalürjik tahlilde numune laboratuvara gider ve geri bir **sertifika** gelir:
numunenin kimliği, kullanılan yöntem, ölçülen değer ve **belirsizliği**.
Gösterge paneli değil, kayıt belgesi. İmzalı, tarihli, savunulabilir.

Arayüz bu belgeyi taklit eder. Üç somut sonucu var:

1. **Veri kutularda değil, çizgilerde durur.** Kart yok. Basılı bir tablonun
   cetvel çizgileri var.
2. **Güven aralığı çizilmiş bir açıklıktır**, metin süsü değil: `├────┤`.
   Okuyucu sayıyı okumadan önce belirsizliğin genişliğini görür.
3. **Verdict bir renk lekesi değil**, işaret + küçük kapital sözcük. Renk
   körlüğünde de ayrışır.

## Palet — ölçüm dışında renk yok

Arayüzün kendisi **akromatik**: soğuk grafit ve soğuk kâğıt, aradaki her ton
nötr. Kroma yalnızca ölçümde görünüyor — verdict işareti, güven aralığı, kayan
koşul.

| Rol | Açık | Koyu |
|---|---|---|
| Zemin | `#F1F3F3` | `#0B0D0E` |
| Yükseltilmiş | `#FFFFFF` | `#121617` |
| Mürekkep | `#0D1112` | `#EDF1F2` |
| Çizgi | `#D2D8D8` | `#1F2527` |
| pass | `#0E7350` | `#58C091` |
| fail | `#B03826` | `#EC8172` |
| unknown | `#4D5F80` | `#92A4C2` |

Bunun iki sonucu var:

1. **Ekranda bir renk gördüyseniz o bir ölçüm sonucudur.** Marka değil, süs
   değil, "birincil eylem" değil. Renk burada bir sözcük.
2. Kroma nadir olduğu için az doygunlukla bile bağırıyor; verdict renkleri neon
   olmak zorunda kalmıyor.

**Vurgu rengi yok.** Vurgu mürekkebin kendisi: odak halkası, satır işareti ve
buton kenarı tam kontrast. Bir marka rengi eklemek, renge ikinci bir anlam
yüklemek ve birinciyi zayıflatmak olurdu.

**İlk palet neden atıldı.** Sıcak krem zemin + koyu kahve + altın vurgu
denendi. Ölçüm aleti değil dergi kapağı gibi duruyordu ve o kombinasyon şu an
her yerde. Değişen konsept değil, sıcaklık: aynı sertifika, soğuk mürekkeple
basılmış.

**Antimon neden kaldı.** `unknown` yeşile de kırmızıya da yakın olamaz
(bağlayıcı kısıt). Soğuk arduvaz mavisi ikisinden de eşit uzakta ve iki temada
da metinden ayrışıyor, yani görmezden gelinemiyor.

**Şekil de ayrışır:** pass dolu çember, fail çember içinde çarpı, unknown yarısı
dolu çember. Renk kaldırılsa bile üçü ayrışır.

## İkonlar — çizilmiş, glif değil

Unicode glifleri (`●`, `✕`, `◐`, `→`) ikon değildir: her yazı tipinde farklı
boyda, farklı ağırlıkta ve farklı taban çizgisinde otururlar. Set
`packages/ui/src/icons.tsx` içinde 16×16 ızgarada, 1.5 birim tek bir kalem
kalınlığıyla ve `currentColor` ile çizildi.

Verdict işaretleri tek bir aileden: aynı çember, içi farklı. Tema düğmesi tek
bir ikon — güneş, ay, ekran — ve tıkladıkça sıradakine dönüyor; üç düğmelik bir
grup, üç durumun ikisini her zaman gereksiz gösteriyor ve dar ekranda başlığı
sıkıştırıyordu.

## Anlaşılırlık — bir oran üç kayıtta okunur

Bağlayıcı kısıt "hiçbir oran N ve güven aralığı olmadan gösterilmez" diyor. Bu
onu karşılamanın ötesinde bir okuma sırası:

1. **sayım, düz cümleyle** — "20 denemenin 14'ünde tetiklendi"
2. **yüzde**, büyük ve tabular
3. **aralık**, çizilmiş, uçlarındaki sayılarla ve genişliğinin ne dediğiyle

İstatistik bilmeyen okuyucu birinci satırda cevabı alıyor; bilen üçüncüde
belirsizliğin genişliğini görüyor. Hiçbiri diğerinin yerine geçmiyor.

Koşum ekranının en üstünde **hüküm** var: işaret, sözcük ve tek bir düz cümle
("10 isteğin 2'sini kaçırdı — skill sessiz kaldı ve modelin kendisi cevapladı").
Sayfadan tek bir şey okunacaksa o okunuyor.

## Tipografi

| Rol | Aile | Neden |
|---|---|---|
| Başlık | **Instrument Serif** | Yüksek kontrastlı, kazınmış hissi; sertifika başlığı |
| Gövde/arayüz | **IBM Plex Sans** | Ölçüm ve makine kimliği için tasarlanmış; gerçek tabular rakamlar |
| Veri/kimlik | **IBM Plex Mono** | Sans ile aynı iskelet: run kimliği ile etiket aynı sesle konuşur |

Plan başlangıç noktası olarak Fraunces + Inter öneriyordu; ikisi de değişti.

**Fraunces yerine Instrument Serif.** Fraunces yumuşak, hümanist ve sıcak —
bir dergi kapağı. Ölçüm aleti değil. Instrument Serif yüksek kontrastlı ve
kazınmış duruyor; adı da yerinde.

**Inter yerine IBM Plex.** Inter'in tabular rakamları var ama karakteri yok ve
her arayüzde duruyor. Plex, kimliği ölçüm ve makine olan bir şirket için
tasarlandı; ayrıca mono kardeşi aynı iskeleti paylaşıyor, bu da sertifika
dilinde önemli: bir hash ile bir etiket yabancı görünmüyor.

## Düzen

```
 Assay  AGENT SKILL MEASUREMENTS                    [LIGHT DARK SYSTEM]
 ─────────────────────────────────────────────────────────────────────

 RUNS ────────────────────────────────────────────────────────────────

 ✕   xlsx  claude-haiku-4-5-20251001 · 10 runs per case          ✕ FAIL
     trigger recall 70% (N=20, 95% CI 48%–85%)
 ─────────────────────────────────────────────────────────────────────
 ●   pdf   claude-haiku-4-5-20251001 · 10 runs per case          ● PASS
     trigger recall 100% (N=20, 95% CI 84%–100%)

 MEASUREMENTS ────────────────────────────────────────────────────────

 PRECISION   ├────────────◆──────┤        100% (N=20, 95% CI 84%–100%)
 RECALL      ├──────◆────┤                 70% (N=20, 95% CI 48%–85%)
```

Bölüm başlığı: etiket, sonra sayfanın kenarına kadar giden hairline. Veri
satırları kutu içinde değil, aralarında cetvel çizgisiyle.

## İki kez atılan varsayılan

İlk taslak "sıcak kâğıt + koyu mürekkep + altın vurgu" idi. Yazdıktan sonra
"bunun hangi kısmı herhangi bir SaaS için de üretebileceğim genel bir
varsayılan?" diye baktım; beş şey çıktı ve beşi de değişti. Sonra arayüz gerçek
ekranlarda görülünce **paletin kendisi** de atıldı.

**1. Sıcak krem + altın premium editoryal şablonuna çok yakındı.** Önce altın
nadirleştirildi; sonra tamamen kaldırıldı. Vurgu artık mürekkebin kendisi ve
kroma yalnızca ölçümde.

**2. Verdict rozetleri dolgulu pill'di.** Pill bir SaaS varsayılanı. Dolgu ve
zemin kaldırıldı; verdict artık çizilmiş bir işaret + küçük kapital sözcük.

**3. `── LABEL ──────` başlığını dekoratif tire dizisi olarak yazacaktım.**
Gerçek bir hairline oldu, `flex: 1` ile kabın kenarına kadar. Metin süsü değil,
çizgi.

**4. Metrik satırı "sayı + N" idi — bariz olan.** Artık üç kayıt: sayım cümlesi,
yüzde, çizilmiş aralık. Aralık sayıdan daha fazla yatay alan alıyor; N=3'teki
bir %100 ile N=200'deki bir %100 aynı görünmüyor.

**5. Hareket olarak scroll'da fade-in-up düşünmüştüm.** Bu her yerde var. Tek
hareket kaldı ve o da ölçümün kendisini anlatıyor.

**6. Unicode glifleri ikon sanılmıştı.** `●`, `✕`, `→` her yazı tipinde farklı
oturuyor. Set çizildi.

## Hareket — yazılmış tek an

Sayfa yüklenirken hiçbir bölüm kaymıyor, hiçbir şey sırayla belirmiyor. Tek
yazılı an güven aralığının **ölçülen noktadan dışa açılması**: bir aletin
ibresinin yerine oturması. 560 ms, `cubic-bezier(0.16, 1, 0.3, 1)`, grup içinde
45 ms gecikmeyle ve toplam 270 ms'de sınırlı.

Anlamı var: önce değer, sonra o değerin ne kadar belirsiz olduğu. `clip-path`
ile yapılıyor, `scaleX` ile değil — `scaleX` uç seriflerini de gerer ve aralık
lastik gibi görünürdü.

Geri bildirim ayrı ve kısa (140 ms): satır vurgusu, buton kenarı, tema
ikonunun yer değiştirmesi. Kullanıcı akışın içinde; uzun geri bildirim gecikme
gibi hissettiriyor.

`prefers-reduced-motion` ile hepsi 1 ms'ye iniyor ve son durum aynı kalıyor.

## Tema geçişi

Üç durum: `light`, `dark`, `system`. Seçim `localStorage`'da.

Flash yok: `themeScript` `<head>` içinde inline, boyamadan önce `data-theme`
yazıyor. `localStorage` erişimi gizli sekmede fırlatabildiği için try/catch
şart — yoksa sayfa hiç boyanmazdı.

Koyu tema sonradan eklenmiş bir "dark mode" değil, aynı belgenin gece baskısı:
kontrast oranları açık temayla eşdeğer tutuldu, palet yeniden ayarlandı
(sadece ters çevrilmedi).

## Bağlayıcı yasaklar

- Gradient yok.
- Yumuşak gölge yok. Derinlik gölgeyle değil çizgiyle anlatılıyor.
- Dolgulu rozet yok.
- Renkli kalın sol kenar çubuğu yok. Kenar notu, üstünde ince bir çizgi ve sol
  boşlukta bir işaretle ayrışır.
- Marka vurgu rengi yok. Kroma ölçüme ayrılmıştır.
- Unicode glifi ikon yerine geçmez.
- Başlığın üstünde etiket (eyebrow) yok. Başlık kendi ağırlığını taşır.
- Yuvarlaklık 2px — neredeyse keskin. Yuvarlak köşe bu belgenin dili değil.
- Sayılar her yerde tabular; bir sütundaki rakamlar hizalanır.
