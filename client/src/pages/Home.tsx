/*
Design philosophy for this file: Technical modernist operating console.
Keep the layout mobile-first, dark, modular, and information-dense without clutter.
Every section should reinforce the idea that ThinkRN is a working system: study engine, analytics surface, and scale story in one flow.
*/
import examContent from "@/data/examContent.json";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Brain,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Layers3,
  Pause,
  Play,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  UserCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Term = {
  id: string;
  course: string;
  deck: string;
  term: string;
  definition: string;
  why_it_matters: string;
};

type Question = {
  id: string;
  course: string;
  section: string;
  stem: string;
  options: string[];
  answer_index: number;
  rationale: string;
  cognitive_level: "recall" | "application" | "analysis" | "prioritization";
};

type AnswerMap = Record<string, number>;
type VoteOption = "Terms-first" | "NCLEX drills" | "Mixed mode" | null;
type TabKey = "terms" | "practice" | "scale";

type MetricKey = Question["cognitive_level"];

const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663568141889/e5pFPnkGugfrUtC2ZCJyHN/thinkrn-hero-console-kgGZcy24zpuaGUFJTUmLpQ.webp";
const SCALE_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663568141889/e5pFPnkGugfrUtC2ZCJyHN/thinkrn-scale-network-E6TbdygxcTHwW5d8pfND8P.webp";
const BUBBLE_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663568141889/e5pFPnkGugfrUtC2ZCJyHN/thinkrn-metric-bubble-bg-EMXehR9TBeZvBXHTjgFxec.webp";

const tabs: { key: TabKey; label: string; icon: typeof Brain }[] = [
  { key: "terms", label: "Terms", icon: Brain },
  { key: "practice", label: "Practice Exam", icon: Stethoscope },
  { key: "scale", label: "Investor Scale", icon: TrendingUp },
];

const votingOptions: Exclude<VoteOption, null>[] = [
  "Terms-first",
  "NCLEX drills",
  "Mixed mode",
];

const scaleCards = [
  {
    title: "Hormozi Model",
    kicker: "$100M Offers logic for nursing education",
    icon: TrendingUp,
    body:
      "ThinkRN packages high-value exam prep, rapid feedback, and continuous content updates into a low-cost delivery loop. Human research through Sentinel creates the insight layer, while agents and workflows turn that research into repeatable study products without requiring a large staff.",
    proof:
      "The system already works at small scale: topic tracking, question generation, content packaging, and performance review happen in a repeatable sequence.",
  },
  {
    title: "Enterprise Partnership Model",
    kicker: "White-labeled for other industries",
    icon: Building2,
    body:
      "The same system can be adapted for enterprises that need training, qualification support, or knowledge operations. Sentinel monitors the domain, Ray guides the research direction, and agents plus CRM workflows convert findings into usable learning or sales assets.",
    proof:
      "Investors are funding a flexible operating system: research, packaging, outreach, and follow-up can be retuned for multiple verticals without rebuilding from scratch.",
  },
  {
    title: "College Athlete Recruitment",
    kicker: "Data + CRM for NIL opportunity matching",
    icon: Dumbbell,
    body:
      "The engagement-tracking logic also applies to athlete recruitment. Profiles, outreach history, response signals, content performance, and fit scoring can be organized so that relationship-building becomes faster and more disciplined.",
    proof:
      "Agents handle the repetitive monitoring and sorting, while the founder stays focused on human judgment, positioning, and relationship decisions.",
  },
];

const levelLabels: Record<MetricKey, string> = {
  recall: "Recall",
  application: "Application",
  analysis: "Analysis",
  prioritization: "Prioritization",
};

const terms = examContent.terms as Term[];
const questions = examContent.questions as Question[];

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value, index) => (index === 0 ? String(value) : String(value).padStart(2, "0")))
    .join(":");
}

