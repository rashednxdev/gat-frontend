'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LogOut, ShieldAlert, Settings, Users, BookOpen, Edit, Trash2, Plus, Layers, FileText, CheckSquare } from 'lucide-react';
import api from '@/lib/axios';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function AdminSectionsPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({ title: '', description: '', order: '', module: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user && user.role !== 'admin') router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchModules();
    }
  }, [user]);

  const fetchModules = async () => {
    try {
      const res = await api.get('/instructions');
      setModules(res.data);
    } catch (err) {
      console.error('Failed to fetch modules', err);
    }
  };

  const sections = useMemo(() => {
    return modules.flatMap(mod => 
      (mod.sections || []).map((sec: any) => ({
        ...sec,
        moduleName: mod.title,
        moduleId: mod._id
      }))
    ).sort((a, b) => a.order - b.order); // Sort by order globally, or you could group by module
  }, [modules]);

  const openCreateDialog = () => {
    setEditingSection(null);
    setFormData({ title: '', description: '', order: '', module: modules[0]?._id || '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (sec: any) => {
    setEditingSection(sec);
    setFormData({ 
      title: sec.title, 
      description: sec.description || '', 
      order: sec.order || '', 
      module: sec.moduleId || '' 
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.module) {
      alert('Please select a parent module.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSection) {
        await api.put(`/instructions/sections/${editingSection._id}`, formData);
      } else {
        await api.post('/instructions/sections', formData);
      }
      setIsDialogOpen(false);
      fetchModules(); // Refresh list
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section? This action cannot be undone.')) return;
    try {
      await api.delete(`/instructions/sections/${id}`);
      fetchModules();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete section');
    }
  };

  if (loading || !user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-card/30 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-8 text-emerald-500 cursor-pointer" onClick={() => router.push('/admin')}>
          <ShieldAlert className="w-8 h-8" />
          <span className="text-xl font-bold">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-2">
          <Button variant="ghost" className="w-full justify-start hover:bg-white/5" onClick={() => router.push('/admin/modules')}>
            <BookOpen className="mr-2 w-5 h-5" /> Modules
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-emerald-500/10 text-emerald-500" onClick={() => router.push('/admin/sections')}>
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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-extrabold mb-2">Sections</h1>
              <p className="text-muted-foreground">Manage sections within your instructions modules.</p>
            </div>
            <Button 
              onClick={openCreateDialog}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            >
              <Plus className="mr-2 w-4 h-4" /> Add Section
            </Button>
          </div>

          <div className="space-y-4">
            {sections.length === 0 ? (
               <div className="text-center p-12 border border-dashed border-white/20 rounded-xl bg-background/30">
                 <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-medium">No Sections Found</h3>
                 <p className="text-muted-foreground mt-2">Create your first section. Make sure you have created at least one Module first!</p>
               </div>
            ) : (
              sections.map((sec: any) => (
                <div key={sec._id} className="glass-panel p-6 rounded-xl flex items-start justify-between border-l-4 border-l-emerald-500">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Module: {sec.moduleName}</span>
                    </div>
                    <h3 className="text-xl font-bold">{sec.title} <span className="text-sm font-normal text-muted-foreground bg-white/5 px-2 py-0.5 rounded ml-2">Order: {sec.order}</span></h3>
                    <div 
                      className="text-muted-foreground mt-2 max-w-none [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5" 
                      dangerouslySetInnerHTML={{ __html: sec.description || 'No description provided.' }} 
                    />
                    <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                      <span>{sec.topics?.length || 0} Topics</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(sec)}>
                      <Edit className="w-4 h-4 text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(sec._id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'Add New Section'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            
            <div className="space-y-2">
              <Label htmlFor="module">Parent Module</Label>
              <select 
                id="module"
                value={formData.module}
                onChange={(e) => setFormData({...formData, module: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>Select a module...</option>
                {modules.map(mod => (
                  <option key={mod._id} value={mod._id}>{mod.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Section Title</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Fundamental Principles"
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <div className="bg-background rounded-md text-foreground border border-input [&_.ql-editor]:min-h-[150px] [&_.ql-toolbar]:bg-muted/50 [&_.ql-toolbar]:border-none [&_.ql-container]:border-none [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:rounded-b-md [&_.ql-stroke]:stroke-foreground [&_.ql-fill]:fill-foreground [&_.ql-picker]:text-foreground">
                <ReactQuill 
                  theme="snow" 
                  value={formData.description} 
                  onChange={(value) => setFormData({...formData, description: value})} 
                  placeholder="Detailed description of this section"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input 
                id="order" 
                type="number"
                value={formData.order} 
                onChange={(e) => setFormData({...formData, order: e.target.value})} 
                placeholder="1"
                required 
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? 'Saving...' : 'Save Section'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
