-- 0.4.8 — bağlamın pini: host'un yüklediği talimat dosyalarının hash'i.
--
-- Ölçüldü: aynı vaka setiyle, aynı dört pinle ve aynı ortam hash'iyle koşulmuş
-- beş kol birbiriyle `within_noise` karşılaştırılıyordu; aralarındaki tek fark
-- çalışma dizininin üstündeki talimat dosyasının içeriğiydi ve hiçbir pin onu
-- taşımıyordu (roadmap 0.4.8).
--
-- NULL = bağlam ÖLÇÜLMEDİ (0.4.5 öncesi kayıt ya da host'un ölçüm kancası
-- koşmadı). "Temiz" demek değil ve karşılaştırmayı durduruyor: o koşumlarda
-- bağlama ne girdiği gerçekten bilinmiyor. Geriye dönük doldurma YAPILMIYOR —
-- bir değer uydurmak, bilinmeyeni bilinen gibi göstermek olurdu.
ALTER TABLE "Run" ADD COLUMN "pinContextHash" TEXT;

-- Boş string hash değildir; NULL ile aynı şeyi söyleyip farklı görünürdü ve
-- `comparePins` onu yer tutucu sayıp yine durdururdu.
ALTER TABLE "Run"
  ADD CONSTRAINT "run_context_hash_not_blank"
  CHECK ("pinContextHash" IS NULL OR btrim("pinContextHash") <> '');
