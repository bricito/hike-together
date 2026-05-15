type Props = {
  token: string
}

export function QRDisplay({ token }: Props) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${token}`

  return (
    <div style={{ textAlign: "center" }}>
      <img src={url} alt="QR Code check-in" />
      <p style={{ marginTop: 10 }}>Token: {token}</p>
    </div>
  )
}
