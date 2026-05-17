type Props = {
  hikeId: string;
  token: string;
};

export function QRDisplay({ hikeId, token }: Props) {
  const url = `${window.location.origin}/checkin?hikeId=${hikeId}&token=${token}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <img src={qrUrl} alt="QR Check-in" className="rounded-2xl shadow-md" width={280} height={280} />
      <p className="text-xs text-muted-foreground text-center max-w-xs break-all">{url}</p>
    </div>
  );
}
