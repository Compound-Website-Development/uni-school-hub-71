import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import npsLogo from "@/assets/nps-logo.png";
import {
  BarChart2,
  ClipboardCheck,
  CreditCard,
  FileText,
  Megaphone,
  Smartphone,
  ArrowRight,
  Users,
  Settings,
  Zap,
} from "lucide-react";

const features = [
  { icon: BarChart2, title: "Result Management", desc: "Upload and access academic results easily" },
  { icon: ClipboardCheck, title: "Attendance Tracking", desc: "Mark and monitor student attendance" },
  { icon: CreditCard, title: "Fee Management", desc: "Track school fee payments in real-time" },
  { icon: FileText, title: "CBT Examinations", desc: "Conduct computer-based tests online" },
  { icon: Megaphone, title: "Announcements", desc: "Broadcast news to students and staff" },
  { icon: Smartphone, title: "Mobile Friendly", desc: "Works on any device, anywhere" },
];

const steps = [
  { num: "01", icon: Users, title: "Register", desc: "Create your school account in minutes" },
  { num: "02", icon: Settings, title: "Set Up School", desc: "Add classes, subjects, and staff" },
  { num: "03", icon: Zap, title: "Go Live", desc: "Start managing your school instantly" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary border-b border-primary/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src={npsLogo} alt="NPS Logo" className="h-10 w-auto" />
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-pattern-dots opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <img src={npsLogo} alt="Nigerian Private Schools" className="h-16 md:h-20 mx-auto mb-8 animate-fade-in" />
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary-foreground leading-tight animate-fade-up">
            Manage Your School.<br />
            <span className="text-accent">Empower Every Student.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto animate-fade-up animation-delay-100">
            A complete school management platform built for Nigerian private schools. Results, attendance, fees, and more — all in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animation-delay-200">
            <Link to="/login">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-lg px-8 py-6">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">Everything Your School Needs</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Powerful tools designed specifically for Nigerian private schools</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="group card-hover border-border bg-card rounded-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <f.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-6 shadow-glow">
                  <s.icon className="w-10 h-10 text-primary-foreground" />
                </div>
                <span className="text-sm font-bold text-accent">STEP {s.num}</span>
                <h3 className="text-xl font-bold text-foreground mt-2 mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-hero relative">
        <div className="absolute inset-0 bg-pattern-dots opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary-foreground mb-6">Ready to Transform Your School?</h2>
          <p className="text-lg text-primary-foreground/80 mb-10 max-w-2xl mx-auto">Join hundreds of Nigerian private schools already using our platform.</p>
          <Link to="/login">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg px-10 py-6 shadow-lg hover:scale-[1.02] transition-all">
              Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src={npsLogo} alt="NPS" className="h-7 w-auto brightness-0 invert" />
            <div className="flex items-center gap-6 text-sm text-background/60">
              <Link to="/login" className="hover:text-background transition-colors">Sign In</Link>
              <Link to="/apply" className="hover:text-background transition-colors">Apply</Link>
            </div>
            <p className="text-sm text-background/50">Built for Nigerian Schools 🇳🇬</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
