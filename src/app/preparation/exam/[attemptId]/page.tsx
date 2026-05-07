'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Question {
  _id: string;
  mainQuestion: string;
  questionType: 'MCQ' | 'Written' | 'Practical' | 'TrueFalse';
  options: string[];
  defaultMark: number;
  subQuestions: { subText: string; subMark: number }[];
  difficulty: string;
  part: string;
}
interface Sheet {
  _id: string;
  title: string;
  part: string;
  totalMarks: number;
  durationMinutes: number;
  passMarks?: number;
  questions: { questionId: Question; customMark?: number }[];
}
interface AttemptData {
  _id: string;
  questionSheetId: Sheet;
  startTime: string;
  result: string;
}

export default function ExamAttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router  = useRouter();
  const { user, loading } = useAuth();

  const [attempt, setAttempt]         = useState<AttemptData | null>(null);
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [answers, setAnswers]         = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [timeLeft, setTimeLeft]       = useState(0);
  const [fetching, setFetching]       = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await api.get(`/preparation/exam/${attemptId}`);
        const data = res.data;
        // If already submitted, go to results
        if (data.result !== 'Pending') {
          router.replace(`/preparation/exam/${attemptId}/results`);
          return;
        }
        setAttempt(data);
        const sheet = data.questionSheetId;
        const qs: Question[] = (sheet.questions || []).map((q: any) => q.questionId).filter(Boolean);
        setQuestions(qs);
        // Remaining time
        const elapsed = (Date.now() - new Date(data.startTime).getTime()) / 1000;
        const remaining = Math.max(0, (sheet.durationMinutes * 60) - elapsed);
        setTimeLeft(Math.floor(remaining));
      } catch { /* silent */ }
      finally { setFetching(false); }
    };
    load();
  }, [user, attemptId]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    const t = setInterval(() => setTimeLeft(s => {
      if (s <= 1) { clearInterval(t); handleSubmit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [timeLeft, submitted]);

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, userAnswer]) => ({
        questionId, userAnswer,
      }));
      await api.post(`/preparation/exam/${attemptId}/submit`, { answers: payload });
      setSubmitted(true);
      router.push(`/preparation/exam/${attemptId}/results`);
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  }, [answers, attemptId, submitting, submitted, router]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const setAnswer = (qId: string, val: string) =>
    setAnswers(prev => ({ ...prev, [qId]: val }));

  const q = questions[currentIdx];
  const answered = Object.keys(answers).length;
  const timerColor = timeLeft < 120 ? 'text-red-400' : timeLeft < 300 ? 'text-amber-400' : 'text-emerald-400';

  if (loading || !user || fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!attempt || !q) return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
        <p>Exam not found or already submitted.</p>
        <Button className="mt-4" onClick={() => router.push('/preparation/exam')}>Back to Exam Center</Button>
      </div>
    </div>
  );

  const sheet = attempt.questionSheetId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-white/10 bg-card/50 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div>
          <p className="text-xs text-muted-foreground">Part {sheet.part}</p>
          <h1 className="font-bold text-sm">{sheet.title}</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Answered</p>
            <p className="font-bold text-sm">{answered}/{questions.length}</p>
          </div>
          <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timerColor}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {submitting ? 'Submitting…' : 'Submit Exam'}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question Navigator */}
        <aside className="w-52 border-r border-white/10 bg-card/30 p-4 overflow-y-auto hidden md:block">
          <p className="text-xs text-muted-foreground font-semibold mb-3 uppercase tracking-wider">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((qItem, idx) => (
              <button
                key={qItem._id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  idx === currentIdx            ? 'bg-primary text-white' :
                  answers[qItem._id]            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                   'bg-background/50 text-muted-foreground hover:bg-white/10'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </aside>

        {/* Question Panel */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {/* Q Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                  Q{currentIdx + 1}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                  q.difficulty === 'Easy'   ? 'bg-emerald-500/20 text-emerald-400' :
                  q.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                              'bg-red-500/20 text-red-400'
                }`}>{q.difficulty}</span>
                <span className="text-xs text-muted-foreground">{q.defaultMark} mark{q.defaultMark !== 1 ? 's' : ''}</span>
              </div>
              <span className="text-xs text-muted-foreground">{currentIdx + 1} of {questions.length}</span>
            </div>

            {/* Question text */}
            <div className="glass-panel rounded-2xl p-6 mb-6">
              <p className="text-base font-medium leading-relaxed">{q.mainQuestion}</p>
            </div>

            {/* MCQ / TrueFalse */}
            {(q.questionType === 'MCQ' || q.questionType === 'TrueFalse') && (
              <div className="space-y-3">
                {(q.questionType === 'TrueFalse' ? ['True', 'False'] : q.options).map((opt, i) => {
                  const label = q.questionType === 'TrueFalse' ? opt : `${String.fromCharCode(65 + i)}. ${opt}`;
                  const val   = q.questionType === 'TrueFalse' ? opt : String.fromCharCode(65 + i);
                  const selected = answers[q._id] === val;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswer(q._id, val)}
                      className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all text-sm ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-white/10 bg-background/40 hover:bg-white/5'
                      }`}
                    >
                      {selected && <CheckCircle2 className="inline w-4 h-4 mr-2 text-primary" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Written / Practical */}
            {(q.questionType === 'Written' || q.questionType === 'Practical') && (
              <div>
                {q.subQuestions.length > 0
                  ? q.subQuestions.map((sq, i) => (
                    <div key={i} className="mb-4">
                      <p className="text-sm font-medium mb-2">({String.fromCharCode(97 + i)}) {sq.subText} <span className="text-xs text-muted-foreground">[{sq.subMark} mark]</span></p>
                      <textarea
                        rows={3}
                        value={answers[`${q._id}_sub_${i}`] ?? ''}
                        onChange={e => setAnswer(`${q._id}_sub_${i}`, e.target.value)}
                        placeholder="Write your answer…"
                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  ))
                  : (
                    <textarea
                      rows={5}
                      value={answers[q._id] ?? ''}
                      onChange={e => setAnswer(q._id, e.target.value)}
                      placeholder="Write your answer here…"
                      className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  )
                }
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(i => i - 1)}
                className="text-muted-foreground"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              {currentIdx < questions.length - 1 ? (
                <Button onClick={() => setCurrentIdx(i => i + 1)} className="bg-primary text-white hover:bg-primary/90">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Submit Exam
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
