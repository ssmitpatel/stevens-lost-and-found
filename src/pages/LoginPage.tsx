import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.endsWith('@stevens.edu')) {
      setError('Please use your @stevens.edu email address.');
      return;
    }
    if (!login(email)) {
      setError('Login failed. Please try again.');
    }
  };

  const quickLogin = (email: string) => {
    setEmail(email);
    login(email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </div>
          <CardTitle className="text-xl">Stevens Lost & Found</CardTitle>
          <CardDescription>Sign in with your Stevens email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="you@stevens.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />{error}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Quick login (demo):</p>
            <div className="flex flex-col gap-1.5">
              {[
                { email: 'jdoe@stevens.edu', label: 'Student' },
                { email: 'asmith@stevens.edu', label: 'Moderator' },
                { email: 'admin@stevens.edu', label: 'Admin' },
              ].map(u => (
                <button
                  key={u.email}
                  onClick={() => quickLogin(u.email)}
                  className="text-xs text-left px-2 py-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {u.label} — {u.email}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
