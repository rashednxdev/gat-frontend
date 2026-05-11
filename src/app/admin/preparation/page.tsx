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

// ── Simple Modal Component ──────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={(e) => { e.preventDefault(); onClose(); }} type="button" className="p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-muted-foreground hover:text-white" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── BookReadingView — Smart Reading Page with Modals ─────────────────────────
function BookTreePanel({ book, onReload }: { book: any; onReload: () => void }) {
  const bookId = book._id;
  const chapters: any[] = book.chapters || [];

  // Modal States
  const [modalType, setModalType] = useState<'addCh' | 'editCh' | 'addTp' | 'editTp' | 'addSt' | 'editSt' | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null); // To store which chapter/topic is being edited or added to
  const [saving, setSaving] = useState(false);

  // Form States
  const [chForm, setChForm] = useState({ title: '', chapterNumber: '', description: '' });
  const [tpForm, setTpForm] = useState({ title: '', content: '', source: '', notes: '' });
  const [stForm, setStForm] = useState({ title: '', content: '', notes: '' });

  const closeModal = () => {
    setModalType(null);
    setActiveItem(null);
  };

  // ── Chapter Actions
  const handleChapterSubmit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modalType === 'addCh') {
        await api.post(`/preparation/books-tools/${bookId}/chapters`, {
          title: chForm.title,
          chapterNumber: chForm.chapterNumber ? Number(chForm.chapterNumber) : undefined,
          description: chForm.description,
        });
      } else if (modalType === 'editCh') {
        await api.put(`/preparation/books-tools/${bookId}/chapters/${activeItem.chapterId}`, {
          title: chForm.title,
          chapterNumber: chForm.chapterNumber ? Number(chForm.chapterNumber) : undefined,
          description: chForm.description,
        });
      }
      closeModal();
      onReload();
    } catch {} finally { setSaving(false); }
  };

  const deleteChapter = async (chId: string) => {
    if (!confirm('Delete this chapter?')) return;
    try { await api.delete(`/preparation/books-tools/${bookId}/chapters/${chId}`); onReload(); } catch {}
  };

  // ── Topic Actions
  const handleTopicSubmit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      const chId = activeItem.chapterId;
      if (modalType === 'addTp') {
        await api.post(`/preparation/books-tools/${bookId}/chapters/${chId}/topics`, {
          title: tpForm.title,
          details: { content: tpForm.content, source: tpForm.source, notes: tpForm.notes },
        });
      } else if (modalType === 'editTp') {
        await api.put(`/preparation/books-tools/${bookId}/chapters/${chId}/topics/${activeItem.topicId}`, {
          title: tpForm.title,
          details: { content: tpForm.content, source: tpForm.source, notes: tpForm.notes },
        });
      }
      closeModal();
      onReload();
    } catch {} finally { setSaving(false); }
  };

  const deleteTopic = async (chId: string, tpId: string) => {
    if (!confirm('Delete this topic?')) return;
    try { await api.delete(`/preparation/books-tools/${bookId}/chapters/${chId}/topics/${tpId}`); onReload(); } catch {}
  };

  // ── SubTopic Actions
  const handleSubTopicSubmit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      const { chapterId, topicId } = activeItem;
      if (modalType === 'addSt') {
        await api.post(`/preparation/books-tools/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics`, {
          title: stForm.title,
          details: { content: stForm.content, notes: stForm.notes },
        });
      } else if (modalType === 'editSt') {
        await api.put(`/preparation/books-tools/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${activeItem.subTopicId}`, {
          title: stForm.title,
          details: { content: stForm.content, notes: stForm.notes },
        });
      }
      closeModal();
      onReload();
    } catch {} finally { setSaving(false); }
  };

  const deleteSubTopic = async (chId: string, tpId: string, stId: string) => {
    if (!confirm('Delete this sub-topic?')) return;
    try { await api.delete(`/preparation/books-tools/${bookId}/chapters/${chId}/topics/${tpId}/subtopics/${stId}`); onReload(); } catch {}
  };

  return (
    <div className="relative font-serif max-w-4xl mx-auto">
      {/* ── Reading Page Container ── */}
      <div className="text-foreground leading-relaxed">
        {chapters.length === 0 && (
          <div className="text-center py-10 opacity-60">
            <BookOpen className="w-12 h-12 mx-auto mb-3" />
            <p>This book is empty. Add the first chapter to begin.</p>
          </div>
        )}

        {chapters.map((ch: any) => (
          <div key={ch.chapterId} className="mb-14 relative group/chapter">
            {/* Chapter Header */}
            <div className="border-b-2 border-primary/30 pb-2 mb-4 pr-16 relative">
              <h2 className="text-3xl font-extrabold m-0 text-white tracking-tight">
                {ch.chapterNumber ? <span className="text-primary/70 mr-2">Chapter {ch.chapterNumber}:</span> : ''}
                {ch.title}
              </h2>
              {ch.description && <p className="text-muted-foreground mt-2 text-lg italic m-0">{ch.description}</p>}
              
              {/* Chapter Actions */}
              <div className="absolute right-0 top-0 opacity-0 group-hover/chapter:opacity-100 flex gap-1 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => { setModalType('editCh'); setActiveItem(ch); setChForm({ title: ch.title, chapterNumber: ch.chapterNumber || '', description: ch.description || '' }); }}>
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/20" onClick={() => deleteChapter(ch.chapterId)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>

            {/* Topics List */}
            {ch.topics?.length === 0 && <p className="text-muted-foreground italic text-sm ml-6">No topics in this chapter.</p>}
            
            <div className="pl-4 md:pl-8 space-y-10">
              {ch.topics?.map((tp: any) => (
                <div key={tp.topicId} className="relative group/topic">
                  {/* Topic Header */}
                  <div className="relative pr-16">
                    <h3 className="text-2xl font-bold m-0 text-emerald-400 mb-2 flex items-center gap-2">
                      <Hash className="w-5 h-5 text-emerald-500/50" />
                      {tp.title}
                    </h3>
                    {tp.details?.content && <p className="text-base text-foreground/90 m-0 mb-3">{tp.details.content}</p>}
                    {(tp.details?.notes || tp.details?.source) && (
                      <div className="bg-white/5 rounded-lg p-3 text-sm text-muted-foreground mb-4">
                        {tp.details?.source && <p className="m-0 mb-1"><strong className="text-white/70">Source:</strong> {tp.details.source}</p>}
                        {tp.details?.notes && <p className="m-0 italic">{tp.details.notes}</p>}
                      </div>
                    )}
                    
                    {/* Topic Actions */}
                    <div className="absolute right-0 top-0 opacity-0 group-hover/topic:opacity-100 flex gap-1 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10" onClick={() => { setModalType('editTp'); setActiveItem({ ...tp, chapterId: ch.chapterId }); setTpForm({ title: tp.title, content: tp.details?.content || '', source: tp.details?.source || '', notes: tp.details?.notes || '' }); }}>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/20" onClick={() => deleteTopic(ch.chapterId, tp.topicId)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>

                  {/* Subtopics List */}
                  <div className="pl-6 md:pl-8 mt-4 space-y-6 border-l-2 border-emerald-500/20">
                    {tp.subTopics?.map((st: any) => (
                      <div key={st.subTopicId} className="relative group/subtopic pl-4">
                        <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-background border-2 border-sky-400"></div>
                        <h4 className="text-xl font-bold m-0 text-sky-300 mb-1">{st.title}</h4>
                        {st.details?.content && <p className="text-base text-foreground/80 m-0 mb-2 whitespace-pre-line">{st.details.content}</p>}
                        {st.details?.notes && <p className="text-sm italic text-muted-foreground m-0 bg-white/5 p-2 rounded whitespace-pre-line">{st.details.notes}</p>}
                        
                        {/* SubTopic Actions */}
                        <div className="absolute right-0 top-0 opacity-0 group-hover/subtopic:opacity-100 flex gap-1 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => { setModalType('editSt'); setActiveItem({ ...st, chapterId: ch.chapterId, topicId: tp.topicId }); setStForm({ title: st.title, content: st.details?.content || '', notes: st.details?.notes || '' }); }}>
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-500/20" onClick={() => deleteSubTopic(ch.chapterId, tp.topicId, st.subTopicId)}>
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add SubTopic Button */}
                    <div className="pl-4">
                      <Button variant="ghost" size="sm" className="text-sky-400 hover:text-sky-300 hover:bg-sky-400/10 px-2 py-1 h-auto text-sm" onClick={() => { setModalType('addSt'); setActiveItem({ chapterId: ch.chapterId, topicId: tp.topicId }); setStForm({ title: '', content: '', notes: '' }); }}>
                        <Plus className="w-3 h-3 mr-1" /> Add Sub-Topic
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Topic Button */}
              <div className="pt-2">
                <Button variant="outline" className="border-dashed border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/10" onClick={() => { setModalType('addTp'); setActiveItem({ chapterId: ch.chapterId }); setTpForm({ title: '', content: '', source: '', notes: '' }); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Topic
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Global Add Chapter Button */}
        <div className="mt-8 pt-4 border-t border-white/10">
          <Button className="w-full bg-primary text-white hover:bg-primary/90" onClick={() => { setModalType('addCh'); setChForm({ title: '', chapterNumber: '', description: '' }); }}>
            <Plus className="w-5 h-5 mr-2" /> Add New Chapter
          </Button>
        </div>
      </div>

      {/* ── Modals ── */}
      
      {/* Chapter Modal */}
      <Modal isOpen={modalType === 'addCh' || modalType === 'editCh'} onClose={closeModal} title={modalType === 'addCh' ? 'Add Chapter' : 'Edit Chapter'}>
        <form onSubmit={handleChapterSubmit} className="space-y-4">
          <Input placeholder="Title *" value={chForm.title} onChange={e => setChForm(f => ({ ...f, title: e.target.value }))} required className="bg-background border-white/10" />
          <Input type="number" placeholder="Chapter Number (optional)" value={chForm.chapterNumber} onChange={e => setChForm(f => ({ ...f, chapterNumber: e.target.value }))} className="bg-background border-white/10" />
          <textarea rows={3} placeholder="Description" value={chForm.description} onChange={e => setChForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <Button type="submit" disabled={saving} className="w-full bg-primary text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Chapter
          </Button>
        </form>
      </Modal>

      {/* Topic Modal */}
      <Modal isOpen={modalType === 'addTp' || modalType === 'editTp'} onClose={closeModal} title={modalType === 'addTp' ? 'Add Topic' : 'Edit Topic'}>
        <form onSubmit={handleTopicSubmit} className="space-y-4">
          <Input placeholder="Topic Title *" value={tpForm.title} onChange={e => setTpForm(f => ({ ...f, title: e.target.value }))} required className="bg-background border-white/10" />
          <textarea rows={4} placeholder="Topic Content" value={tpForm.content} onChange={e => setTpForm(f => ({ ...f, content: e.target.value }))} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <Input placeholder="Source Reference" value={tpForm.source} onChange={e => setTpForm(f => ({ ...f, source: e.target.value }))} className="bg-background border-white/10" />
          <Input placeholder="Extra Notes" value={tpForm.notes} onChange={e => setTpForm(f => ({ ...f, notes: e.target.value }))} className="bg-background border-white/10" />
          <Button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Topic
          </Button>
        </form>
      </Modal>

      {/* SubTopic Modal */}
      <Modal isOpen={modalType === 'addSt' || modalType === 'editSt'} onClose={closeModal} title={modalType === 'addSt' ? 'Add Sub-Topic' : 'Edit Sub-Topic'}>
        <form onSubmit={handleSubTopicSubmit} className="space-y-4">
          <Input placeholder="Sub-Topic Title *" value={stForm.title} onChange={e => setStForm(f => ({ ...f, title: e.target.value }))} required className="bg-background border-white/10" />
          <textarea rows={4} placeholder="Content" value={stForm.content} onChange={e => setStForm(f => ({ ...f, content: e.target.value }))} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <Input placeholder="Extra Notes" value={stForm.notes} onChange={e => setStForm(f => ({ ...f, notes: e.target.value }))} className="bg-background border-white/10" />
          <Button type="submit" disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Sub-Topic
          </Button>
        </form>
      </Modal>
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
                          ? <ExamReadingView exam={detail} onReload={reloadDetail} />
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

// ── ExamReadingView — Smart Reading Page with Modals ─────────────────────────
function ExamReadingView({ exam, onReload }: { exam: any; onReload: () => void }) {
  const examId = exam._id;
  const parts: any[] = exam.parts || [];

  const [modalType, setModalType] = useState<
    'addPart' | 'editPart' | 
    'addPaper' | 'editPaper' | 
    'addGroup' | 'editGroup' | 
    'addTp' | 'editTp' | 
    'addSt' | 'editSt' | null
  >(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Forms
  const [partForm, setPartForm] = useState({ name: '', description: '' });
  const [paperForm, setPaperForm] = useState({ name: '', description: '', totalMarks: '', passMarks: '', durationMinutes: '', isOptional: false, typeOfExam: 'Written' });
  const [groupForm, setGroupForm] = useState({ name: '', description: '', marks: '' });
  const [tpForm, setTpForm] = useState({ name: '', description: '' });
  const [stForm, setStForm] = useState({ name: '', description: '' });

  const closeModal = () => { setModalType(null); setActiveItem(null); };

  // Handlers for Part
  const handlePartSubmit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modalType === 'addPart') {
        await api.post(`/preparation/syllabus/${examId}/parts`, partForm);
      } else if (modalType === 'editPart') {
        await api.put(`/preparation/syllabus/${examId}/parts/${activeItem.partId}`, partForm);
      }
      closeModal(); onReload();
    } catch {} finally { setSaving(false); }
  };
  const deletePart = async (id: string) => {
    if (!confirm('Delete this part?')) return;
    try { await api.delete(`/preparation/syllabus/${examId}/parts/${id}`); onReload(); } catch {}
  };

  // Handlers for Paper
  const handlePaperSubmit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...paperForm,
        totalMarks: paperForm.totalMarks ? Number(paperForm.totalMarks) : undefined,
        passMarks: paperForm.passMarks ? Number(paperForm.passMarks) : undefined,
        durationMinutes: paperForm.durationMinutes ? Number(paperForm.durationMinutes) : undefined,
      };
      if (modalType === 'addPaper') {
        await api.post(`/preparation/syllabus/${examId}/parts/${activeItem.partId}/papers`, payload);
      } else if (modalType === 'editPaper') {
        await api.put(`/preparation/syllabus/${examId}/parts/${activeItem.partId}/papers/${activeItem.paperId}`, payload);
      }
      closeModal(); onReload();
    } catch {} finally { setSaving(false); }
  };
  const deletePaper = async (partId: string, id: string) => {
    if (!confirm('Delete this paper?')) return;
    try { await api.delete(`/preparation/syllabus/${examId}/parts/${partId}/papers/${id}`); onReload(); } catch {}
  };

  // Handlers for Group
  const handleGroupSubmit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...groupForm, marks: groupForm.marks ? Number(groupForm.marks) : undefined };
      if (modalType === 'addGroup') {
        await api.post(`/preparation/syllabus/${examId}/parts/${activeItem.partId}/papers/${activeItem.paperId}/groups`, payload);
      } else if (modalType === 'editGroup') {
        await api.put(`/preparation/syllabus/${examId}/parts/${activeItem.partId}/papers/${activeItem.paperId}/groups/${activeItem.groupId}`, payload);
      }
      closeModal(); onReload();
    } catch {} finally { setSaving(false); }
  };
  const deleteGroup = async (partId: string, paperId: string, id: string) => {
    if (!confirm('Delete this group?')) return;
    try { await api.delete(`/preparation/syllabus/${examId}/parts/${partId}/papers/${paperId}/groups/${id}`); onReload(); } catch {}
  };

  // Handlers for Topic
  const handleTopicSubmit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modalType === 'addTp') {
        await api.post(`/preparation/syllabus/${examId}/parts/${activeItem.partId}/papers/${activeItem.paperId}/groups/${activeItem.groupId}/topics`, tpForm);
      } else if (modalType === 'editTp') {
        await api.put(`/preparation/syllabus/${examId}/parts/${activeItem.partId}/papers/${activeItem.paperId}/groups/${activeItem.groupId}/topics/${activeItem.topicId}`, tpForm);
      }
      closeModal(); onReload();
    } catch {} finally { setSaving(false); }
  };
  const deleteTopic = async (partId: string, paperId: string, groupId: string, id: string) => {
    if (!confirm('Delete this topic?')) return;
    try { await api.delete(`/preparation/syllabus/${examId}/parts/${partId}/papers/${paperId}/groups/${groupId}/topics/${id}`); onReload(); } catch {}
  };

  // Handlers for SubTopic
  const handleSubTopicSubmit = async (e: any) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modalType === 'addSt') {
        await api.post(`/preparation/syllabus/${examId}/parts/${activeItem.partId}/papers/${activeItem.paperId}/groups/${activeItem.groupId}/topics/${activeItem.topicId}/subtopics`, stForm);
      } else if (modalType === 'editSt') {
        await api.put(`/preparation/syllabus/${examId}/parts/${activeItem.partId}/papers/${activeItem.paperId}/groups/${activeItem.groupId}/topics/${activeItem.topicId}/subtopics/${activeItem.subTopicId}`, stForm);
      }
      closeModal(); onReload();
    } catch {} finally { setSaving(false); }
  };
  const deleteSubTopic = async (partId: string, paperId: string, groupId: string, topicId: string, id: string) => {
    if (!confirm('Delete this sub-topic?')) return;
    try { await api.delete(`/preparation/syllabus/${examId}/parts/${partId}/papers/${paperId}/groups/${groupId}/topics/${topicId}/subtopics/${id}`); onReload(); } catch {}
  };

  return (
    <div className="relative font-serif max-w-5xl mx-auto">
      <div className="prose prose-invert max-w-none text-foreground leading-relaxed">
        {parts.length === 0 && (
          <div className="text-center py-10 opacity-60">
            <BookOpen className="w-12 h-12 mx-auto mb-3" />
            <p>This syllabus is empty. Add the first part to begin.</p>
          </div>
        )}

        {/* Level 1: Parts */}
        {parts.map((part: any) => (
          <div key={part.partId} className="mb-16 relative group/part">
            <div className="border-b-2 border-primary/30 pb-2 mb-6 pr-16 relative">
              <h2 className="text-3xl font-extrabold m-0 text-white tracking-tight flex items-center gap-2">
                <FolderOpen className="w-7 h-7 text-primary/70" /> {part.name}
              </h2>
              {part.description && <p className="text-muted-foreground mt-2 text-lg italic m-0">{part.description}</p>}
              <div className="absolute right-0 top-0 opacity-0 group-hover/part:opacity-100 flex gap-1 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => { setModalType('editPart'); setActiveItem(part); setPartForm({ name: part.name, description: part.description || '' }); }}><Pencil className="w-4 h-4 text-muted-foreground" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/20" onClick={() => deletePart(part.partId)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
            </div>

            {/* Level 2: Papers */}
            <div className="pl-4 md:pl-8 space-y-12">
              {part.papers?.map((paper: any) => (
                <div key={paper.paperId} className="relative group/paper">
                  <div className="relative pr-16 mb-4">
                    <h3 className="text-2xl font-bold m-0 text-amber-400 flex items-center gap-2">
                      <FileText className="w-6 h-6 text-amber-500/50" /> {paper.name}
                    </h3>
                    {paper.description && <p className="text-base text-foreground/90 m-0 mt-1">{paper.description}</p>}
                    <div className="flex gap-2 text-xs text-muted-foreground mt-2">
                      <span className="bg-white/5 px-2 py-1 rounded">Type: {paper.typeOfExam}</span>
                      {paper.totalMarks && <span className="bg-white/5 px-2 py-1 rounded">Marks: {paper.totalMarks}</span>}
                      {paper.passMarks && <span className="bg-white/5 px-2 py-1 rounded">Pass: {paper.passMarks}</span>}
                      {paper.durationMinutes && <span className="bg-white/5 px-2 py-1 rounded">Time: {paper.durationMinutes}m</span>}
                      {paper.isOptional && <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded">Optional</span>}
                    </div>
                    <div className="absolute right-0 top-0 opacity-0 group-hover/paper:opacity-100 flex gap-1 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10" onClick={() => { setModalType('editPaper'); setActiveItem({ ...paper, partId: part.partId }); setPaperForm({ name: paper.name, description: paper.description || '', totalMarks: paper.totalMarks || '', passMarks: paper.passMarks || '', durationMinutes: paper.durationMinutes || '', isOptional: paper.isOptional || false, typeOfExam: paper.typeOfExam || 'Written' }); }}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/20" onClick={() => deletePaper(part.partId, paper.paperId)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                    </div>
                  </div>

                  {/* Level 3: Groups */}
                  <div className="pl-4 md:pl-8 space-y-8 border-l-2 border-amber-500/20">
                    {paper.groups?.map((group: any) => (
                      <div key={group.groupId} className="relative group/group pl-4">
                        <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-background border-2 border-emerald-400"></div>
                        <h4 className="text-xl font-bold m-0 text-emerald-400 flex items-center justify-between">
                          <span>{group.name} {group.marks && <span className="text-sm font-normal ml-2 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">{group.marks} marks</span>}</span>
                        </h4>
                        {group.description && <p className="text-base text-foreground/80 m-0 mt-1">{group.description}</p>}
                        
                        <div className="absolute right-0 top-0 opacity-0 group-hover/group:opacity-100 flex gap-1 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => { setModalType('editGroup'); setActiveItem({ ...group, partId: part.partId, paperId: paper.paperId }); setGroupForm({ name: group.name, description: group.description || '', marks: group.marks || '' }); }}><Pencil className="w-3 h-3 text-muted-foreground" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-500/20" onClick={() => deleteGroup(part.partId, paper.paperId, group.groupId)}><Trash2 className="w-3 h-3 text-red-400" /></Button>
                        </div>

                        {/* Level 4: Topics */}
                        <div className="pl-6 mt-4 space-y-6">
                          {group.topics?.map((topic: any) => (
                            <div key={topic.topicId} className="relative group/topic">
                              <h5 className="text-lg font-semibold m-0 text-sky-300 mb-1">{topic.name}</h5>
                              {topic.description && <p className="text-sm text-muted-foreground m-0 mb-2">{topic.description}</p>}
                              
                              <div className="absolute right-0 top-0 opacity-0 group-hover/topic:opacity-100 flex gap-1 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-white/10" onClick={() => { setModalType('editTp'); setActiveItem({ ...topic, partId: part.partId, paperId: paper.paperId, groupId: group.groupId }); setTpForm({ name: topic.name, description: topic.description || '' }); }}><Pencil className="w-3 h-3 text-muted-foreground" /></Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-500/20" onClick={() => deleteTopic(part.partId, paper.paperId, group.groupId, topic.topicId)}><Trash2 className="w-3 h-3 text-red-400" /></Button>
                              </div>

                              {/* Level 5: SubTopics */}
                              <div className="pl-4 mt-2 space-y-2 border-l border-sky-500/30">
                                {topic.subTopics?.map((st: any) => (
                                  <div key={st.subTopicId} className="relative group/subtopic pl-3">
                                    <h6 className="text-base font-medium m-0 text-foreground flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                                      {st.name}
                                    </h6>
                                    {st.description && <p className="text-xs text-muted-foreground m-0 mt-0.5 ml-3.5">{st.description}</p>}
                                    <div className="absolute right-0 top-0 opacity-0 group-hover/subtopic:opacity-100 flex gap-1 transition-opacity">
                                      <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-white/10" onClick={() => { setModalType('editSt'); setActiveItem({ ...st, partId: part.partId, paperId: paper.paperId, groupId: group.groupId, topicId: topic.topicId }); setStForm({ name: st.name, description: st.description || '' }); }}><Pencil className="w-2.5 h-2.5 text-muted-foreground" /></Button>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-500/20" onClick={() => deleteSubTopic(part.partId, paper.paperId, group.groupId, topic.topicId, st.subTopicId)}><Trash2 className="w-2.5 h-2.5 text-red-400" /></Button>
                                    </div>
                                  </div>
                                ))}
                                <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 px-2 py-1 h-auto text-xs ml-3" onClick={() => { setModalType('addSt'); setActiveItem({ partId: part.partId, paperId: paper.paperId, groupId: group.groupId, topicId: topic.topicId }); setStForm({ name: '', description: '' }); }}><Plus className="w-3 h-3 mr-1" /> Add Sub-Topic</Button>
                              </div>
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" className="text-sky-400 hover:text-sky-300 hover:bg-sky-400/10 px-2 py-1 h-auto text-xs" onClick={() => { setModalType('addTp'); setActiveItem({ partId: part.partId, paperId: paper.paperId, groupId: group.groupId }); setTpForm({ name: '', description: '' }); }}><Plus className="w-3 h-3 mr-1" /> Add Topic</Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 px-2 py-1 h-auto text-xs" onClick={() => { setModalType('addGroup'); setActiveItem({ partId: part.partId, paperId: paper.paperId }); setGroupForm({ name: '', description: '', marks: '' }); }}><Plus className="w-3 h-3 mr-1" /> Add Group</Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="border-dashed border-amber-500/30 text-amber-400 hover:text-amber-300 hover:border-amber-400 hover:bg-amber-500/10 text-sm" onClick={() => { setModalType('addPaper'); setActiveItem({ partId: part.partId }); setPaperForm({ name: '', description: '', totalMarks: '', passMarks: '', durationMinutes: '', isOptional: false, typeOfExam: 'Written' }); }}><Plus className="w-4 h-4 mr-2" /> Add Paper</Button>
            </div>
          </div>
        ))}
        
        <div className="mt-8 pt-4 border-t border-white/10">
          <Button className="w-full bg-primary text-white hover:bg-primary/90" onClick={() => { setModalType('addPart'); setPartForm({ name: '', description: '' }); }}><Plus className="w-5 h-5 mr-2" /> Add New Part</Button>
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal isOpen={modalType === 'addPart' || modalType === 'editPart'} onClose={closeModal} title={modalType === 'addPart' ? 'Add Part' : 'Edit Part'}>
        <form onSubmit={handlePartSubmit} className="space-y-4">
          <Input placeholder="Part Name *" value={partForm.name} onChange={e => setPartForm(f => ({ ...f, name: e.target.value }))} required className="bg-background border-white/10" />
          <textarea rows={3} placeholder="Description" value={partForm.description} onChange={e => setPartForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <Button type="submit" disabled={saving} className="w-full bg-primary text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Part</Button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'addPaper' || modalType === 'editPaper'} onClose={closeModal} title={modalType === 'addPaper' ? 'Add Paper' : 'Edit Paper'}>
        <form onSubmit={handlePaperSubmit} className="space-y-4">
          <Input placeholder="Paper Name *" value={paperForm.name} onChange={e => setPaperForm(f => ({ ...f, name: e.target.value }))} required className="bg-background border-white/10" />
          <textarea rows={2} placeholder="Description" value={paperForm.description} onChange={e => setPaperForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Total Marks" value={paperForm.totalMarks} onChange={e => setPaperForm(f => ({ ...f, totalMarks: e.target.value }))} className="bg-background border-white/10" />
            <Input type="number" placeholder="Pass Marks" value={paperForm.passMarks} onChange={e => setPaperForm(f => ({ ...f, passMarks: e.target.value }))} className="bg-background border-white/10" />
            <Input type="number" placeholder="Duration (min)" value={paperForm.durationMinutes} onChange={e => setPaperForm(f => ({ ...f, durationMinutes: e.target.value }))} className="bg-background border-white/10" />
            <select value={paperForm.typeOfExam} onChange={e => setPaperForm(f => ({ ...f, typeOfExam: e.target.value }))} className="bg-background border border-white/10 rounded-xl px-3 py-2 text-sm">
              <option>Written</option><option>Open Book</option><option>Practical</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-white cursor-pointer"><input type="checkbox" checked={paperForm.isOptional} onChange={e => setPaperForm(f => ({ ...f, isOptional: e.target.checked }))} className="w-4 h-4 accent-primary" /> Optional paper</label>
          <Button type="submit" disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700 text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Paper</Button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'addGroup' || modalType === 'editGroup'} onClose={closeModal} title={modalType === 'addGroup' ? 'Add Group' : 'Edit Group'}>
        <form onSubmit={handleGroupSubmit} className="space-y-4">
          <Input placeholder="Group Name *" value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} required className="bg-background border-white/10" />
          <Input type="number" placeholder="Marks" value={groupForm.marks} onChange={e => setGroupForm(f => ({ ...f, marks: e.target.value }))} className="bg-background border-white/10" />
          <textarea rows={2} placeholder="Description" value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <Button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Group</Button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'addTp' || modalType === 'editTp'} onClose={closeModal} title={modalType === 'addTp' ? 'Add Topic' : 'Edit Topic'}>
        <form onSubmit={handleTopicSubmit} className="space-y-4">
          <Input placeholder="Topic Name *" value={tpForm.name} onChange={e => setTpForm(f => ({ ...f, name: e.target.value }))} required className="bg-background border-white/10" />
          <textarea rows={3} placeholder="Description" value={tpForm.description} onChange={e => setTpForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <Button type="submit" disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700 text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Topic</Button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'addSt' || modalType === 'editSt'} onClose={closeModal} title={modalType === 'addSt' ? 'Add Sub-Topic' : 'Edit Sub-Topic'}>
        <form onSubmit={handleSubTopicSubmit} className="space-y-4">
          <Input placeholder="Sub-Topic Name *" value={stForm.name} onChange={e => setStForm(f => ({ ...f, name: e.target.value }))} required className="bg-background border-white/10" />
          <textarea rows={3} placeholder="Description" value={stForm.description} onChange={e => setStForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <Button type="submit" disabled={saving} className="w-full bg-rose-600 hover:bg-rose-700 text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Sub-Topic</Button>
        </form>
      </Modal>
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
