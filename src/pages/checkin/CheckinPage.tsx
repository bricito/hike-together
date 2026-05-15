import { useEffect, useState } from "react"

export default function CheckinPage() {
  const [status, setStatus] = useState("loading")

  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get("token")

  // exemple user (remplace par Supabase auth)
  const userId = "demo-user"

  useEffect(() => {
    async function checkin() {
      if (!token) {
        setStatus("missing token")
        return
      }

      const res = await fetch(
        `https://TON-WORKER.checkin?token=${token}&userId=${userId}`
      )

      const data = await res.json()

      if (data.success) {
        setStatus("✅ Check-in validé")
      } else {
        setStatus("❌ " + data.error)
      }
    }

    checkin()
  }, [])

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>Check-in randonnée</h1>
      <p>{status}</p>
    </div>
  )
}
