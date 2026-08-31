export default function Home() {
  return (
    <main>
      <span className="badge">Faz 0 — fizibilite</span>
      <h1>Assay</h1>
      <p>
        AI ajan skill&apos;lerinin gerçekten çalışıp çalışmadığını ölçer. Agent Skills
        için CI test koşum aracı — genel amaçlı LLM eval aracı değil.
      </p>
      <div className="empty">
        <strong>Henüz koşum yok</strong>
        {/* Veri gerçekliği: uydurma sayı yerine boş durum. */}
        <p>Hosted katman Faz 2&apos;de geliyor. Ölçüm önce CLI&apos;da kanıtlanacak.</p>
      </div>
    </main>
  )
}
