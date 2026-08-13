import localFont from "next/font/local";
import PwaRegistration from "./PwaRegistration";

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  style: "normal",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  style: "normal",
  weight: "100 900",
});

export const bodyClassName = `${geistSans.variable} ${geistMono.variable} antialiased`;

export function RootBody({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <body className={bodyClassName}>
      <PwaRegistration />
      {children}
    </body>
  );
}
