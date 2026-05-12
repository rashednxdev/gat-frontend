'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldAlert, Settings, Users, BookOpen, Layers, FileText, CheckSquare } from 'lucide-react';
import api from '@/lib/axios';

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ modules: 0, sections: 0, topics: 0, tasks: 0 });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user && user.role !== 'admin') router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/instructions');
      const modules = res.data;
      let sCount = 0, tCount = 0, tkCount = 0;
      modules.forEach((m: any) => {
        sCount += m.sections?.length || 0;
        m.sections?.forEach((s: any) => {
          tCount += s.topics?.length || 0;
          s.topics?.forEach((t: any) => {
            tkCount += t.tasks?.length || 0;
          });
        });
      });
      setStats({ modules: modules.length, sections: sCount, topics: tCount, tasks: tkCount });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-card/30 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-8 text-red-500">
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
          <Button variant="ghost" className="w-full justify-start hover:bg-white/5" onClick={() => router.push('/admin/users')}>
            <Users className="mr-2 w-5 h-5" /> Users
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-white/5" onClick={() => router.push('/admin/preparation')}>
            <BookOpen className="mr-2 w-5 h-5 text-primary" /> Preparation
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

      <main className="flex-1 p-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage the instructions and oversee system usage.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="glass-panel p-6 rounded-xl border-t-4 border-t-blue-500">
              <p className="text-muted-foreground text-sm font-medium">Total Modules</p>
              <p className="text-3xl font-bold mt-2">{stats.modules}</p>
            </div>
            <div className="glass-panel p-6 rounded-xl border-t-4 border-t-emerald-500">
              <p className="text-muted-foreground text-sm font-medium">Total Sections</p>
              <p className="text-3xl font-bold mt-2">{stats.sections}</p>
            </div>
            <div className="glass-panel p-6 rounded-xl border-t-4 border-t-amber-500">
              <p className="text-muted-foreground text-sm font-medium">Total Topics</p>
              <p className="text-3xl font-bold mt-2">{stats.topics}</p>
            </div>
            <div className="glass-panel p-6 rounded-xl border-t-4 border-t-purple-500">
              <p className="text-muted-foreground text-sm font-medium">Total Tasks</p>
              <p className="text-3xl font-bold mt-2">{stats.tasks}</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 mt-8">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Instructions Overview</h2>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                  onClick={() => router.push('/admin/modules')}
                >
                  Add New Module
                </Button>
             </div>
             <div className="text-center p-12 border border-dashed border-white/20 rounded-xl bg-background/30">
               <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <h3 className="text-lg font-medium">Instructions Management API is ready</h3>
               <p className="text-muted-foreground max-w-md mx-auto mt-2">
                 You can use the protected API endpoints (`/api/instructions/*`) to programmatically create and manage the training hierarchy.
               </p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
