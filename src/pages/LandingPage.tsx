import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search, MapPin, GitCompare, Shield, Sparkles, ArrowRight,
  Package, Users, Clock, CheckCircle2, Mail, Bell, Moon, Sun,
} from 'lucide-react';
import { mockItems, mockUsers, CAMPUS_LOCATIONS } from '@/data/mock-data';
import { useTheme } from '@/contexts/ThemeContext';

const features = [
  {
    icon: Search,
    title: 'Report Lost Items',
    description: 'Quickly post what you lost with photos, category, and location — the whole campus can help you find it.',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  },
  {
    icon: MapPin,
    title: 'Log Found Items',
    description: 'Found something? Post it in seconds and help a fellow Stevens student get their belongings back.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    icon: GitCompare,
    title: 'Smart Matching',
    description: 'We automatically suggest potential matches between lost and found items based on category, time, and location.',
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  },
  {
    icon: Shield,
    title: 'Verified & Safe',
    description: 'Only verified @stevens.edu emails can sign up. Moderators review sensitive claims before handover.',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    icon: Bell,
    title: 'Real-time Alerts',
    description: 'Get notified the moment someone posts a found item that might match yours. No refreshing required.',
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  },
  {
    icon: Mail,
    title: 'Private Messaging',
    description: 'Connect with the finder or owner through in-app messages — no need to share personal contact info.',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  },
];

const steps = [
  { n: '01', title: 'Sign up with your Stevens email', desc: 'Create your account in seconds using your @stevens.edu address.' },
  { n: '02', title: 'Post a lost or found item', desc: 'Add a title, photo, category, and last-seen location.' },
  { n: '03', title: 'Get matched & reunited', desc: 'Review suggested matches, chat, verify, and close the loop.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const stats = [
    { label: 'Items Reunited', value: mockItems.filter(i => i.status === 'returned').length + 142, icon: CheckCircle2 },
    { label: 'Active Listings', value: mockItems.filter(i => i.status === 'open').length + 38, icon: Package },
    { label: 'Campus Spots', value: CAMPUS_LOCATIONS.length, icon: MapPin },
    { label: 'Members', value: mockUsers.length + 1248, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-sm hidden sm:inline">Stevens Lost &amp; Found</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Campus</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log in</Button>
            <Button size="sm" onClick={() => navigate('/signup')}>
              Sign up <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-10 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-40 right-0 h-80 w-80 rounded-full bg-info/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-success/10 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Made for Stevens Institute of Technology
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Lost something on campus?
            <br />
            <span className="bg-gradient-to-r from-primary via-rose-500 to-amber-500 bg-clip-text text-transparent">
              Let&apos;s find it together.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Stevens Lost &amp; Found connects students, faculty, and staff across campus — so a lost
            backpack, ID, or laptop finds its way home fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="h-11 px-6" onClick={() => navigate('/signup')}>
              Get started free <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-6" onClick={() => navigate('/login')}>
              I already have an account
            </Button>
          </div>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {stats.map(s => (
              <Card key={s.label} className="border-border/60">
                <CardContent className="p-4 text-center">
                  <s.icon className="h-4 w-4 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{s.value.toLocaleString()}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Everything you need to reunite with your stuff</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Purpose-built for campus life. From quick posting to smart matches, we cover the whole journey.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <Card key={f.title} className="group hover:shadow-lg hover:-translate-y-0.5 transition-all border-border/60">
              <CardContent className="p-6">
                <div className={`h-10 w-10 rounded-lg ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-muted/40 border-y">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">How it works</h2>
            <p className="text-muted-foreground">Three simple steps from lost to found.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map((s, idx) => (
              <div key={s.n} className="relative">
                <Card className="h-full border-border/60">
                  <CardContent className="p-6">
                    <div className="text-5xl font-bold text-primary/20 mb-2">{s.n}</div>
                    <h3 className="font-semibold mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
                {idx < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus locations */}
      <section id="stats" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Every corner of campus, covered</h2>
          <p className="text-muted-foreground">From Babbio to the Castle Point Lookout — we&apos;ve got the map memorized.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
          {CAMPUS_LOCATIONS.map(loc => (
            <div key={loc} className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs shadow-sm hover:shadow-md hover:border-primary/40 transition-all">
              <MapPin className="h-3 w-3 text-primary" />
              {loc}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          <Clock className="h-3 w-3 inline mr-1" />Interactive campus map coming soon
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-info/10">
          <CardContent className="p-10 sm:p-14 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Ready to find what&apos;s yours?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join hundreds of Stevens students already using Lost &amp; Found to reconnect with their belongings.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="h-11 px-6" onClick={() => navigate('/signup')}>
                Create your account
              </Button>
              <Button size="lg" variant="outline" className="h-11 px-6" onClick={() => navigate('/login')}>
                Log in
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[10px]">S</span>
            </div>
            <span>Stevens Lost &amp; Found — a campus community project</span>
          </div>
          <div>© {new Date().getFullYear()} Stevens Institute of Technology</div>
        </div>
      </footer>
    </div>
  );
}
