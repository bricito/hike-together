import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Clock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  submitReview,
  reviewWindowStatus,
  type PendingReviewTarget,
  type ReviewInput,
} from "@/lib/reviews-api";
import { toast } from "sonner";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)} className="transition-transform hover:scale-110">
          <Star className={`h-6 w-6 transition-colors ${n <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
} 

function BadgePill({ label, emoji, active, onToggle }: { label: string; emoji: string; active: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}>
      <span>{emoji}</span>
      {label}
    </button>
  );
}

function ReviewCard({ target }: { target: PendingReviewTarget }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [punctual, setPunctual] = useState(false);
  const [friendly, setFriendly] = useState(false);
  const [safe, setSafe] = useState(false);
  const [comment, setComment] = useState("");

  const windowStatus = reviewWindowStatus(target.starts_at, target.duration_hours);

  const { mutate, isPending } = useMutation({
    mutationFn: (input: ReviewInput) => submitReview(input),
    onSuccess: () => {
      toast.success("Avis envoyé !");
      queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Une erreur est survenue.");
    },
  });

  const handleSubmit = () => {
    if (rating === 0) { toast.error("Veuillez attribuer une note."); return; }
    mutate({ hike_id: target.hikeId, reviewed_user_id: target.targetUserId, role: target.role, rating, badge_punctual: punctual, badge_friendly: friendly, badge_safe: safe, comment: comment.trim() || undefined });
  };

  const initials = target.targetName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <button type="button" onClick={() => !target.alreadyReviewed && windowStatus === "open" && setOpen((o) => !o)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={target.targetAvatar ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{target.targetName}</p>
          <p className="text-xs text-muted-foreground truncate">{target.hikeTitle}</p>
        </div>
        {target.alreadyReviewed ? (
          <Badge variant="secondary" className="gap-1 shrink-0"><CheckCircle2 className="h-3 w-3 text-green-500" />Noté</Badge>
        ) : windowStatus === "closed" ? (
          <Badge variant="outline" className="gap-1 shrink-0 text-muted-foreground"><Clock className="h-3 w-3" />Expiré</Badge>
        ) : windowStatus === "not_yet" ? (
          <Badge variant="outline" className="gap-1 shrink-0 text-muted-foreground"><Clock className="h-3 w-3" />Pas encore</Badge>
        ) : (
          <span className="text-muted-foreground shrink-0">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
        )}
      </button>

      {open && !target.alreadyReviewed && windowStatus === "open" && (
        <div className="px-4 pb-5 pt-1 space-y-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Note globale</p>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Points forts</p>
            <div className="flex flex-wrap gap-2">
              <BadgePill emoji="⏰" label="Ponctuel" active={punctual} onToggle={() => setPunctual((v) => !v)} />
              <BadgePill emoji="😊" label="Sympa" active={friendly} onToggle={() => setFriendly((v) => !v)} />
              <BadgePill emoji="🦺" label="Prudent" active={safe} onToggle={() => setSafe((v) => !v)} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Commentaire (optionnel)</p>
            <Textarea placeholder="Partagez votre expérience…" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="resize-none text-sm" />
          </div>
          <Button onClick={handleSubmit} disabled={isPending || rating === 0} className="w-full rounded-full">
            {isPending ? "Envoi…" : "Envoyer l'avis"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ReviewSection({ targets }: { targets: PendingReviewTarget[] }) {
  if (targets.length === 0) return null;

  const pending = targets.filter((t) => !t.alreadyReviewed && reviewWindowStatus(t.starts_at, t.duration_hours) === "open");
  const rest = targets.filter((t) => t.alreadyReviewed || reviewWindowStatus(t.starts_at, t.duration_hours) !== "open");

  return (
    <section className="mt-10 space-y-4">
      <div>
        <h2 className="font-display text-xl">Avis à laisser</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Notez vos compagnons de randonnée après chaque sortie.</p>
      </div>
      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map((t) => <ReviewCard key={`${t.hikeId}-${t.targetUserId}`} target={t} />)}
        </div>
      )}
      {rest.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Historique</p>
          {rest.map((t) => <ReviewCard key={`${t.hikeId}-${t.targetUserId}`} target={t} />)}
        </div>
      )}
    </section>
  );
}
