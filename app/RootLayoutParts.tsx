import { Geist, Geist_Mono } from "next/font/google";
import PwaRegistration from "./PwaRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
