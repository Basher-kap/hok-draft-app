import "./globals.css";
import { ComfortProvider } from "@/components/ComfortProvider";
import { TierListProvider } from "@/components/TierListProvider";

export const metadata = {
  title: "HoK Draft Pick",
  description: "AI-assisted draft pick simulator for Honor of Kings (international server)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TierListProvider>
          <ComfortProvider>{children}</ComfortProvider>
        </TierListProvider>
      </body>
    </html>
  );
}
