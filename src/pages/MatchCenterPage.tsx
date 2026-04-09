import { mockMatches, mockItems } from '@/data/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { GitCompare } from 'lucide-react';

export default function MatchCenterPage() {
  const navigate = useNavigate();

  if (mockMatches.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Match Center</h1>
        <EmptyState
          title="No matches yet"
          description="When lost and found items are similar, they'll appear here as potential matches."
          icon={<GitCompare className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold mb-1">Match Center</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {mockMatches.length} potential {mockMatches.length === 1 ? 'match' : 'matches'}
      </p>

      <div className="space-y-3">
        {mockMatches.map(match => {
          const lost = mockItems.find(i => i.id === match.lostItemId);
          const found = mockItems.find(i => i.id === match.foundItemId);
          if (!lost || !found) return null;

          return (
            <Card key={match.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">{match.score}% match</Badge>
                  <Badge variant={match.status === 'pending' ? 'outline' : 'default'} className="text-xs capitalize">{match.status}</Badge>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge variant="destructive" className="text-[10px] uppercase px-1.5 py-0">Lost</Badge>
                      <StatusBadge status={lost.status} />
                    </div>
                    <p className="text-sm font-medium">{lost.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{lost.location} · {lost.date.split('T')[0]}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge className="text-[10px] uppercase px-1.5 py-0">Found</Badge>
                      <StatusBadge status={found.status} />
                    </div>
                    <p className="text-sm font-medium">{found.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{found.location} · {found.date.split('T')[0]}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3 mb-3">{match.reason}</p>

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => navigate(`/item/${lost.id}`)}>Review Lost Item</Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/item/${found.id}`)}>Review Found Item</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
