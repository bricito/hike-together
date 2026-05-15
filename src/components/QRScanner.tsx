import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  userId: string;
};

export function QRScanner({ userId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream;

    const startCamera = async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    startCamera();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const fakeScan = async () => {
    // 🔴 ici on simule lecture QR (version simple)
    const input = prompt("Colle le QR JSON ici");

    if (!input) return;

    const { hikeId, token } = JSON.parse(input);

    const { data: hike } = await supabase
      .from("hikes")
      .select("checkin_token")
      .eq("id", hikeId)
      .single();

    if (hike?.checkin_token !== token) {
      alert("QR invalide");
      return;
    }

    await supabase
      .from("hike_participants")
      .update({
        checked_in: true,
        checked_in_at: new Date(),
      })
      .eq("hike_id", hikeId)
      .eq("user_id", userId);

    alert("Check-in OK !");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-72 h-72 bg-black rounded-lg"
      />

      <button
        onClick={fakeScan}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Simuler scan QR
      </button>
    </div>
  );
}
