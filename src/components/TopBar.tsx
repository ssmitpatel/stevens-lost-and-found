import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Moon, Sun, LogOut, ChevronDown, Search, Plus, X, Package, MapPin, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/hooks/use-notifications';
import { useUnreadChatCount } from '@/hooks/use-chat';
import { useItems } from '@/hooks/use-items';
import { CATEGORY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadChats = useUnreadChatCount();

  const { data: allItems = [] } = useItems();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery('');
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allItems
      .filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        CATEGORY_LABELS[i.category].toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, allItems]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const type = location.pathname.startsWith('/app/found') ? 'found' : 'lost';
    navigate(`/app/${type}?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="h-14 border-b flex items-center gap-3 px-4 bg-card/80 backdrop-blur shrink-0 sticky top-0 z-30">
      <SidebarTrigger className="shrink-0" />

      <form
        ref={containerRef as unknown as React.RefObject<HTMLFormElement>}
        onSubmit={submit}
        className="relative hidden sm:block"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query) setOpen(true); }}
          placeholder="Search items, locations, categories..."
          className="w-72 lg:w-96 h-9 pl-9 pr-9 bg-background/60 text-sm"
          aria-label="Search items"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {open && query.trim() && (
          <div className="absolute top-full mt-1 left-0 w-full z-40 bg-popover border rounded-md shadow-lg overflow-hidden">
            {suggestions.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-muted-foreground">
                No matches for "{query}"
              </div>
            ) : (
              <>
                <ul className="max-h-80 overflow-auto py-1">
                  {suggestions.map(item => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/app/item/${item.id}`);
                          setOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2.5"
                      >
                        <div className="h-8 w-8 rounded bg-muted overflow-hidden shrink-0">
                          {item.photos[0] && (
                            <img src={item.photos[0]} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                'text-[9px] font-semibold uppercase tracking-wider px-1 rounded',
                                item.type === 'lost'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-success/10 text-success',
                              )}
                            >
                              {item.type}
                            </span>
                            <span className="text-xs font-medium truncate">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-0.5"><Package className="h-2.5 w-2.5" />{CATEGORY_LABELS[item.category]}</span>
                            <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{item.location}</span>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="submit"
                  className="w-full text-left border-t px-3 py-2 text-[11px] text-primary hover:bg-accent flex items-center gap-1.5"
                >
                  <Search className="h-3 w-3" /> See all results for "{query}"
                </button>
              </>
            )}
          </div>
        )}
      </form>

      <div className="ml-auto flex items-center gap-1">
        <Button
          size="sm"
          className="hidden sm:inline-flex h-8 gap-1"
          onClick={() => navigate('/app/post?type=lost')}
        >
          <Plus className="h-3.5 w-3.5" />Report
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative"
          aria-label="Messages"
          onClick={() => navigate('/app/messages')}
        >
          <MessageSquare className="h-4 w-4" />
          {unreadChats > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-semibold ring-2 ring-card">
              {unreadChats > 9 ? '9+' : unreadChats}
            </span>
          )}
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
          )}
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-2 px-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-rose-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs font-medium">{user?.name}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{user?.role}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs">
              <div className="flex flex-col">
                <span className="font-medium">{user?.name}</span>
                <span className="text-muted-foreground font-normal">{user?.email}</span>
              </div>
              <Badge variant="secondary" className="mt-2 text-[10px] px-1.5 capitalize">{user?.role}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-xs text-destructive">
              <LogOut className="h-3.5 w-3.5 mr-2" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
