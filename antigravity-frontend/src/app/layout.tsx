import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageWrapper from "@/components/layout/PageWrapper";
import QueryProvider from "@/components/providers/QueryProvider";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#4338ca",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://phonekoi.com'),
  title: {
    default: "PhoneKoi | Bangladesh's #1 IMEI Verification & Stolen Phone Registry",
    template: "%s | PhoneKoi",
  },
  description:
    "Know the truth before you buy. Real-time IMEI verification, stolen iPhone, Samsung, and Xiaomi phone blacklist, Police GD cross-referencing, and AI fraud risk scoring across Bangladesh.",
  applicationName: "PhoneKoi",
  authors: [{ name: "PhoneKoi Security Team", url: "https://phonekoi.com" }],
  creator: "PhoneKoi",
  publisher: "PhoneKoi",
  keywords: [
    // Core brand & service
    "PhoneKoi",
    "Phone Koi",
    "ফোন কই",
    "IMEI check Bangladesh",
    "stolen phone registry",
    "IMEI verification BD",
    "BTRC IMEI check",
    "police GD phone recovery",
    "used phone verify Dhaka",
    "second hand phone check",
    "churi jawa mobile khoja",
    "চোরাই মোবাইল যাচাই",
    "আইএমইআই চেক বাংলাদেশ",

    // User requested iPhone keywords & models
    "iphone harano geche",
    "iphone",
    "iphone diffrent models",
    "iphone 16 pro max",
    "iphone 16 pro",
    "iphone 16",
    "iphone 15 pro max",
    "iphone 15 pro",
    "iphone 15",
    "iphone 14 pro max",
    "iphone 14 pro",
    "iphone 14",
    "iphone 13 pro max",
    "iphone 13 pro",
    "iphone 13",
    "iphone 12 pro max",
    "iphone 12",
    "iphone 11 pro max",
    "iphone 11",
    "used iphone check bangladesh",
    "stolen iphone tracker bd",
    "iphone icloud status check bd",
    "আইফোন হারানো গেছে",

    // User requested Xiaomi keywords
    "xiaomi phone",
    "xiaomi",
    "redmi note",
    "redmi note 13 pro",
    "redmi note 12",
    "poco phone",
    "xiaomi imei check bangladesh",
    "xiaomi phone harano geche",
    "শাওমি ফোন",

    // User requested Samsung keywords
    "samsung phone",
    "samsung",
    "samsung galaxy",
    "galaxy s24 ultra",
    "galaxy s23 ultra",
    "galaxy s22",
    "samsung a series",
    "samsung a54",
    "samsung a34",
    "samsung z fold",
    "samsung z flip",
    "samsung imei check bangladesh",
    "samsung phone churi hoyeche",
    "স্যামসাং ফোন",

    // Regional & Safety terms
    "Dhaka stolen phone blacklist",
    "Chittagong mobile theft registry",
    "Sylhet phone verification",
    "Luhn check IMEI",
    "secondhand phone scam prevention",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["bn_BD"],
    url: "https://phonekoi.com",
    siteName: "PhoneKoi",
    title: "PhoneKoi | Verify Any Phone Before Buying in Bangladesh",
    description:
      "Check if an iPhone, Samsung, or Xiaomi phone is stolen or reported in Police GD. Instant IMEI risk scoring, community blacklist, and device protection.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PhoneKoi Official Logo and IMEI Verification Engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PhoneKoi | IMEI Verification & Stolen Phone Registry BD",
    description:
      "Verify IMEI before buying used iPhone, Samsung, or Xiaomi phones. Cross-checked with Police GD and community reports.",
    images: ["/og-image.png"],
    creator: "@PhoneKoi",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://phonekoi.com",
    languages: {
      "en-BD": "https://phonekoi.com",
      "bn-BD": "https://phonekoi.com",
    },
  },
  category: "technology",
  other: {
    "geo.region": "BD-13",
    "geo.placename": "Dhaka, Bangladesh",
    "geo.position": "23.8103;90.4125",
    "ICBM": "23.8103, 90.4125",
    "target": "all",
    "audience": "all",
    "coverage": "Bangladesh",
  },
};

// Rich Structured Data for Google, Bing, and AI Search Engines (ChatGPT, Perplexity, Gemini, Copilot)
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://phonekoi.com/#organization",
      "name": "PhoneKoi",
      "alternateName": ["Phone Koi", "ফোন কই", "PhoneKoi Bangladesh"],
      "url": "https://phonekoi.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://phonekoi.com/logo.png",
        "contentUrl": "https://phonekoi.com/logo.png",
        "width": "1024",
        "height": "512",
        "caption": "PhoneKoi Official Logo"
      },
      "image": "https://phonekoi.com/og-image.png",
      "description": "Bangladesh's leading community-driven IMEI verification platform and stolen phone registry.",
      "areaServed": {
        "@type": "Country",
        "name": "Bangladesh"
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Dhaka",
        "addressCountry": "BD"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://phonekoi.com/#website",
      "url": "https://phonekoi.com",
      "name": "PhoneKoi",
      "publisher": {
        "@id": "https://phonekoi.com/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://phonekoi.com/result/{imei}"
        },
        "query-input": "required name=imei"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://phonekoi.com/#software",
      "name": "PhoneKoi IMEI Verification Engine",
      "applicationCategory": "SecurityApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BDT"
      },
      "description": "Search IMEI integrity, verify iPhone, Xiaomi, and Samsung devices against Police GD and community theft reports."
    },
    {
      "@type": "FAQPage",
      "@id": "https://phonekoi.com/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How to check if an iPhone or phone is stolen in Bangladesh? (iphone harano geche kina kivabe bujhbo)",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Dial *#06# on the device to get the 15-digit IMEI number, then enter it on PhoneKoi (phonekoi.com). The system instantly runs a Luhn check, queries the Police GD stolen database, and evaluates the risk score before you buy."
          }
        },
        {
          "@type": "Question",
          "name": "Can I check Samsung and Xiaomi phone IMEI on PhoneKoi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, PhoneKoi supports all Samsung Galaxy devices (S26 ultra, S26, A-series, all series), Xiaomi/Redmi phones, and Apple iPhones (11 – 18 Pro Max)."
          }
        },
        {
          "@type": "Question",
          "name": "How do I report a stolen or lost phone on PhoneKoi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Navigate to phonekoi.com/report, provide the IMEI, your Police GD (General Diary) tracking number, and device details to blacklist the stolen phone across the nationwide community network."
          }
        },
        {
          "@type": "Question",
          "name": "What is PhoneKoi IMEI risk score and community trust standing?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "PhoneKoi calculates real-time risk scores from 0 to 100 based on theft incident reports, law enforcement Police GD filings, Luhn checksum validation, and suspicious activity frequency to protect buyers."
          }
        },
        {
          "@type": "Question",
          "name": "How to verify if a used phone is authentic before buying in Bangladesh?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Check the IMEI on phonekoi.com before making payment. Ensure the IMEI matches the device settings, SIM tray, and box, and verify that no active theft report or police investigation is registered."
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col text-indigo-950`}>
        <QueryProvider>
          <Navbar />
          <main className="relative flex flex-col items-center justify-start flex-1 w-full">
            <PageWrapper>{children}</PageWrapper>
          </main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
