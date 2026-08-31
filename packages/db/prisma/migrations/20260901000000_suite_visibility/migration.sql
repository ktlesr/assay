-- Vaka setinin görünürlüğü.
--
-- Varsayılan gizli. Bir koşum kaydı istem metinlerini, araç argümanlarını ve
-- dosya yollarını taşıyor; bunların herkese açık olması varsayılan olamaz.
-- Tanıtım sayfası yalnızca açıkça herkese açık işaretlenmiş vaka setlerinin
-- koşumlarını gösterir.
ALTER TABLE "Suite" ADD COLUMN "public" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Suite_public_idx" ON "Suite"("public");
