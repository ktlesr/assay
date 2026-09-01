import { rmSync } from 'node:fs'

// Yayın build'i temiz dist ister: geliştirme build'inden kalan test dosyaları
// ve source map'ler tarball'a sızmasın diye.
rmSync('dist', { recursive: true, force: true })
rmSync('.tsbuildinfo.publish', { force: true })
