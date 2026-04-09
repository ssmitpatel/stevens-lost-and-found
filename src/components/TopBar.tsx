import { Bell, Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
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
import { mockNotifications } from '@/data/mock-data';
import type { UserRole } from '@/data/mock-data';

export function TopBar() {
  const { user, logout, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const unreadCount = mockNotifications.filter(n => n.userId === user?.id && !n.read).length;

  return (
    <header className="h-12 border-b flex items-center gap-2 px-3 bg-card shrink-0">
      <SidebarTrigger className="shrink-0" />

      <Input
        placeholder="Search items..."
        className="max-w-xs h-8 text-sm"
      />

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                {user?.name?.charAt(0) || '?'}
              </div>
              <span className="text-sm hidden sm:inline">{user?.name}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">
              {user?.email}
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">{user?.role}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Switch role (demo)</DropdownMenuLabel>
            {(['student', 'moderator', 'admin'] as UserRole[]).map(role => (
              <DropdownMenuItem key={role} onClick={() => switchRole(role)} className="text-xs capitalize">
                {role} {user?.role === role && '✓'}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-xs text-destructive">
              <LogOut className="h-3.5 w-3.5 mr-2" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
