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

## Palet — altı isimli renk

Tahlil ocağından: pota, kâğıt, altın boncuk, patinalı bakır, pas, antimon.

| Ad | Hex | Rol |
|---|---|---|
| Crucible | `#141310` | koyu zemin — pota |
| Paper | `#F5F2EB` | açık zemin — laboratuvar kâğıdı |
| Assay Gold | `#B08528` | tek vurgu. Odak halkası ve marka çizgisi; **buton dolgusu asla** |
| Verdigris | `#2E6F55` | pass — patinalı bakır, arayüz yeşili değil |
| Iron Oxide | `#A33B2A` | fail — pas, alarm kırmızısı değil |
| Antimony | `#5B6B8A` | unknown — soğuk arduvaz mavisi |

**Antimon neden.** `unknown` yeşile de kırmızıya da yakın olamaz (bağlayıcı
kısıt). Soğuk mavi-gri ikisinden de eşit uzakta ve nötr; ama açık/koyu iki
temada da metinden ayrışacak doygunlukta, yani görmezden gelinemiyor. Antimon
tahlilde gerçekten kullanılan bir metal — paletin geri kalanıyla aynı dünyadan.

**Şekil de ayrışır:** pass `●`, fail `✕`, unknown `◐`. Yarım dolu daire
"kısmen bilinen" demek; renk kaldırılsa bile anlam duruyor.

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

## Kendi planımın eleştirisi

Planı yazdıktan sonra "bunun hangi kısmı herhangi bir SaaS için de
üretebileceğim genel bir varsayılan?" diye baktım. Beş şey çıktı, beşi de
değişti.

**1. "Sıcak kâğıt + koyu mürekkep + altın vurgu" premium editoryal şablonuna
çok yakındı.** Düzeltme: altını **nadir** yaptım — yalnızca odak halkası ve
marka. Hiçbir butonun dolgusu değil. Ve baskın görsel öğe renk değil **çizgi**
oldu; veri görünümlerinde kart zemini tamamen kaldırıldı.

**2. Verdict rozetleri dolgulu pill'di.** Pill bir SaaS varsayılanı.
Düzeltme: dolgu ve zemin kaldırıldı; verdict artık sabit genişlikte bir
sütunda duran **işaret + küçük kapital sözcük** — laboratuvar defterindeki
kontrol listesi gibi.

**3. `── LABEL ──────` başlığını dekoratif tire dizisi olarak yazacaktım.**
Düzeltme: gerçek bir hairline, `flex: 1` ile kabın kenarına kadar gidiyor.
Metin süsü değil, çizgi.

**4. Metrik satırı "sayı + N" idi — bariz olan.** Düzeltme: aralık sayıdan
**daha fazla yatay alan** alıyor. Belirsizliğin genişliği önce okunuyor.
N=3'teki bir %100 ile N=200'deki bir %100 aynı görünmemeli.

**5. Hareket olarak scroll'da fade-in-up düşünmüştüm.** Bu her yerde var.
Düzeltme: sayfa yüklenirken **hiçbir şey kaymıyor**. Tek hareket, güven
aralıklarının merkezden dışa çizilmesi — ibrenin yerine oturması. Bir kez.
`prefers-reduced-motion` ile 1ms'ye iniyor.

Sonuncusu akılda kalan detay: **aralıklar bir alet ibresi gibi yerine
oturuyor.**

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
- Yuvarlaklık 2px — neredeyse keskin. Yuvarlak köşe bu belgenin dili değil.
- Sayılar her yerde tabular; bir sütundaki rakamlar hizalanır.
