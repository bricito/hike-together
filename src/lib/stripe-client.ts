export async function startCheckout(params: {
  hikeId: string;
  hikeTitle: string;
  priceCents: number;
  currency: string;
  userId: string;
  userEmail: string;
}) {
  const res = await fetch("/api/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Erreur lors de la création du paiement");
  }
  const { url } = await res.json();
  window.location.href = url;
}
