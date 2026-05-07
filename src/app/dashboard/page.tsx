'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Circle, LogOut, LayoutDashboard, FileText, ChevronRight, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [curriculum, setCurriculum] = useState([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [openModules, setOpenModules] = useState<string[]>([]);
  
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
    setShowSearchDropdown(false);
    setSearchQuery('');
    
    // Open the module accordion
    if (!openModules.includes(`mod-${moduleId}`)) {
      setOpenModules(prev => [...prev, `mod-${moduleId}`]);
    }
    
    // Scroll to the item after a short delay to allow accordion to animate open
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
      const [currRes, progRes] = await Promise.all([
        api.get('/curriculum'),
        api.get('/progress')
      ]);
      setCurriculum(currRes.data);
      setProgress(progRes.data);
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

  const totalTasks = curriculum.reduce((acc: number, mod: any) => acc + (mod.sections?.reduce((sAcc: number, sec: any) => sAcc + (sec.topics?.reduce((tAcc: number, top: any) => tAcc + (top.tasks?.length || 0), 0) || 0), 0) || 0), 0);
  const completedTasks = progress.filter(p => p.isRead).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-card/30 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-8">
          <LayoutDashboard className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">Dashboard</span>
        </div>
        <nav className="flex-1 space-y-2">
          <Button variant="ghost" className="w-full justify-start bg-primary/10 text-primary">
            <FileText className="mr-2 w-5 h-5" /> Curriculum
          </Button>
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

          <div>
            <h1 className="text-4xl font-extrabold mb-2">Welcome, {user.name}</h1>
            <p className="text-muted-foreground">Continue your government accounting training below.</p>
          </div>

          {/* Progress Overview */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 border-t-4 border-t-emerald-500">
            <div className="flex-1 w-full">
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-lg font-bold">Overall Progress</h3>
                <span className="text-emerald-400 font-bold text-xl">{progressPercentage}%</span>
              </div>
              <div className="h-4 w-full bg-background/50 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                You have completed {completedTasks} out of {totalTasks} tasks.
              </p>
            </div>
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

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FileText className="mr-3 w-6 h-6 text-primary" /> Training Modules
            </h2>
            
            <Accordion type="multiple" value={openModules} onValueChange={setOpenModules} className="space-y-4">
              {curriculum.map((module: any) => (
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
                                        {(task.requiredDocuments?.length > 0 || task.regulatoryReferences?.length > 0) && (
                                          <div className="mt-3 pt-3 border-t border-white/5 grid md:grid-cols-2 gap-4">
                                            {task.requiredDocuments?.length > 0 && (
                                              <div>
                                                <h4 className="text-xs font-semibold text-primary/80 mb-1">Required Documents</h4>
                                                <ul className="text-xs text-muted-foreground space-y-1">
                                                  {task.requiredDocuments.map((doc: string, idx: number) => <li key={idx} className="flex items-center before:content-['•'] before:mr-2 before:text-primary/50">{doc}</li>)}
                                                </ul>
                                              </div>
                                            )}
                                            {task.regulatoryReferences?.length > 0 && (
                                              <div>
                                                <h4 className="text-xs font-semibold text-blue-300 mb-1">Regulatory References</h4>
                                                <ul className="text-xs text-muted-foreground space-y-1">
                                                  {task.regulatoryReferences.map((ref: string, idx: number) => <li key={idx} className="flex items-center before:content-['•'] before:mr-2 before:text-blue-500">{ref}</li>)}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
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
              {curriculum.length === 0 && <p className="text-muted-foreground text-center py-8">No curriculum modules available yet.</p>}
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}
