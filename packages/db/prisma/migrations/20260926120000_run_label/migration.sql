-- 0.4.7 — koşumun insan tarafından verilen adı.
--
-- Aynı vaka setiyle koşulan iki kol (aynı suite hash'i, aynı dört pin, aynı
-- aktivasyon sayıları) kayıtta ayırt edilemiyordu; ölçüldü: ifade bağlama
-- deneyinin beş kolu sitede aynı sayfa gibi görünüyor (roadmap 0.4.7).
--
-- **Pin değil ve hiçbir hash'e girmiyor.** Etiketin denetçisi yok: metnin
-- kendisi beyandır. Karşılaştırmayı koşullar durdurur, etiket değil.
ALTER TABLE "Run" ADD COLUMN "label" TEXT;

-- Boş etiket null ile aynı şeyi söyleyip farklı görünürdü. Üst sınır
-- `LABEL_MAX_LENGTH` ile aynı: etiket künyede tek satır, o yüzden satır sonu
-- ve kontrol karakteri de reddediliyor. `[[:cntrl:]]` POSIX sınıfı; `\u…`
-- kaçışları normal bir dizgide harfi harfine okunur ve kontrol yerine `u`,
-- `0`, `f` karakterlerini yasaklardı.
ALTER TABLE "Run"
  ADD CONSTRAINT "run_label_shape"
  CHECK (
    "label" IS NULL
    OR (btrim("label") <> '' AND length("label") <= 120 AND "label" !~ '[[:cntrl:]]')
  );
