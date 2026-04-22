/*
  ThinkRN — CohortHome.tsx (Hiatus Mode + Safety Gate)
  =====================================================
  Route: /  (public cohort page — zero server tracking)

  Safety gate logic:
  - Client-side only. No data leaves the browser.
  - Detects dangerous/misuse prompt patterns in the Q&A feedback box
  - Auto-dismisses flagged input with a clear, non-punitive message
  - Does NOT record, log, or transmit anything — pure local pattern check
  - All content from publicly available nursing education resources (ATI, NCSBN)

  Market context panel:
  - Shows KC / MNU hyper-local footprint so visitors understand real scale
  - Transparent about what this proves at small scale before going bigger
*/

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  Building2,
  Clock3,
  GraduationCap,
  Heart,
  Info,
  Leaf,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = "home" | "market" | "integrity" | "about";
type FeedbackState = "idle" | "flagged" | "submitted";

// ─── Safety Gate ──────────────────────────────────────────────────────────────
// Client-side only. Zero transmission. Pattern matching for obvious misuse.
// NOT a disciplinary system — it just stops unsafe content from appearing.

const DANGEROUS_PATTERNS = [
  // Exam cheating / answer extraction
  /give\s+me\s+(the\s+)?answers?\s+(to|for)/i,
  /what\s+are\s+the\s+real\s+answers/i,
  /actual\s+exam\s+(questions?|answers?)/i,
  /copy\s+(the\s+)?questions?\s+from/i,
  /bypass\s+(the\s+)?(filter|integrity|safety)/i,
  /ignore\s+(previous\s+)?(instructions?|rules?|guidelines?)/i,
  // Jailbreak / prompt injection attempts
  /pretend\s+you\s+are/i,
  /you\s+are\s+now\s+(a\s+)?DAN/i,
  /do\s+anything\s+now/i,
  /act\s+as\s+(if\s+you\s+are\s+)?(an?\s+)?AI\s+without/i,
  /override\s+(your\s+)?(safety|content|filter)/i,
  /system\s+prompt/i,
  /\[\[.*\]\]/i,
  /<<.*>>/i,
  // Clinical harm (not a medical advice tool)
  /what\s+(dose|dosage|mg)\s+should\s+i\s+(give|take|administer)/i,
  /can\s+i\s+(give|take)\s+\d+\s*mg/i,
  /is\s+it\s+safe\s+to\s+overdose/i,
  /how\s+(much|many)\s+.{0,30}\s+to\s+kill/i,
  // Personal data harvesting
  /what\s+is\s+(your\s+)?student\s+id/i,
  /give\s+me\s+(the\s+)?list\s+of\s+(students?|cohort\s+members?)/i,
];

function isFlagged(text: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(text));
}

// ─── Constants ────────────────────────────────────────────────────────────────

const tabs: { key: TabKey; label: string; icon: typeof Brain }[] = [
  { key: "home",      label: "ThinkRN",   icon: Brain      },
  { key: "market",    label: "KC / MNU",  icon: MapPin     },
  { key: "integrity", label: "Integrity", icon: ShieldCheck},
  { key: "about",     label: "About",     icon: Info       },
];

const roadmapItems = [
  {
    icon: GraduationCap,
    label: "Semester 2 Complete",
    sub: "January – April 2026 · All 4 courses",
    state: "done",
  },
  {
    icon: Leaf,
    label: "Intentional Pause",
    sub: "Stepping back to think before building further",
    state: "active",
  },
  {
    icon: Heart,
    label: "Family & Support System",
    sub: "Grounding the vision before continuing",
    state: "active",
  },
  {
    icon: Brain,
    label: "Full Semester Content Bank",
    sub: "All topics, all courses — complete flashcard + NCLEX set",
    state: "next",
  },
  {
    icon: Users,
    label: "Nonprofit Partnerships",
    sub: "Open to collaboration for access-focused distribution",
    state: "next",
  },
  {
    icon: TrendingUp,
    label: "ThinkRN v2 — Polished & Public",
    sub: "Sliding-scale pricing · Open to public funding",
    state: "next",
  },
];

