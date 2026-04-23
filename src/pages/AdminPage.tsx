import { useItems, useUpdateItemStatus } from '@/hooks/use-items';
import { useClaims } from '@/hooks/use-claims';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { CATEGORY_LABELS } from '@/lib/constants';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchProfile } from '@/lib/supabase-data';
import type { User } from '@/lib/constants';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: items = [], isLoading: itemsLoading } = useItems({ includeClosed: true });
  const { data: claims = [] } = useClaims();
  const updateStatus = useUpdateItemStatus();

  // Fetch all reporter profiles
  const [profiles, setProfiles] = useState<Map<string, User>>(new Map());
  useEffect(() => {
    const reporterIds = [...new Set(items.map(i => i.reporterId))];
    Promise.all(reporterIds.map(async id => {
      const p = await fetchProfile(id);
      return p ? [id, p] as const : null;
    })).then(results => {
      const map = new Map<string, User>();
      for (const r of results) {
        if (r) map.set(r[0], r[1]);
      }
      setProfiles(map);
    });
  }, [items]);

  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Shield className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">You don't have access to this page.</p>
      </div>
    );
  }

  if (itemsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const flaggedItems = items.filter(i => i.status === 'open');

  const stats = [
    { label: 'Total Items', value: items.length },
    { label: 'Pending Claims', value: pendingClaims.length },
    { label: 'Open Items', value: flaggedItems.length },
    { label: 'Returned', value: items.filter(i => i.status === 'returned').length },
  ];

  const handleApprove = (id: string) => {
    updateStatus.mutate(
      { id, status: 'returned' },
      {
        onSuccess: () => toast.success('Item approved'),
        onError: () => toast.error('Failed to update item'),
      },
    );
  };

  const handleClose = (id: string) => {
    updateStatus.mutate(
      { id, status: 'closed' },
      {
        onSuccess: () => toast.success('Item closed'),
        onError: () => toast.error('Failed to update item'),
      },
    );
  };

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-xl font-semibold mb-1">Moderation Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-4">Review and manage reported items</p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-sm font-medium mb-2">All Items</h2>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Title</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Reporter</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => {
              const reporter = profiles.get(item.reporterId);
              return (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => navigate(`/app/item/${item.id}`)}>
                  <TableCell className="text-xs font-medium">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'lost' ? 'destructive' : 'default'} className="text-[10px] uppercase px-1.5 py-0">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{CATEGORY_LABELS[item.category]}</TableCell>
                  <TableCell className="text-xs">{item.location}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell className="text-xs">{reporter?.name ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleApprove(item.id)}>
                        <Check className="h-3.5 w-3.5 text-success" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleClose(item.id)}>
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
