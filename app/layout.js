import "./globals.css";
import StoreProvider from "@/components/Store";
import Shell from "@/components/Shell";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zilla-store.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ZILLA STORE · Vintage Tech",
    template: "%s | ZILLA STORE",
  },
  description: "Tested vintage digital cameras, PSP, iPods and more, delivered across Algeria.",
  keywords: [
    "vintage tech Algeria",
    "digital camera Algeria",
    "PSP Algeria",
    "iPod Algeria",
    "vintage console",
    "ZILLA STORE",
  ],
  applicationName: "ZILLA STORE",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ZILLA STORE · Vintage Tech",
    description: "Tested vintage digital cameras, PSP, iPods and more, delivered across Algeria.",
    url: siteUrl,
    siteName: "ZILLA STORE",
    locale: "en_US",
    type: "website",
    images: [{ url: "/logo.jpg", width: 1200, height: 630, alt: "ZILLA STORE" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZILLA STORE · Vintage Tech",
    description: "Tested vintage digital cameras, PSP, iPods and more, delivered across Algeria.",
    images: ["/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

const themeInit = `try{var t=localStorage.getItem('zt');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }) {
  const settings = await getSettings();
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <StoreProvider settings={settings}>
          <Shell footer={<Footer settings={settings} />}>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