const marketStats = [
  {
    icon: Building2,
    label: "MNU Nursing Program",
    value: "~120",
    sub: "Students per cohort year",
    detail:
      "MidAmerica Nazarene University's nursing program in Olathe, KS — the hyper-local starting point. ThinkRN was built for this exact cohort.",
  },
  {
    icon: Users,
    label: "KC Metro Nursing Students",
    value: "~2,400",
    sub: "Active nursing students in Greater KC",
    detail:
      "UMKC, MNU, Graceland, Rockhurst, and community colleges across the metro. All studying the same NCLEX-RN test plan. One tool could serve all of them.",
  },
  {
    icon: Stethoscope,
    label: "NCLEX-RN Candidates (US)",
    value: "~200K",
    sub: "Test-takers per year nationally",
    detail:
      "The same publicly available content — ATI topic areas, NCSBN test plan — scales from one Kansas City cohort to every nursing student in the country.",
  },
  {
    icon: GraduationCap,
    label: "Proof of Concept",
    value: "100%",
    sub: "Built by one student, used by real peers",
    detail:
      "No team. No funding. No institution behind it yet. Just one nursing student, publicly available resources, and a system that already works at small scale.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CohortHome() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [email, setEmail]         = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [feedback, setFeedback]   = useState("");
  const [feedbackState, setFeedbackState] = useState<FeedbackState>("idle");
  const [safetyMsg, setSafetyMsg] = useState("");
  const feedbackRef = useRef<HTMLTextAreaElement>(null);

  // ── Safety-gated feedback handler ──────────────────────────────────────────
  // No server call. No logging. Just pattern check → local state.
  const handleFeedbackChange = (val: string) => {
    setFeedback(val);
    if (feedbackState === "flagged") setFeedbackState("idle");
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = feedback.trim();
    if (!trimmed) return;

    if (isFlagged(trimmed)) {
      setFeedbackState("flagged");
      setSafetyMsg(
        "That message pattern isn't something this tool can engage with. " +
        "ThinkRN is a study and organization tool built on publicly available " +
        "nursing education content. If you need help studying, the flashcard " +
        "and practice exam tabs are available when the site relaunches."
      );
      setFeedback("");
      return;
    }

    // In hiatus mode: no server. Store locally as a signal only.
    // When Ray returns, he can review what visitors wanted.
    try {
      const existing = JSON.parse(
        window.localStorage.getItem("thinkrn-visitor-signals") || "[]"
      ) as string[];
      existing.push(trimmed.slice(0, 280));
      window.localStorage.setItem(
        "thinkrn-visitor-signals",
        JSON.stringify(existing.slice(-20))
      );
    } catch {
      // localStorage may be blocked — silently fail
    }
    setFeedbackState("submitted");
    setFeedback("");
  };

  const handleEmailSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) {
      try {
        window.localStorage.setItem("thinkrn-notify-email", email);
      } catch { /* silently fail if blocked */ }
      setEmailSaved(true);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.10),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.07),transparent_18%),linear-gradient(180deg,rgba(5,10,18,0.97),rgba(2,6,12,1))]" />
        <div className="noise-mask absolute inset-0" />
      </div>

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 border-b border-white/8 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-200" />
            <h1 className="font-bold text-sm uppercase tracking-wider text-white">ThinkRN</h1>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-200/80 hidden sm:inline">
              On Hiatus
            </span>
          </div>
          <nav className="flex gap-1 overflow-x-auto" aria-label="Main navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  aria-current={activeTab === tab.key ? "page" : undefined}
                  className={`nav-button ${activeTab === tab.key ? "border-cyan-300/50 bg-cyan-300/15" : ""}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline text-xs">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="container relative z-10 py-10 mx-auto" style={{ maxWidth: "680px" }}>
        <AnimatePresence mode="wait">

          {/* ═══ HOME ═══ */}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-8"
            >
              {/* Hero */}
              <div className="space-y-4">
                <div className="eyebrow flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Deliberate pause · April 2026
                </div>
                <h2 className="section-title">
                  ThinkRN is resting.
                  <br />
                  <span className="text-cyan-200">Intentionally.</span>
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  I'm Ray — a nursing student who built this site for my cohort at MNU.
                  It worked. We used it all semester. Now I'm stepping back to think
                  carefully about what I'm building, why I'm building it, and what it
                  means — for my cohort, for KC, and potentially for nursing students
                  everywhere — before I go further.
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  This isn't a shutdown. It's a checkpoint. My family and support system
                  are part of this process. The site stays up so you can understand the
                  vision — and so I have something real to come back to.
                </p>
              </div>

              {/* Roadmap */}
              <div className="card-shell p-6 space-y-5">
                <div>
                  <div className="eyebrow">Where things stand</div>
                  <h3 className="section-title-sm mt-1">Roadmap</h3>
                </div>
                <ol className="space-y-4">
                  {roadmapItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <li key={i} className="flex items-start gap-4">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                            item.state === "done"
                              ? "border-emerald-400/40 bg-emerald-400/12 text-emerald-200"
                              : item.state === "active"
                              ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                              : "border-white/12 bg-white/5 text-slate-600"
                          }`}
                          aria-hidden="true"
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold leading-snug ${
                              item.state === "active"
                                ? "text-amber-100"
                                : item.state === "done"
                                ? "text-white"
                                : "text-slate-500"
                            }`}
                          >
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                        </div>
                        {item.state === "active" && (
                          <span className="shrink-0 self-start rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-amber-200/70">
                            Now
                          </span>
                        )}
                        {item.state === "done" && (
                          <span className="shrink-0 self-start rounded-full border border-emerald-400/25 bg-emerald-400/8 px-2 py-0.5 text-[9px] uppercase tracking-widest text-emerald-200/60">
                            Done
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Notify — browser-only, no server */}
              <div className="card-shell p-6 space-y-4">
                <div>
                  <div className="eyebrow">Stay connected</div>
                  <h3 className="section-title-sm mt-1">Get notified when ThinkRN returns</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Your email is saved only in your own browser. Never sent to a server. This is
                    a local browser reminder — not a mailing list.
                  </p>
                </div>
                {!emailSaved ? (
                  <form onSubmit={handleEmailSave} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      aria-label="Email address for local notification"
                      className="flex-1 rounded-full border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/40 focus:outline-none"
                    />
                    <button type="submit" className="nav-button shrink-0">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Save</span>
                    </button>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[1.2rem] border border-emerald-400/30 bg-emerald-400/10 p-4"
                  >
                    <p className="text-sm text-emerald-100 font-semibold">Saved in your browser ✓</p>
                    <p className="text-xs text-emerald-100/50 mt-1">
                      Zero servers. Zero tracking. Completely private.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Safety-gated visitor signal box */}
              <div className="card-shell p-6 space-y-4">
                <div>
                  <div className="eyebrow flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    Visitor signal
                  </div>
                  <h3 className="section-title-sm mt-1">What would make ThinkRN useful for you?</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Stored only in your browser. Ray reads this when he returns. Not a chat — just
                    a signal box. Clinical and academic integrity rules still apply here.
                  </p>
                </div>

                {feedbackState === "submitted" ? (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[1.2rem] border border-cyan-300/25 bg-cyan-300/8 p-4 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm text-cyan-100 font-semibold">Signal saved locally ✓</p>
                      <p className="text-xs text-cyan-100/50 mt-1">
                        Stored in your browser only. Ray will review when he returns.
                      </p>
                    </div>
                    <button
                      onClick={() => setFeedbackState("idle")}
                      className="shrink-0 text-slate-500 hover:text-slate-300 transition"
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : feedbackState === "flagged" ? (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[1.2rem] border border-amber-400/30 bg-amber-400/8 p-4 flex items-start gap-3"
                  >
                    <AlertTriangle className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-amber-100 font-semibold">Can't engage with that</p>
                      <p className="text-xs text-amber-100/60 mt-1 leading-relaxed">{safetyMsg}</p>
                    </div>
                    <button
                      onClick={() => { setFeedbackState("idle"); setSafetyMsg(""); }}
                      className="shrink-0 text-amber-400/60 hover:text-amber-300 transition"
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                    <textarea
                      ref={feedbackRef}
                      value={feedback}
                      onChange={(e) => handleFeedbackChange(e.target.value)}
                      placeholder="e.g. I want full semester content for MNU · I'm a different school · I want an offline mode · I want pharmacology mnemonics…"
                      rows={3}
                      maxLength={280}
                      aria-label="Visitor signal — what would make ThinkRN useful for you"
                      className="w-full rounded-[1.2rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/30 focus:outline-none resize-none leading-relaxed"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{feedback.length}/280</span>
                      <button
                        type="submit"
                        disabled={!feedback.trim()}
                        className="nav-button disabled:opacity-40"
                      >
                        Send signal
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Vision amber card */}
              <div className="card-shell border-amber-400/15 bg-amber-400/5 p-6 space-y-3">
                <div className="eyebrow text-amber-200/60">Coming next</div>
                <h3 className="section-title-sm text-amber-100">The bigger picture</h3>
                <p className="text-sm text-amber-100/65 leading-relaxed">
                  ThinkRN v2 will cover a full nursing semester — all four courses, every topic area,
                  complete flashcard decks and NCLEX-style question banks built exclusively from
                  publicly available resources. One app. One semester. Proven at KC scale first.
                </p>
                <p className="text-sm text-amber-100/50 leading-relaxed">
                  Beyond that: sliding-scale pricing, nonprofit partnerships, and a model built for
                  access — not extraction. But only when the vision is fully understood and the
                  roadmap is real.
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ MARKET ═══ */}
          {activeTab === "market" && (
            <motion.div
              key="market"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div>
                <div className="eyebrow flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  Kansas City · MNU · The starting point
                </div>
                <h2 className="section-title mt-1">
                  What this already proves
                  <br />
                  <span className="text-cyan-200">at local scale.</span>
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mt-4">
                  ThinkRN wasn't built for everyone. It was built for one cohort — nursing students
                  at MidAmerica Nazarene University in Olathe, Kansas. That constraint is the point.
                  If it works here, it scales. Here's what the numbers look like.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {marketStats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="card-shell p-5 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-cyan-200">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                          <p className="font-bold text-2xl text-white mt-0.5 leading-none">{stat.value}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed border-t border-white/8 pt-3">
                        {stat.detail}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="card-shell border-cyan-300/15 bg-cyan-300/5 p-6 space-y-3">
                <div className="eyebrow text-cyan-200/60">The logic</div>
                <h3 className="section-title-sm text-cyan-100">Why hyper-local first</h3>
                <p className="text-sm text-cyan-100/65 leading-relaxed">
                  Every nursing program in the US studies toward the same NCLEX-RN test plan.
                  The content that works for MNU's cohort works for UMKC, works for Rockhurst,
                  works for schools in St. Louis, Chicago, and nationwide. Starting local means
                  the proof is real, not theoretical. It means a real cohort used it and it worked.
                  That's the foundation everything else gets built on.
                </p>
                <p className="text-sm text-cyan-100/45 leading-relaxed">
                  This tab exists so that anyone who finds this site — whether you're a student,
                  a potential partner, or just curious — can understand the scope of what's
                  already proven vs. what's still being planned.
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ INTEGRITY ═══ */}
          {activeTab === "integrity" && (
            <motion.div
              key="integrity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div>
                <div className="eyebrow flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Non-negotiable
                </div>
                <h2 className="section-title mt-1">Academic Integrity</h2>
              </div>

              <div className="card-shell p-6 sm:p-8 space-y-6">
                <div className="rounded-[1.2rem] border border-cyan-300/25 bg-cyan-300/8 p-4">
                  <p className="text-sm leading-relaxed text-cyan-100">
                    ThinkRN is an organization and study tool. All content is generated from
                    publicly available nursing education resources — ATI topic areas, the NCLEX-RN
                    test plan published by NCSBN, and standard nursing textbook concepts.
                    No school-specific intellectual property is used.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="font-bold text-white text-base mb-3">What this is ✓</h3>
                    <ul className="space-y-2.5">
                      {[
                        "A personal study aid built on publicly available nursing education standards",
                        "Flashcards and NCLEX-style questions aligned to ATI topic areas and the NCSBN test plan",
                        "A tool to reinforce and organize learning — not replace it",
                        "A project built by one student for his cohort, with zero institutional affiliation",
                        "Zero data collection — no tracking, no cookies, no server",
                      ].map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-300">
                          <span className="text-emerald-400 mt-0.5 shrink-0" aria-hidden="true">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-white/8">
                    <h3 className="font-bold text-white text-base mb-3">What this is not —</h3>
                    <ul className="space-y-2.5">
                      {[
                        "Not a cheating tool — answers are for studying, not copying",
                        "Not a substitute for clinical education, instructors, or hands-on practice",
                        "Not affiliated with any school, institution, or testing body",
                        "Not a source of proprietary exam questions from any program",
                        "Not a medical advice tool — never use this for real patient care decisions",
                      ].map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-400">
                          <span className="text-amber-400/70 mt-0.5 shrink-0" aria-hidden="true">—</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-white/8">
                    <h3 className="font-bold text-white text-base mb-2">Built-in safety</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      The feedback box on the Home tab uses automatic client-side pattern detection.
                      Messages that match dangerous prompt patterns — prompt injection attempts,
                      requests for real exam answers, clinical harm queries, or personal data
                      extraction — are blocked locally before they're stored. Nothing is transmitted
                      to a server. This is a transparency layer, not a punishment system.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/8">
                    <h3 className="font-bold text-white text-base mb-2">Why I built this</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      I'm a nursing student. I saw how hard my cohort was working and built something
                      to make it more organized. The process of building it affected me in ways I'm
                      still working through. This pause is part of that — taking real time to
                      understand the impact before scaling anything further.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ ABOUT ═══ */}
          {activeTab === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <div>
                <div className="eyebrow">Transparency</div>
                <h2 className="section-title mt-1">About This Site</h2>
              </div>

              <div className="card-shell p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-white mb-2">Who built this</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Ray Kosgei. Nursing student. Class rep. MNU, Olathe KS → Kansas City.
                    Built ThinkRN during Semester 2 as a study and organization tool for his cohort.
                    Stack: React · Vite · TypeScript · Tailwind CSS · GitHub Pages.
                  </p>
                </div>

                <div className="pt-5 border-t border-white/8">
                  <h3 className="font-bold text-lg text-white mb-2">Data & privacy</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <strong>Zero data collection.</strong> No tracking, no analytics, no cookies,
                    no server calls. Your session — including any feedback or email you saved —
                    lives only in your own browser's localStorage. Nothing was ever sent anywhere.
                  </p>
                </div>

                <div className="pt-5 border-t border-white/8">
                  <h3 className="font-bold text-lg text-white mb-2">The vision — openly</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">
                    Privately funded by Ray right now. Long-term: open to public funding and
                    nonprofit partnerships — specifically because access to good study tools is
                    unevenly distributed and he has seen it firsthand.
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Not building that yet. Needs to think it through. When he comes back,
                    the plan is a real long-term roadmap, full content bank, and a clear framework
                    for how nonprofit collaboration would work without compromising integrity.
                  </p>
                </div>

                <div className="pt-5 border-t border-white/8">
                  <h3 className="font-bold text-lg text-white mb-2">Source code</h3>
                  <p className="text-sm text-slate-300">
                    Open source.{" "}
                    <a
                      href="https://github.com/uyhlop/thinkrn-exams"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 underline underline-offset-4 hover:text-cyan-200 transition"
                    >
                      github.com/uyhlop/thinkrn-exams
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
