'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LogOut, ShieldAlert, Settings, Users, BookOpen, Edit, Trash2, Plus, Layers, FileText, CheckSquare, Link as LinkIcon, FileBadge } from 'lucide-react';
import api from '@/lib/axios';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function AdminTasksPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  
  const [formData, setFormData] = useState({ 
    title: '', 
    instructions: '', 
    order: '', 
    topic: '',
    requiredDocumentsStr: '',
    regulatoryReferencesStr: ''
  });
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
      console.error('Failed to fetch instructions', err);
    }
  };

  const tasks = useMemo(() => {
    return modules.flatMap(mod => 
      (mod.sections || []).flatMap((sec: any) => 
        (sec.topics || []).flatMap((top: any) => 
          (top.tasks || []).map((tsk: any) => ({
            ...tsk,
            topicName: top.title,
            sectionName: sec.title,
            moduleName: mod.title,
            topicId: top._id
          }))
        )
      )
    ).sort((a, b) => a.order - b.order);
  }, [modules]);

  const openCreateDialog = () => {
    setEditingTask(null);
    let defaultTopic = '';
    for (let m of modules) {
      for (let s of (m.sections || [])) {
        if (s.topics && s.topics.length > 0) {
          defaultTopic = s.topics[0]._id;
          break;
        }
      }
      if (defaultTopic) break;
    }
    setFormData({ 
      title: '', 
      instructions: '', 
      order: '', 
      topic: defaultTopic,
      requiredDocumentsStr: '',
      regulatoryReferencesStr: ''
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (tsk: any) => {
    setEditingTask(tsk);
    setFormData({ 
      title: tsk.title, 
      instructions: tsk.instructions || '', 
      order: tsk.order || '', 
      topic: tsk.topicId || '',
      requiredDocumentsStr: (tsk.requiredDocuments || []).join(', '),
      regulatoryReferencesStr: (tsk.regulatoryReferences || []).join(', ')
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic) {
      alert('Please select a parent topic.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: formData.title,
      instructions: formData.instructions,
      order: formData.order,
      topic: formData.topic,
      requiredDocuments: formData.requiredDocumentsStr.split(',').map(s => s.trim()).filter(s => s),
      regulatoryReferences: formData.regulatoryReferencesStr.split(',').map(s => s.trim()).filter(s => s)
    };

    try {
      if (editingTask) {
        await api.put(`/instructions/tasks/${editingTask._id}`, payload);
      } else {
        await api.post('/instructions/tasks', payload);
      }
      setIsDialogOpen(false);
      fetchModules(); 
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
    try {
      await api.delete(`/instructions/tasks/${id}`);
      fetchModules();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete task');
    }
  };

  if (loading || !user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-white/10 bg-card/30 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-8 text-purple-500 cursor-pointer" onClick={() => router.push('/admin')}>
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
          <Button variant="ghost" className="w-full justify-start bg-purple-500/10 text-purple-500" onClick={() => router.push('/admin/tasks')}>
            <CheckSquare className="mr-2 w-5 h-5" /> Tasks
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-white/5" onClick={() => router.push('/admin/users')}>
            <Users className="mr-2 w-5 h-5" /> Users
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

      <main className="flex-1 p-8 relative overflow-y-auto h-screen">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-extrabold mb-2">Tasks</h1>
              <p className="text-muted-foreground">Manage the lowest-level tasks and their instructions.</p>
            </div>
            <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]">
              <Plus className="mr-2 w-4 h-4" /> Add Task
            </Button>
          </div>

          <div className="space-y-4">
            {tasks.length === 0 ? (
               <div className="text-center p-12 border border-dashed border-white/20 rounded-xl bg-background/30">
                 <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-medium">No Tasks Found</h3>
                 <p className="text-muted-foreground mt-2">Create your first task. Ensure you have Topics created first.</p>
               </div>
            ) : (
              tasks.map((tsk: any) => (
                <div key={tsk._id} className="glass-panel p-6 rounded-xl flex items-start justify-between border-l-4 border-l-purple-500">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                        {tsk.moduleName} / {tsk.sectionName} / {tsk.topicName}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold">{tsk.title} <span className="text-sm font-normal text-muted-foreground bg-white/5 px-2 py-0.5 rounded ml-2">Order: {tsk.order}</span></h3>
                    
                    <div className="text-muted-foreground mt-2 max-w-none [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5" dangerouslySetInnerHTML={{ __html: tsk.instructions || 'No instructions provided.' }} />
                    
                    {(tsk.requiredDocuments?.length > 0 || tsk.regulatoryReferences?.length > 0) && (
                      <div className="mt-4 pt-4 border-t border-white/5 grid md:grid-cols-2 gap-4">
                        {tsk.requiredDocuments?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-purple-300 flex items-center mb-2"><FileBadge className="w-4 h-4 mr-1" /> Required Documents</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {tsk.requiredDocuments.map((doc: string, idx: number) => <li key={idx} className="flex items-center before:content-['•'] before:mr-2 before:text-purple-500">{doc}</li>)}
                            </ul>
                          </div>
                        )}
                        {tsk.regulatoryReferences?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-blue-300 flex items-center mb-2"><LinkIcon className="w-4 h-4 mr-1" /> Regulatory References</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {tsk.regulatoryReferences.map((ref: string, idx: number) => <li key={idx} className="flex items-center before:content-['•'] before:mr-2 before:text-blue-500">{ref}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(tsk)}>
                      <Edit className="w-4 h-4 text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tsk._id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            
            <div className="space-y-2">
              <Label htmlFor="topic">Parent Topic</Label>
              <select 
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>Select a topic...</option>
                {modules.map(mod => 
                  (mod.sections || []).map((sec: any) => (
                    <optgroup key={`sec-${sec._id}`} label={`${mod.title} / ${sec.title}`}>
                      {(sec.topics || []).map((top: any) => (
                        <option key={top._id} value={top._id}>{top.title}</option>
                      ))}
                    </optgroup>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <div className="bg-background rounded-md text-foreground border border-input [&_.ql-editor]:min-h-[150px] [&_.ql-toolbar]:bg-muted/50 [&_.ql-toolbar]:border-none [&_.ql-container]:border-none [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:rounded-b-md [&_.ql-stroke]:stroke-foreground [&_.ql-fill]:fill-foreground [&_.ql-picker]:text-foreground">
                <ReactQuill 
                  theme="snow" 
                  value={formData.instructions} 
                  onChange={(value) => setFormData({...formData, instructions: value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="docs">Required Documents</Label>
                <Input 
                  id="docs" 
                  value={formData.requiredDocumentsStr} 
                  onChange={(e) => setFormData({...formData, requiredDocumentsStr: e.target.value})} 
                  placeholder="e.g. ID Card, Form A1 (comma separated)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refs">Regulatory References</Label>
                <Input 
                  id="refs" 
                  value={formData.regulatoryReferencesStr} 
                  onChange={(e) => setFormData({...formData, regulatoryReferencesStr: e.target.value})} 
                  placeholder="e.g. Sec 5.2.1, Rule 9 (comma separated)"
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
                required 
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                {isSubmitting ? 'Saving...' : 'Save Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
