'use client';
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { ShieldAlert, BookOpen, ClipboardList, HelpCircle, FileText, Link2, LogOut, Loader2, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronRight, FolderOpen, Folder, BookMarked, Hash, AlignLeft, Pencil, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

type Tab = 'books' | 'syllabus' | 'questions' | 'sheets' | 'tags';

export default function AdminPreparationPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('books');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user && user.role !== 'admin') router.push('/dashboard');
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') return null;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'books',     label: 'Books & Tools', icon: BookOpen },
    { id: 'syllabus',  label: 'Syllabus',      icon: ClipboardList },
    { id: 'questions', label: 'Questions',      icon: HelpCircle },
    { id: 'sheets',    label: 'Sheets',         icon: FileText },
    { id: 'tags',      label: 'Content Tags',   icon: Link2 },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-white/10 bg-card/30 p-6 flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-8 text-red-400">
          <ShieldAlert className="w-8 h-8" />
          <span className="text-xl font-bold">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-1">
          <Link href="/admin"><Button variant="ghost" className="w-full justify-start hover:bg-white/5 text-muted-foreground">← Main Admin</Button></Link>
          {tabs.map(t => (
            <Button key={t.id} variant="ghost"
              className={`w-full justify-start ${tab === t.id ? 'bg-primary/10 text-primary' : 'hover:bg-white/5'}`}
              onClick={() => setTab(t.id)}>
              <t.icon className="mr-2 w-4 h-4" /> {t.label}
            </Button>
          ))}
        </nav>
        <div className="pt-6 border-t border-white/10">
          <p className="text-sm font-semibold truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground mb-3">Admin</p>
          <Button variant="destructive" size="sm" className="w-full bg-red-600/20 text-red-400 border border-red-500/30"
            onClick={() => { logout(); router.push('/login'); }}>
            <LogOut className="mr-2 w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold">Preparation <span className="text-primary">Admin</span></h1>
            <p className="text-muted-foreground text-sm mt-1">Manage SAS preparation content.</p>
          </div>
          <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-white/5'}`}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'books'     && <BooksTab />}
          {tab === 'syllabus'  && <SyllabusTab />}
          {tab === 'questions' && <QuestionsTab />}
          {tab === 'sheets'    && <SheetsTab />}
          {tab === 'tags'      && <TagsTab />}
        </div>
      </main>
    </div>
  );
}

