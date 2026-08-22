import SiteHeader from "@/components/SiteHeader";
import BookingSection from "@/components/BookingSection";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-ivory-texture">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-brass mb-4">
          Est. in the hills above the old harbor
        </p>
        <h1 className="font-display italic text-4xl md:text-6xl text-forest leading-tight mb-6">
          A quiet place to
          <br />
          arrive.
        </h1>
        <p className="text-forest/70 max-w-md mx-auto leading-relaxed">
          The Aldervale keeps things simple: thoughtful rooms, a concierge
          who actually answers, and a stay you won&apos;t need to plan around.
        </p>
      </section>

      <BookingSection />

      <footer className="border-t border-line mt-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-xs text-forest/50">
          <span>The Aldervale Hotel — a roleplay hospitality simulation</span>
          <span>Concierge available by email, day or night</span>
        </div>
      </footer>
    </div>
  );
}
