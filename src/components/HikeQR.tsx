import { useEffect, useState } from "react";

type Props = {
  hikeId: string;
};

export function HikeQR({ hikeId }: Props) {
  const [qrValue, setQrValue] = useState<string>("");

  useEffect(() => {
    const generate = async () => {
      const res = await fetch(
        `https://YOUR-WORKER.workers.dev/generate?hikeId=${hikeId}`
      );

      const data = await res.json();

      setQrValue(
        JSON.stringify({
          hikeId: data.hikeId,
          token: data.token,
        })
      );
    };

    generate();

    const interval = setInterval(generate, 30000); // QR dynamique
    return () => clearInterval(interval);
  }, [hikeId]);

  if (!qrValue) return <p>Chargement QR...</p>;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    qrValue
  )}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <img src={qrUrl} alt="QR Check-in" className="rounded-lg shadow" />

      <p className="text-sm opacity-70">
        QR valable 30 secondes
      </p>
    </div>
  );
}
