import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smiley Dental Clinic - سمايلي لطب الأسنان",
  description: "منصة إلكترونية تربط بين طلاب طب الأسنان والمرضى للحصول على علاج مجاني أو بتكلفة منخفضة",
  keywords: ["طب الأسنان", "علاج أسنان مجاني", "طلاب طب الأسنان", "حالات عملية"],
  authors: [{ name: "Smiley Dental Clinic Team" }],
  icons: {
    icon: "/dental.svg",
    apple: "/dental.svg",
  },
  openGraph: {
    title: "Smiley Dental Clinic - سمايلي لطب الأسنان",
    description: "منصة إلكترونية تربط بين طلاب طب الأسنان والمرضى للحصول على علاج مجاني أو بتكلفة منخفضة",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smiley Dental Clinic - سمايلي لطب الأسنان",
    description: "منصة إلكترونية تربط بين طلاب طب الأسنان والمرضى للحصول على علاج مجاني أو بتكلفة منخفضة",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'ar';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
// Force reload
