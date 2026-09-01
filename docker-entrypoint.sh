#!/bin/sh
# Açılışta ortam doğrulaması, sonra migration, sonra sunucu.
#
# `migrate deploy` yalnızca bekleyen migration'ları uygular ve şema üretmez;
# üretimde `migrate dev`in aksine soru sormaz ve veri düşürmez.
#
# Migration başarısızsa sunucu başlamaz: yarım şemayla açılan bir örnek,
# ölçüm kaydını sessizce yarım saklardı.
set -e

# --- Ortam doğrulaması -------------------------------------------------------
#
# Burada sert duruyoruz. `apps/web/instrumentation.ts` aynı kontrolü uygulama
# içinde de yapıyor ama Next hatayı yakalayıp "Failed to prepare server" yazıp
# süreci ayakta bırakıyor — yani konteyner "çalışıyor" görünüp hiçbir isteğe
# cevap veremiyor. Buradan `exit 1` etmek konteyneri gerçekten düşürüyor ve
# Dokploy eski sürümü ayakta tutuyor.

missing=""
for var in DATABASE_URL AUTH_SECRET AUTH_URL; do
  eval "value=\$$var"
  if [ -z "$value" ]; then
    missing="$missing  - $var\n"
  fi
done

if [ -n "$missing" ]; then
  echo "Eksik ortam değişkeni, sunucu başlatılmadı:" >&2
  printf "$missing" >&2
  echo "Değerler Dokploy'un ortam değişkenleri ekranına girilir (docs/deploy.md)." >&2
  exit 1
fi

case "$AUTH_URL" in
  */) echo "AUTH_URL sonunda eğik çizgi olmamalı: $AUTH_URL" >&2
      echo "Eğik çizgi, OAuth geri dönüş adresinin sağlayıcıdaki kayıtla eşleşmemesine yol açar." >&2
      exit 1 ;;
esac

case "$AUTH_URL" in
  https://*|http://localhost*) ;;
  *) echo "AUTH_URL https olmalı: $AUTH_URL" >&2
     echo "Uygulama HSTS gönderiyor; HTTPS olmayan bir dış adres oturum çerezini kırar." >&2
     exit 1 ;;
esac

# --- Migration ---------------------------------------------------------------

cd packages/db
node node_modules/prisma/build/index.js migrate deploy
cd /app

exec "$@"
