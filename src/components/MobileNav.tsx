import { Link } from "@tanstack/react-router";
import { Home, Map, PlusCircle, MessageCircle, User, type LucideIcon } from "lucide-react";

type Item = { to: string; label: string; icon: LucideIcon; primary?: boolean };

const items: Item[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/hikes", label: "Map", icon: Map },
  { to: "/create", label: "Create", icon: PlusCircle, primary: true },
  { to: "/login", label: "Messages", icon: MessageCircle },
  { to: "/login", label: "Profile", icon: User },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl">
      <ul className="grid grid-cols-5 h-16">
        {items.map(({ to, label, icon: Icon, primary }) => (
          <li key={label} className="flex">
            <Link
              to={to}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              {primary ? (
                <span className="-mt-6 h-12 w-12 rounded-full bg-[image:var(--gradient-primary)] grid place-items-center text-primary-foreground shadow-[var(--shadow-elegant)]">
                  <Icon className="h-6 w-6" />
                </span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
