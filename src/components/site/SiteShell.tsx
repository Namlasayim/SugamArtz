import { Link } from "@tanstack/react-router";
import { Heart, Instagram, Menu, MessageCircle, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSettings, whatsappLink, instagramLink } from "@/lib/site";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/gallery", label: "Gallery" },
  { to: "/sold", label: "Sold Works" },
  { to: "/custom", label: "Commissions" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/track-order", label: "Track Order" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  const { settings } = useSettings();
  const { count } = useWishlist();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:h-20 lg:px-10">
        <Link to="/" className="group flex flex-col leading-none" onClick={() => setOpen(false)}>
          <span className="font-display text-xl tracking-[0.14em] text-foreground sm:text-2xl">
            {settings.artist_name.toUpperCase()}
          </span>
          <span className="eyebrow mt-1 hidden sm:block">Original Paintings · Nepal</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-[0.8rem] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/wishlist"
            aria-label={`Wishlist, ${count} saved`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary"
          >
            <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[10px] font-medium text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <a
            href={whatsappLink(settings.whatsapp_number)}
            target="_blank"
            rel="noreferrer"
            aria-label="Message the artist on WhatsApp"
            className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary sm:inline-flex"
          >
            <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary lg:hidden"
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border/70 bg-background transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <nav className="flex flex-col px-5 py-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="border-b border-border/50 py-3.5 text-sm tracking-[0.12em] uppercase last:border-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  const { settings } = useSettings();
  return (
    <footer className="mt-24 border-t border-border bg-canvas">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div className="sm:col-span-2">
          <h2 className="font-display text-2xl tracking-[0.1em]">{settings.artist_name}</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {settings.artist_statement}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">{settings.location}</p>
        </div>
        <div>
          <p className="eyebrow">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV.slice(0, 4).map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Reach the studio</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                href={whatsappLink(settings.whatsapp_number)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} /> WhatsApp
              </a>
            </li>
            <li>
              <a
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                href={instagramLink(settings.instagram_username)}
                target="_blank"
                rel="noreferrer"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.5} /> @{settings.instagram_username}
              </a>
            </li>
            <li>
              <a
                className="text-muted-foreground transition-colors hover:text-foreground"
                href={`mailto:${settings.contact_email}`}
              >
                {settings.contact_email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto max-w-7xl px-5 py-6 text-xs text-muted-foreground lg:px-10">
          © {new Date().getFullYear()} {settings.artist_name}. All artworks are original and one of a kind.
        </div>
      </div>
    </footer>
  );
}