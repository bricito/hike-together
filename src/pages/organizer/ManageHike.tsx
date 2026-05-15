import { useEffect, useState } from "react"
import { QRDisplay } from "../../components/QRDisplay"

export default function ManageHike() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const hikeId = window.location.pathname.split("/").pop()

  async function generateQR() {
    setLoading(true)

    const res = await fetch(
      `https://TON-WORKER.generate?hikeId=${hikeId}`
    )

    const data = await res.json()

    setToken(data.token)
    setLoading(false)
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧭 Gestion randonnée</h1>

      <p>Hike ID: {hikeId}</p>

      <button onClick={generateQR} disabled={loading}>
        {loading ? "Génération..." : "Générer QR check-in"}
      </button>

      <div style={{ marginTop: 30 }}>
        {token && <QRDisplay token={token} />}
      </div>
    </div>
  )
}
