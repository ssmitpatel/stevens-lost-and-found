import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ItemCard } from '@/components/ItemCard';
import { mockItems, mockMatches } from '@/data/mock-data';
import { Search, MapPin, TrendingUp, Clock, Plus } from 'lucide-react';

const kpis = [
  { label: 'Open Items', value: mockItems.filter(i => i.status === 'open').length, icon: Search, color: 'text-info' },
  { label: 'Pending Matches', value: mockMatches.filter(m => m.status === 'pending').length, icon: TrendingUp, color: 'text-warning' },
  { label: 'Returned This Week', value: mockItems.filter(i => i.status === 'returned').length, icon: MapPin, color: 'text-success' },
  { label: 'Avg Return Time', value: '2.3 days', icon: Clock, color: 'text-primary' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const recentItems = [...mockItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of campus lost & found activity</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/post?type=found')}>
            <MapPin className="h-3.5 w-3.5 mr-1" />Report Found
          </Button>
          <Button size="sm" onClick={() => navigate('/post?type=lost')}>
            <Plus className="h-3.5 w-3.5 mr-1" />Report Lost
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-semibold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Recent Activity</h2>
          <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => navigate('/lost')}>
            View all →
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {recentItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
