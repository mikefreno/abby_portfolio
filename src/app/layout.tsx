import "~/styles/globals.css";

import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"] });

export const metadata = {
  title: "Abigail Weinick",
  description: "filmmaker and photographer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <link rel="preload" as="image" href="/Abby_self_mirror.jpg" />
      <link rel="preload" as="image" href="/DirtLipstick.jpg" />
      <link rel="preload" as="image" href="/HotTearsMakeup.jpg" />
      <link rel="preload" as="image" href="/Mike_and_abby.jpg" />
      <link rel="preload" as="image" href="/Mike_tongue_out.jpg" />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body className={`${playfair.className}`}>{children}</body>
    </html>
  );
}
