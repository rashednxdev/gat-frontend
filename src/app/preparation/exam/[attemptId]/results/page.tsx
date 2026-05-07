'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import {
  CheckCircle2, XCircle, Clock, Award, Target,
  ChevronLeft, Loader2, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AnswerDetail {
  questionId: {
    _id: string;
    mainQuestion: string;
    correctAnswer: string | string[];
    explanation?: string;
    questionType: string;
    options: string[];
  };
  userAnswer: string;
  isCorrect: boolean;
  marksObtained: number;
}
interface AttemptDetail {
  _id: string;
  questionSheetId: { title: string; part: string; totalMarks: number; passMarks?: number; durationMinutes: number };
  totalMarksObtained: number;
  result: 'Pass' | 'Fail' | 'Pending';
  startTime: string;
  endTime?: string;
  submittedAt?: string;
  answers: AnswerDetail[];
}

export default function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.get(`/preparation/exam/${attemptId}`)
      .then(r => setAttempt(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user, attemptId]);

  if (loading || !user || fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!attempt) return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground text-center">
      <div>
        <p>Results not found.</p>
        <Link href="/preparation/exam"><Button className="mt-4">Back to Exam Center</Button></Link>
      </div>
    </div>
  );

  const sheet     = attempt.questionSheetId;
  const pct       = sheet.totalMarks > 0 ? Math.round((attempt.totalMarksObtained / sheet.totalMarks) * 100) : 0;
  const isPassed  = attempt.result === 'Pass';
  const timeTaken = attempt.endTime && attempt.startTime
    ? Math.round((new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000)
    : null;
  const fmt = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  const correct   = attempt.answers.filter(a => a.isCorrect).length;
  const incorrect = attempt.answers.filter(a => !a.isCorrect && a.userAnswer).length;
  const skipped   = attempt.answers.filter(a => !a.userAnswer).length;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Back */}
        <Link href="/preparation/exam">
          <Button variant="ghost" className="text-muted-foreground text-sm pl-0">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Exam Center
          </Button>
        </Link>

        {/* Result Hero */}
        <div className={`glass-panel rounded-3xl p-8 text-center border-t-4 ${isPassed ? 'border-t-emerald-500' : 'border-t-red-500'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isPassed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {isPassed
              ? <Award className="w-10 h-10 text-emerald-400" />
              : <XCircle className="w-10 h-10 text-red-400" />
            }
          </div>
          <h1 className="text-3xl font-extrabold mb-1">{isPassed ? 'Congratulations!' : 'Better Luck Next Time'}</h1>
          <p className="text-muted-foreground text-sm mb-6">{sheet.title} · Part {sheet.part}</p>

          {/* Score Circle */}
          <div className="relative w-36 h-36 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={isPassed ? 'rgb(52,211,153)' : 'rgb(248,113,113)'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-extrabold ${isPassed ? 'text-emerald-400' : 'text-red-400'}`}>{pct}%</span>
              <span className="text-xs text-muted-foreground">score</span>
            </div>
          </div>

          <p className="text-2xl font-bold">
            {attempt.totalMarksObtained} / {sheet.totalMarks} marks
          </p>
          {sheet.passMarks && (
            <p className="text-sm text-muted-foreground mt-1">Pass mark: {sheet.passMarks}</p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-2xl font-bold text-emerald-400">{correct}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{incorrect}</p>
              <p className="text-xs text-muted-foreground">Wrong</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">{skipped}</p>
              <p className="text-xs text-muted-foreground">Skipped</p>
            </div>
          </div>

          {timeTaken !== null && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" /> Time taken: {fmt(timeTaken)}
            </div>
          )}
        </div>

        {/* Review Section */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowReview(r => !r)}
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
          >
            <h2 className="font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Answer Review
            </h2>
            <span className="text-xs text-muted-foreground">{showReview ? 'Hide' : 'Show'}</span>
          </button>

          {showReview && (
            <div className="border-t border-white/10 divide-y divide-white/5">
              {attempt.answers.map((ans, idx) => {
                const q = ans.questionId;
                if (!q) return null;
                const correctStr = Array.isArray(q.correctAnswer)
                  ? q.correctAnswer.join(', ')
                  : q.correctAnswer;
                return (
                  <div key={idx} className={`p-5 ${ans.isCorrect ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                    <div className="flex items-start gap-3">
                      {ans.isCorrect
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        : <XCircle     className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      }
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-2">Q{idx + 1}. {q.mainQuestion}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-background/50 rounded-lg p-2">
                            <p className="text-muted-foreground mb-0.5">Your Answer</p>
                            <p className={`font-semibold ${ans.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                              {ans.userAnswer || '—'}
                            </p>
                          </div>
                          <div className="bg-background/50 rounded-lg p-2">
                            <p className="text-muted-foreground mb-0.5">Correct Answer</p>
                            <p className="font-semibold text-emerald-400">{correctStr}</p>
                          </div>
                        </div>
                        {q.explanation && (
                          <p className="text-xs text-muted-foreground mt-2 bg-background/30 rounded-lg p-2">
                            💡 {q.explanation}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 text-right">
                          {ans.marksObtained} / {q.questionType === 'MCQ' ? 'mark' : ''} marks
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/preparation/exam" className="flex-1">
            <Button variant="outline" className="w-full border-white/10">Back to Exam Center</Button>
          </Link>
          <Link href="/preparation" className="flex-1">
            <Button className="w-full bg-primary text-white hover:bg-primary/90">
              <Target className="w-4 h-4 mr-2" /> Preparation Overview
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
