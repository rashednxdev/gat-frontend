'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldAlert, Settings, Users, BookOpen, Layers, FileText, CheckSquare, Search, Award } from 'lucide-react';
import api from '@/lib/axios';

export default function AdminUsersPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  
  const [usersProgress, setUsersProgress] = useState<any[]>([]);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user && user.role !== 'admin') router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [currRes, progRes] = await Promise.all([
        api.get('/curriculum'),
        api.get('/progress/all')
      ]);
      setCurriculum(currRes.data);
      setUsersProgress(progRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  const totalTasks = useMemo(() => {
    return curriculum.reduce((acc: number, mod: any) => 
      acc + (mod.sections?.reduce((sAcc: number, sec: any) => 
        sAcc + (sec.topics?.reduce((tAcc: number, top: any) => 
          tAcc + (top.tasks?.length || 0), 0) || 0), 0) || 0), 0);
  }, [curriculum]);

  const filteredUsers = useMemo(() => {
    return usersProgress.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usersProgress, searchTerm]);

  if (loading || !user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-card/30 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-8 text-blue-500 cursor-pointer" onClick={() => router.push('/admin')}>
          <ShieldAlert className="w-8 h-8" />
          <span className="text-xl font-bold">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-2">
          <Button variant="ghost" className="w-full justify-start hover:bg-white/5" onClick={() => router.push('/admin/modules')}>
            <BookOpen className="mr-2 w-5 h-5" /> Modules
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-white/5" onClick={() => router.push('/admin/sections')}>
            <Layers className="mr-2 w-5 h-5" /> Sections
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-white/5" onClick={() => router.push('/admin/topics')}>
            <FileText className="mr-2 w-5 h-5" /> Topics
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-white/5" onClick={() => router.push('/admin/tasks')}>
            <CheckSquare className="mr-2 w-5 h-5" /> Tasks
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-blue-500/10 text-blue-500" onClick={() => router.push('/admin/users')}>
            <Users className="mr-2 w-5 h-5" /> Users
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-white/5">
            <Settings className="mr-2 w-5 h-5" /> Settings
          </Button>
        </nav>
        <div className="pt-8 border-t border-white/10">
          <div className="mb-4">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">Admin</p>
          </div>
          <Button variant="destructive" className="w-full justify-start bg-red-600/20 text-red-500 hover:bg-red-600/40 border border-red-500/30" onClick={() => { logout(); router.push('/login'); }}>
            <LogOut className="mr-2 w-5 h-5" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 relative overflow-y-auto h-screen">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-extrabold mb-2">User Progress</h1>
              <p className="text-muted-foreground">Track training completion across all registered users.</p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full bg-background/50 border border-white/10 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredUsers.length === 0 ? (
               <div className="text-center p-12 border border-dashed border-white/20 rounded-xl bg-background/30">
                 <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-medium">No Users Found</h3>
               </div>
            ) : (
              filteredUsers.map((u: any) => {
                const completedCount = u.progress?.filter((p: any) => p.isRead).length || 0;
                const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
                const isComplete = percentage === 100 && totalTasks > 0;
                
                return (
                  <div key={u._id} className="glass-panel p-6 rounded-xl flex flex-col md:flex-row items-center justify-between border-l-4 border-l-blue-500 gap-6">
                    <div className="flex-1 flex items-center gap-4 w-full">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xl uppercase border border-blue-500/30 shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          {u.name}
                          {isComplete && <Award className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />}
                        </h3>
                        <p className="text-muted-foreground text-sm">{u.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full max-w-md">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Progress</span>
                        <span className={`font-bold ${isComplete ? 'text-emerald-400' : 'text-blue-400'}`}>{percentage}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-background/50 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${isComplete ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-right text-muted-foreground mt-2">
                        {completedCount} / {totalTasks} Tasks
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
