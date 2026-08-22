import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-line bg-ivory-texture">
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brass text-brass font-display italic text-lg">
            A
          </span>
          <span className="font-display text-xl tracking-wide text-forest">
            The Aldervale
          </span>
        </Link>
        <nav className="flex items-center gap-8 text-sm">
          <Link href="/" className="text-forest/80 hover:text-forest transition-colors">
            Rooms
          </Link>
          <Link href="/lookup" className="text-forest/80 hover:text-forest transition-colors">
            My Reservation
          </Link>
          <Link
            href="/staff/login"
            className="text-forest/60 hover:text-forest transition-colors text-xs uppercase tracking-widest border-l border-line pl-8"
          >
            Staff Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
