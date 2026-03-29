"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Star,
  MapPin,
  MessageCircle,
  Clock,
  Heart,
  CheckCircle2,
  User,
  Stethoscope,
  Play,
  Loader2,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "@/hooks/useTranslations";
import { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   HOOK: useScrolled — header changes on scroll
   ============================================================ */
function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/* ============================================================
   HOOK: useInView — fires once when element enters viewport
   ============================================================ */
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return { ref, inView };
}

/* ============================================================
   HOOK: useCountUp — animates number from 0 to target
   ============================================================ */
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let animationFrameId: number;
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };
    
    animationFrameId = requestAnimationFrame(step);
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [start, target, duration]);
  return count;
}

/* ============================================================
   COMPONENT: StatCard — stat with count-up animation
   ============================================================ */
function StatCard({
  emoji,
  value,
  label,
  numClassName = "",
  delay,
  start,
}: {
  emoji: string;
  value: number;
  label: string;
  numClassName?: string;
  delay: string;
  start: boolean;
}) {
  const count = useCountUp(value, 1800, start);
  return (
    <Card
      className="border border-white/20 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
      style={{
        animationDelay: delay,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
      }}
    >
      <CardContent className="pt-8 text-center">
        <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6">
          {emoji}
        </div>
        <div className={`text-responsive-3xl font-bold mb-1 text-white ${numClassName}`}>
          +{count.toLocaleString()}
        </div>
        <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   COMPONENT: AnimatedSection — fade-in-up on scroll
   ============================================================ */
function AnimatedSection({
  children,
  className = "",
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function Home() {
  const { t, locale, loading } = useTranslations();
  const isRTL = locale === "ar";
  const [isLoaded, setIsLoaded] = useState(false);
  const scrolled = useScrolled(20);

  const { ref: heroStatsRef, inView: heroStatsInView } = useInView();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsLoaded(true), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleHoverColor = useCallback((e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, color: string) => {
    e.currentTarget.style.color = color;
  }, []);

  const handleHoverBackground = useCallback((e: React.MouseEvent<HTMLButtonElement>, color: string) => {
    e.currentTarget.style.background = color;
  }, []);

  const handleHoverBorderColor = useCallback((e: React.MouseEvent<HTMLElement>, color: string) => {
    e.currentTarget.style.borderColor = color;
  }, []);

  const handleLeaveColor = useCallback((e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.currentTarget.style.color = "";
  }, []);

  const handleLeaveBackground = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "";
  }, []);

  const handleLeaveBorderColor = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = "";
  }, []);

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1B40" }} suppressHydrationWarning>
        <div className="text-center fade-in" style={{ animationDuration: "0.3s" }}>
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: "#00BFA6" }} />
          <p className="text-responsive-base" style={{ color: "rgba(255,255,255,0.6)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F8F4FF" }} suppressHydrationWarning>

      {/* ==========================================
           HEADER
      ========================================== */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? "py-2" : "py-4"}`}
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "2px solid #E0FAF7",
          boxShadow: "0 2px 20px rgba(0,191,166,0.12)",
        }}
      >
        <div className="container-full flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3 fade-in" style={{ animationDelay: "50ms" }}>
            <div
              className={`rounded-xl flex items-center justify-center transition-all duration-500 ${scrolled ? "w-9 h-9" : "w-11 h-11"}`}
              style={{
                background: "linear-gradient(135deg, #00BFA6, #6C3FC5)",
                boxShadow: "0 4px 14px rgba(108,63,197,0.3)",
              }}
            >
              <span 
                className={`transition-all duration-500 ${scrolled ? "text-xl" : "text-2xl"}`}
                style={{ 
                  fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
                  fontSize: 'inherit'
                }}
              >🦷</span>
            </div>
            <span
              className="text-responsive-xl font-bold"
              style={{
                background: "linear-gradient(135deg, #008C7A, #6C3FC5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("home.brand")}
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8 fade-in" style={{ animationDelay: "100ms" }}>
            {[
              { href: "#features",     label: t("home.features")   },
              { href: "#how-it-works", label: t("home.howItWorks") },
              { href: "#faq",          label: t("home.faq")        },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-responsive-sm font-semibold transition-colors duration-200"
                style={{ color: "#444", textDecoration: "none" }}
                onMouseEnter={(e) => handleHoverColor(e, "#00BFA6")}
                onMouseLeave={handleLeaveColor}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Buttons */}
          <div className="flex items-center gap-3 fade-in" style={{ animationDelay: "150ms" }}>
            <LanguageSwitcher />
            <Button
              variant="ghost"
              asChild
              className="font-semibold text-responsive-sm"
              style={{ color: "#444" }}
            >
              <Link href="/auth/login">{t("home.login")}</Link>
            </Button>
            <Button
              asChild
              className="font-bold text-responsive-sm text-white transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #00BFA6, #008C7A)",
                boxShadow: "0 4px 14px rgba(0,191,166,0.4)",
                border: "none",
              }}
            >
              <Link href="/auth/register">{t("home.getStarted")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ==========================================
           HERO SECTION
      ========================================== */}
      <section
        className="section-spacing-lg relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0D1B40 0%, #1a2a6c 50%, #2d1b69 100%)",
        }}
      >
        {/* Glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
          <div
            className="absolute rounded-full"
            style={{
              top: -80, left: -80, width: 400, height: 400,
              background: "radial-gradient(circle, rgba(0,191,166,0.25) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              bottom: -60, right: -60, width: 350, height: 350,
              background: "radial-gradient(circle, rgba(108,63,197,0.3) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="container-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="space-y-8 fade-in" style={{ animationDelay: "200ms" }}>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
                style={{
                  background: "rgba(0,191,166,0.2)",
                  border: "1px solid rgba(0,191,166,0.4)",
                  color: "#00BFA6",
                }}
              >
                🚀 {t("home.badge")}
              </div>

              <h1 className="text-responsive-5xl font-bold leading-tight text-white">
                {t("home.title")}
                <span
                  className="block pt-2"
                  style={{
                    background: "linear-gradient(135deg, #00BFA6, #64f4e8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("home.titleHighlight")}
                </span>
              </h1>

              <p className="text-responsive-lg leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
                {t("home.description")}
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  asChild
                  className="font-bold text-responsive-base text-white transition-all duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #00BFA6, #008C7A)",
                    boxShadow: "0 6px 24px rgba(0,191,166,0.5)",
                    border: "none",
                  }}
                >
                  <Link href="/auth/register?type=student">
                    <Stethoscope className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t("home.registerAsStudent")}
                  </Link>
                </Button>
                <Button
                  size="lg"
                  asChild
                  className="font-bold text-responsive-base text-white transition-all duration-300 hover:scale-105"
                  style={{
                    background: "transparent",
                    border: "2px solid rgba(255,255,255,0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Link href="/auth/register?type=patient">
                    <User className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t("home.registerAsPatient")}
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-8 pt-4">
                {[t("home.freeTreatment"), t("home.verifiedStudents"), t("home.comprehensiveRating")].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-responsive-sm font-semibold text-white">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(0,191,166,0.2)",
                        border: "2px solid #00BFA6",
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#00BFA6" }} />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: stat cards */}
            <div
              ref={heroStatsRef}
              className="grid grid-cols-2 gap-6 fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <StatCard
                emoji="👨‍⚕️" 
                value={500}  
                label={t("home.activeStudents")}
                numClassName="" 
                delay="0ms" 
                start={heroStatsInView}
              />
              <StatCard 
                emoji="👥"   
                value={2000} 
                label={t("home.registeredPatients")} 
                numClassName="" 
                delay="100ms" 
                start={heroStatsInView} 
              />
              <StatCard 
                emoji="✅"   
                value={1500} 
                label={t("home.completedCases")}     
                numClassName="" 
                delay="200ms" 
                start={heroStatsInView} 
              />

              {/* Rating card — static */}
              <Card
                className="border border-white/20 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}
              >
                <CardContent className="pt-8 text-center">
                  <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6">⭐</div>
                  <div
                    className="text-responsive-3xl font-bold mb-1"
                    style={{
                      background: "linear-gradient(135deg, #FFAE00, #ffcf57)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    4.8
                  </div>
                  <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {t("home.averageRating")}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
           FOR WHOM SECTION - USER TYPES
      ========================================== */}
      <section
        style={{
          width: "100%",
          minHeight: "100vh",
          padding: "80px 5vw",
          position: "relative",
          backgroundImage: "url('/img/forYou.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(245, 240, 232, .3)",
            zIndex: 0,
          }}
        />

        {/* Content */}
        <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative", zIndex: 10 }}>
          <div
            className="eyebrow"
            style={{
              display: "inline-block",
              padding: "4px 16px",
              borderRadius: "100px",
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "16px",
              background: "#00BFA6",
              color: "white",
            }}
          >
            {t("home.userTypes.eyebrow") || "من لأجله؟"}
          </div>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: "bold",
              marginBottom: "16px",
              fontFamily: "'Playfair Display', serif",
              color: "#1a1a2e",
            }}
          >
            {t("home.userTypes.title") || "المنصة لك سواء كنت..."}
          </h2>
        </div>

        <div
          className="user-types"
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "32px",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Patient Card */}
          <div
            className="user-card patient"
            onClick={() => window.location.href = "/auth/register?type=patient"}
            style={{
              background: "#E8F8F5",
              borderRadius: "24px",
              padding: "40px 32px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              border: "2px solid #C0EAE4",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 20px 35px rgba(0,0,0,0.12)";
              e.currentTarget.style.borderColor = "#00BFA6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = "#C0EAE4";
            }}
          >
            <span className="uc-icon" style={{ display: "block", textAlign: "center", fontSize: "56px", marginBottom: "24px" }}>
              {t("home.userTypes.patient.icon") || "🏥"}
            </span>
            <h3 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "16px", textAlign: "center", color: "#1a1a2e" }}>
              {t("home.userTypes.patient.title") || "مريض يبحث عن علاج"}
            </h3>
            <p style={{ fontSize: "14px", color: "#555", textAlign: "center", marginBottom: "24px", lineHeight: 1.8 }}>
              {t("home.userTypes.patient.description") || "تصفّح الحالات المتاحة، قدّم على ما يناسبك، وتواصل مع الطالب مباشرة"}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0" }}>
              {(() => {
                const patientFeatures = t("home.userTypes.patient.features", { returnObjects: true });
                const safeFeatures = Array.isArray(patientFeatures)
                  ? patientFeatures
                  : [
                      "علاج مجاني أو بأسعار منخفضة",
                      "طلاب موثّقون وذوو تقييمات عالية",
                      "تتبع حالتك خطوة بخطوة",
                      "نظام إبلاغ لضمان سلامتك",
                    ];
                return safeFeatures.map((feature, index) => (
                  <li key={index} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <span style={{ color: "#00BFA6", fontWeight: 700, fontSize: "16px", flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: "14px", color: "#444" }}>{feature}</span>
                  </li>
                ));
              })()}
            </ul>
            <button
              className="btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = "/auth/register?type=patient";
              }}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #00BFA6, #008C7A)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 6px 24px rgba(0,191,166,0.35)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,191,166,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,191,166,0.35)";
              }}
            >
              {t("home.userTypes.patient.button") || "سجّل كمريض ←"}
            </button>
          </div>

          {/* Student Card */}
          <div
            className="user-card student"
            onClick={() => window.location.href = "/auth/register?type=student"}
            style={{
              background: "#FFF8E7",
              borderRadius: "24px",
              padding: "40px 32px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              border: "2px solid #F0E6C8",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 20px 35px rgba(0,0,0,0.12)";
              e.currentTarget.style.borderColor = "#C8A84B";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = "#F0E6C8";
            }}
          >
            <span className="uc-icon" style={{ display: "block", textAlign: "center", fontSize: "56px", marginBottom: "24px" }}>
              {t("home.userTypes.student.icon") || "🎓"}
            </span>
            <h3 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "16px", textAlign: "center", color: "#1a1a2e" }}>
              {t("home.userTypes.student.title") || "طالب طب أسنان"}
            </h3>
            <p style={{ fontSize: "14px", color: "#666", textAlign: "center", marginBottom: "24px", lineHeight: 1.8 }}>
              {t("home.userTypes.student.description") || "انشر حالاتك المطلوبة، اقبل المرضى المناسبين، وطوّر مهاراتك مع كل حالة"}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0" }}>
              {(() => {
                const studentFeatures = t("home.userTypes.student.features", { returnObjects: true });
                const safeFeatures = Array.isArray(studentFeatures)
                  ? studentFeatures
                  : [
                      "حالات عملية متنوعة ومصنّفة",
                      "نظام نقاط وشارات تحفيزي",
                      "بورتفوليو احترافي للإنجازات",
                      "لوحة تحكم شاملة للحالات",
                    ];
                return safeFeatures.map((feature, index) => (
                  <li key={index} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <span style={{ color: "#C8A84B", fontWeight: 700, fontSize: "16px", flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: "14px", color: "#444" }}>{feature}</span>
                  </li>
                ));
              })()}
            </ul>
            <button
              className="btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = "/auth/register?type=student";
              }}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #C8A84B, #B8960A)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 6px 24px rgba(200,168,75,0.35)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(200,168,75,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(200,168,75,0.35)";
              }}
            >
              {t("home.userTypes.student.button") || "سجّل كطالب ←"}
            </button>
          </div>
        </div>
      </section>

      {/* ==========================================
           VIDEO DEMO SECTION
      ========================================== */}
      <section
        className="section-spacing relative"
        style={{
          backgroundImage: "url('/img/video-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 z-0" style={{ background: "rgba(13,27,64,0.85)" }} />
        <div className="container-full relative z-10">
          <AnimatedSection className="text-center mb-16">
            <span
              className="inline-block px-4 py-2 rounded-full text-sm font-bold mb-4"
              style={{ background: "rgba(0,191,166,0.2)", color: "#00BFA6", border: "1px solid rgba(0,191,166,0.35)" }}
            >
              Demo
            </span>
            <h2 className="text-responsive-4xl font-bold mb-6 text-white" suppressHydrationWarning>
              {t("home.videoSection.title")}
            </h2>
            <p className="text-responsive-lg max-w-3xl mx-auto" style={{ color: "rgba(255,255,255,0.75)" }} suppressHydrationWarning>
              {t("home.videoSection.subtitle")}
            </p>
          </AnimatedSection>

          <AnimatedSection className="container-wide" delay={150}>
            <div
              className="relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-500"
              style={{
                background: "#0a0a0a",
                border: "2px solid rgba(0,191,166,0.3)",
              }}
            >
              <video className="w-full aspect-video" controls poster="/img/video-poster.jpg" preload="metadata">
                <source src="/img/poster.mp4" type="video/mp4" />
                <source src="/img/platform-demo.webm" type="video/webm" />
                <p className="text-white text-center p-8">{t("home.videoSection.notSupported")}</p>
              </video>
              <div
                className="absolute bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
              >
                <Play className="w-4 h-4" style={{ color: "#00BFA6" }} />
                <span suppressHydrationWarning>{t("home.videoSection.watchFull")}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                { icon: Clock,        bg: "linear-gradient(135deg,#00BFA6,#008C7A)", title: t("home.videoSection.quick"),  desc: t("home.videoSection.quickDesc")  },
                { icon: CheckCircle2, bg: "linear-gradient(135deg,#a78bfa,#6C3FC5)", title: t("home.videoSection.easy"),   desc: t("home.videoSection.easyDesc")   },
                { icon: Shield,       bg: "linear-gradient(135deg,#00BFA6,#008C7A)", title: t("home.videoSection.secure"), desc: t("home.videoSection.secureDesc") },
              ].map(({ icon: Icon, bg, title, desc }, i) => (
                <Card
                  key={i}
                  className="text-center transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <CardContent className="pt-8 pb-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                      style={{ background: bg }}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-responsive-base font-bold mb-2 text-white" suppressHydrationWarning>{title}</h3>
                    <p className="text-responsive-sm" style={{ color: "rgba(255,255,255,0.65)" }} suppressHydrationWarning>{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ==========================================
           FEATURES SECTION
      ========================================== */}
      <section
        id="features"
        className="section-spacing relative"
        style={{
          backgroundImage: "url('/img/features.PNG')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-white/65" />

        <div className="container-full relative z-10">
          <AnimatedSection className="text-center mb-16">
            <span
              className="inline-block px-4 py-2 rounded-full text-sm font-bold mb-4"
              style={{ background: "#E0FAF7", color: "#008C7A" }}
            >
              Features
            </span>
            <h2 className="text-responsive-4xl font-bold mb-4" style={{ color: "#0D1B40" }}>
              {t("home.whySmiley")}
            </h2>
            <p className="text-responsive-lg max-w-2xl mx-auto" style={{ color: "#666", lineHeight: 1.7 }}>
              {t("home.platformOffers")}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield,        iconBg: "#E0FAF7", iconColor: "#008C7A", title: t("home.verifiedStudents"),     desc: t("home.verifiedStudentsDesc")     },
              { icon: Star,          iconBg: "#FFF8E1", iconColor: "#B8860B", title: t("home.comprehensiveRating"),  desc: t("home.comprehensiveRatingDesc")  },
              { icon: MapPin,        iconBg: "#EDE6FF", iconColor: "#6C3FC5", title: t("home.locationBasedSearch"),  desc: t("home.locationBasedSearchDesc")  },
              { icon: MessageCircle, iconBg: "#E0FAF7", iconColor: "#008C7A", title: t("home.directMessaging"),      desc: t("home.directMessagingDesc")      },
              { icon: Clock,         iconBg: "#FFF0EF", iconColor: "#C0392B", title: t("home.appointmentReminders"), desc: t("home.appointmentRemindersDesc") },
              { icon: Heart,         iconBg: "#FFF8E1", iconColor: "#B8860B", title: t("home.freeTreatment"),        desc: t("home.freeTreatmentDesc")        },
            ].map(({ icon: Icon, iconBg, iconColor, title, desc }, i) => (
              <AnimatedSection key={i} delay={i * 80}>
                <Card
                  className="h-full transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group cursor-default"
                  style={{ border: "2px solid #f0f0f0", background: "white" }}
                  onMouseEnter={(e) => handleHoverBorderColor(e, "#00BFA6")}
                  onMouseLeave={handleLeaveBorderColor}
                >
                  <CardHeader>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                      style={{ background: iconBg }}
                    >
                      <Icon className="w-7 h-7" style={{ color: iconColor }} />
                    </div>
                    <CardTitle className="text-responsive-lg font-bold" style={{ color: "#0D1B40" }}>
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-responsive-base leading-relaxed" style={{ color: "#777" }}>
                      {desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
           HOW IT WORKS SECTION
      ========================================== */}
      <section
        id="how-it-works"
        className="section-spacing relative"
        style={{
          backgroundImage: "url('/img/register.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-white/60" />

        <div className="container-full relative z-10">
          <AnimatedSection className="text-center mb-16">
            <span
              className="inline-block px-4 py-2 rounded-full text-sm font-bold mb-4"
              style={{ background: "#EDE6FF", color: "#6C3FC5" }}
            >
              Process
            </span>
            <h2 className="text-responsive-4xl font-bold mb-4" style={{ color: "#0D1B40" }}>
              {t("home.howItWorks")}
            </h2>
            <p className="text-responsive-lg max-w-2xl mx-auto" style={{ color: "#666", lineHeight: 1.7 }}>
              {t("home.howItWorksSubtitle") || "Simple steps to get started with your dental journey"}
            </p>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Patients */}
            <AnimatedSection delay={100}>
              <h3 className="text-responsive-2xl font-bold mb-8 flex items-center gap-4" style={{ color: "#0D1B40" }}>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #00BFA6, #008C7A)" }}
                >
                  <User className="w-6 h-6 text-white" />
                </div>
                {t("home.forPatients")}
              </h3>
              <div className="space-y-4">
                {[
                  t("home.step1Patient"), t("home.step2Patient"), t("home.step3Patient"),
                  t("home.step4Patient"), t("home.step5Patient"),
                ].map((step, i) => (
                  <AnimatedSection key={i} delay={i * 80}>
                    <Card
                      className="shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-x-1 group"
                      style={{ border: "1.5px solid #e8e8e8", background: "white" }}
                      onMouseEnter={(e) => handleHoverBorderColor(e, "#00BFA6")}
                      onMouseLeave={handleLeaveBorderColor}
                    >
                      <CardContent className="p-5">
                        <div className="flex gap-4 items-start">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
                            style={{ background: "linear-gradient(135deg, #00BFA6, #008C7A)" }}
                          >
                            {i + 1}
                          </div>
                          <span className="font-semibold text-responsive-base leading-relaxed pt-1" style={{ color: "#333" }}>
                            {step}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>

            {/* Students */}
            <AnimatedSection delay={200}>
              <h3 className="text-responsive-2xl font-bold mb-8 flex items-center gap-4" style={{ color: "#0D1B40" }}>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #a78bfa, #6C3FC5)" }}
                >
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                {t("home.forStudents")}
              </h3>
              <div className="space-y-4">
                {[
                  t("home.step1Student"), t("home.step2Student"), t("home.step3Student"),
                  t("home.step4Student"), t("home.step5Student"),
                ].map((step, i) => (
                  <AnimatedSection key={i} delay={i * 80}>
                    <Card
                      className="shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-x-1 group"
                      style={{ border: "1.5px solid #e8e8e8", background: "white" }}
                      onMouseEnter={(e) => handleHoverBorderColor(e, "#6C3FC5")}
                      onMouseLeave={handleLeaveBorderColor}
                    >
                      <CardContent className="p-5">
                        <div className="flex gap-4 items-start">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
                            style={{ background: "linear-gradient(135deg, #a78bfa, #6C3FC5)" }}
                          >
                            {i + 1}
                          </div>
                          <span className="font-semibold text-responsive-base leading-relaxed pt-1" style={{ color: "#333" }}>
                            {step}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ==========================================
           FAQ SECTION
      ========================================== */}
      <section
        id="faq"
        className="section-spacing relative"
        style={{
          backgroundImage: "url('/img/faq.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#fff",
        }}
      >
        <div className="absolute inset-0 bg-white/60" />

        <div className="container-full relative z-10">
          <div className="container-medium">
            <AnimatedSection className="text-center mb-16">
              <span
                className="inline-block px-4 py-2 rounded-full text-sm font-bold mb-4"
                style={{ background: "#E0FAF7", color: "#008C7A" }}
              >
                FAQ
              </span>
              <h2 className="text-responsive-4xl font-bold mb-4" style={{ color: "#0D1B40" }}>
                {t("home.faqTitle")}
              </h2>
              <p className="text-responsive-lg max-w-2xl mx-auto" style={{ color: "#666" }}>
                {t("home.faqSubtitle") || "Find answers to frequently asked questions"}
              </p>
            </AnimatedSection>

            <div className="space-y-5">
              {[
                { q: t("home.faq1"), a: t("home.faq1Answer") },
                { q: t("home.faq2"), a: t("home.faq2Answer") },
                { q: t("home.faq3"), a: t("home.faq3Answer") },
              ].map((item, i) => (
                <AnimatedSection key={i} delay={i * 100}>
                  <Card
                    className="transition-all duration-300 hover:shadow-lg group"
                    style={{ border: "2px solid #eee", background: "white" }}
                    onMouseEnter={(e) => handleHoverBorderColor(e, "#00BFA6")}
                    onMouseLeave={handleLeaveBorderColor}
                  >
                    <CardHeader>
                      <CardTitle className="text-responsive-base font-bold flex items-start gap-3" style={{ color: "#0D1B40" }}>
                        <span
                          className="font-black transition-all duration-300 group-hover:scale-125 inline-block"
                          style={{ color: "#00BFA6" }}
                        >
                          Q{i + 1}.
                        </span>
                        <span className="leading-relaxed">{item.q}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-responsive-sm leading-relaxed pl-7" style={{ color: "#666" }}>
                        {item.a}
                      </p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
           CTA SECTION
      ========================================== */}
      <section className="section-spacing" style={{ background: "#F8F4FF" }}>
        <div className="container-full">
          <AnimatedSection>
            <div
              className="relative overflow-hidden text-center"
              style={{
                background: "linear-gradient(135deg, #0D1B40 0%, #134a3a 50%, #1a4a40 100%)",
                borderRadius: "24px",
                padding: "60px",
                margin: "0 0 80px",
              }}
            >
              {/* 🦷 watermark */}
              <span
                className="absolute pointer-events-none select-none"
                style={{
                  fontSize: 200,
                  opacity: 0.04,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  lineHeight: 1,
                  fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
                }}
              >
                🦷
              </span>

              <div className="relative z-10">
                <h2
                  className="font-bold text-white mb-4"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "clamp(26px, 4vw, 36px)",
                    fontWeight: 700,
                  }}
                >
                  {t("home.ctaTitle")}
                </h2>

                <p
                  className="mb-8 mx-auto"
                  style={{
                    fontSize: 16,
                    color: "rgba(255,255,255,0.65)",
                    maxWidth: 520,
                    lineHeight: 1.7,
                  }}
                >
                  {t("home.ctaDescription")}
                </p>

                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                    size="lg"
                    asChild
                    className="transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "white",
                      color: "#0D1B40",
                      fontWeight: 800,
                      fontSize: 15,
                      padding: "14px 32px",
                      borderRadius: 10,
                      border: "none",
                      fontFamily: "inherit",
                      boxShadow: "none",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(255,255,255,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    <Link href="/auth/register">
                      {t("home.registerAsPatient")}
                    </Link>
                  </Button>

                  <Button
                    size="lg"
                    asChild
                    className="transition-all duration-200"
                    style={{
                      background: "transparent",
                      color: "white",
                      fontWeight: 800,
                      fontSize: 15,
                      padding: "14px 32px",
                      borderRadius: 10,
                      border: "2px solid rgba(255,255,255,0.4)",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <Link href="/auth/login">
                      {t("home.login")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ==========================================
           FOOTER
      ========================================== */}
      <footer style={{ background: "#0D1B40", padding: "60px 5% 30px" }}>
        <div className="container-full">
          <div className="grid md:grid-cols-4 gap-12 mb-12">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110 hover:rotate-6"
                  style={{ background: "linear-gradient(135deg, #00BFA6, #6C3FC5)" }}
                >
                  <span 
                    className="text-2xl"
                    style={{ 
                      fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
                      fontSize: 'inherit'
                    }}
                  >🦷</span>
                </div>
                <span
                  className="text-responsive-xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, #00BFA6, #a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("home.brand")}
                </span>
              </div>
              <p className="text-responsive-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("home.footerDescription")}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4
                className="font-bold mb-6 text-responsive-base uppercase tracking-wider"
                style={{ color: "white", letterSpacing: "0.8px" }}
              >
                {t("home.quickLinks")}
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "#features",     label: t("home.features")   },
                  { href: "#how-it-works", label: t("home.howItWorks") },
                  { href: "#faq",          label: t("home.faq")        },
                ].map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-responsive-sm transition-colors duration-200"
                      style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}
                      onMouseEnter={(e) => handleHoverColor(e, "#00BFA6")}
                      onMouseLeave={handleLeaveColor}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4
                className="font-bold mb-6 text-responsive-base uppercase tracking-wider"
                style={{ color: "white", letterSpacing: "0.8px" }}
              >
                {t("home.support")}
              </h4>
              <ul className="space-y-3">
                {[t("home.contactUs"), t("home.termsAndConditions"), t("home.privacyPolicy")].map((label) => (
                  <li key={label}>
                    <a
                      href="#"
                      className="text-responsive-sm transition-colors duration-200"
                      style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}
                      onMouseEnter={(e) => handleHoverColor(e, "#00BFA6")}
                      onMouseLeave={handleLeaveColor}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4
                className="font-bold mb-6 text-responsive-base uppercase tracking-wider"
                style={{ color: "white", letterSpacing: "0.8px" }}
              >
                {t("home.contactUs")}
              </h4>
              <p className="text-responsive-sm mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("home.contactUsQuestion")}
              </p>
              <Button
                variant="outline"
                className="w-full font-bold transition-all duration-300 hover:scale-105"
                style={{
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  color: "white",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#00BFA6";
                  (e.currentTarget as HTMLElement).style.color = "#00BFA6";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
                  (e.currentTarget as HTMLElement).style.color = "white";
                }}
              >
                {t("home.contactUsButton")}
              </Button>
            </div>
          </div>

          <div
            className="pt-8 text-center text-responsive-sm"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {t("home.copyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}