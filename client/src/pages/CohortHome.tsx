/* Cohort version: zero tracking, zero analytics bubble, completely open with About tab */
import examContent from "@/data/examContent.json";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Info,
  Pause,
  Play,
  RefreshCcw,
  Stethoscope,
  TrendingUp,
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
type TabKey = "terms" | "practice" | "scale" | "about";
type MetricKey = Question["cognitive_level"];

const tabs: { key: TabKey; label: string; icon: typeof Brain }[] = [
  { key: "terms", label: "Terms", icon: Brain },
  { key: "practice", label: "Practice Exam", icon: Stethoscope },
  { key: "scale", label: "Investor Scale", icon: TrendingUp },
  { key: "about", label: "About", icon: Info },
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

export default function CohortHome() {
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
    const saved = window.localStorage.getItem("thinkrn-cohort-session");
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
      window.localStorage.removeItem("thinkrn-cohort-session");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "thinkrn-cohort-session",
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

      {/* Header with nav tabs */}
      <div className="sticky top-0 z-40 border-b border-white/8 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-200" />
            <h1 className="font-bold text-sm uppercase tracking-wider text-white">ThinkRN</h1>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`nav-button ${activeTab === tab.key ? "border-cyan-300/50 bg-cyan-300/15" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container relative z-10 py-8">
        <AnimatePresence mode="wait">
          {/* TERMS TAB */}
          {activeTab === "terms" && (
            <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">Study Mode</div>
                  <h2 className="section-title">Flashcard Terms</h2>
                </div>
                <select
                  value={deck}
                  onChange={(e) => setDeck(e.target.value)}
                  className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white"
                >
                  {deckOptions.map((d) => (
                    <option key={d} value={d} className="bg-slate-900">
                      {d === "all" ? "All Decks" : d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="card-shell p-6 sm:p-8">
                <div className="flashcard" onClick={() => setFlipped(!flipped)}>
                  <div className="flashcard-inner" style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                    <div className="flashcard-face flashcard-front">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-slate-400 mb-4">{currentTerm?.course}</div>
                        <h4 className="font-bold text-2xl text-white sm:text-3xl">{currentTerm?.term}</h4>
                      </div>
                      <div className="text-xs text-slate-400">Click to reveal</div>
                    </div>
                    <div className="flashcard-face flashcard-back">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-cyan-200 mb-4">Definition</div>
                        <p className="text-base leading-relaxed text-white">{currentTerm?.definition}</p>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-widest text-amber-200 mb-2">Why it matters</div>
                        <p className="text-sm leading-relaxed text-amber-100/80">{currentTerm?.why_it_matters}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {termIndex + 1} / {filteredTerms.length}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTermIndex(Math.max(0, termIndex - 1))}
                      disabled={termIndex === 0}
                      className="nav-button disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setTermIndex(Math.min(filteredTerms.length - 1, termIndex + 1))}
                      disabled={termIndex === filteredTerms.length - 1}
                      className="nav-button disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PRACTICE EXAM TAB */}
          {activeTab === "practice" && (
            <motion.div key="practice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">Assessment</div>
                  <h2 className="section-title">Practice Exam</h2>
                </div>
              </div>

              {!practiceFinished ? (
                <>
                  {showBreakReminder && (
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="card-shell border-amber-400/30 bg-amber-400/10 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-amber-100">Brain Break Time!</p>
                          <p className="text-sm text-amber-100/70 mt-1">You've answered {answeredMilestone} questions. Take a moment to rest.</p>
                        </div>
                        <button
                          onClick={() => setBreakDismissedAt(answeredMilestone)}
                          className="text-amber-100 hover:text-amber-200 text-sm font-bold"
                        >
                          Got it
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div className="card-shell p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-400">
                        Question {questionIndex + 1} / {questions.length}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-cyan-200" />
                        <span className="font-bold text-cyan-100">{formatTime(elapsedSeconds)}</span>
                      </div>
                    </div>

                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300 transition-all duration-300"
                        style={{ width: progressWidth(answeredCount, questions.length) }}
                      />
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-widest text-slate-400 mb-3">{currentQuestion?.section}</div>
                      <p className="text-base leading-relaxed text-white">{currentQuestion?.stem}</p>
                    </div>

                    <div className="space-y-3">
                      {currentQuestion?.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectAnswer(idx)}
                          disabled={answeredCurrent !== undefined}
                          className={`answer-option ${
                            answeredCurrent === idx
                              ? idx === currentQuestion.answer_index
                                ? "answer-correct"
                                : "answer-wrong"
                              : ""
                          }`}
                        >
                          <span className="answer-badge">{String.fromCharCode(65 + idx)}</span>
                          <span className="flex-1 text-sm">{option}</span>
                        </button>
                      ))}
                    </div>

                    {showRationale && answeredCurrent !== undefined && (
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="card-shell border-cyan-300/30 bg-cyan-300/10 p-4 space-y-2"
                      >
                        <p className="text-xs uppercase tracking-widest text-cyan-200 font-bold">Rationale</p>
                        <p className="text-sm leading-relaxed text-cyan-100">{currentQuestion?.rationale}</p>
                        <p className="text-xs text-cyan-100/60 mt-3">
                          <strong>Cognitive Level:</strong> {levelLabels[currentQuestion?.cognitive_level || "recall"]}
                        </p>
                      </motion.div>
                    )}

                    {answeredCurrent !== undefined && (
                      <button
                        onClick={() => {
                          if (questionIndex < questions.length - 1) {
                            setQuestionIndex(questionIndex + 1);
                            setShowRationale(false);
                          }
                        }}
                        disabled={questionIndex === questions.length - 1}
                        className="nav-button w-full justify-center disabled:opacity-50"
                      >
                        {questionIndex === questions.length - 1 ? "Exam Complete" : "Next Question"}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="card-shell p-8 space-y-6">
                  <div className="text-center">
                    <h3 className="font-bold text-3xl text-white mb-2">Exam Complete!</h3>
                    <p className="text-slate-400">Great work. Here's your performance breakdown.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="metric-tile">
                      <span>Accuracy</span>
                      <strong>{accuracyRate}%</strong>
                    </div>
                    <div className="metric-tile">
                      <span>Answered</span>
                      <strong>{answeredCount}</strong>
                    </div>
                    <div className="metric-tile">
                      <span>Correct</span>
                      <strong>{correctCount}</strong>
                    </div>
                    <div className="metric-tile">
                      <span>Time</span>
                      <strong>{formatTime(elapsedSeconds)}</strong>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">By Cognitive Level</p>
                    {Object.entries(cognitiveStats).map(([level, stats]) => (
                      <div key={level}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">{levelLabels[level as MetricKey]}</span>
                          <span className="text-cyan-100 font-bold">
                            {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}% ({stats.correct}/{stats.total})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300"
                            style={{ width: stats.total > 0 ? `${(stats.correct / stats.total) * 100}%` : "0%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Format Preference</p>
                    <div className="grid grid-cols-3 gap-2">
                      {votingOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => setVote(option)}
                          className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                            vote === option
                              ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100"
                              : "border-white/15 bg-white/8 text-slate-300 hover:border-white/30"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={resetPractice} className="nav-button w-full justify-center">
                    <RefreshCcw className="h-4 w-4" />
                    Start Over
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* SCALE TAB */}
          {activeTab === "scale" && (
            <motion.div key="scale" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div>
                <div className="eyebrow">Vision</div>
                <h2 className="section-title">How ThinkRN Scales</h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {scaleCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="card-shell p-6 flex flex-col gap-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="eyebrow">{card.kicker}</div>
                          <h3 className="font-bold text-lg text-white mt-2">{card.title}</h3>
                        </div>
                        <Icon className="h-5 w-5 text-cyan-200 shrink-0" />
                      </div>
                      <p className="text-sm leading-relaxed text-slate-300">{card.body}</p>
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-xs uppercase tracking-widest text-amber-200 font-bold mb-2">Proof</p>
                        <p className="text-xs leading-relaxed text-amber-100/70">{card.proof}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-2xl">
              <div>
                <div className="eyebrow">Transparency</div>
                <h2 className="section-title">About This Site</h2>
              </div>

              <div className="card-shell p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-white mb-3">Data & Privacy</h3>
                  <p className="text-sm leading-relaxed text-slate-300 mb-4">
                    <strong>ThinkRN does not collect any data on this site.</strong> This is a free study tool for our cohort. No tracking, no cookies, no analytics.
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">
                    For next year's cohort, we're exploring an opt-in/opt-out model. The question we're asking: "If this was free for you, would you let us track basic study metrics to make it better?" All future cohorts will have a sliding scale pricing model.
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h3 className="font-bold text-lg text-white mb-3">How It Works</h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex gap-3">
                      <span className="text-cyan-200 font-bold">•</span>
                      <span><strong>Terms Deck:</strong> Flip through flashcards organized by exam topic.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-200 font-bold">•</span>
                      <span><strong>Practice Exam:</strong> NCLEX-style questions with rationales and cognitive level breakdown.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-cyan-200 font-bold">•</span>
                      <span><strong>Investor Scale:</strong> How ThinkRN grows with funding.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h3 className="font-bold text-lg text-white mb-3">Your Session</h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Your progress is saved locally in your browser. Close and reopen anytime—your answers, time, and preferences are preserved. No server, no tracking, completely private.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
