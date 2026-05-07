'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
  ClipboardList, ChevronDown, ChevronRight, CheckCircle2,
  Circle, Loader2, BookOpen, GraduationCap, LayoutDashboard,
  FileText, Target, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SubTopic { subTopicId: string; title: string; order: number; details?: { description?: string; importantNotes?: string } }
interface Topic    { topicId: string; title: string; marksAllocated?: number; order: number; subTopics: SubTopic[] }
interface Part     { partId: string; partNumber: string; title: string; totalMarks?: number; passMarks?: number; topics: Topic[] }
interface Syllabus { _id: string; name: string; version?: string; parts: Part[] }
interface Progress { targetId: string; status: 'not_started' | 'in_progress' | 'completed' }

export default function SyllabusPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [syllabusData, setSyllabusData] = useState<Syllabus | null>(null);
  const [progress, setProgress]         = useState<Progress[]>([]);
  const [openParts, setOpenParts]       = useState<string[]>([]);
  const [openTopics, setOpenTopics]     = useState<string[]>([]);
  const [fetching, setFetching]         = useState(true);
  const [marking, setMarking]           = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [sylRes, progRes] = await Promise.all([
          api.get('/preparation/syllabus'),
          api.get('/preparation/progress?progressType=syllabus'),
        ]);
        // Use first active syllabus
        if (sylRes.data.length > 0) {
          const full = await api.get(`/preparation/syllabus/${sylRes.data[0]._id}`);
          setSyllabusData(full.data);
          if (full.data.parts?.length) setOpenParts([full.data.parts[0].partId]);
        }
        setProgress(progRes.data);
      } catch { /* silent */ }
      finally { setFetching(false); }
    };
    load();
  }, [user]);

  const getStatus = (id: string): Progress['status'] =>
    progress.find(p => p.targetId === id)?.status ?? 'not_started';

  const nextStatus = (cur: Progress['status']): Progress['status'] | null => {
    if (cur === 'not_started') return 'in_progress';
    if (cur === 'in_progress') return 'completed';
    return null;
  };

  const markItem = async (targetId: string, targetType: string, part: string, currentStatus: Progress['status']) => {
    const next = nextStatus(currentStatus);
    if (!next) return;
    setMarking(targetId);
    try {
      await api.post('/preparation/progress/mark', {
        part, progressType: 'syllabus', targetId, targetType, status: next,
      });
      setProgress(prev => {
        const existing = prev.find(p => p.targetId === targetId);
        if (existing) return prev.map(p => p.targetId === targetId ? { ...p, status: next } : p);
        return [...prev, { targetId, status: next }];
      });
    } catch { /* silent */ }
    finally { setMarking(null); }
  };

  const togglePart  = (id: string) => setOpenParts(p  => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleTopic = (id: string) => setOpenTopics(p  => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const StatusBadge = ({ status }: { status: Progress['status'] }) => {
    const map = {
      not_started: 'bg-muted text-muted-foreground',
      in_progress: 'bg-amber-500/20 text-amber-400',
      completed:   'bg-emerald-500/20 text-emerald-400',
    };
    const label = { not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>{label[status]}</span>;
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
          <Link href="/preparation/syllabus"><Button variant="ghost" className="w-full justify-start bg-primary/10 text-primary"><ClipboardList className="mr-2 w-5 h-5" /> Syllabus</Button></Link>
          <Link href="/preparation/books"><Button variant="ghost" className="w-full justify-start hover:bg-white/5"><BookOpen className="mr-2 w-5 h-5" /> Books & Tools</Button></Link>
          <Link href="/preparation/exam"><Button variant="ghost" className="w-full justify-start hover:bg-white/5"><FileText className="mr-2 w-5 h-5" /> Exam Center</Button></Link>
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
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold mb-1 flex items-center gap-2">
              <ClipboardList className="text-primary w-7 h-7" /> Syllabus
            </h1>
            <p className="text-muted-foreground text-sm">
              {syllabusData ? `${syllabusData.name}${syllabusData.version ? ` · v${syllabusData.version}` : ''}` : 'Loading syllabus…'}
            </p>
          </div>

          {fetching && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

          {!fetching && !syllabusData && (
            <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground">
              No syllabus data available yet.
            </div>
          )}

          {syllabusData?.parts.map(part => (
            <div key={part.partId} className="glass-panel rounded-2xl overflow-hidden">
              {/* Part header */}
              <button
                onClick={() => togglePart(part.partId)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left"
              >
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Part {part.partNumber}</span>
                  <h2 className="text-lg font-bold mt-0.5">{part.title}</h2>
                  {part.totalMarks && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Total: {part.totalMarks} marks · Pass: {part.passMarks} marks
                    </p>
                  )}
                </div>
                {openParts.includes(part.partId)
                  ? <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  : <ChevronRight className="w-5 h-5 text-muted-foreground" />
                }
              </button>

              {/* Topics */}
              {openParts.includes(part.partId) && (
                <div className="border-t border-white/5 divide-y divide-white/5">
                  {part.topics.map(topic => {
                    const topicStatus = getStatus(topic.topicId);
                    const nextS = nextStatus(topicStatus);
                    return (
                      <div key={topic.topicId}>
                        {/* Topic row */}
                        <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
                          <button onClick={() => toggleTopic(topic.topicId)} className="flex-1 flex items-center gap-3 text-left">
                            {openTopics.includes(topic.topicId)
                              ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            }
                            <span className="font-medium text-sm">{topic.title}</span>
                            {topic.marksAllocated != null && (
                              <span className="text-xs text-muted-foreground ml-auto mr-4">{topic.marksAllocated} marks</span>
                            )}
                          </button>
                          <StatusBadge status={topicStatus} />
                          {nextS && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={marking === topic.topicId}
                              onClick={() => markItem(topic.topicId, 'syllabusTopic', part.partNumber, topicStatus)}
                              className="text-xs h-7 px-2 hover:bg-primary/20 text-primary"
                            >
                              {marking === topic.topicId
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : nextS === 'in_progress' ? 'Start' : <><CheckCircle2 className="w-3 h-3 mr-1" /> Done</>
                              }
                            </Button>
                          )}
                          {topicStatus === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </div>

                        {/* SubTopics */}
                        {openTopics.includes(topic.topicId) && topic.subTopics.map(st => {
                          const stStatus = getStatus(st.subTopicId);
                          const stNext = nextStatus(stStatus);
                          return (
                            <div key={st.subTopicId} className="flex items-center gap-3 pl-14 pr-5 py-2.5 bg-background/30 border-t border-white/5">
                              <Circle className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="flex-1 text-sm text-muted-foreground">{st.title}</span>
                              <StatusBadge status={stStatus} />
                              {stNext && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={marking === st.subTopicId}
                                  onClick={() => markItem(st.subTopicId, 'syllabusTopic', part.partNumber, stStatus)}
                                  className="text-xs h-7 px-2 hover:bg-primary/20 text-primary"
                                >
                                  {marking === st.subTopicId
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : stNext === 'in_progress' ? 'Start' : 'Done'
                                  }
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
