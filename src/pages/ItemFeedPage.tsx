import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ItemCard } from '@/components/ItemCard';
import { ItemCardSkeleton } from '@/components/ItemCardSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useItems } from '@/hooks/use-items';
import { CATEGORY_LABELS, STATUS_LABELS, CAMPUS_LOCATIONS } from '@/lib/constants';
import type { ItemType, ItemCategory } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Plus, X, Tag, Search } from 'lucide-react';

interface ItemFeedProps {
  type: ItemType;
}

export default function ItemFeedPage({ type }: ItemFeedProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q')?.trim() ?? '';
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');

  const { data: allItems = [], isLoading } = useItems({ type });

  const items = useMemo(() => {
    const needle = q.toLowerCase();
    return allItems
      .filter(i => category === 'all' || i.category === category)
      .filter(i => status === 'all' || i.status === status)
      .filter(i => location === 'all' || i.location === location)
      .filter(i => {
        if (!needle) return true;
        return (
          i.title.toLowerCase().includes(needle) ||
          i.description.toLowerCase().includes(needle) ||
          i.location.toLowerCase().includes(needle) ||
          CATEGORY_LABELS[i.category].toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [allItems, category, status, location, q]);

  const hasFilters = category !== 'all' || status !== 'all' || location !== 'all' || q !== '';

  const clearFilters = () => {
    setCategory('all');
    setStatus('all');
    setLocation('all');
    if (q) {
      const next = new URLSearchParams(searchParams);
      next.delete('q');
      setSearchParams(next, { replace: true });
    }
  };

  const clearQuery = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">{type === 'lost' ? 'Lost Items' : 'Found Items'}</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
            {q && <> matching "<span className="font-medium text-foreground">{q}</span>"</>}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate(`/app/post?type=${type}`)}>
          <Plus className="h-3.5 w-3.5 mr-1" />Report {type === 'lost' ? 'Lost' : 'Found'}
        </Button>
      </div>

      {q && (
        <div className="mb-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs">
          <Search className="h-3 w-3" />
          <span>Search: "{q}"</span>
          <button
            type="button"
            aria-label="Clear search query"
            onClick={clearQuery}
            className="inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-primary/20"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Quick category chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <Tag className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
        <CategoryChip
          active={category === 'all'}
          onClick={() => setCategory('all')}
        >
          All
        </CategoryChip>
        {(Object.keys(CATEGORY_LABELS) as ItemCategory[]).map(cat => (
          <CategoryChip
            key={cat}
            active={category === cat}
            onClick={() => setCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </CategoryChip>
        ))}
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

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <ItemCardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={`No ${type} items found`}
          description={hasFilters ? 'Try adjusting your filters.' : `No reported ${type} items yet today.`}
          actionLabel={`Report ${type === 'lost' ? 'Lost' : 'Found'} Item`}
          onAction={() => navigate(`/app/post?type=${type}`)}
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

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-7 px-2.5 rounded-full text-[11px] font-medium border transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-background text-foreground border-border hover:bg-accent',
      )}
    >
      {children}
    </button>
  );
}