function progressWidth(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.max(0, Math.min(100, (value / total) * 100))}%`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("terms");
  const [deck, setDeck] = useState<"all" | string>("all");
  const [termIndex, setTermIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [showRationale, setShowRationale] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [breakDismissedAt, setBreakDismissedAt] = useState(0);
  const [vote, setVote] = useState<VoteOption>(null);

  const deckOptions = useMemo(() => {
    const uniqueDecks = Array.from(new Set(terms.map((term) => term.deck)));
    return ["all", ...uniqueDecks];
  }, []);

  const filteredTerms = useMemo(() => {
    if (deck === "all") return terms;
    return terms.filter((term) => term.deck === deck);
  }, [deck]);

  const currentTerm = filteredTerms[termIndex] ?? filteredTerms[0];
  const currentQuestion = questions[questionIndex];
  const answeredCount = Object.keys(answers).length;
  const correctCount = useMemo(
    () => questions.filter((question) => answers[question.id] === question.answer_index).length,
    [answers],
  );

  const accuracyRate = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;

  const cognitiveStats = useMemo(() => {
    const base = {
      recall: { correct: 0, total: 0 },
      application: { correct: 0, total: 0 },
      analysis: { correct: 0, total: 0 },
      prioritization: { correct: 0, total: 0 },
    } satisfies Record<MetricKey, { correct: number; total: number }>;

    questions.forEach((question) => {
      const selected = answers[question.id];
      if (selected === undefined) return;
      base[question.cognitive_level].total += 1;
      if (selected === question.answer_index) {
        base[question.cognitive_level].correct += 1;
      }
    });

    return base;
  }, [answers]);

  const answeredMilestone = Math.floor(answeredCount / 25) * 25;
  const showBreakReminder = answeredMilestone > 0 && answeredMilestone !== breakDismissedAt;

  useEffect(() => {
    setTermIndex(0);
    setFlipped(false);
  }, [deck]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    const saved = window.localStorage.getItem("thinkrn-session-v1");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as {
        activeTab: TabKey;
        deck: string;
        termIndex: number;
        questionIndex: number;
        answers: AnswerMap;
        elapsedSeconds: number;
        vote: VoteOption;
      };
      setActiveTab(parsed.activeTab ?? "terms");
      setDeck(parsed.deck ?? "all");
      setTermIndex(parsed.termIndex ?? 0);
      setQuestionIndex(parsed.questionIndex ?? 0);
      setAnswers(parsed.answers ?? {});
      setElapsedSeconds(parsed.elapsedSeconds ?? 0);
      setVote(parsed.vote ?? null);
    } catch {
      window.localStorage.removeItem("thinkrn-session-v1");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "thinkrn-session-v1",
      JSON.stringify({
        activeTab,
        deck,
        termIndex,
        questionIndex,
        answers,
        elapsedSeconds,
        vote,
      }),
    );
  }, [activeTab, deck, termIndex, questionIndex, answers, elapsedSeconds, vote]);

  const answeredCurrent = currentQuestion ? answers[currentQuestion.id] : undefined;
  const practiceFinished = answeredCount === questions.length;

  const selectAnswer = (index: number) => {
    if (!currentQuestion) return;
    setAnswers((current) => ({ ...current, [currentQuestion.id]: index }));
    setShowRationale(true);
    if (!timerRunning) setTimerRunning(true);
  };

  const resetPractice = () => {
    setAnswers({});
    setShowRationale(false);
    setQuestionIndex(0);
    setElapsedSeconds(0);
    setTimerRunning(false);
    setBreakDismissedAt(0);
    setVote(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.12),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.08),transparent_18%),linear-gradient(180deg,rgba(5,10,18,0.96),rgba(2,6,12,1))]" />
        <div className="noise-mask absolute inset-0" />
      </div>

      <div className="fixed bottom-4 right-4 z-50 w-[168px] overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/6 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-6 sm:right-6 sm:w-[184px]">
        <div
          className="absolute inset-0 opacity-35"
          style={{ backgroundImage: `url(${BUBBLE_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="relative space-y-2 p-3">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-cyan-100/70">
            <span>Live Study Data</span>
            <Activity className="h-3.5 w-3.5 text-cyan-200" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bubble-chip">
              <span>Time</span>
              <strong>{formatTime(elapsedSeconds)}</strong>
            </div>
            <div className="bubble-chip">
              <span>Answered</span>
              <strong>{answeredCount}/{questions.length}</strong>
            </div>
            <div className="bubble-chip">
              <span>Accuracy</span>
              <strong>{accuracyRate}%</strong>
            </div>
            <div className="bubble-chip">
              <span>Deck</span>
              <strong>{deck === "all" ? "All" : deck.includes("Mental") ? "MH" : "HR1"}</strong>
            </div>
          </div>
        </div>
      </div>

      <header className="relative border-b border-white/8 bg-black/18 backdrop-blur-xl">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-cyan-200/72">
                <Sparkles className="h-3.5 w-3.5" />
                ThinkRN Operating Surface
              </div>
              <h1 className="font-bold text-2xl tracking-tight text-white sm:text-3xl">
                Ray Kosgei Exam Console
              </h1>
            </div>
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-right text-xs text-slate-300 sm:block">
              <div className="font-medium text-white">Offline-capable review</div>
              <div>Mental Health + Health Restoration</div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="container py-6 sm:py-8">
          <div className="hero-grid overflow-hidden rounded-[2rem] border border-white/10 bg-card/80 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur sm:p-6 lg:p-8">
            <div className="order-2 space-y-6 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-100/80">
                <ShieldCheck className="h-3.5 w-3.5" />
                This week’s exams anchored from calendar + semester schedule
              </div>
              <div className="space-y-4">
                <h2 className="max-w-xl font-bold text-4xl leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Study the exam. Show the system. Scale the proof.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  ThinkRN turns Ray’s course schedule into a focused mobile study experience with terms, NCLEX-style practice,
                  live performance analytics, and a clean investor story showing how the same workflow scales with funding.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="panel-tile">
                  <Clock3 className="mb-3 h-5 w-5 text-cyan-200" />
                  <p className="tile-label">Upcoming</p>
                  <p className="tile-value">Mental Health Exam 3</p>
                  <p className="tile-note">Apr 21 · 10:45 AM</p>
                </div>
                <div className="panel-tile">
                  <HeartPulse className="mb-3 h-5 w-5 text-cyan-200" />
                  <p className="tile-label">Next</p>
                  <p className="tile-value">HR 1 Exam 4</p>
                  <p className="tile-note">Apr 22 · 1:00 PM</p>
                </div>
                <div className="panel-tile">
                  <Target className="mb-3 h-5 w-5 text-amber-200" />
                  <p className="tile-label">Coverage</p>
                  <p className="tile-value">100 Terms / 120 Questions</p>
                  <p className="tile-note">Mixed cognitive levels</p>
                </div>
              </div>
            </div>

            <div className="order-1 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20 lg:order-2">
              <img
                src={HERO_IMAGE}
                alt="Abstract ThinkRN study console illustration"
                className="h-full min-h-[280px] w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="sticky top-0 z-30 border-y border-white/8 bg-[rgba(4,8,14,0.82)] backdrop-blur-xl">
          <div className="container py-3">
            <div className="grid grid-cols-3 gap-2 rounded-full border border-white/10 bg-white/5 p-1.5">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`rounded-full px-3 py-3 text-xs font-medium transition sm:text-sm ${
                    activeTab === key
                      ? "bg-white text-slate-950 shadow-[0_8px_24px_rgba(255,255,255,0.14)]"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="container py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {activeTab === "terms" && (
              <motion.section
                key="terms"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Flashcard terms exam</p>
                    <h3 className="section-title">Flip through the language most likely to anchor recall.</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {deckOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDeck(option)}
                        className={`rounded-full border px-3 py-2 text-xs transition ${
                          deck === option
                            ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-50"
                            : "border-white/10 bg-white/4 text-slate-300 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {option === "all" ? "All decks" : option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="card-shell p-4 sm:p-6">
                    <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                      <span>{currentTerm?.course}</span>
                      <span>{termIndex + 1} / {filteredTerms.length}</span>
                    </div>
                    <button type="button" onClick={() => setFlipped((value) => !value)} className="flashcard w-full text-left">
                      <div className={`flashcard-inner ${flipped ? "is-flipped" : ""}`}>
                        <div className="flashcard-face flashcard-front">
                          <div>
                            <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-cyan-200/70">Tap to flip</p>
                            <h4 className="font-bold text-3xl text-white sm:text-4xl">{currentTerm?.term}</h4>
                          </div>
                          <p className="max-w-md text-sm leading-7 text-slate-300">
                            Use this side for active recall before looking at the definition.
                          </p>
                        </div>
                        <div className="flashcard-face flashcard-back">
                          <div className="space-y-5">
                            <div>
                              <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-cyan-200/70">Definition</p>
                              <p className="text-sm leading-7 text-slate-100">{currentTerm?.definition}</p>
                            </div>
                            <div>
                              <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-amber-200/70">Why it matters</p>
                              <p className="text-sm leading-7 text-slate-300">{currentTerm?.why_it_matters}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setTermIndex((value) => (value === 0 ? filteredTerms.length - 1 : value - 1));
                          setFlipped(false);
                        }}
                        className="nav-button"
                      >
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </button>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                        <div className="h-full rounded-full bg-cyan-300/80" style={{ width: progressWidth(termIndex + 1, filteredTerms.length) }} />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTermIndex((value) => (value + 1) % filteredTerms.length);
                          setFlipped(false);
                        }}
                        className="nav-button"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="card-shell p-5">
                      <p className="eyebrow">Deck summary</p>
                      <h4 className="section-title-sm">Coverage tuned for this exam window</h4>
                      <div className="mt-4 space-y-3">
                        {["Mental Health Exam 3", "Health Restoration 1 Exam 4"].map((label) => {
                          const count = terms.filter((term) => term.deck === label).length;
                          return (
                            <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-white">{label}</span>
                                <span className="text-xs text-slate-400">{count} cards</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                                <div className="h-full rounded-full bg-cyan-300/75" style={{ width: progressWidth(count, terms.length) }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="card-shell p-5">
                      <p className="eyebrow">How to use</p>
                      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                        <p>Start with the term side. Say the definition out loud before flipping.</p>
                        <p>Cycle the Mental Health deck first if Ray is reviewing for the earliest exam, then switch to HR 1 for the next day.</p>
                        <p>Because the session state saves locally, this page can be reopened later on the phone without losing place.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === "practice" && (
              <motion.section
                key="practice"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">120-question practice exam</p>
                    <h3 className="section-title">NCLEX-style rehearsal with timer, rationales, and cognitive-level tracking.</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTimerRunning((value) => !value)}
                      className="nav-button"
                    >
                      {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {timerRunning ? "Pause" : "Start"}
                    </button>
                    <button type="button" onClick={resetPractice} className="nav-button">
                      <RefreshCcw className="h-4 w-4" /> Reset
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.78fr_0.22fr]">
                  <div className="card-shell p-4 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Question {questionIndex + 1} of {questions.length}</p>
                        <h4 className="mt-2 font-bold text-2xl text-white sm:text-3xl">{currentQuestion.section}</h4>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                        {levelLabels[currentQuestion.cognitive_level]}
                      </div>
                    </div>

                    <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-cyan-300/80" style={{ width: progressWidth(questionIndex + 1, questions.length) }} />
                    </div>

                    <p className="text-base leading-8 text-slate-100 sm:text-lg">{currentQuestion.stem}</p>

                    <div className="mt-6 space-y-3">
                      {currentQuestion.options.map((option, index) => {
                        const selected = answeredCurrent === index;
                        const isCorrect = currentQuestion.answer_index === index;
                        const reveal = answeredCurrent !== undefined;
                        return (
                          <button
                            key={`${currentQuestion.id}-${index}`}
                            type="button"
                            onClick={() => selectAnswer(index)}
                            className={`answer-option ${
                              reveal && isCorrect
                                ? "answer-correct"
                                : reveal && selected && !isCorrect
                                  ? "answer-wrong"
                                  : selected
                                    ? "answer-selected"
                                    : ""
                            }`}
                          >
                            <span className="answer-badge">{String.fromCharCode(65 + index)}</span>
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {showRationale && answeredCurrent !== undefined && (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4"
                        >
                          <div className="mb-3 flex items-center gap-2 text-sm text-cyan-100">
                            <CheckCircle2 className="h-4 w-4" />
                            Correct answer: {String.fromCharCode(65 + currentQuestion.answer_index)}
                          </div>
                          <p className="text-sm leading-7 text-slate-300">{currentQuestion.rationale}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-6 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionIndex((value) => Math.max(0, value - 1));
                          setShowRationale(true);
                        }}
                        className="nav-button"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionIndex((value) => Math.min(questions.length - 1, value + 1));
                          setShowRationale(true);
                        }}
                        className="nav-button"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="card-shell p-5">
                      <p className="eyebrow">Timer</p>
                      <div className="mt-3 font-bold text-4xl text-white">{formatTime(elapsedSeconds)}</div>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        Run continuously for a realistic test block, or pause between study sessions.
                      </p>
                    </div>

                    <div className="card-shell p-5">
                      <p className="eyebrow">Cognitive breakdown</p>
                      <div className="mt-4 space-y-4">
                        {Object.entries(cognitiveStats).map(([key, value]) => {
                          const rate = value.total ? Math.round((value.correct / value.total) * 100) : 0;
                          return (
                            <div key={key}>
                              <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                                <span>{levelLabels[key as MetricKey]}</span>
                                <span>{value.correct}/{value.total} · {rate}%</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                                <div className="h-full rounded-full bg-cyan-300/75" style={{ width: `${rate}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showBreakReminder && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="card-shell flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="eyebrow">Brain break reminder</p>
                        <h4 className="section-title-sm">You’ve answered {answeredMilestone} questions.</h4>
                        <p className="mt-2 text-sm leading-7 text-slate-300">
                          Step away for two to five minutes, hydrate, reset your breathing, then come back sharper.
                        </p>
                      </div>
                      <button type="button" onClick={() => setBreakDismissedAt(answeredMilestone)} className="nav-button">
                        Resume focus <ArrowRight className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                  <div className="card-shell p-5">
                    <p className="eyebrow">Results summary</p>
                    <h4 className="section-title-sm">Current performance snapshot</h4>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="metric-tile">
                        <span>Correct</span>
                        <strong>{correctCount}</strong>
                      </div>
                      <div className="metric-tile">
                        <span>Accuracy</span>
                        <strong>{accuracyRate}%</strong>
                      </div>
                      <div className="metric-tile">
                        <span>Answered</span>
                        <strong>{answeredCount}</strong>
                      </div>
                      <div className="metric-tile">
                        <span>Remaining</span>
                        <strong>{questions.length - answeredCount}</strong>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      Stronger scores in application and prioritization suggest readiness for clinical reasoning. Lower recall scores suggest a return to the terms deck first.
                    </p>
                  </div>

                  <div className="card-shell p-5">
                    <p className="eyebrow">Next week preference</p>
                    <h4 className="section-title-sm">Which format do you prefer for next week?</h4>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {votingOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setVote(option)}
                          className={`rounded-[1.4rem] border p-4 text-left transition ${
                            vote === option
                              ? "border-cyan-300/40 bg-cyan-300/12 text-cyan-50"
                              : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-400">Vote</div>
                          <div className="text-base font-medium">{option}</div>
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {practiceFinished
                        ? "Full exam completed. The vote is saved locally on this phone for quick reference later."
                        : "The vote can be set anytime and is saved locally on this phone along with study progress."}
                    </p>
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === "scale" && (
              <motion.section
                key="scale"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="card-shell overflow-hidden p-0">
                  <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="p-5 sm:p-6 lg:p-8">
                      <p className="eyebrow">With funding, here’s where ThinkRN scales</p>
                      <h3 className="section-title max-w-xl">
                        You are not funding an app. You are funding a proven operating system that expands.
                      </h3>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                        Sentinel is the research and monitoring engine behind the system. Ray does the research through Sentinel;
                        the process stays human-driven and AI-assisted. Agents, APIs, and CRM workflows remove repetitive labor,
                        shorten turnaround time, and let one founder market and build at the same time.
                      </p>
                      <blockquote className="mt-5 border-l border-cyan-300/35 pl-4 italic text-lg leading-8 text-white sm:text-xl">
                        “I’m not asking you to fund an app. I’m asking you to fund a system that I’ve already proven works at small scale,
                        and here’s how it grows.”
                      </blockquote>
                    </div>
                    <div className="min-h-[300px] border-t border-white/10 lg:min-h-full lg:border-l lg:border-t-0">
                      <img src={SCALE_IMAGE} alt="Abstract ThinkRN scale network illustration" className="h-full w-full object-cover" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {scaleCards.map(({ title, kicker, body, proof, icon: Icon }) => (
                    <article key={title} className="card-shell h-full p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-200">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">30-second story</span>
                      </div>
                      <h4 className="text-xl font-semibold text-white">{title}</h4>
                      <p className="mt-2 text-sm text-cyan-100/70">{kicker}</p>
                      <p className="mt-4 text-sm leading-7 text-slate-300">{body}</p>
                      <div className="mt-5 rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                        <strong className="mb-2 block text-white">Why this matters:</strong>
                        {proof}
                      </div>
                    </article>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                  <div className="card-shell p-5">
                    <p className="eyebrow">How the engine saves money</p>
                    <div className="mt-4 space-y-3">
                      {[
                        "Sentinel monitors source material so Ray spends less time hunting and more time deciding.",
                        "Agents turn research into drafts, summaries, and structured records instead of requiring a full content team.",
                        "CRM-style tracking keeps leads, learners, or prospects organized across follow-up cycles.",
                        "APIs and workflow automation reduce turnaround time, making each dollar of labor travel further.",
                      ].map((line) => (
                        <div key={line} className="flex gap-3 rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4">
                          <Layers3 className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                          <p className="text-sm leading-7 text-slate-300">{line}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-shell p-5">
                    <p className="eyebrow">Founder-in-motion proof</p>
                    <h4 className="section-title-sm">Ray can market and build simultaneously.</h4>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center gap-2 text-white">
                          <UserCircle2 className="h-4 w-4 text-cyan-200" />
                          Ray in the loop
                        </div>
                        <p className="text-sm leading-7 text-slate-300">
                          Ray edits and posts public-facing content, keeps the voice aligned, and directs what matters.
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center gap-2 text-white">
                          <Briefcase className="h-4 w-4 text-cyan-200" />
                          Agents in the background
                        </div>
                        <p className="text-sm leading-7 text-slate-300">
                          While he posts, agents can monitor inputs, organize records, prep drafts, and move repetitive work forward.
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center gap-2 text-white">
                          <GraduationCap className="h-4 w-4 text-cyan-200" />
                          Education proof
                        </div>
                        <p className="text-sm leading-7 text-slate-300">
                          ThinkRN already demonstrates that the research-to-delivery loop can produce useful educational products quickly.
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center gap-2 text-white">
                          <Target className="h-4 w-4 text-cyan-200" />
                          Investor takeaway
                        </div>
                        <p className="text-sm leading-7 text-slate-300">
                          Funding expands an operating system that already has signal, workflow discipline, and multiple pathways to scale.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
