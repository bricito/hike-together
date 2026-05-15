import { useParams } from "@tanstack/react-router";

export default function ManageHike() {
  const { id } = useParams({ from: "/hikes/$id/manage" });

  return (
    <div>
      <h1>🧑‍💼 Gestion randonnée</h1>
      <p>Hike ID: {id}</p>

      {/* ici plus tard : QR code + check-in + participants */}
    </div>
  );
}
