import Link from 'next/link'
import cli from '../../../../packages/cli/package.json'
import { Mark } from './mark'

/**
 * Kolofon.
 *
 * Bir sertifika bağlantı listesiyle bitmez; **künyeyle** biter: yöntem, sürüm,
 * lisans, kimin düzenlediği. Bu sayfa bir sertifika taklidi olduğuna göre
 * altı da öyle bitiyor. Genel amaçlı bir SaaS footer'ı (dört sütun link, sosyal
 * ikonlar, bülten kutusu) bu belgenin dili değil.
 *
 * Burada uydurma bir şey yok (veri gerçekliği sözleşmesi): müşteri sayısı,
 * logo, referans, "10.000 geliştirici" yok. Yalnızca doğrulanabilir olgular —
 * lisans, yayımlanan sürüm, paket adları ve gerçekten var olan sayfalar.
 *
 * Sürüm `packages/cli/package.json`'dan derleme anında okunuyor. Elle yazmak
 * bir sonraki yayında sessizce eskiyecek bir sayı bırakırdı; ölçüm dürüstlüğü
 * satan bir sitede footer'ın yanlış sürümü göstermesi küçük ama utandırıcı bir
 * yalan olurdu.
 */

const SDK_PACKAGES = [
  '@ktlsr/assay',
  '@ktlsr/assay-core',
  '@ktlsr/assay-runner',
  '@ktlsr/assay-adapters',
] as const

const REPO = 'https://github.com/ktlesr/assay'

export function Footer() {
  return (
    <footer className="colophon">
      <div className="colophon-inner">
        <div className="colophon-lead">
          <p className="colophon-word">
            <Mark size={16} />
            <span>Assay</span>
          </p>
          <p className="colophon-line">
            The SDK measures and runs anywhere. This instance only remembers what it was
            given.
          </p>
        </div>

        <nav className="colophon-cols" aria-label="Footer">
          <div className="colophon-col">
            <p className="col-label">SDK</p>
            <ul>
              <li>
                <a
                  className="colophon-link"
                  href="https://www.npmjs.com/package/@ktlsr/assay"
                >
                  Install from npm
                </a>
              </li>
              <li>
                <a className="colophon-link" href={`${REPO}/tree/main/packages/cli`}>
                  CLI reference
                </a>
              </li>
              <li>
                <a className="colophon-link" href={`${REPO}/tree/main/action`}>
                  GitHub Action
                </a>
              </li>
            </ul>
          </div>

          <div className="colophon-col">
            <p className="col-label">Method</p>
            <ul>
              <li>
                <Link className="colophon-link" href="/methodology">
                  Why one score misleads
                </Link>
              </li>
              <li>
                <a
                  className="colophon-link"
                  href={`${REPO}/blob/main/docs/invariants.md`}
                >
                  The rules it will not break
                </a>
              </li>
              <li>
                <a
                  className="colophon-link"
                  href={`${REPO}/blob/main/docs/measurements.md`}
                >
                  Recorded measurements
                </a>
              </li>
            </ul>
          </div>

          <div className="colophon-col">
            <p className="col-label">Source</p>
            <ul>
              <li>
                <a className="colophon-link" href={REPO}>
                  Repository
                </a>
              </li>
              <li>
                <a className="colophon-link" href={`${REPO}/issues`}>
                  Issues
                </a>
              </li>
              <li>
                <a className="colophon-link" href={`${REPO}/blob/main/LICENSE`}>
                  Apache-2.0
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/*
        Künye damgası. Bir tahlil sertifikasının altındaki satırın karşılığı:
        neyin, hangi sürümle, hangi lisansla düzenlendiği. Mono, çünkü bunlar
        kimlik — sayfanın geri kalanındaki hash'ler ve run id'leriyle aynı ses.
      */}
      <p className="colophon-stamp">
        <span className="colophon-stamp-mark" aria-hidden="true">
          <Mark size={13} />
        </span>
        <span>Apache-2.0</span>
        <span aria-hidden="true">·</span>
        <span>SDK {cli.version}</span>
        <span aria-hidden="true">·</span>
        <span className="colophon-stamp-packages">
          {SDK_PACKAGES.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </span>
      </p>
    </footer>
  )
}
