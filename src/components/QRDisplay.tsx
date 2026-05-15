import QRCode from "react-qr-code";

export default function QRCodeDisplay({ hikeId, token }) {
  const url = `${window.location.origin}/checkin?hike_id=${hikeId}&token=${token}`;

  return (
    <div className="bg-white p-4">
      <QRCode value={url} />
      <p className="text-xs mt-2">{url}</p>
    </div>
  );
}
