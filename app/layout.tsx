import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Aldervale Hotel",
  description: "A quiet luxury hotel — reservations, guest care, and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-ivory text-forest antialiased">
        {children}
      </body>
    </html>
  );
}
