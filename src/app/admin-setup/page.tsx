'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function AdminSetup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureCode, setSecureCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/admin-register', { name, email, password, secureCode });
      login(res.data.token, res.data);
      router.push('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Admin registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md glass-panel border-red-500/20 relative z-10">
        <CardHeader className="space-y-3 items-center text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6 text-red-500" />
          </div>
          <CardTitle className="text-3xl font-bold">Admin Setup</CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Register a new administrator account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">{error}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="secureCode" className="text-red-400">Secure Code</Label>
              <Input 
                id="secureCode" type="password" required 
                value={secureCode} onChange={(e) => setSecureCode(e.target.value)}
                className="bg-background/50 border-red-500/30 focus-visible:ring-red-500 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" required 
                value={name} onChange={(e) => setName(e.target.value)}
                className="bg-background/50 border-white/10 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" type="email" required 
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-white/10 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" type="password" required 
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-white/10 h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] mt-4" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
              Create Admin
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
