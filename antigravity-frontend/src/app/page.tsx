"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Lock, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: ShieldCheck,
    title: "Luhn Algorithm Check",
    desc: "Instant format validation to ensure the IMEI structure is authentic.",
    color: "from-emerald-400 to-teal-400",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: Zap,
    title: "Real-time Risk Engine",
    desc: "Dynamic scoring based on theft reports and suspicious activity patterns.",
    color: "from-indigo-400 to-blue-400",
    bg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    icon: Lock,
    title: "Community Driven",
    desc: "A decentralized database of stolen phones verified by the community.",
    color: "from-purple-400 to-pink-400",
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

export default function Home() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 1.2 } });
    tl.fromTo(titleRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, delay: 0.2 })
      .fromTo(subtitleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1 }, "-=0.8")
      .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1 }, "-=0.7");

    if (featuresRef.current) {
      const cards = featuresRef.current.querySelectorAll(".feature-card");
      gsap.fromTo(
        cards,
        { y: 80, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, stagger: 0.15,
          scrollTrigger: { trigger: featuresRef.current, start: "top 80%" },
        }
      );
    }
  }, []);

  return (
    <div className="w-full relative overflow-hidden">
      {/* Background Orbs */}
      <div className="orb w-[600px] h-[600px] bg-indigo-300 top-[-100px] right-[-150px]" />
      <div className="orb w-[400px] h-[400px] bg-purple-300 top-[300px] left-[-100px]" style={{ animationDelay: "3s" }} />
      <div className="orb w-[300px] h-[300px] bg-sky-200 bottom-[0px] right-[20%]" style={{ animationDelay: "5s" }} />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col md:flex-row items-center justify-between px-6 max-w-7xl mx-auto pt-16 gap-12">
        <div className="flex-1 flex flex-col items-start justify-center z-10 space-y-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-indigo-100 shadow-sm text-indigo-600 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Powered by AI & Community Trust
          </div>
          <h1 ref={titleRef} className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight text-indigo-950">
            Know the{" "}
            <span className="text-gradient">truth</span>
            <br />before you buy.
          </h1>
          <p ref={subtitleRef} className="text-xl text-slate-500 max-w-lg leading-relaxed">
            Real-time IMEI risk scoring powered by community reports. Never buy a stolen or blacklisted phone again.
          </p>
          <div ref={ctaRef} className="flex items-center gap-4 pt-2 flex-wrap">
            <Link
              href="/check"
              className="btn-primary px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg"
            >
              Verify IMEI Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/report"
              className="px-8 py-4 rounded-2xl font-semibold text-indigo-600 bg-white/80 border border-indigo-100 hover:bg-white transition-colors shadow-sm"
            >
              Report Stolen
            </Link>
          </div>
        </div>

        <div className="flex-1 w-full flex justify-center items-center relative z-0">
          <div className="relative w-full max-w-[315px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-8 border-indigo-950/10">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/9acFmlRqQjw?autoplay=1&mute=1&loop=1&playlist=9acFmlRqQjw"
              title="Phone Koi Preview"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
            ></iframe>
          </div>
          {/* Subtle glow behind video */}
          <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] -z-10" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 relative w-full" ref={featuresRef}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-indigo-950">The Phone Koi Engine</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              A decentralized intelligence network constantly scanning for risk vectors across the global marketplace.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="feature-card card-gradient rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6`}>
                  <f.icon className={`w-7 h-7 ${f.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-indigo-950">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
