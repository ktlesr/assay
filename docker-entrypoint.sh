#!/bin/sh
# Açılışta migration, sonra sunucu.
#
# `migrate deploy` yalnızca bekleyen migration'ları uygular ve şema üretmez;
# üretimde `migrate dev`in aksine soru sormaz ve veri düşürmez.
#
# Migration başarısızsa sunucu başlamaz: yarım şemayla açılan bir örnek,
# ölçüm kaydını sessizce yarım saklardı.
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set; refusing to start" >&2
  exit 1
fi

cd packages/db
node node_modules/prisma/build/index.js migrate deploy
cd /app

exec "$@"
