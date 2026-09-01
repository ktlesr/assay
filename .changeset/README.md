# Changesets

Sürüm ve changelog yönetimi. Yayımlanan dört paket `fixed` grubunda: hepsi
aynı sürüm numarasını taşır. Sebep, dördünün tek bir SDK'nın parçaları
olması — `@ktlsr/assay@0.2.0` ile `@ktlsr/assay-core@0.1.7`'yi eşleştirmeye
çalışmak, kullanıcıya çözecek bir bulmaca vermek olurdu.

Değişiklik yaptıktan sonra:

```
pnpm changeset          # değişikliği ve sürüm türünü kaydet
pnpm changeset version  # sürümleri ve CHANGELOG'ları güncelle
```

`web`, `@ktlsr/assay-db` ve `@ktlsr/assay-ui` yayımlanmaz; `ignore`
listesinde.
