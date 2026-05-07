'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.token, res.data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md glass-panel border-white/10 relative z-10">
        <CardHeader className="space-y-3 items-center text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Start your learning journey today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" placeholder="John Doe" required 
                value={name} onChange={(e) => setName(e.target.value)}
                className="bg-background/50 border-white/10 focus-visible:ring-primary h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" type="email" placeholder="john@example.com" required 
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-white/10 focus-visible:ring-primary h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" type="password" required 
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-white/10 focus-visible:ring-primary h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all mt-4" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
              Register
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-white/5 pt-6 mt-2">
          <p className="text-muted-foreground text-sm">
            Already have an account? <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
