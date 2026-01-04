import type { Metadata } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google"; // Switch to Inter as per plan/common usage or stick to Geist
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });
const notoNastaliqUrdu = Noto_Nastaliq_Urdu({ 
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-urdu",
});

export const metadata: Metadata = {
  title: "AxiomAssist",
  description: "Intelligent AI Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${notoNastaliqUrdu.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
