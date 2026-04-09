import { mockItems, mockClaims, mockUsers, STATUS_LABELS, CATEGORY_LABELS } from '@/data/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, X } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Shield className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">You don't have access to this page.</p>
      </div>
    );
  }

  const pendingClaims = mockClaims.filter(c => c.status === 'pending');
  const flaggedItems = mockItems.filter(i => i.status === 'open');

  const stats = [
    { label: 'Total Items', value: mockItems.length },
    { label: 'Pending Claims', value: pendingClaims.length },
    { label: 'Open Items', value: flaggedItems.length },
    { label: 'Returned', value: mockItems.filter(i => i.status === 'returned').length },
  ];

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
            {mockItems.map(item => {
              const reporter = mockUsers.find(u => u.id === item.reporterId);
              return (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => navigate(`/item/${item.id}`)}>
                  <TableCell className="text-xs font-medium">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'lost' ? 'destructive' : 'default'} className="text-[10px] uppercase px-1.5 py-0">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{CATEGORY_LABELS[item.category]}</TableCell>
                  <TableCell className="text-xs">{item.location}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell className="text-xs">{reporter?.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.success('Item approved')}>
                        <Check className="h-3.5 w-3.5 text-success" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.success('Item closed')}>
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
