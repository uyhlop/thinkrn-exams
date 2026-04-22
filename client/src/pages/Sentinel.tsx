/*
  ThinkRN — Sentinel.tsx
  ======================
  Route: /sentinel  (password-gated — Ray only)

  Security model:
  - Client-side SHA-256 hash comparison only
  - Password never stored in plaintext anywhere in this codebase
  - No server, no PII, no transmission
*/

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Building2,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  Lightbulb,
  Lock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PASS_HASH =
  "07c81ae0d4382e7bc4ab4ae462db0c54857f57091c6f383a4fed0cacfb56b060";

async function hashInput(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type SentinelTab = "market" | "signals" | "ideas";

interface IdeaEntry {
  id: string;
  text: string;
  category: string;
  ts: number;
}

const marketLayers = [
  {
    icon: Building2,
    label: "Beachhead",
    sublabel: "MNU cohort · Olathe KS",
    value: "~120",
    unit: "students",
    color: "amber",
    detail:
      "The exact cohort ThinkRN was built for. Proof it works at ground level. One school, one semester, real usage.",
  },
  {
    icon: MapPin,
    sublabel: "Greater KC metro",
    label: "SAM — Serviceable",
    value: "~2,400",
    unit: "nursing students",
    color: "cyan",
    detail:
      "UMKC, MNU, Rockhurst, Graceland, community colleges across KC. Same NCLEX-RN test plan. One tool serves all of them.",
  },
  {
    icon: Users,
    label: "Regional expansion",
    sublabel: "MO · KS · surrounding states",
    value: "~28,000",
    unit: "nursing students",
    color: "cyan",
    detail:
      "Missouri and Kansas alone graduate thousands of RNs per year. The content is identical — ATI topic areas, NCSBN test plan.",
  },
  {
    icon: Stethoscope,
    label: "TAM — Total Addressable",
    sublabel: "US NCLEX-RN candidates",
    value: "~200,000",
    unit: "test-takers / year",
    color: "emerald",
    detail:
      "Every nursing student in the US studies toward the same nationally standardized exam. One content system. National reach.",
  },
  {
    icon: GraduationCap,
    label: "Adjacent — LPN / NCLEX-PN",
    sublabel: "Practical nursing candidates",
    value: "~60,000",
    unit: "additional / year",
    color: "slate",
    detail:
      "LPN programs use overlapping content. Extending ThinkRN to NCLEX-PN is a natural second product with minimal content delta.",
  },
];

const fundingModel = [
  {
    stage: "Now",
    label: "Self-funded · Hiatus",
    desc: "Ray privately funding development. Site live. Proving concept. No external money yet.",
    state: "active",
  },
  {
    stage: "Next",
    label: "Nonprofit partnerships",
    desc: "Partner with nursing access nonprofits to distribute ThinkRN to underserved programs. Sliding-scale or free tier.",
    state: "next",
  },
  {
    stage: "Then",
    label: "Public funding / open investment",
    desc: "Once roadmap is real and vision is fully understood: open to mission-aligned investors and public funding rounds.",
    state: "next",
  },
  {
    stage: "Always",
    label: "Access-first pricing",
    desc: "Sliding-scale model. Free for students who can't pay. Revenue from institutions and those who can afford it.",
    state: "principle",
  },
];

const IDEA_CATEGORIES = [
  "Product",
  "Business model",
  "Nonprofit",
  "Content",
  "Tech",
  "Partnership",
  "Personal",
  "Other",
];

export default function Sentinel() {
  const [unlocked, setUnlocked] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [passError, setPassError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [activeTab, setActiveTab] = useState<SentinelTab>("market");
  const [signals, setSignals] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<IdeaEntry[]>([]);
  const [ideaText, setIdeaText] = useState("");
  const [ideaCat, setIdeaCat] = useState(IDEA_CATEGORIES[0]);
  const ideaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!unlocked) return;
    try {
      const sigs = JSON.parse(
        window.localStorage.getItem("thinkrn-visitor-signals") || "[]"
      ) as string[];
      setSignals(sigs.reverse());
      const stored = JSON.parse(
        window.localStorage.getItem("thinkrn-sentinel-ideas") || "[]"
      ) as IdeaEntry[];
      setIdeas(stored.sort((a, b) => b.ts - a.ts));
    } catch { /* localStorage may be blocked */ }
  }, [unlocked]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = await hashInput(passInput.trim());
    if (hash === PASS_HASH) {
      setUnlocked(true);
      setPassError("");
    } else {
      setPassError("Incorrect password.");
      setPassInput("");
    }
  };

  const saveIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim()) return;
    const entry: IdeaEntry = {
      id: Date.now().toString(36),
      text: ideaText.trim().slice(0, 1000),
      category: ideaCat,
      ts: Date.now(),
    };
    const next = [entry, ...ideas];
    setIdeas(next);
    try {
      window.localStorage.setItem(
        "thinkrn-sentinel-ideas",
        JSON.stringify(next.slice(0, 200))
      );
    } catch { /* silently fail */ }
    setIdeaText("");
  };

  const deleteIdea = (id: string) => {
    const next = ideas.filter((i) => i.id !== id);
    setIdeas(next);
    try {
      window.localStorage.setItem("thinkrn-sentinel-ideas", JSON.stringify(next));
    } catch { /* silently fail */ }
  };

  const tabs: { key: SentinelTab; label: string; icon: typeof Brain }[] = [
    { key: "market",  label: "Market",   icon: TrendingUp   },
    { key: "signals", label: "Signals",  icon: MessageSquare },
    { key: "ideas",   label: "Idea Bank",icon: Lightbulb    },
  ];

  if (!unlocked) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.08),transparent_30%),linear-gradient(180deg,rgba(5,10,18,0.98),rgba(2,6,12,1))]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm mx-auto px-6"
        >
          <div className="card-shell p-8 space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
                <Lock className="h-5 w-5 text-amber-200" aria-hidden="true" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">ThinkRN Sentinel</h1>
                <p className="text-xs text-slate-500 mt-1">Investor & research access · Ray only</p>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={passInput}
                  onChange={(e) => { setPassInput(e.target.value); setPassError(""); }}
                  placeholder="Password"
                  aria-label="Sentinel password"
                  autoFocus
                  className="w-full rounded-[1.2rem] border border-white/15 bg-white/8 px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-600 focus:border-amber-400/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {passError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-400 text-center"
                >
                  {passError}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={!passInput.trim()}
                className="nav-button w-full justify-center disabled:opacity-40"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Unlock Sentinel
              </button>
            </form>

            <p className="text-center text-[10px] text-slate-600 leading-relaxed">
              Investor-facing market data and private notes.
              Client-side auth only — no server, no PII stored.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.06),transparent_25%),linear-gradient(180deg,rgba(5,10,18,0.97),rgba(2,6,12,1))]" />
      </div>

      <div className="sticky top-0 z-40 border-b border-white/8 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-amber-300" />
            <h1 className="font-bold text-sm uppercase tracking-wider text-white">ThinkRN</h1>
            <span className="rounded-full border border-amber-400/40 bg-amber-400/12 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-200/80 hidden sm:inline">
              Sentinel
            </span>
          </div>
          <nav className="flex gap-1" aria-label="Sentinel navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  aria-current={activeTab === tab.key ? "page" : undefined}
                  className={`nav-button ${activeTab === tab.key ? "border-amber-400/50 bg-amber-400/15" : ""}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline text-xs">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="container relative z-10 py-10 mx-auto" style={{ maxWidth: "720px" }}>
        <AnimatePresence mode="wait">

          {activeTab === "market" && (
            <motion.div key="market" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-6">
              <div>
                <div className="eyebrow flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  Investor view · Confidential
                </div>
                <h2 className="section-title mt-1">
                  Market size &<br />
                  <span className="text-amber-200">funding model.</span>
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mt-4">
                  ThinkRN starts hyper-local — one cohort, one city — and scales along a well-defined path.
                  Every nursing student in the US studies toward the same nationally standardized exam.
                  The content system that works for MNU works everywhere.
                </p>
              </div>

              <div className="card-shell p-6 space-y-5">
                <div>
                  <div className="eyebrow">Scale ladder</div>
                  <h3 className="section-title-sm mt-1">Beachhead → TAM</h3>
                </div>
                <ol className="space-y-4">
                  {marketLayers.map((layer, i) => {
                    const Icon = layer.icon;
                    const colorMap: Record<string, string> = {
                      amber:   "border-amber-400/40 bg-amber-400/10 text-amber-200",
                      cyan:    "border-cyan-300/30 bg-cyan-300/8 text-cyan-200",
                      emerald: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
                      slate:   "border-white/12 bg-white/5 text-slate-400",
                    };
                    const valColor: Record<string, string> = {
                      amber: "text-amber-100", cyan: "text-cyan-100",
                      emerald: "text-emerald-100", slate: "text-slate-400",
                    };
                    return (
                      <li key={i} className="flex items-start gap-4">
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${colorMap[layer.color]}`} aria-hidden="true">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className={`font-bold text-xl leading-none ${valColor[layer.color]}`}>{layer.value}</span>
                            <span className="text-xs text-slate-500">{layer.unit}</span>
                          </div>
                          <p className="text-sm font-semibold text-white">{layer.label}</p>
                          <p className="text-xs text-slate-500">{layer.sublabel}</p>
                          <p className="text-xs text-slate-400 leading-relaxed pt-1">{layer.detail}</p>
                        </div>
                        {i < marketLayers.length - 1 && (
                          <ChevronRight className="h-4 w-4 text-slate-700 shrink-0 mt-2.5" aria-hidden="true" />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="card-shell p-6 space-y-5">
                <div>
                  <div className="eyebrow">Funding model</div>
                  <h3 className="section-title-sm mt-1">How this gets built</h3>
                </div>
                <ol className="space-y-4">
                  {fundingModel.map((f, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold ${
                        f.state === "active" ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                        : f.state === "principle" ? "border-emerald-400/30 bg-emerald-400/8 text-emerald-200"
                        : "border-white/10 bg-white/4 text-slate-500"
                      }`}>{f.stage}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{f.label}</p>
                        <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{f.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="card-shell border-amber-400/15 bg-amber-400/5 p-6 space-y-4">
                <div className="eyebrow text-amber-200/60">Proof points</div>
                <ul className="space-y-2.5">
                  {[
                    "Built and deployed by one person with zero institutional resources",
                    "Real cohort usage — not a demo, not a mockup",
                    "100% publicly available content — no IP risk",
                    "Zero data collection — privacy-first from day one",
                    "NCLEX-RN test plan is nationally standardized — content scales without rewrite",
                    "GitHub Pages deployment — $0 hosting cost at current scale",
                  ].map((pt, i) => (
                    <li key={i} className="flex gap-3 text-sm text-amber-100/70">
                      <span className="text-amber-400 mt-0.5 shrink-0" aria-hidden="true">◆</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {activeTab === "signals" && (
            <motion.div key="signals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-6">
              <div>
                <div className="eyebrow flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  From the public page
                </div>
                <h2 className="section-title mt-1">Visitor Signals</h2>
                <p className="text-slate-400 text-sm leading-relaxed mt-3">
                  Messages visitors left on the public hiatus page — stored in their browser localStorage.
                  If you're on the same device/browser they used, signals appear here.
                </p>
              </div>
              {signals.length === 0 ? (
                <div className="card-shell p-8 flex flex-col items-center text-center gap-3">
                  <MessageSquare className="h-8 w-8 text-slate-700" aria-hidden="true" />
                  <p className="text-sm text-slate-500">No signals yet — or you're on a different browser than the visitors.</p>
                  <p className="text-xs text-slate-600">Signals are browser-local by design. This is not a bug.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {signals.map((sig, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card-shell p-4">
                      <p className="text-sm text-slate-200 leading-relaxed">{sig}</p>
                      <p className="text-[10px] text-slate-600 mt-2">Signal #{signals.length - i}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "ideas" && (
            <motion.div key="ideas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-6">
              <div>
                <div className="eyebrow flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                  Private · localStorage only
                </div>
                <h2 className="section-title mt-1">Idea Bank</h2>
                <p className="text-slate-400 text-sm leading-relaxed mt-3">
                  Capture ideas while you're away. Stored only in this browser. Never transmitted. Max 200 entries · 1,000 chars each.
                </p>
              </div>

              <div className="card-shell p-6 space-y-4">
                <div className="eyebrow">New idea</div>
                <form onSubmit={saveIdea} className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <select value={ideaCat} onChange={(e) => setIdeaCat(e.target.value)} aria-label="Idea category"
                      className="rounded-[1.2rem] border border-white/12 bg-white/6 px-3 py-2.5 text-xs text-white focus:border-amber-400/30 focus:outline-none">
                      {IDEA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="text-xs text-slate-600">{ideaText.length}/1000</span>
                  </div>
                  <textarea ref={ideaRef} value={ideaText} onChange={(e) => setIdeaText(e.target.value)}
                    placeholder="Capture an idea, insight, or business thought while it's fresh…"
                    rows={4} maxLength={1000} aria-label="New idea text"
                    className="w-full rounded-[1.2rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-amber-400/30 focus:outline-none resize-none leading-relaxed" />
                  <div className="flex justify-end">
                    <button type="submit" disabled={!ideaText.trim()} className="nav-button disabled:opacity-40">
                      <BookOpen className="h-4 w-4" aria-hidden="true" />
                      Save idea
                    </button>
                  </div>
                </form>
              </div>

              {ideas.length === 0 ? (
                <div className="card-shell p-8 flex flex-col items-center text-center gap-3">
                  <Lightbulb className="h-8 w-8 text-slate-700" aria-hidden="true" />
                  <p className="text-sm text-slate-500">No ideas saved yet. Add your first one above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ideas.map((idea, i) => (
                    <motion.div key={idea.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card-shell p-5 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full border border-amber-400/25 bg-amber-400/8 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-200/70">
                          {idea.category}
                        </span>
                        <button onClick={() => deleteIdea(idea.id)} aria-label="Delete idea" className="shrink-0 text-slate-600 hover:text-red-400 transition">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{idea.text}</p>
                      <p className="text-[10px] text-slate-600">
                        {new Date(idea.ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
