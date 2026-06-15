import localFont from "next/font/local";
import "./globals.css";
import Navbar from "../components/Navbar";

const elmsSans = localFont({
  src: "./fonts/ElmsSans-VariableFont_wght.ttf",
  variable: "--font-primary",
  display: "swap",
});

const cormorantGaramond = localFont({
  src: "./fonts/CormorantGaramond-VariableFont_wght.ttf",
  variable: "--font-secondary",
  display: "swap",
});

const greatVibes = localFont({
  src: "./fonts/GreatVibes-Regular.ttf",
  variable: "--font-tertiary",
  display: "swap",
});

export const metadata = {
  title: "Leonn Restaurant | Köln",
  description: "Premium dining experience at Leonn Restaurant in Köln.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className={`${elmsSans.variable} ${cormorantGaramond.variable} ${greatVibes.variable}`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
