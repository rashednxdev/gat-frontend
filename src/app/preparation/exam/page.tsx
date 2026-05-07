'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
  FileText, Clock, Target, Award, ChevronRight,
  GraduationCap, LayoutDashboard, ClipboardList, BookOpen, LogOut, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Sheet {
  _id: string;
  title: string;
  part: string;
  type: 'static' | 'dynamic';
  totalMarks: number;
  durationMinutes: number;
  passMarks?: number;
  description?: string;
}
interface Attempt {
  _id: string;
  questionSheetId: { _id: string; title: string; part: string; totalMarks: number };
  totalMarksObtained: number;
  result: 'Pass' | 'Fail' | 'Pending';
  submittedAt?: string;
}

export default function ExamPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [sheets, setSheets]     = useState<Sheet[]>([]);
  const [history, setHistory]   = useState<Attempt[]>([]);
  const [filterPart, setFilterPart] = useState<'all' | '1' | '2'>('all');
  const [fetching, setFetching] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const params = filterPart !== 'all' ? `?part=${filterPart}` : '';
        const [sheetsRes, histRes] = await Promise.all([
          api.get(`/preparation/sheets${params}`),
          api.get('/preparation/exam/history'),
        ]);
        setSheets(sheetsRes.data);
        setHistory(histRes.data);
      } catch { /* silent */ }
      finally { setFetching(false); }
    };
    load();
  }, [user, filterPart]);

  const startExam = async (sheetId: string) => {
    setStarting(sheetId);
    try {
      const res = await api.post('/preparation/exam/start', { questionSheetId: sheetId });
      router.push(`/preparation/exam/${res.data.attemptId}`);
    } catch (err: any) {
      // If attempt already exists, navigate to it
      if (err?.response?.data?.attemptId) {
        router.push(`/preparation/exam/${err.response.data.attemptId}`);
      }
    } finally {
      setStarting(null);
    }
  };

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
          <Link href="/preparation"><Button variant="ghost" className="w-full justify-start hover:bg-white/5"><LayoutDashboard className="mr-2 w-5 h-5" /> Overview</Button></Link>
          <Link href="/preparation/syllabus"><Button variant="ghost" className="w-full justify-start hover:bg-white/5"><ClipboardList className="mr-2 w-5 h-5" /> Syllabus</Button></Link>
          <Link href="/preparation/books"><Button variant="ghost" className="w-full justify-start hover:bg-white/5"><BookOpen className="mr-2 w-5 h-5" /> Books & Tools</Button></Link>
          <Link href="/preparation/exam"><Button variant="ghost" className="w-full justify-start bg-primary/10 text-primary"><FileText className="mr-2 w-5 h-5" /> Exam Center</Button></Link>
          <Link href="/dashboard"><Button variant="ghost" className="w-full justify-start hover:bg-white/5 text-muted-foreground"><LayoutDashboard className="mr-2 w-5 h-5" /> Main Dashboard</Button></Link>
        </nav>
        <div className="pt-6 border-t border-white/10">
          <p className="font-semibold truncate text-sm">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate mb-3">{user.email}</p>
          <Button variant="destructive" size="sm" className="w-full justify-start bg-destructive/20 hover:bg-destructive/40 text-destructive-foreground border border-destructive/30" onClick={() => { logout(); router.push('/login'); }}>
            <LogOut className="mr-2 w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold mb-1 flex items-center gap-2">
              <Target className="text-amber-400 w-7 h-7" /> Exam Center
            </h1>
            <p className="text-muted-foreground text-sm">Practice exams for SAS Part 1 &amp; Part 2.</p>
          </div>

          {/* Part Filter */}
          <div className="flex gap-2">
            {(['all', '1', '2'] as const).map(p => (
              <button key={p} onClick={() => setFilterPart(p)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${filterPart === p ? 'bg-primary text-white border-primary' : 'border-white/10 text-muted-foreground hover:bg-white/5'}`}
              >
                {p === 'all' ? 'All Parts' : `Part ${p}`}
              </button>
            ))}
          </div>

          {fetching && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

          {/* Available Sheets */}
          {!fetching && (
            <>
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Available Exam Sheets
                </h2>

                {sheets.length === 0 && (
                  <div className="glass-panel rounded-2xl p-10 text-center text-muted-foreground text-sm">
                    No exam sheets available yet.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sheets.map(sheet => (
                    <div key={sheet._id} className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-primary/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs font-bold text-primary uppercase tracking-widest">Part {sheet.part}</span>
                          <h3 className="font-bold text-base mt-0.5">{sheet.title}</h3>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${sheet.type === 'dynamic' ? 'bg-violet-500/20 text-violet-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {sheet.type}
                        </span>
                      </div>
                      {sheet.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{sheet.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {sheet.totalMarks} marks</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {sheet.durationMinutes} min</span>
                        {sheet.passMarks && <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Pass: {sheet.passMarks}</span>}
                      </div>
                      <Button
                        className="w-full bg-primary text-white hover:bg-primary/90"
                        disabled={starting === sheet._id}
                        onClick={() => startExam(sheet._id)}
                      >
                        {starting === sheet._id
                          ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          : null
                        }
                        {starting === sheet._id ? 'Starting…' : 'Start Exam'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exam History */}
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" /> My Attempts
                </h2>

                {history.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-6">No attempts yet.</p>
                )}

                <div className="space-y-2">
                  {history.map(a => (
                    <Link key={a._id} href={`/preparation/exam/${a._id}`}>
                      <div className="flex items-center justify-between p-3 bg-background/40 rounded-xl border border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-sm">
                            {a.questionSheetId?.title ?? 'Exam'}
                            <span className="ml-2 text-xs text-muted-foreground">Part {a.questionSheetId?.part}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : 'In Progress'}
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
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
