
'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Circle, LogOut, LayoutDashboard, FileText, ChevronRight, Search, Loader2, BookOpen, FolderOpen, BookMarked, Hash, Bookmark, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'instructions' | 'books' | 'syllabus'>('instructions');

  // Instructions State
  const [instructions, setInstructions] = useState([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [openModules, setOpenModules] = useState<string[]>([]);
  
  // Preparation State
  const [books, setBooks] = useState<any[]>([]);
  const [syllabusList, setSyllabusList] = useState<any[]>([]);
  const [prepProgress, setPrepProgress] = useState<any[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user?.role === 'admin') router.push('/admin');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch();
      } else {
        setSearchResults(null);
        setShowSearchDropdown(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.results);
      setShowSearchDropdown(true);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (moduleId: string, targetId: string) => {
    setActiveTab('instructions');
    setShowSearchDropdown(false);
    setSearchQuery('');
    
    // Open the module accordion
    if (!openModules.includes(`mod-${moduleId}`)) {
      setOpenModules(prev => [...prev, `mod-${moduleId}`]);
    }
    
    // Scroll to the item after a short delay
    setTimeout(() => {
      const element = document.getElementById(`item-${targetId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-primary/20', 'transition-all', 'duration-1000');
        setTimeout(() => element.classList.remove('bg-primary/20'), 3000);
      }
    }, 300);
  };

  const fetchData = async () => {
    try {
      const [currRes, progRes, booksRes, syllRes, prepProgRes] = await Promise.all([
        api.get('/instructions'),
        api.get('/progress'),
        api.get('/preparation/books-tools?includeChapters=true'),
        api.get('/preparation/syllabus?includeParts=true'),
        api.get('/preparation/progress')
      ]);
      setInstructions(currRes.data);
      setProgress(progRes.data);
      setBooks(booksRes.data.filter((b: any) => b.isActive));
      setSyllabusList(syllRes.data.filter((s: any) => s.isActive));
      setPrepProgress(prepProgRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  const toggleTaskProgress = async (taskId: string, currentStatus: boolean) => {
    try {
      await api.put(`/progress/${taskId}`, { isRead: !currentStatus });
      fetchData(); // Refresh progress
    } catch (err) {
      console.error('Failed to update progress', err);
    }
  };

  const isTaskCompleted = (taskId: string) => {
    const p = progress.find(pr => pr.task === taskId);
    return p ? p.isRead : false;
  };

  const totalTasks = instructions.reduce((acc: number, mod: any) => acc + (mod.sections?.reduce((sAcc: number, sec: any) => sAcc + (sec.topics?.reduce((tAcc: number, top: any) => tAcc + (top.tasks?.length || 0), 0) || 0), 0) || 0), 0);
  const completedTasks = progress.filter(p => p.isRead).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalBookTopics = books.reduce((acc: number, book: any) => acc + (book.chapters?.reduce((cAcc: number, ch: any) => cAcc + (ch.topics?.length || 0), 0) || 0), 0);
  const completedBookTopics = prepProgress.filter(p => p.progressType === 'book' && p.status === 'completed').length;
  const bookProgressPercentage = totalBookTopics > 0 ? Math.round((completedBookTopics / totalBookTopics) * 100) : 0;

  const totalSyllabusSubTopics = syllabusList.reduce((acc: number, exam: any) => acc + (exam.parts?.reduce((pAcc: number, part: any) => pAcc + (part.papers?.reduce((papAcc: number, paper: any) => papAcc + (paper.groups?.reduce((gAcc: number, group: any) => gAcc + (group.topics?.reduce((tAcc: number, topic: any) => tAcc + (topic.subTopics?.length || 0), 0) || 0), 0) || 0), 0) || 0), 0) || 0), 0);
  const completedSyllabusSubTopics = prepProgress.filter(p => p.progressType === 'syllabus' && p.status === 'completed').length;
  const syllabusProgressPercentage = totalSyllabusSubTopics > 0 ? Math.round((completedSyllabusSubTopics / totalSyllabusSubTopics) * 100) : 0;

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-card/30 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-8">
          <LayoutDashboard className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">Dashboard</span>
        </div>
        <nav className="flex-1 space-y-4">
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('instructions')}
              className={`w-full justify-start ${activeTab === 'instructions' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <FileText className="mr-2 w-5 h-5" /> Instructions
            </Button>
          </div>
          
          <div className="space-y-1">
            <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preparation</h4>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('books')}
              className={`w-full justify-start pl-8 ${activeTab === 'books' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <BookMarked className="mr-2 w-4 h-4" /> Books & Tools
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('syllabus')}
              className={`w-full justify-start pl-8 ${activeTab === 'syllabus' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <Bookmark className="mr-2 w-4 h-4" /> Syllabus
            </Button>
          </div>
        </nav>
        <div className="pt-8 border-t border-white/10">
          <div className="mb-4">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Button variant="destructive" className="w-full justify-start bg-destructive/20 hover:bg-destructive/40 text-destructive-foreground border border-destructive/30" onClick={() => { logout(); router.push('/login'); }}>
            <LogOut className="mr-2 w-5 h-5" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <header className="md:hidden flex justify-between items-center mb-8 pb-4 border-b border-white/10">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Button variant="ghost" size="icon" onClick={() => { logout(); router.push('/login'); }}>
              <LogOut className="w-5 h-5 text-destructive" />
            </Button>
          </header>

          {/* Mobile Tabs */}
          <div className="md:hidden flex gap-2 flex-wrap border-b border-white/10 pb-4">
            <Button size="sm" variant={activeTab === 'instructions' ? 'default' : 'secondary'} onClick={() => setActiveTab('instructions')}>Instructions</Button>
            <Button size="sm" variant={activeTab === 'books' ? 'default' : 'secondary'} onClick={() => setActiveTab('books')}>Books & Tools</Button>
            <Button size="sm" variant={activeTab === 'syllabus' ? 'default' : 'secondary'} onClick={() => setActiveTab('syllabus')}>Syllabus</Button>
          </div>

          <div>
            <h1 className="text-4xl font-extrabold mb-2">Welcome, {user.name}</h1>
            <p className="text-muted-foreground">Continue your government accounting training below.</p>
          </div>

          {/* Universal Search Field */}
          <div className="relative z-50">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isSearching ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" /> : <Search className="h-5 w-5 text-muted-foreground" />}
              </div>
              <Input 
                type="text" 
                placeholder="Search across modules, sections, topics, and tasks..." 
                className="pl-10 h-12 bg-card/50 border-white/10 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults) setShowSearchDropdown(true); }}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              />
            </div>
            
            {showSearchDropdown && searchResults && (
              <div className="absolute mt-2 w-full bg-card border border-white/10 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
                {searchResults.modules?.length === 0 && searchResults.sections?.length === 0 && searchResults.topics?.length === 0 && searchResults.tasks?.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No results found for "{searchQuery}"</div>
                ) : (
                  <div className="py-2">
                    {/* Search results mapping (same as before) */}
                    {searchResults.modules?.length > 0 && (
                      <div className="px-3 py-2">
                        <h4 className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-2 px-2">Modules</h4>
                        {searchResults.modules.map((item: any) => (
                          <div key={item._id} onClick={() => handleResultClick(item._id, item._id)} className="px-2 py-2 hover:bg-white/5 rounded-md cursor-pointer transition-colors">
                            <p className="font-medium text-sm">{item.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.sections?.length > 0 && (
                      <div className="px-3 py-2 border-t border-white/5">
                        <h4 className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-2 px-2">Sections</h4>
                        {searchResults.sections.map((item: any) => (
                          <div key={item._id} onClick={() => handleResultClick(item.module?._id || item.module, item._id)} className="px-2 py-2 hover:bg-white/5 rounded-md cursor-pointer transition-colors">
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">in {item.module?.title || 'Unknown Module'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.topics?.length > 0 && (
                      <div className="px-3 py-2 border-t border-white/5">
                        <h4 className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-2 px-2">Topics</h4>
                        {searchResults.topics.map((item: any) => (
                          <div key={item._id} onClick={() => handleResultClick(item.section?.module?._id || item.section?.module, item._id)} className="px-2 py-2 hover:bg-white/5 rounded-md cursor-pointer transition-colors">
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">in {item.section?.title || 'Unknown Section'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.tasks?.length > 0 && (
                      <div className="px-3 py-2 border-t border-white/5">
                        <h4 className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-2 px-2">Tasks</h4>
                        {searchResults.tasks.map((item: any) => (
                          <div key={item._id} onClick={() => handleResultClick(item.topic?.section?.module?._id || item.topic?.section?.module, item._id)} className="px-2 py-2 hover:bg-white/5 rounded-md cursor-pointer transition-colors">
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">in {item.topic?.title || 'Unknown Topic'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Overview (All Categories) */}
          <div className="glass-panel p-6 rounded-2xl space-y-6 border-t-4 border-t-primary">
            <h3 className="text-xl font-bold">Overall Progress</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Instructions Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <h4 className="font-semibold text-muted-foreground">Instructions</h4>
                  <span className="text-primary font-bold">{progressPercentage}%</span>
                </div>
                <div className="h-3 w-full bg-background/50 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {completedTasks} / {totalTasks} tasks
                </p>
              </div>

              {/* Books Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <h4 className="font-semibold text-muted-foreground">Books & Tools</h4>
                  <span className="text-emerald-400 font-bold">{bookProgressPercentage}%</span>
                </div>
                <div className="h-3 w-full bg-background/50 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${bookProgressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {completedBookTopics} / {totalBookTopics} topics
                </p>
              </div>

              {/* Syllabus Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <h4 className="font-semibold text-muted-foreground">Syllabus</h4>
                  <span className="text-amber-400 font-bold">{syllabusProgressPercentage}%</span>
                </div>
                <div className="h-3 w-full bg-background/50 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${syllabusProgressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {completedSyllabusSubTopics} / {totalSyllabusSubTopics} sub-topics
                </p>
              </div>
            </div>
          </div>

          {activeTab === 'instructions' && (
            <>
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FileText className="mr-3 w-6 h-6 text-primary" /> Training Modules
                </h2>
                
                <Accordion type="multiple" value={openModules} onValueChange={setOpenModules} className="space-y-4">
                  {instructions.map((module: any) => (
                    <AccordionItem value={`mod-${module._id}`} key={module._id} id={`item-${module._id}`} className="border border-white/10 rounded-xl px-4 bg-background/40 data-[state=open]:bg-primary/5 transition-colors">
                      <AccordionTrigger className="hover:no-underline text-lg font-semibold py-4">
                        {module.title}
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-4 pl-4 border-l-2 border-primary/20 ml-2">
                        {module.sections?.map((section: any) => (
                          <div key={section._id} id={`item-${section._id}`} className="space-y-3 p-1 rounded-md">
                            <h4 className="font-semibold text-primary/80 flex items-center text-base">
                              <ChevronRight className="w-4 h-4 mr-1" /> {section.title}
                            </h4>
                            <div className="space-y-4 pl-6 border-l border-white/10 ml-2">
                              {section.topics?.map((topic: any) => (
                                <div key={topic._id} id={`item-${topic._id}`} className="bg-card/40 rounded-lg p-4 border border-white/5">
                                  <h5 className="font-medium mb-3">{topic.title}</h5>
                                  <div className="space-y-2">
                                    {topic.tasks?.map((task: any) => {
                                      const completed = isTaskCompleted(task._id);
                                      return (
                                        <div key={task._id} id={`item-${task._id}`} className={`flex flex-col p-4 rounded-md transition-colors ${completed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-background/50 hover:bg-background/80'}`}>
                                          <div>
                                            <p className={`font-medium ${completed ? 'text-emerald-400' : ''}`}>{task.title}</p>
                                            {task.instructions && (
                                              <div 
                                                className="text-sm text-muted-foreground mt-2 max-w-none [&>p]:mb-1 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4" 
                                                dangerouslySetInnerHTML={{ __html: task.instructions }} 
                                              />
                                            )}
                                          </div>
                                          <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                                            <Button 
                                              size="sm"
                                              variant={completed ? "outline" : "default"} 
                                              className={completed ? "border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                                              onClick={() => toggleTaskProgress(task._id, completed)}
                                            >
                                              {completed ? (
                                                <><CheckCircle2 className="w-4 h-4 mr-2" /> Completed</>
                                              ) : (
                                                "I have understand."
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  {instructions.length === 0 && <p className="text-muted-foreground text-center py-8">No instructions modules available yet.</p>}
                </Accordion>
              </div>
            </>
          )}

          {activeTab === 'books' && (
            <UserBooksView books={books} prepProgress={prepProgress} onReload={fetchData} />
          )}

          {activeTab === 'syllabus' && (
            <UserSyllabusView syllabusList={syllabusList} prepProgress={prepProgress} onReload={fetchData} />
          )}

        </div>
      </main>
    </div>
  );
}

// ── Topic Questions Viewer ───────────────────────────────────────────────────
function TopicQuestionsViewer({ topicId }: { topicId: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'MCQ' | 'Written' | 'Practical' | 'TrueFalse'>('MCQ');
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/preparation/questions?topicId=${topicId}&active=true`);
        setQuestions(res.data);
        
        // Auto-select first tab that has questions if MCQ is empty
        const types = ['MCQ', 'Written', 'Practical', 'TrueFalse'];
        for (const type of types) {
          if (res.data.some((q: any) => q.questionType === type)) {
            setActiveTab(type as any);
            break;
          }
        }
      } catch (err) {
        console.error('Failed to load questions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [topicId]);

  const toggleAnswer = (id: string) => setShowAnswers(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (questions.length === 0) return <div className="p-4 text-center text-muted-foreground text-sm mt-4 border border-white/5 rounded-xl bg-black/20">No questions found for this topic.</div>;

  const filtered = questions.filter(q => q.questionType === activeTab);
  const tabs = [
    { id: 'MCQ', label: 'MCQ' },
    { id: 'Written', label: 'Written' },
    { id: 'Practical', label: 'Practical' },
    { id: 'TrueFalse', label: 'True / False' }
  ];

  return (
    <div className="mt-4 border border-white/10 rounded-xl bg-black/20 overflow-hidden font-sans">
      <div className="flex overflow-x-auto border-b border-white/10 bg-white/5">
        {tabs.map(t => {
          const count = questions.filter(q => q.questionType === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === t.id ? 'border-b-2 border-primary text-primary bg-primary/10' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
            >
              {t.label} <span className="ml-2 text-xs bg-black/30 px-2 py-0.5 rounded-full">{count}</span>
            </button>
          );
        })}
      </div>
      
      <div className="p-4 md:p-6 space-y-6 max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No {activeTab} questions available.</p>
        ) : (
          filtered.map((q, idx) => (
            <div key={q._id} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h5 className="font-bold text-foreground text-base m-0 leading-relaxed">
                  <span className="text-primary mr-2">Q{idx + 1}.</span> {q.mainQuestion}
                </h5>
                <span className="shrink-0 text-xs font-semibold bg-white/10 px-2 py-1 rounded text-muted-foreground">
                  {q.difficulty} · {q.defaultMark} pts
                </span>
              </div>

              {(q.questionType === 'MCQ' || q.questionType === 'TrueFalse') && q.options && q.options.length > 0 && (
                <div className="space-y-2 mb-4 pl-6">
                  {q.options.map((opt: string, i: number) => (
                    <div key={i} className={`p-3 rounded-lg border text-sm transition-colors ${showAnswers[q._id] && opt === q.correctAnswer ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' : 'bg-background/50 border-white/5'}`}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>
              )}

              {(q.questionType === 'Written' || q.questionType === 'Practical') && q.subQuestions && q.subQuestions.length > 0 && (
                <div className="space-y-4 mb-4 pl-6 border-l-2 border-primary/20">
                  {q.subQuestions.map((sq: any, i: number) => (
                    <div key={i} className="bg-background/40 p-4 rounded-lg border border-white/5">
                      <p className="text-sm font-semibold m-0 mb-2">{String.fromCharCode(97 + i)}) {sq.subText} <span className="text-xs text-muted-foreground ml-2">[{sq.subMark} marks]</span></p>
                      {showAnswers[q._id] && (
                        <div className="mt-3 p-3 bg-white/5 rounded border border-white/10 text-sm text-emerald-200/90 whitespace-pre-wrap">
                          <strong>Answer:</strong> {sq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/10">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleAnswer(q._id)}
                  className="text-xs text-muted-foreground hover:text-white"
                >
                  <Eye className="w-4 h-4 mr-2" /> {showAnswers[q._id] ? 'Hide Answer' : 'Show Answer'}
                </Button>

                {showAnswers[q._id] && (q.questionType === 'MCQ' || q.questionType === 'TrueFalse') && (
                  <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
                    <p className="font-bold text-emerald-400 mb-1 m-0">Correct Answer: {q.correctAnswer}</p>
                    {q.explanation && <p className="text-emerald-100/80 mt-2 m-0">{q.explanation}</p>}
                  </div>
                )}
                {showAnswers[q._id] && (q.questionType === 'Written' || q.questionType === 'Practical') && q.explanation && (
                  <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                    <p className="font-bold text-blue-400 mb-1 m-0">Explanation / Notes:</p>
                    <p className="text-blue-100/80 mt-2 m-0">{q.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── User Books & Tools View ───────────────────────────────────────────────────
function UserBooksView({ books, prepProgress, onReload }: { books: any[], prepProgress: any[], onReload: () => void }) {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [openTopicQuestions, setOpenTopicQuestions] = useState<string | null>(null);

  const isTopicCompleted = (topicId: string) => {
    return prepProgress.some(p => p.targetId === topicId && p.progressType === 'book' && p.status === 'completed');
  };

  const markCompleted = async (book: any, topicId: string) => {
    try {
      await api.post('/preparation/progress/mark', {
        part: book.part,
        progressType: 'book',
        targetId: topicId,
        targetType: 'bookTopic',
        status: 'completed'
      });
      onReload();
    } catch (err: any) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.message || err.message);
    }
  };

  if (!selectedBookId) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {books.map((b: any) => (
          <div key={b._id} onClick={() => setSelectedBookId(b._id)} className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors border border-white/10 hover:border-primary/50 group">
            <BookMarked className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-xl mb-1">{b.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{b.author ? `By ${b.author}` : ''} · Part {b.part}</p>
            {b.description && <p className="text-sm text-white/70 line-clamp-2">{b.description}</p>}
          </div>
        ))}
        {books.length === 0 && <p className="col-span-2 text-center text-muted-foreground py-10">No books available.</p>}
      </div>
    );
  }

  const book = books.find(b => b._id === selectedBookId);
  if (!book) return null;

  return (
    <div className="glass-panel rounded-2xl p-8">
      <Button variant="ghost" onClick={() => setSelectedBookId(null)} className="mb-6 -ml-4 text-muted-foreground hover:text-white">
        &larr; Back to Books list
      </Button>
      
      <div className="mb-10 pb-6 border-b border-white/10">
        <h2 className="text-3xl font-extrabold text-white mb-2">{book.name}</h2>
        <p className="text-muted-foreground">{book.author ? `By ${book.author}` : ''} · {book.edition ? `${book.edition} Edition` : ''} · Part {book.part}</p>
        {book.description && <p className="mt-4 text-lg text-white/80">{book.description}</p>}
      </div>

      <div className="font-serif prose prose-invert max-w-none text-foreground leading-relaxed space-y-12">
        {book.chapters?.map((ch: any) => (
          <div key={ch.chapterId} className="relative">
            <h3 className="text-2xl font-extrabold m-0 text-white tracking-tight mb-4 border-b border-primary/30 pb-2">
              {ch.chapterNumber ? <span className="text-primary/70 mr-2">Chapter {ch.chapterNumber}:</span> : ''} {ch.title}
            </h3>
            {ch.description && <p className="text-muted-foreground text-lg italic">{ch.description}</p>}

            <div className="pl-4 md:pl-8 space-y-10 mt-6">
              {ch.topics?.map((tp: any) => {
                const completed = isTopicCompleted(tp.topicId);
                return (
                  <div key={tp.topicId} className={`relative p-6 rounded-2xl transition-colors border ${completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                    <h4 className="text-xl font-bold m-0 text-emerald-400 mb-3 flex items-center gap-2">
                      <Hash className="w-5 h-5 text-emerald-500/50" /> {tp.title}
                    </h4>
                    {tp.details?.content && <p className="text-base text-foreground/90 m-0 mb-4 whitespace-pre-line">{tp.details.content}</p>}
                    
                    <div className="pl-6 md:pl-8 mt-4 space-y-4 border-l-2 border-emerald-500/20">
                      {tp.subTopics?.map((st: any) => (
                        <div key={st.subTopicId} className="relative pl-4">
                          <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-background border-2 border-sky-400"></div>
                          <h5 className="text-lg font-bold m-0 text-sky-300 mb-1">{st.title}</h5>
                          {st.details?.content && <p className="text-base text-foreground/80 m-0 mb-2 whitespace-pre-line">{st.details.content}</p>}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
                      <Button 
                        onClick={() => setOpenTopicQuestions(prev => prev === tp.topicId ? null : tp.topicId)}
                        variant="secondary"
                        className="bg-white/10 hover:bg-white/20 text-white"
                      >
                        <FileText className="w-4 h-4 mr-2" /> {openTopicQuestions === tp.topicId ? 'Hide Questions' : 'Questions'}
                      </Button>
                      <Button 
                        onClick={() => !completed && markCompleted(book, tp.topicId)}
                        disabled={completed}
                        variant={completed ? "outline" : "default"}
                        className={completed ? "border-emerald-500/50 text-emerald-500 disabled:opacity-100" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                      >
                        {completed ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Acknowledged</> : "I have understand."}
                      </Button>
                    </div>

                    {openTopicQuestions === tp.topicId && (
                      <TopicQuestionsViewer topicId={tp.topicId} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {(!book.chapters || book.chapters.length === 0) && <p className="text-muted-foreground italic text-center">Content coming soon.</p>}
      </div>
    </div>
  );
}

// ── User Syllabus View ────────────────────────────────────────────────────────
function UserSyllabusView({ syllabusList, prepProgress, onReload }: { syllabusList: any[], prepProgress: any[], onReload: () => void }) {
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  const isSubTopicCompleted = (subTopicId: string) => {
    return prepProgress.some(p => p.targetId === subTopicId && p.progressType === 'syllabus' && p.status === 'completed');
  };

  const toggleSubTopicCompleted = async (partId: string, subTopicId: string, currentStatus: boolean) => {
    try {
      await api.post('/preparation/progress/mark', {
        part: partId,
        progressType: 'syllabus',
        targetId: subTopicId,
        targetType: 'syllabusSubTopic',
        status: currentStatus ? 'not_started' : 'completed'
      });
      onReload();
    } catch (err: any) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.message || err.message);
    }
  };

  if (!selectedExamId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Select Exam Syllabus</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {syllabusList.map((exam: any) => (
            <div key={exam._id} onClick={() => setSelectedExamId(exam._id)} className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors border border-white/10 hover:border-primary/50">
              <Bookmark className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-1">{exam.name}</h3>
              <p className="text-sm text-muted-foreground">{exam.organizedBy || ''}{exam.version ? ` · v${exam.version}` : ''}</p>
            </div>
          ))}
          {syllabusList.length === 0 && <p className="col-span-2 text-center text-muted-foreground py-10">No syllabus available.</p>}
        </div>
      </div>
    );
  }

  const exam = syllabusList.find(e => e._id === selectedExamId);
  if (!exam) return null;

  if (!selectedPartId) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedExamId(null)} className="-ml-4 text-muted-foreground hover:text-white">
          &larr; Back to Exams
        </Button>
        <h2 className="text-3xl font-bold text-white mb-2">{exam.name} Syllabus</h2>
        <p className="text-muted-foreground mb-6">Select a part to continue</p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {exam.parts?.map((part: any) => (
            <div key={part.partId} onClick={() => setSelectedPartId(part.partId)} className="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors border border-white/10 hover:border-primary/50">
              <FolderOpen className="w-8 h-8 text-yellow-400/80 mb-4" />
              <h3 className="font-bold text-xl mb-1">{part.name}</h3>
              {part.description && <p className="text-sm text-white/70 line-clamp-2">{part.description}</p>}
            </div>
          ))}
          {(!exam.parts || exam.parts.length === 0) && <p className="col-span-2 text-muted-foreground">No parts available.</p>}
        </div>
      </div>
    );
  }

  const part = exam.parts.find((p: any) => p.partId === selectedPartId);
  if (!part) return null;

  return (
    <div className="glass-panel rounded-2xl p-8">
      <Button variant="ghost" onClick={() => setSelectedPartId(null)} className="mb-6 -ml-4 text-muted-foreground hover:text-white">
        &larr; Back to Parts
      </Button>
      
      <div className="mb-10 pb-6 border-b border-primary/30">
        <h2 className="text-3xl font-extrabold text-white mb-2">{part.name}</h2>
        {part.description && <p className="text-lg text-muted-foreground italic">{part.description}</p>}
      </div>

      <div className="font-serif prose prose-invert max-w-none text-foreground leading-relaxed space-y-16">
        {part.papers?.map((paper: any) => (
          <div key={paper.paperId} className="relative">
            <h3 className="text-2xl font-bold m-0 text-amber-400 flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-amber-500/50" /> {paper.name}
            </h3>
            
            <div className="pl-4 md:pl-8 space-y-12 border-l-2 border-amber-500/20">
              {paper.groups?.map((group: any) => (
                <div key={group.groupId} className="relative pl-4">
                  <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-background border-2 border-emerald-400"></div>
                  <h4 className="text-xl font-bold m-0 text-emerald-400 mb-4">{group.name} {group.marks && <span className="text-sm font-normal ml-2 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">{group.marks} marks</span>}</h4>
                  
                  <div className="pl-6 space-y-8">
                    {group.topics?.map((topic: any) => {
                      return (
                        <div key={topic.topicId} className="relative p-6 rounded-2xl transition-colors border bg-white/5 border-white/5">
                          <h5 className="text-lg font-semibold m-0 text-sky-300 mb-3">{topic.name}</h5>
                          {topic.description && <p className="text-sm text-foreground/80 m-0 mb-4">{topic.description}</p>}
                          
                          <div className="pl-4 mt-2 space-y-4 border-l border-sky-500/30">
                            {topic.subTopics?.map((st: any) => {
                              const completed = isSubTopicCompleted(st.subTopicId);
                              return (
                                <div key={st.subTopicId} className={`relative pl-4 py-3 pr-4 rounded-xl flex items-start justify-between gap-4 transition-colors ${completed ? 'bg-emerald-500/10' : 'hover:bg-white/5'}`}>
                                  <div>
                                    <h6 className="text-base font-medium m-0 text-foreground flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${completed ? 'bg-emerald-400' : 'bg-rose-400'}`} /> {st.name}
                                    </h6>
                                    {st.description && <p className="text-xs text-muted-foreground m-0 mt-1 ml-4">{st.description}</p>}
                                  </div>
                                  <div className="shrink-0 flex items-center pt-1">
                                    <button
                                      onClick={() => toggleSubTopicCompleted(part.partId, st.subTopicId, completed)}
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${completed ? 'bg-emerald-500' : 'bg-white/20'}`}
                                      aria-pressed={completed}
                                    >
                                      <span className="sr-only">Toggle completion</span>
                                      <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${completed ? 'translate-x-6' : 'translate-x-1'}`}
                                      />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