// ── Books & Tools Tab ─────────────────────────────────────────────────────────
function BooksTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', type: 'book', part: '1', author: '', publisher: '', edition: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => { try { const r = await api.get('/preparation/books-tools'); setItems(r.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const submit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/preparation/books-tools', form); setForm({ name: '', type: 'book', part: '1', author: '', publisher: '', edition: '', description: '' }); load(); }
    catch {} finally { setSaving(false); }
  };

  const del = async (id: string) => { if (!confirm('Delete this item?')) return; try { await api.delete(`/preparation/books-tools/${id}`); if (expandedId === id) { setExpandedId(null); setDetail(null); } load(); } catch {} };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(id); setDetailLoading(true);
    try { const r = await api.get(`/preparation/books-tools/${id}`); setDetail(r.data); }
    catch {} finally { setDetailLoading(false); }
  };

  const reloadDetail = async () => {
    if (!expandedId) return;
    try { const r = await api.get(`/preparation/books-tools/${expandedId}`); setDetail(r.data); } catch {}
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="glass-panel rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Add Book / Tool</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="bg-background/50 border-white/10" />
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-sm">
            <option value="book">Book</option><option value="tool">Tool</option>
          </select>
          <select value={form.part} onChange={e => setForm(f => ({ ...f, part: e.target.value }))} className="bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-sm">
            <option value="1">Part 1</option><option value="2">Part 2</option>
          </select>
          <Input placeholder="Author" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className="bg-background/50 border-white/10" />
          <Input placeholder="Publisher" value={form.publisher} onChange={e => setForm(f => ({ ...f, publisher: e.target.value }))} className="bg-background/50 border-white/10" />
          <Input placeholder="Edition" value={form.edition} onChange={e => setForm(f => ({ ...f, edition: e.target.value }))} className="bg-background/50 border-white/10" />
        </div>
        <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background/50 border-white/10" />
        <Button type="submit" disabled={saving} className="bg-primary text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save</Button>
      </form>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 font-bold">All Books & Tools ({items.length})</div>
        {loading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
          <div className="divide-y divide-white/5">
            {items.length === 0 && <p className="text-muted-foreground text-sm p-6 text-center">No items yet.</p>}
            {items.map((item: any) => (
              <div key={item._id}>
                {/* ── Row ─────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-3 hover:bg-white/5 cursor-pointer" onClick={() => toggleExpand(item._id)}>
                  <div className="flex items-center gap-3">
                    {expandedId === item._id ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <BookMarked className="w-4 h-4 text-primary/70" />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.type} · Part {item.part}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); del(item._id); }} className="text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* ── Expanded tree panel ──────────────────────── */}
                {expandedId === item._id && (
                  <div className="border-t border-white/5 bg-background/40 px-6 py-5 space-y-5">
                    {detailLoading ? (
                      <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                    ) : detail ? (
                      <BookTreePanel book={detail} onReload={reloadDetail} />
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── BookTreePanel — Chapter / Topic / SubTopic manager ───────────────────────
function BookTreePanel({ book, onReload }: { book: any; onReload: () => void }) {
  const bookId = book._id;
  const chapters: any[] = book.chapters || [];
  const [expandedChId, setExpandedChId] = useState<string | null>(null);
  const [expandedTpId, setExpandedTpId] = useState<string | null>(null);

  // ── Add Chapter form ──────────────────────────────────────────────
  const [chForm, setChForm] = useState({ title: '', chapterNumber: '', description: '' });
  const [chSaving, setChSaving] = useState(false);
  const addChapter = async (e: any) => {
    e.preventDefault(); setChSaving(true);
    try {
      await api.post(`/preparation/books-tools/${bookId}/chapters`, {
        title: chForm.title,
        chapterNumber: chForm.chapterNumber ? Number(chForm.chapterNumber) : undefined,
        description: chForm.description,
      });
      setChForm({ title: '', chapterNumber: '', description: '' });
      onReload();
    } catch {} finally { setChSaving(false); }
  };

  return (
    <div className="space-y-4">
      {/* ── Add Chapter form ── */}
      <form onSubmit={addChapter} className="rounded-xl border border-white/10 bg-background/60 p-4 space-y-3">
        <p className="text-xs font-semibold text-primary flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Add Chapter</p>
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="Title *" value={chForm.title} onChange={e => setChForm(f => ({ ...f, title: e.target.value }))} required className="col-span-2 bg-background/50 border-white/10 text-sm h-8" />
          <Input type="number" placeholder="Ch. #" value={chForm.chapterNumber} onChange={e => setChForm(f => ({ ...f, chapterNumber: e.target.value }))} className="bg-background/50 border-white/10 text-sm h-8" />
        </div>
        <Input placeholder="Description (optional)" value={chForm.description} onChange={e => setChForm(f => ({ ...f, description: e.target.value }))} className="bg-background/50 border-white/10 text-sm h-8" />
        <Button type="submit" size="sm" disabled={chSaving} className="bg-primary/80 text-white h-7 text-xs">
          {chSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Add Chapter
        </Button>
      </form>

      {/* ── Chapter list ── */}
      {chapters.length === 0 && <p className="text-xs text-muted-foreground">No chapters yet.</p>}
      <div className="space-y-2">
        {chapters.map((ch: any) => {
          const chId = ch.chapterId;
          const isChOpen = expandedChId === chId;
          return (
            <div key={chId} className="rounded-xl border border-white/10 overflow-hidden">
              {/* Chapter row */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 cursor-pointer select-none"
                onClick={() => { setExpandedChId(isChOpen ? null : chId); setExpandedTpId(null); }}>
                {isChOpen ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                <Folder className="w-3.5 h-3.5 text-yellow-400/80" />
                <span className="text-sm font-medium flex-1">
                  {ch.chapterNumber ? `Ch. ${ch.chapterNumber} — ` : ''}{ch.title}
                </span>
                <span className="text-xs text-muted-foreground">{(ch.topics || []).length} topics</span>
              </div>

              {/* Topics panel */}
              {isChOpen && (
                <ChapterPanel
                  bookId={bookId}
                  ch={ch}
                  expandedTpId={expandedTpId}
                  setExpandedTpId={setExpandedTpId}
                  onReload={onReload}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ChapterPanel — Topic list + Add Topic form ───────────────────────────────
function ChapterPanel({ bookId, ch, expandedTpId, setExpandedTpId, onReload }: any) {
  const chId = ch.chapterId;
  const topics: any[] = ch.topics || [];
  const [tpForm, setTpForm] = useState({ title: '', content: '', source: '', notes: '' });
  const [tpSaving, setTpSaving] = useState(false);

  const addTopic = async (e: any) => {
    e.preventDefault(); setTpSaving(true);
    try {
      await api.post(`/preparation/books-tools/${bookId}/chapters/${chId}/topics`, {
        title: tpForm.title,
        details: { content: tpForm.content, source: tpForm.source, notes: tpForm.notes },
      });
      setTpForm({ title: '', content: '', source: '', notes: '' });
      onReload();
    } catch {} finally { setTpSaving(false); }
  };

  return (
    <div className="px-4 py-3 bg-background/30 space-y-3">
      {/* Add Topic form */}
      <form onSubmit={addTopic} className="rounded-lg border border-white/10 bg-background/50 p-3 space-y-2">
        <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5"><AlignLeft className="w-3 h-3" /> Add Topic</p>
        <Input placeholder="Topic title *" value={tpForm.title} onChange={e => setTpForm(f => ({ ...f, title: e.target.value }))} required className="bg-background/50 border-white/10 text-xs h-7" />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Content / notes" value={tpForm.content} onChange={e => setTpForm(f => ({ ...f, content: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
          <Input placeholder="Source reference" value={tpForm.source} onChange={e => setTpForm(f => ({ ...f, source: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
        </div>
        <Input placeholder="Notes" value={tpForm.notes} onChange={e => setTpForm(f => ({ ...f, notes: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
        <Button type="submit" size="sm" disabled={tpSaving} className="bg-emerald-600/70 text-white h-6 text-xs px-3">
          {tpSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Add Topic
        </Button>
      </form>

      {/* Topic list */}
      {topics.length === 0 && <p className="text-xs text-muted-foreground pl-1">No topics yet.</p>}
      <div className="space-y-1.5">
        {topics.map((tp: any) => {
          const tpId = tp.topicId;
          const isTpOpen = expandedTpId === tpId;
          return (
            <div key={tpId} className="rounded-lg border border-white/10 overflow-hidden">
              <div
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 cursor-pointer select-none"
                onClick={() => setExpandedTpId(isTpOpen ? null : tpId)}>
                {isTpOpen ? <ChevronDown className="w-3 h-3 text-emerald-400" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                <Hash className="w-3 h-3 text-emerald-400/70" />
                <span className="text-xs font-medium flex-1">{tp.title}</span>
                <span className="text-xs text-muted-foreground">{(tp.subTopics || []).length} sub</span>
              </div>

              {isTpOpen && (
                <TopicPanel
                  bookId={bookId}
                  chId={chId}
                  tp={tp}
                  onReload={onReload}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── TopicPanel — SubTopic list + Add SubTopic form ───────────────────────────
function TopicPanel({ bookId, chId, tp, onReload }: any) {
  const tpId = tp.topicId;
  const subTopics: any[] = tp.subTopics || [];
  const [stForm, setStForm] = useState({ title: '', content: '', notes: '' });
  const [stSaving, setStSaving] = useState(false);

  const addSubTopic = async (e: any) => {
    e.preventDefault(); setStSaving(true);
    try {
      await api.post(`/preparation/books-tools/${bookId}/chapters/${chId}/topics/${tpId}/subtopics`, {
        title: stForm.title,
        details: { content: stForm.content, notes: stForm.notes },
      });
      setStForm({ title: '', content: '', notes: '' });
      onReload();
    } catch {} finally { setStSaving(false); }
  };

  return (
    <div className="px-3 py-2.5 bg-background/20 space-y-2.5">
      {/* Add SubTopic form */}
      <form onSubmit={addSubTopic} className="rounded-lg border border-white/10 bg-background/40 p-2.5 space-y-1.5">
        <p className="text-xs font-semibold text-sky-400 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Sub-Topic</p>
        <Input placeholder="Sub-topic title *" value={stForm.title} onChange={e => setStForm(f => ({ ...f, title: e.target.value }))} required className="bg-background/50 border-white/10 text-xs h-7" />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Content" value={stForm.content} onChange={e => setStForm(f => ({ ...f, content: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
          <Input placeholder="Notes" value={stForm.notes} onChange={e => setStForm(f => ({ ...f, notes: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
        </div>
        <Button type="submit" size="sm" disabled={stSaving} className="bg-sky-700/70 text-white h-6 text-xs px-3">
          {stSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Add Sub-Topic
        </Button>
      </form>

      {/* SubTopic list */}
      {subTopics.length === 0 && <p className="text-xs text-muted-foreground pl-1">No sub-topics yet.</p>}
      <div className="space-y-1">
        {subTopics.map((st: any) => (
          <div key={String(st.subTopicId)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
            <span className="text-xs">{st.title}</span>
            {st.details?.content && <span className="text-xs text-muted-foreground ml-auto truncate max-w-[200px]">{st.details.content}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}


function SyllabusTab() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', organizedBy: '', version: '' });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => { try { const r = await api.get('/preparation/syllabus'); setList(r.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const submit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/preparation/syllabus', form); setForm({ name: '', description: '', organizedBy: '', version: '' }); load(); }
    catch {} finally { setSaving(false); }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(id); setDetailLoading(true);
    try { const r = await api.get(`/preparation/syllabus/${id}`); setDetail(r.data); }
    catch {} finally { setDetailLoading(false); }
  };

  const reloadDetail = async () => {
    if (!expandedId) return;
    try { const r = await api.get(`/preparation/syllabus/${expandedId}`); setDetail(r.data); } catch {}
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="glass-panel rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Create Exam</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Exam name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="bg-background/50 border-white/10" />
          <Input placeholder="Organized by (e.g. CGDF)" value={form.organizedBy} onChange={e => setForm(f => ({ ...f, organizedBy: e.target.value }))} className="bg-background/50 border-white/10" />
          <Input placeholder="Version (e.g. 2026)" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} className="bg-background/50 border-white/10" />
          <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background/50 border-white/10" />
        </div>
        <Button type="submit" disabled={saving} className="bg-primary text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save
        </Button>
      </form>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 font-bold">All Exams ({list.length})</div>
        {loading
          ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          : (
            <div className="divide-y divide-white/5">
              {list.length === 0 && <p className="text-muted-foreground text-sm p-6 text-center">No exams yet.</p>}
              {list.map((exam: any) => (
                <div key={exam._id}>
                  <div
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 cursor-pointer"
                    onClick={() => toggleExpand(exam._id)}
                  >
                    {expandedId === exam._id
                      ? <ChevronDown className="w-4 h-4 text-primary" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <ClipboardList className="w-4 h-4 text-primary/70" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">{exam.organizedBy || ''}{exam.version ? ` · v${exam.version}` : ''} · {exam.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  {expandedId === exam._id && (
                    <div className="border-t border-white/5 bg-background/40 px-6 py-5">
                      {detailLoading
                        ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                        : detail
                          ? <ExamTreePanel exam={detail} onReload={reloadDetail} />
                          : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

// ── ExamTreePanel — Parts ─────────────────────────────────────────────────────
function ExamTreePanel({ exam, onReload }: { exam: any; onReload: () => void }) {
  const [pForm, setPForm] = useState({ name: '', description: '' });
  const [pSaving, setPSaving] = useState(false);
  const [pError, setPError] = useState('');
  const [openPartId, setOpenPartId] = useState<string | null>(null);

  const addPart = async (e: any) => {
    e.preventDefault(); setPSaving(true); setPError('');
    try {
      await api.post(`/preparation/syllabus/${exam._id}/parts`, pForm);
      setPForm({ name: '', description: '' }); onReload();
    } catch (err: any) {
      console.error('addPart error:', err?.response?.data || err?.message);
      setPError(err?.response?.data?.message || 'Failed to add part');
    } finally { setPSaving(false); }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={addPart} className="rounded-xl border border-white/10 bg-background/60 p-4 space-y-2">
        <p className="text-xs font-semibold text-primary flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Add Part</p>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Part name *" value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))} required className="bg-background/50 border-white/10 text-sm h-8" />
          <Input placeholder="Description" value={pForm.description} onChange={e => setPForm(f => ({ ...f, description: e.target.value }))} className="bg-background/50 border-white/10 text-sm h-8" />
        </div>
        {pError && <p className="text-xs text-red-400 font-medium">{pError}</p>}
        <Button type="submit" size="sm" disabled={pSaving} className="bg-primary/80 text-white h-7 text-xs">
          {pSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Add Part
        </Button>
      </form>

      {(exam.parts || []).length === 0 && <p className="text-xs text-muted-foreground">No parts yet.</p>}
      <div className="space-y-2">
        {(exam.parts || []).map((part: any) => (
          <div key={String(part.partId)} className="rounded-xl border border-white/10 overflow-hidden">
            <div
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 cursor-pointer select-none"
              onClick={() => setOpenPartId(openPartId === String(part.partId) ? null : String(part.partId))}
            >
              {openPartId === String(part.partId) ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
              <Folder className="w-3.5 h-3.5 text-yellow-400/80" />
              <span className="text-sm font-medium flex-1">{part.name}</span>
              <span className="text-xs text-muted-foreground">{(part.papers || []).length} papers</span>
            </div>
            {openPartId === String(part.partId) && (
              <PartPanel examId={exam._id} part={part} onReload={onReload} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// ── PartPanel — Papers ────────────────────────────────────────────────────────
function PartPanel({ examId, part, onReload }: any) {
  const [form, setForm] = useState({ name: '', description: '', totalMarks: '', passMarks: '', durationMinutes: '', isOptional: false, typeOfExam: 'Written' });
  const [saving, setSaving] = useState(false);
  const [openPaperId, setOpenPaperId] = useState<string | null>(null);

  const addPaper = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post(`/preparation/syllabus/${examId}/parts/${String(part.partId)}/papers`, {
        ...form,
        totalMarks: form.totalMarks ? Number(form.totalMarks) : undefined,
        passMarks: form.passMarks ? Number(form.passMarks) : undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      });
      setForm({ name: '', description: '', totalMarks: '', passMarks: '', durationMinutes: '', isOptional: false, typeOfExam: 'Written' });
      onReload();
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="px-4 py-3 bg-background/30 space-y-3">
      <form onSubmit={addPaper} className="rounded-lg border border-white/10 bg-background/50 p-3 space-y-2">
        <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Add Paper</p>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Paper name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="bg-background/50 border-white/10 text-xs h-7" />
          <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
          <Input type="number" placeholder="Total Marks" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
          <Input type="number" placeholder="Pass Marks" value={form.passMarks} onChange={e => setForm(f => ({ ...f, passMarks: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
          <Input type="number" placeholder="Duration (min)" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
          <select value={form.typeOfExam} onChange={e => setForm(f => ({ ...f, typeOfExam: e.target.value }))} className="bg-background/50 border border-white/10 rounded-lg px-2 py-1 text-xs h-7">
            <option>Written</option><option>Open Book</option><option>Practical</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={form.isOptional} onChange={e => setForm(f => ({ ...f, isOptional: e.target.checked }))} />
          Optional paper
        </label>
        <Button type="submit" size="sm" disabled={saving} className="bg-emerald-600/70 text-white h-6 text-xs px-3">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Add Paper
        </Button>
      </form>

      {(part.papers || []).length === 0 && <p className="text-xs text-muted-foreground pl-1">No papers yet.</p>}
      <div className="space-y-1.5">
        {(part.papers || []).map((paper: any) => (
          <div key={String(paper.paperId)} className="rounded-lg border border-white/10 overflow-hidden">
            <div
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 cursor-pointer select-none"
              onClick={() => setOpenPaperId(openPaperId === String(paper.paperId) ? null : String(paper.paperId))}
            >
              {openPaperId === String(paper.paperId) ? <ChevronDown className="w-3 h-3 text-emerald-400" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              <FileText className="w-3 h-3 text-emerald-400/70" />
              <span className="text-xs font-medium flex-1">{paper.name}</span>
              <span className="text-xs text-muted-foreground">{paper.typeOfExam}{paper.isOptional ? ' · Optional' : ''} · {(paper.groups || []).length} groups</span>
            </div>
            {openPaperId === String(paper.paperId) && (
              <PaperPanel examId={examId} partId={String(part.partId)} paper={paper} onReload={onReload} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PaperPanel — Groups ───────────────────────────────────────────────────────
function PaperPanel({ examId, partId, paper, onReload }: any) {
  const [form, setForm] = useState({ name: '', description: '', marks: '' });
  const [saving, setSaving] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const addGroup = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post(`/preparation/syllabus/${examId}/parts/${partId}/papers/${String(paper.paperId)}/groups`, {
        name: form.name, description: form.description,
        marks: form.marks ? Number(form.marks) : undefined,
      });
      setForm({ name: '', description: '', marks: '' }); onReload();
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="px-3 py-2.5 bg-background/20 space-y-2.5">
      <form onSubmit={addGroup} className="rounded-lg border border-white/10 bg-background/40 p-2.5 space-y-1.5">
        <p className="text-xs font-semibold text-sky-400 flex items-center gap-1"><Hash className="w-3 h-3" /> Add Group</p>
        <div className="grid grid-cols-3 gap-1.5">
          <Input placeholder="Group name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="col-span-2 bg-background/50 border-white/10 text-xs h-7" />
          <Input type="number" placeholder="Marks" value={form.marks} onChange={e => setForm(f => ({ ...f, marks: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
        </div>
        <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
        <Button type="submit" size="sm" disabled={saving} className="bg-sky-700/70 text-white h-6 text-xs px-3">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Add Group
        </Button>
      </form>

      {(paper.groups || []).length === 0 && <p className="text-xs text-muted-foreground pl-1">No groups yet.</p>}
      <div className="space-y-1">
        {(paper.groups || []).map((group: any) => (
          <div key={String(group.groupId)} className="rounded-lg border border-white/10 overflow-hidden">
            <div
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 cursor-pointer select-none"
              onClick={() => setOpenGroupId(openGroupId === String(group.groupId) ? null : String(group.groupId))}
            >
              {openGroupId === String(group.groupId) ? <ChevronDown className="w-3 h-3 text-sky-400" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              <Hash className="w-3 h-3 text-sky-400/70" />
              <span className="text-xs font-medium flex-1">{group.name}</span>
              <span className="text-xs text-muted-foreground">{group.marks ? `${group.marks}m · ` : ''}{(group.topics || []).length} topics</span>
            </div>
            {openGroupId === String(group.groupId) && (
              <GroupPanel examId={examId} partId={partId} paperId={String(paper.paperId)} group={group} onReload={onReload} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GroupPanel — Topics ───────────────────────────────────────────────────────
function GroupPanel({ examId, partId, paperId, group, onReload }: any) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);

  const addTopic = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post(`/preparation/syllabus/${examId}/parts/${partId}/papers/${paperId}/groups/${String(group.groupId)}/topics`, form);
      setForm({ name: '', description: '' }); onReload();
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="px-3 py-2 bg-background/10 space-y-2">
      <form onSubmit={addTopic} className="rounded-md border border-white/10 bg-background/30 p-2 space-y-1.5">
        <p className="text-xs font-semibold text-violet-400 flex items-center gap-1"><AlignLeft className="w-3 h-3" /> Add Topic</p>
        <div className="grid grid-cols-2 gap-1.5">
          <Input placeholder="Topic name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="bg-background/50 border-white/10 text-xs h-7" />
          <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-7" />
        </div>
        <Button type="submit" size="sm" disabled={saving} className="bg-violet-700/70 text-white h-6 text-xs px-3">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Add Topic
        </Button>
      </form>

      {(group.topics || []).length === 0 && <p className="text-xs text-muted-foreground pl-1">No topics yet.</p>}
      <div className="space-y-1">
        {(group.topics || []).map((topic: any) => (
          <div key={String(topic.topicId)} className="rounded-md border border-white/10 overflow-hidden">
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 cursor-pointer select-none"
              onClick={() => setOpenTopicId(openTopicId === String(topic.topicId) ? null : String(topic.topicId))}
            >
              {openTopicId === String(topic.topicId) ? <ChevronDown className="w-2.5 h-2.5 text-violet-400" /> : <ChevronRight className="w-2.5 h-2.5 text-muted-foreground" />}
              <span className="text-xs font-medium flex-1">{topic.name}</span>
              <span className="text-xs text-muted-foreground">{(topic.subTopics || []).length} sub</span>
            </div>
            {openTopicId === String(topic.topicId) && (
              <SubTopicPanel examId={examId} partId={partId} paperId={paperId} groupId={String(group.groupId)} topic={topic} onReload={onReload} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SubTopicPanel — Sub-Topics ────────────────────────────────────────────────
function SubTopicPanel({ examId, partId, paperId, groupId, topic, onReload }: any) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const addSubTopic = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post(`/preparation/syllabus/${examId}/parts/${partId}/papers/${paperId}/groups/${groupId}/topics/${String(topic.topicId)}/subtopics`, form);
      setForm({ name: '', description: '' }); onReload();
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="px-2.5 py-2 bg-background/5 space-y-1.5">
      <form onSubmit={addSubTopic} className="rounded border border-white/10 bg-background/20 p-2 space-y-1">
        <p className="text-xs font-semibold text-rose-400 flex items-center gap-1"><Plus className="w-2.5 h-2.5" /> Add Sub-Topic</p>
        <div className="grid grid-cols-2 gap-1.5">
          <Input placeholder="Sub-topic name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="bg-background/50 border-white/10 text-xs h-6" />
          <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background/50 border-white/10 text-xs h-6" />
        </div>
        <Button type="submit" size="sm" disabled={saving} className="bg-rose-700/70 text-white h-5 text-xs px-2">
          {saving ? <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" /> : <Plus className="w-2.5 h-2.5 mr-1" />} Add
        </Button>
      </form>
      <div className="space-y-0.5">
        {(topic.subTopics || []).map((st: any) => (
          <div key={String(st.subTopicId)} className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span className="text-xs">{st.name}</span>
            {st.description && <span className="text-xs text-muted-foreground ml-auto truncate max-w-[150px]">{st.description}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Questions Tab ─────────────────────────────────────────────────────────────
function QuestionsTab() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ sourceType: 'book', sourceId: '', sourceLocation: {} as any, questionType: 'MCQ', mainQuestion: '', defaultMark: '1', correctAnswer: '', options: ['', '', '', ''], difficulty: 'Easy', explanation: '' });
  const [saving, setSaving] = useState(false);

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [booksData, setBooksData] = useState<any[]>([]);
  const [topicSearch, setTopicSearch] = useState('');
  const [selectedTopicName, setSelectedTopicName] = useState('');

  const load = async () => { try { const r = await api.get('/preparation/questions'); setQuestions(r.data); } catch {} finally { setLoading(false); } };
  const loadBooks = async () => { try { const r = await api.get('/preparation/books-tools?includeChapters=true'); setBooksData(r.data); } catch {} };

  useEffect(() => { load(); loadBooks(); }, []);

  const submit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/preparation/questions', { ...form, defaultMark: Number(form.defaultMark) });
      setForm(f => ({ ...f, mainQuestion: '', correctAnswer: '', options: ['', '', '', ''], explanation: '' }));
      load();
    } catch {} finally { setSaving(false); }
  };

  const toggle = async (id: string) => { try { await api.patch(`/preparation/questions/${id}/toggle`); load(); } catch {} };

  const flattenedTopics = useMemo(() => {
    const list = [];
    for (const book of booksData) {
      // remove the if (book.type !== 'book') continue; check to also allow tools to be used as sources
      for (const ch of book.chapters || []) {
        for (const tp of ch.topics || []) {
          list.push({ bookId: book._id, bookName: book.name, chapterId: ch.chapterId, chapterTitle: ch.title, topicId: tp.topicId, topicTitle: tp.title });
        }
      }
    }
    return list;
  }, [booksData]);

  const filteredTopics = flattenedTopics.filter(t => 
    t.topicTitle.toLowerCase().includes(topicSearch.toLowerCase()) || 
    t.bookName.toLowerCase().includes(topicSearch.toLowerCase()) ||
    t.chapterTitle.toLowerCase().includes(topicSearch.toLowerCase())
  );

  const handleTopicSelect = (topic: any) => {
    setForm(f => ({
      ...f,
      sourceId: topic.bookId,
      sourceLocation: { chapterId: topic.chapterId, topicId: topic.topicId }
    }));
    setSelectedTopicName(`${topic.bookName} - ${topic.topicTitle}`);
    setTopicModalOpen(false);
    setTopicSearch('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="glass-panel rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Add Question</h2>
        <div className="relative">
          <Input 
            readOnly
            placeholder="Double click to select Topic *" 
            value={selectedTopicName || form.sourceId} 
            onDoubleClick={() => setTopicModalOpen(true)}
            className="bg-background/50 border-white/10 cursor-pointer font-medium" 
            title="Double click to select Topic"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <select value={form.questionType} onChange={e => setForm(f => ({ ...f, questionType: e.target.value, correctAnswer: '', options: ['', '', '', ''] }))} className="bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-sm">
            <option>MCQ</option><option>Written</option><option>Practical</option><option>TrueFalse</option>
          </select>
          <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className="bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-sm">
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
          <Input type="number" placeholder="Mark" value={form.defaultMark} onChange={e => setForm(f => ({ ...f, defaultMark: e.target.value }))} className="bg-background/50 border-white/10" />
        </div>
        
        <textarea rows={3} placeholder="Question text *" value={form.mainQuestion} onChange={e => setForm(f => ({ ...f, mainQuestion: e.target.value }))} required className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-2 text-sm resize-none" />
        
        {form.questionType === 'MCQ' && (
          <div className="space-y-3 p-4 bg-background/30 rounded-xl border border-white/5">
            <p className="text-sm font-medium text-muted-foreground">MCQ Options (Select the correct one)</p>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 bg-background/50 p-2 rounded-xl border border-white/5">
                  <input type="radio" name="correctOption" required checked={form.correctAnswer === String(i)} onChange={() => setForm(f => ({ ...f, correctAnswer: String(i) }))} className="w-4 h-4 cursor-pointer accent-primary shrink-0" />
                  <Input placeholder={`Option ${String.fromCharCode(65 + i)}`} value={form.options[i]} onChange={e => {
                    const newOpts = [...form.options];
                    newOpts[i] = e.target.value;
                    setForm(f => ({ ...f, options: newOpts }));
                  }} required className="bg-transparent border-none focus-visible:ring-0 px-0 h-auto" />
                </div>
              ))}
            </div>
          </div>
        )}

        {form.questionType === 'TrueFalse' && (
          <select value={form.correctAnswer} onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))} required className="bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-sm w-full">
            <option value="">Select correct answer...</option>
            <option value="True">True</option>
            <option value="False">False</option>
          </select>
        )}

        {(form.questionType === 'Written' || form.questionType === 'Practical') && (
          <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
            <ReactQuill theme="snow" value={form.correctAnswer} onChange={val => setForm(f => ({ ...f, correctAnswer: val }))} className="bg-white/5 text-sm h-48 border-none" />
          </div>
        )}
        
        <Input placeholder="Explanation (optional)" value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} className="bg-background/50 border-white/10" />
        <Button type="submit" disabled={saving} className="bg-primary text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save</Button>
      </form>

      {/* Topic Selection Modal */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-bold flex items-center gap-2 text-primary"><BookMarked className="w-4 h-4" /> Select Topic from Books</h3>
              <button onClick={() => setTopicModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b border-white/10">
              <Input 
                autoFocus
                placeholder="Search topics or books..." 
                value={topicSearch} 
                onChange={e => setTopicSearch(e.target.value)} 
                className="bg-white/5 border-white/10" 
              />
            </div>
            <div className="flex-1 overflow-y-auto max-h-96 p-2">
              {filteredTopics.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No topics found matching "{topicSearch}"</p>
              ) : (
                <div className="space-y-1">
                  {filteredTopics.map((topic, i) => (
                    <div 
                      key={`${topic.bookId}-${topic.topicId}-${i}`}
                      onClick={() => handleTopicSelect(topic)}
                      className="px-4 py-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-sm text-primary/90">{topic.topicTitle}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{topic.bookName} <span className="mx-1">•</span> {topic.chapterTitle}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 font-bold">Questions ({questions.length})</div>
        {loading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
          <div className="divide-y divide-white/5">
            {questions.length === 0 && <p className="text-muted-foreground text-sm p-6 text-center">No questions yet.</p>}
            {questions.map((q: any) => (
              <div key={q._id} className="flex items-center justify-between px-5 py-3 hover:bg-white/5">
                <div className="flex-1 mr-4">
                  <p className="font-medium text-sm line-clamp-1">{q.mainQuestion}</p>
                  <p className="text-xs text-muted-foreground capitalize">{q.questionType} · {q.difficulty}</p>
                </div>
                <button onClick={() => toggle(q._id)} title="Toggle active" className={q.isActive ? 'text-emerald-400' : 'text-muted-foreground'}>
                  {q.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sheets Tab ────────────────────────────────────────────────────────────────
function SheetsTab() {
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', part: '1', type: 'static', totalMarks: '100', durationMinutes: '60', passMarks: '50', description: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => { try { const r = await api.get('/preparation/sheets'); setSheets(r.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const submit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/preparation/sheets', {
        ...form,
        totalMarks: Number(form.totalMarks),
        durationMinutes: Number(form.durationMinutes),
        passMarks: Number(form.passMarks),
        ...(form.type === 'dynamic' ? { selectionCriteria: { syllabusTopics: [], difficulties: ['Easy', 'Medium', 'Hard'], totalQuestions: 10 } } : {}),
      });
      setForm({ title: '', part: '1', type: 'static', totalMarks: '100', durationMinutes: '60', passMarks: '50', description: '' });
      load();
    } catch {} finally { setSaving(false); }
  };

  const del = async (id: string) => { if (!confirm('Delete sheet?')) return; try { await api.delete(`/preparation/sheets/${id}`); load(); } catch {} };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="glass-panel rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Create Sheet</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="bg-background/50 border-white/10" />
          <select value={form.part} onChange={e => setForm(f => ({ ...f, part: e.target.value }))} className="bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-sm">
            <option value="1">Part 1</option><option value="2">Part 2</option>
          </select>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-sm">
            <option value="static">Static</option><option value="dynamic">Dynamic</option>
          </select>
          <Input type="number" placeholder="Total Marks" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))} className="bg-background/50 border-white/10" />
          <Input type="number" placeholder="Duration (min)" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} className="bg-background/50 border-white/10" />
          <Input type="number" placeholder="Pass Marks" value={form.passMarks} onChange={e => setForm(f => ({ ...f, passMarks: e.target.value }))} className="bg-background/50 border-white/10" />
        </div>
        <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-background/50 border-white/10" />
        <Button type="submit" disabled={saving} className="bg-primary text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save</Button>
      </form>
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 font-bold">Question Sheets ({sheets.length})</div>
        {loading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
          <div className="divide-y divide-white/5">
            {sheets.length === 0 && <p className="text-muted-foreground text-sm p-6 text-center">No sheets yet.</p>}
            {sheets.map((s: any) => (
              <div key={s._id} className="flex items-center justify-between px-5 py-3 hover:bg-white/5">
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.type} · Part {s.part} · {s.totalMarks} marks · {s.durationMinutes} min</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => del(s._id)} className="text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Content Tags Tab ──────────────────────────────────────────────────────────
function TagsTab() {
  const [form, setForm] = useState({ 
    bookOrToolId: '', 
    contentLocation: {} as any,
    syllabusTopicId: '', 
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  // Data fetching
  const [booksData, setBooksData] = useState<any[]>([]);
  const [syllabusData, setSyllabusData] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  // Modals state
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBookTopicName, setSelectedBookTopicName] = useState('');

  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const [syllabusSearch, setSyllabusSearch] = useState('');
  const [selectedSyllabusTopicName, setSelectedSyllabusTopicName] = useState('');

  const loadTags = async () => {
    try {
      const r = await api.get('/preparation/content-tags');
      setTags(r.data);
    } catch {} finally { setTagsLoading(false); }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [r1, r2] = await Promise.all([
          api.get('/preparation/books-tools?includeChapters=true'),
          api.get('/preparation/syllabus?includeParts=true')
        ]);
        setBooksData(r1.data);
        setSyllabusData(r2.data);
      } catch {}
    };
    loadData();
    loadTags();
  }, []);

  const flattenedBookTopics = useMemo(() => {
    const list = [];
    for (const book of booksData) {
      for (const ch of book.chapters || []) {
        for (const tp of ch.topics || []) {
          list.push({ bookId: book._id, bookName: book.name, type: book.type || 'book', chapterId: ch.chapterId, chapterTitle: ch.title, topicId: tp.topicId, topicTitle: tp.title });
        }
      }
    }
    return list;
  }, [booksData]);

  const filteredBookTopics = flattenedBookTopics.filter(t => 
    t.topicTitle.toLowerCase().includes(bookSearch.toLowerCase()) || 
    t.bookName.toLowerCase().includes(bookSearch.toLowerCase()) ||
    t.chapterTitle.toLowerCase().includes(bookSearch.toLowerCase())
  );

  const flattenedSyllabusTopics = useMemo(() => {
    const list = [];
    for (const exam of syllabusData) {
      for (const part of exam.parts || []) {
        for (const paper of part.papers || []) {
          for (const group of paper.groups || []) {
            for (const topic of group.topics || []) {
              list.push({
                examId: exam._id,
                examName: exam.name,
                partId: part.partId,
                partName: part.name,
                paperId: paper.paperId,
                paperName: paper.name,
                groupId: group.groupId,
                groupName: group.name,
                topicId: topic.topicId,
                topicName: topic.name
              });
            }
          }
        }
      }
    }
    return list;
  }, [syllabusData]);

  const filteredSyllabusTopics = flattenedSyllabusTopics.filter(t =>
    t.topicName.toLowerCase().includes(syllabusSearch.toLowerCase()) ||
    t.paperName.toLowerCase().includes(syllabusSearch.toLowerCase()) ||
    t.partName.toLowerCase().includes(syllabusSearch.toLowerCase()) ||
    t.examName.toLowerCase().includes(syllabusSearch.toLowerCase())
  );

  const handleBookSelect = (topic: any) => {
    setForm(f => ({
      ...f,
      bookOrToolId: topic.bookId,
      contentLocation: { chapterId: topic.chapterId, topicId: topic.topicId }
    }));
    setSelectedBookTopicName(`${topic.bookName} - ${topic.topicTitle}`);
    setBookModalOpen(false);
    setBookSearch('');
  };

  const handleSyllabusSelect = (topic: any) => {
    setForm(f => ({
      ...f,
      syllabusTopicId: topic.topicId
    }));
    setSelectedSyllabusTopicName(`${topic.examName} > ${topic.partName} > ${topic.paperName} > ${topic.topicName}`);
    setSyllabusModalOpen(false);
    setSyllabusSearch('');
  };

  const submit = async (e: any) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      if (editingTagId) {
        await api.put(`/preparation/content-tags/${editingTagId}`, form);
        setMsg('Tag updated successfully!');
      } else {
        await api.post('/preparation/content-tags', form);
        setMsg('Tag created successfully!');
      }
      
      // Keep syllabus topic, only clear book topic to easily map multiple books to the same syllabus topic
      setForm(f => ({ ...f, bookOrToolId: '', contentLocation: {} as any }));
      setSelectedBookTopicName('');
      setEditingTagId(null);
      loadTags();
    } catch (err: any) {
      setMsg(err?.response?.data?.message || 'Error saving tag');
    } finally { setSaving(false); }
  };

  const delTag = async (id: string) => {
    if (!confirm('Delete this mapped content tag?')) return;
    try {
      await api.delete(`/preparation/content-tags/${id}`);
      loadTags();
    } catch {}
  };

  const editTag = (tag: any) => {
    setEditingTagId(tag._id);
    setForm({
      bookOrToolId: tag.bookOrToolId?._id || tag.bookOrToolId,
      contentLocation: tag.contentLocation || {},
      syllabusTopicId: tag.syllabusTopicId,
    });
    
    // Find names
    const sTop = flattenedSyllabusTopics.find(t => t.topicId === tag.syllabusTopicId);
    setSelectedSyllabusTopicName(sTop ? `${sTop.examName} > ${sTop.partName} > ${sTop.paperName} > ${sTop.topicName}` : tag.syllabusTopicId);

    const bTop = flattenedBookTopics.find(t => t.topicId === tag.contentLocation?.topicId);
    setSelectedBookTopicName(bTop ? `${bTop.bookName} - ${bTop.topicTitle}` : tag.contentLocation?.topicId || 'Unknown');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="glass-panel rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2"><Link2 className="w-4 h-4" /> Link Content to Syllabus</h2>
        <p className="text-xs text-muted-foreground">Select a Syllabus Topic, then assign a Topic of Books to it. You can map multiple Books to the same Syllabus Topic.</p>
        
        <div className="space-y-3">
          <div className="relative">
            <Input 
              readOnly
              placeholder="Double click to select Syllabus Topic *" 
              value={selectedSyllabusTopicName || form.syllabusTopicId} 
              onDoubleClick={() => setSyllabusModalOpen(true)}
              className="bg-background/50 border-white/10 cursor-pointer font-medium w-full" 
              title="Double click to select Syllabus Topic"
              required
            />
          </div>
          <div className="relative">
            <Input 
              readOnly
              placeholder="Double click to select Topic of Books *" 
              value={selectedBookTopicName || form.bookOrToolId} 
              onDoubleClick={() => setBookModalOpen(true)}
              className="bg-background/50 border-white/10 cursor-pointer font-medium w-full" 
              title="Double click to select Topic of Books"
              required
            />
          </div>
        </div>

        {msg && <p className={`text-sm ${msg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving} className="bg-primary text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} 
            {editingTagId ? 'Update Link' : 'Create Link'}
          </Button>
          {editingTagId && (
            <Button type="button" variant="outline" onClick={() => { setEditingTagId(null); setForm(f => ({ ...f, bookOrToolId: '', contentLocation: {} as any })); setSelectedBookTopicName(''); }} className="border-white/10">
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

      {/* Tags List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <h3 className="font-bold flex items-center gap-2"><BookMarked className="w-4 h-4 text-primary" /> Mapped Content Links</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-xs text-muted-foreground uppercase border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Syllabus Topic</th>
                <th className="px-4 py-3 font-medium">Book/Tool Topic</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tagsLoading ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
              ) : tags.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No content mapped yet.</td></tr>
              ) : (
                tags.map(tag => {
                  const sTop = flattenedSyllabusTopics.find(t => t.topicId === tag.syllabusTopicId);
                  const bTop = flattenedBookTopics.find(t => t.topicId === tag.contentLocation?.topicId);
                  
                  return (
                    <tr key={tag._id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3 align-top">
                        {sTop ? (
                          <div>
                            <p className="font-medium text-primary/90">{sTop.topicName}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{sTop.examName} • {sTop.partName} • {sTop.paperName}</p>
                          </div>
                        ) : <span className="text-muted-foreground text-xs">{tag.syllabusTopicId}</span>}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {bTop ? (
                          <div>
                            <p className="font-medium text-primary/90">{bTop.topicTitle}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{bTop.bookName} • {bTop.chapterTitle}</p>
                          </div>
                        ) : <span className="text-muted-foreground text-xs">{tag.contentLocation?.topicId}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => editTag(tag)} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-md transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => delTag(tag._id)} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Syllabus Selection Modal */}
      {syllabusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-bold flex items-center gap-2 text-primary"><BookMarked className="w-4 h-4" /> Select Syllabus Topic</h3>
              <button onClick={() => setSyllabusModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b border-white/10 bg-black/20">
              <Input placeholder="Search syllabus topics..." value={syllabusSearch} onChange={e => setSyllabusSearch(e.target.value)} className="bg-background/50 border-white/10" autoFocus />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
              {filteredSyllabusTopics.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No topics found</p>
              ) : (
                filteredSyllabusTopics.map((topic, i) => (
                  <div 
                    key={`${topic.topicId}-${i}`}
                    onClick={() => handleSyllabusSelect(topic)}
                    className="px-4 py-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <p className="font-medium text-sm text-primary/90">{topic.topicName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{topic.examName} <span className="mx-1">•</span> {topic.partName} <span className="mx-1">•</span> {topic.paperName}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Book Selection Modal */}
      {bookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-bold flex items-center gap-2 text-primary"><BookMarked className="w-4 h-4" /> Select Topic from Books</h3>
              <button onClick={() => setBookModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b border-white/10 bg-black/20">
              <Input placeholder="Search topics..." value={bookSearch} onChange={e => setBookSearch(e.target.value)} className="bg-background/50 border-white/10" autoFocus />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
              {filteredBookTopics.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No topics found</p>
              ) : (
                filteredBookTopics.map((topic, i) => (
                  <div 
                    key={`${topic.bookId}-${topic.topicId}-${i}`}
                    onClick={() => handleBookSelect(topic)}
                    className="px-4 py-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <p className="font-medium text-sm text-primary/90">{topic.topicTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{topic.bookName} <span className="mx-1">•</span> {topic.chapterTitle}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
