import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, ShieldCheck, Target } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6 px-8 border-b border-white/10 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              GovAcc Training
            </h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-white/5">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="max-w-4xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight">
            Master Government <br />
            <span className="bg-gradient-to-r from-blue-400 via-primary to-emerald-400 bg-clip-text text-transparent">
              Accounting Standards
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A structured, role-based platform designed to guide you through complex regulatory processes step-by-step.
          </p>
          
          <div className="flex justify-center gap-6 pt-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all">
                Start Learning <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto z-10 relative">
          {[
            { icon: BookOpen, title: "Structured Curriculum", desc: "Follow a clear hierarchy: Modules → Sections → Topics → Tasks." },
            { icon: Target, title: "Progress Tracking", desc: "Keep track of your completed tasks with visual indicators." },
            { icon: ShieldCheck, title: "Role-Based Access", desc: "Secure environment with distinct admin and user roles." }
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center space-y-4 hover:scale-105 transition-transform duration-300">
              <div className="p-4 bg-primary/10 rounded-full">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
      
      <footer className="py-8 border-t border-white/10 text-center text-muted-foreground text-sm z-10 relative">
        <p>&copy; {new Date().getFullYear()} Government Accounting Task Training System. All rights reserved.</p>
      </footer>
    </div>
  );
}
