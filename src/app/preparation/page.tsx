'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
  BookOpen, Wrench, GraduationCap, ClipboardList,
  TrendingUp, ChevronRight, ArrowRight, LayoutDashboard,
  LogOut, FileText, Target, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProgressSummary {
  part: string;
  progressType: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  percentage: number;
}

interface ExamAttempt {
  _id: string;
  questionSheetId: { title: string; part: string; totalMarks: number };
  totalMarksObtained: number;
  result: 'Pass' | 'Fail' | 'Pending';
  submittedAt: string;
}

export default function PreparationPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<ProgressSummary[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<ExamAttempt[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user?.role === 'admin') router.push('/admin');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [sumRes, histRes] = await Promise.all([
          api.get('/preparation/progress/summary'),
          api.get('/preparation/exam/history'),
        ]);
        setSummary(sumRes.data);
        setRecentAttempts((histRes.data as ExamAttempt[]).slice(0, 5));
      } catch { /* silent — empty state shown */ }
      finally { setFetching(false); }
    };
    load();
  }, [user]);

  const getPartSummary = (part: string, type: string) =>
    summary.find(s => s.part === part && s.progressType === type);

  const progressBar = (pct: number, color: string) => (
    <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden border border-white/5 mt-1">
      <div
        className={`h-full ${color} transition-all duration-1000`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-card/30 p-6 flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-8">
          <GraduationCap className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">Preparation</span>
        </div>
        <nav className="flex-1 space-y-1">
          <Link href="/preparation">
            <Button variant="ghost" className="w-full justify-start bg-primary/10 text-primary">
              <LayoutDashboard className="mr-2 w-5 h-5" /> Overview
            </Button>
          </Link>
          <Link href="/preparation/syllabus">
            <Button variant="ghost" className="w-full justify-start hover:bg-white/5">
              <ClipboardList className="mr-2 w-5 h-5" /> Syllabus
            </Button>
          </Link>
          <Link href="/preparation/books">
            <Button variant="ghost" className="w-full justify-start hover:bg-white/5">
              <BookOpen className="mr-2 w-5 h-5" /> Books & Tools
            </Button>
          </Link>
          <Link href="/preparation/exam">
            <Button variant="ghost" className="w-full justify-start hover:bg-white/5">
              <FileText className="mr-2 w-5 h-5" /> Exam Center
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start hover:bg-white/5 text-muted-foreground">
              <LayoutDashboard className="mr-2 w-5 h-5" /> Main Dashboard
            </Button>
          </Link>
        </nav>
        <div className="pt-6 border-t border-white/10">
          <p className="font-semibold truncate text-sm">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate mb-3">{user.email}</p>
          <Button
            variant="destructive"
            size="sm"
            className="w-full justify-start bg-destructive/20 hover:bg-destructive/40 text-destructive-foreground border border-destructive/30"
            onClick={() => { logout(); router.push('/login'); }}
          >
            <LogOut className="mr-2 w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto space-y-8 relative z-10">

          {/* Header */}
          <div>
            <h1 className="text-4xl font-extrabold mb-1">
              SAS <span className="text-primary">Preparation</span>
            </h1>
            <p className="text-muted-foreground">
              Track your study progress for Part 1 &amp; Part 2.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/preparation/syllabus', icon: ClipboardList, label: 'Syllabus', desc: 'Browse topics & subtopics', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { href: '/preparation/books',    icon: BookOpen,       label: 'Books & Tools', desc: 'Chapters & reference material', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
              { href: '/preparation/exam',     icon: Target,         label: 'Exam Center', desc: 'Practice with question sheets', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            ].map(({ href, icon: Icon, label, desc, color, bg }) => (
              <Link key={href} href={href}>
                <div className={`glass-panel p-5 rounded-2xl border ${bg} hover:scale-[1.02] transition-transform cursor-pointer`}>
                  <Icon className={`w-7 h-7 ${color} mb-3`} />
                  <h3 className="font-bold text-base">{label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                  <div className="flex items-center mt-3 text-xs text-muted-foreground">
                    Go <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Progress Cards */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Study Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['1', '2'].map(part => (
                <div key={part} className="glass-panel p-5 rounded-2xl">
                  <h3 className="font-bold text-base mb-4 text-primary">Part {part}</h3>
                  <div className="space-y-4">
                    {[
                      { type: 'syllabus', label: 'Syllabus Topics', color: 'bg-blue-500' },
                      { type: 'book',     label: 'Books',           color: 'bg-violet-500' },
                      { type: 'tool',     label: 'Tools',           color: 'bg-amber-500' },
                    ].map(({ type, label, color }) => {
                      const s = getPartSummary(part, type);
                      const pct = s?.percentage ?? 0;
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-bold text-emerald-400">{pct}%</span>
                          </div>
                          {progressBar(pct, color)}
                          {s && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {s.completed}/{s.total} completed
                            </p>
                          )}
                          {!s && !fetching && (
                            <p className="text-xs text-muted-foreground mt-1">No progress yet</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Exam Attempts */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> Recent Exams
              </h2>
              <Link href="/preparation/exam">
                <Button variant="ghost" size="sm" className="text-primary text-xs">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            {recentAttempts.length === 0 && !fetching && (
              <p className="text-muted-foreground text-center py-8 text-sm">
                No exam attempts yet. Head to Exam Center to get started.
              </p>
            )}

            <div className="space-y-3">
              {recentAttempts.map(a => (
                <Link key={a._id} href={`/preparation/exam/${a._id}`}>
                  <div className="flex items-center justify-between p-3 bg-background/40 rounded-xl border border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-sm">
                        {a.questionSheetId?.title ?? 'Exam'}
                        <span className="ml-2 text-xs text-muted-foreground">Part {a.questionSheetId?.part}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : 'In Progress'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">
                        {a.totalMarksObtained}/{a.questionSheetId?.totalMarks ?? '—'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        a.result === 'Pass'    ? 'bg-emerald-500/20 text-emerald-400' :
                        a.result === 'Fail'    ? 'bg-red-500/20 text-red-400' :
                                                 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {a.result}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
