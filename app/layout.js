import "./globals.css";
import StoreProvider from "@/components/Store";
import Shell from "@/components/Shell";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ZILLA STORE · Vintage Tech",
  description: "Tested vintage digital cameras, PSP, iPods and more, delivered across Algeria.",
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
