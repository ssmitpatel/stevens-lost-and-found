import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ItemCard } from '@/components/ItemCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockItems, ItemType, ItemCategory, ItemStatus, CATEGORY_LABELS, STATUS_LABELS, CAMPUS_LOCATIONS } from '@/data/mock-data';
import { Plus, X } from 'lucide-react';

interface ItemFeedProps {
  type: ItemType;
}

export default function ItemFeedPage({ type }: ItemFeedProps) {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');

  const items = useMemo(() => {
    return mockItems
      .filter(i => i.type === type)
      .filter(i => category === 'all' || i.category === category)
      .filter(i => status === 'all' || i.status === status)
      .filter(i => location === 'all' || i.location === location)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [type, category, status, location]);

  const hasFilters = category !== 'all' || status !== 'all' || location !== 'all';

  const clearFilters = () => {
    setCategory('all');
    setStatus('all');
    setLocation('all');
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">{type === 'lost' ? 'Lost Items' : 'Found Items'}</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate(`/post?type=${type}`)}>
          <Plus className="h-3.5 w-3.5 mr-1" />Report {type === 'lost' ? 'Lost' : 'Found'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 sticky top-0 bg-background py-2 z-10">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {CAMPUS_LOCATIONS.map(loc => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" />Clear
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={`No ${type} items found`}
          description={hasFilters ? 'Try adjusting your filters.' : `No reported ${type} items yet today.`}
          actionLabel={`Report ${type === 'lost' ? 'Lost' : 'Found'} Item`}
          onAction={() => navigate(`/post?type=${type}`)}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
