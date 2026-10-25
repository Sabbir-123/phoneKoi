"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldCheck, Search, ShieldAlert, Sparkles, MapPin, Lock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

export default function Footer() {
  const pathname = usePathname();
  const { t, isBn } = useTranslation();

  // Do not render footer on dashboard pages
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-50 border-t border-slate-200/80 text-slate-600 relative overflow-hidden z-10">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-100/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-14 lg:py-18 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 pb-14 border-b border-slate-200">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="inline-block group">
              <Image
                src="/logo.png"
                alt="PhoneKoi Logo"
                width={148}
                height={38}
                className="h-9 w-auto object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
              />
            </Link>
            
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-normal">
              {t.footer.tagline}
            </p>

            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-emerald-700 font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t.footer.liveNetwork}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 font-medium shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                {t.footer.location}
              </span>
            </div>
          </div>

          {/* Quick Verification Services */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">{t.footer.servicesTitle}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/check" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-indigo-500" />
                  {t.footer.checkImei}
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  {t.footer.reportStolen}
                </Link>
              </li>
              <li>
                <Link href="/recovered" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  {t.footer.recoveredDb}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  {t.footer.pricingPlans}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  {t.footer.trustDashboard}
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Devices */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">{t.footer.supportedDevicesTitle}</h4>
            <ul className="space-y-2.5 text-sm text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <span>🍎</span> Apple iPhone (11 – 18 Pro Max)
              </li>
              <li className="flex items-center gap-2">
                <span>📱</span> Samsung Galaxy (S26 Ultra, S-series, A-series)
              </li>
              <li className="flex items-center gap-2">
                <span>⚡</span> Xiaomi, Redmi &amp; Poco
              </li>
              <li className="flex items-center gap-2">
                <span>🌐</span> Vivo, Oppo, Realme, OnePlus
              </li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">{t.footer.securityTitle}</h4>
            <ul className="space-y-2.5 text-sm text-slate-600 font-medium">
              <li className="flex items-center gap-2 text-xs">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t.footer.privacyProtected}</span>
              </li>
              <li className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{t.footer.policeVerified}</span>
              </li>
              <li className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                <span>{t.footer.oneNumberPolicy}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} PhoneKoi. {t.footer.copyright}</p>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/check" className="hover:text-indigo-600 transition-colors">{t.nav.checkImei}</Link>
            <Link href="/report" className="hover:text-indigo-600 transition-colors">{t.nav.reportStolen}</Link>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">{t.nav.pricing}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
