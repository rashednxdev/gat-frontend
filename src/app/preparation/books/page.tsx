'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
  BookOpen, Wrench, ChevronDown, ChevronRight, Loader2,
  GraduationCap, LayoutDashboard, ClipboardList, FileText, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SubTopic { subTopicId: string; title: string; order: number; details?: Record<string, string> }
interface Topic    { topicId: string; title: string; order: number; subTopics: SubTopic[]; details?: Record<string, string> }
interface Chapter  { chapterId: string; title: string; chapterNumber?: number; order: number; topics: Topic[] }
interface BookTool { _id: string; type: 'book' | 'tool'; name: string; author?: string; edition?: string; publisher?: string; part: string; description?: string; pdfUrl?: string }

export default function BooksPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [items, setItems]               = useState<BookTool[]>([]);
  const [selected, setSelected]         = useState<BookTool | null>(null);
  const [chapters, setChapters]         = useState<Chapter[]>([]);
  const [openChapters, setOpenChapters] = useState<string[]>([]);
  const [openTopics, setOpenTopics]     = useState<string[]>([]);
  const [filterType, setFilterType]     = useState<'all' | 'book' | 'tool'>('all');
  const [filterPart, setFilterPart]     = useState<'all' | '1' | '2'>('all');
  const [fetching, setFetching]         = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (filterType !== 'all') params.append('type', filterType);
        if (filterPart !== 'all') params.append('part', filterPart);
        const res = await api.get(`/preparation/books-tools?${params}`);
        setItems(res.data);
      } catch { /* silent */ }
      finally { setFetching(false); }
    };
    load();
  }, [user, filterType, filterPart]);

  const selectItem = async (item: BookTool) => {
    if (selected?._id === item._id) { setSelected(null); setChapters([]); return; }
    setSelected(item);
    setDetailLoading(true);
    setOpenChapters([]);
    setOpenTopics([]);
    try {
      const res = await api.get(`/preparation/books-tools/${item._id}`);
      setChapters(res.data.chapters ?? []);
    } catch { setChapters([]); }
    finally { setDetailLoading(false); }
  };

  const toggleChapter = (id: string) => setOpenChapters(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleTopic   = (id: string) => setOpenTopics(p  => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

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
          <Link href="/preparation/books"><Button variant="ghost" className="w-full justify-start bg-primary/10 text-primary"><BookOpen className="mr-2 w-5 h-5" /> Books & Tools</Button></Link>
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
        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold mb-1 flex items-center gap-2">
              <BookOpen className="text-violet-400 w-7 h-7" /> Books &amp; Tools
            </h1>
            <p className="text-muted-foreground text-sm">Reference materials for SAS preparation.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-xl border border-white/10 overflow-hidden">
              {(['all', 'book', 'tool'] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${filterType === t ? 'bg-primary text-white' : 'hover:bg-white/5 text-muted-foreground'}`}
                >
                  {t === 'all' ? 'All Types' : t === 'book' ? 'Books' : 'Tools'}
                </button>
              ))}
            </div>
            <div className="flex rounded-xl border border-white/10 overflow-hidden">
              {(['all', '1', '2'] as const).map(p => (
                <button key={p} onClick={() => setFilterPart(p)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${filterPart === p ? 'bg-primary text-white' : 'hover:bg-white/5 text-muted-foreground'}`}
                >
                  {p === 'all' ? 'All Parts' : `Part ${p}`}
                </button>
              ))}
            </div>
          </div>

          {fetching && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

          {!fetching && items.length === 0 && (
            <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground">No books or tools found.</div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => {
              const isBook = item.type === 'book';
              const isOpen = selected?._id === item._id;
              return (
                <div key={item._id}>
                  <button
                    onClick={() => selectItem(item)}
                    className={`w-full text-left glass-panel rounded-2xl p-5 border transition-all hover:scale-[1.02] ${isOpen ? 'border-primary/50 bg-primary/5' : 'border-white/10'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      {isBook
                        ? <BookOpen className="w-6 h-6 text-violet-400" />
                        : <Wrench  className="w-6 h-6 text-amber-400" />
                      }
                      <div className="flex gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Part {item.part}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${isBook ? 'bg-violet-500/20 text-violet-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                    {item.author    && <p className="text-xs text-muted-foreground">By {item.author}</p>}
                    {item.publisher && <p className="text-xs text-muted-foreground">{item.publisher}</p>}
                    {item.edition   && <p className="text-xs text-muted-foreground">Edition: {item.edition}</p>}
                    {item.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.description}</p>}
                    <div className="flex items-center mt-3 text-xs text-primary">
                      {isOpen ? 'Collapse' : 'View Chapters'}
                      {isOpen ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronRight className="w-3 h-3 ml-1" />}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Chapter Tree */}
          {selected && (
            <div className="glass-panel rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-lg">{selected.name} — Chapters</h2>
                {selected.pdfUrl && (
                  <a href={selected.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="text-primary text-xs">Open PDF</Button>
                  </a>
                )}
              </div>

              {detailLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}

              {!detailLoading && chapters.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-6">No chapters available for this item.</p>
              )}

              {!detailLoading && chapters.map(ch => (
                <div key={ch.chapterId} className="border border-white/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleChapter(ch.chapterId)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    {openChapters.includes(ch.chapterId)
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    }
                    <span className="font-semibold text-sm">
                      {ch.chapterNumber != null ? `Ch. ${ch.chapterNumber} — ` : ''}{ch.title}
                    </span>
                  </button>

                  {openChapters.includes(ch.chapterId) && (
                    <div className="border-t border-white/5 divide-y divide-white/5">
                      {ch.topics.map(tp => (
                        <div key={tp.topicId}>
                          <button
                            onClick={() => toggleTopic(tp.topicId)}
                            className="w-full flex items-center gap-3 pl-8 pr-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                          >
                            {openTopics.includes(tp.topicId)
                              ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                              : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            }
                            <span className="text-sm">{tp.title}</span>
                          </button>

                          {openTopics.includes(tp.topicId) && (
                            <div className="pl-16 pr-4 pb-3 space-y-2 bg-background/30">
                              {tp.details?.content && (
                                <p className="text-xs text-muted-foreground mt-2">{tp.details.content}</p>
                              )}
                              {tp.subTopics.map(st => (
                                <div key={st.subTopicId} className="pl-4 py-1.5 border-l-2 border-primary/20">
                                  <p className="text-xs font-medium">{st.title}</p>
                                  {st.details?.content && <p className="text-xs text-muted-foreground mt-0.5">{st.details.content}</p>}
                                </div>
                              ))}
                              {tp.subTopics.length === 0 && <p className="text-xs text-muted-foreground italic">No subtopics.</p>}
                            </div>
                          )}
                        </div>
                      ))}
                      {ch.topics.length === 0 && <p className="text-xs text-muted-foreground pl-8 py-2">No topics in this chapter.</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
