import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ItemCard } from '@/components/ItemCard';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import mapLight from '@/assets/map/campus_map_light.png';
import mapDark from '@/assets/map/campus_map_dark.png';
import {
  mockItems,
  CATEGORY_LABELS,
  ItemCategory,
  ItemType,
} from '@/data/mock-data';

type BuildingKey =
  | 'Babbio Center'
  | 'Edwin A. Stevens Hall'
  | 'Burchard Building'
  | 'McLean Hall'
  | 'Palmer Hall'
  | 'Morton-Peirce-Kidde Complex'
  | 'Howe Center'
  | 'Library'
  | 'Student Center'
  | 'Schaefer Athletic Center'
  | 'Gateway Academic Center'
  | 'Campus Quad'
  | 'Castle Point Lookout'
  | 'River Terrace';

interface BuildingPin {
  key: BuildingKey;
  short: string;
  x: number;
  y: number;
}

// Coordinates are percentages of the campus_map_*.png aspect (2241×1587).
// (x, y) = center of each building's rooftop as seen on the aerial illustration.
const BUILDINGS: BuildingPin[] = [
  { key: 'Schaefer Athletic Center', short: 'Schaefer', x: 55, y: 78 },
  { key: 'McLean Hall', short: 'McLean', x: 78, y: 68 },
  { key: 'Morton-Peirce-Kidde Complex', short: 'Morton', x: 50, y: 55 },
  { key: 'Burchard Building', short: 'Burchard', x: 58, y: 38 },
  { key: 'Campus Quad', short: 'Quad', x: 48, y: 46 },
  { key: 'Palmer Hall', short: 'Palmer', x: 30, y: 45 },
  { key: 'Edwin A. Stevens Hall', short: 'EAS', x: 46, y: 52 },
  { key: 'Howe Center', short: 'Howe', x: 52, y: 42 },
  { key: 'Babbio Center', short: 'Babbio', x: 72, y: 58 },
  { key: 'River Terrace', short: 'River', x: 88, y: 50 },
  { key: 'Library', short: 'Library', x: 55, y: 57 },
  { key: 'Student Center', short: 'Student Ctr', x: 35, y: 52 },
  { key: 'Gateway Academic Center', short: 'Gateway', x: 28, y: 36 },
  { key: 'Castle Point Lookout', short: 'Castle Point', x: 55, y: 22 },
];

export default function CampusMapPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [typeFilter, setTypeFilter] = useState<'all' | ItemType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ItemCategory>('all');
  const [activeBuilding, setActiveBuilding] = useState<BuildingKey | null>(null);

  const filteredItems = useMemo(() => {
    return mockItems
      .filter(i => typeFilter === 'all' || i.type === typeFilter)
      .filter(i => categoryFilter === 'all' || i.category === categoryFilter);
  }, [typeFilter, categoryFilter]);

  const itemsByBuilding = useMemo(() => {
    const map = new Map<BuildingKey, { lost: number; found: number }>();
    for (const b of BUILDINGS) map.set(b.key, { lost: 0, found: 0 });
    for (const item of filteredItems) {
      const bucket = map.get(item.location as BuildingKey);
      if (!bucket) continue;
      if (item.type === 'lost') bucket.lost += 1;
      else bucket.found += 1;
    }
    return map;
  }, [filteredItems]);

  const visibleItems = useMemo(() => {
    if (!activeBuilding) return filteredItems;
    return filteredItems.filter(i => i.location === activeBuilding);
  }, [filteredItems, activeBuilding]);

  const totalLost = filteredItems.filter(i => i.type === 'lost').length;
  const totalFound = filteredItems.filter(i => i.type === 'found').length;

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Campus Map
          </h1>
          <p className="text-sm text-muted-foreground">
            See exactly where items were lost or found across campus.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
            <span className="font-medium">{totalLost}</span>
            <span className="text-muted-foreground">lost</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="font-medium">{totalFound}</span>
            <span className="text-muted-foreground">found</span>
          </span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mr-1">
            Type
          </span>
          {(['all', 'lost', 'found'] as const).map(t => (
            <Chip
              key={t}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'all' ? 'All' : t === 'lost' ? 'Lost' : 'Found'}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mr-1">
            Category
          </span>
          <Chip
            active={categoryFilter === 'all'}
            onClick={() => setCategoryFilter('all')}
          >
            All
          </Chip>
          {(Object.keys(CATEGORY_LABELS) as ItemCategory[]).map(cat => (
            <Chip
              key={cat}
              active={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </Chip>
          ))}
        </div>
      </div>

      {/* Map */}
      <Card className="overflow-hidden border-border/60">
        <CardContent className="p-0">
          <div
            className="relative w-full"
            style={{ aspectRatio: '2241 / 1587' }}
            aria-label="Stevens campus map"
          >
            {/* Theme-aware map backdrop */}
            <img
              src={theme === 'dark' ? mapDark : mapLight}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover object-bottom select-none pointer-events-none"
              draggable={false}
            />

            {/* Building pins */}
            {BUILDINGS.map(b => {
              const counts = itemsByBuilding.get(b.key)!;
              const total = counts.lost + counts.found;
              const isActive = activeBuilding === b.key;
              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() =>
                    setActiveBuilding(prev => (prev === b.key ? null : b.key))
                  }
                  className={cn(
                    'absolute -translate-x-1/2 -translate-y-full flex flex-col items-center group focus:outline-none',
                  )}
                  style={{ left: `${b.x}%`, top: `${b.y}%` }}
                  aria-pressed={isActive}
                  aria-label={`${b.key}: ${counts.lost} lost, ${counts.found} found`}
                >
                  {/* Counts cluster above pin */}
                  {total > 0 && (
                    <div className="flex gap-1 mb-1">
                      {counts.lost > 0 && (
                        <span className="px-1.5 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                          {counts.lost}
                        </span>
                      )}
                      {counts.found > 0 && (
                        <span className="px-1.5 h-4 min-w-4 rounded-full bg-success text-success-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                          {counts.found}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Pin */}
                  <span
                    className={cn(
                      'relative flex items-center justify-center h-7 w-7 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.45)] ring-[3px] ring-white transition-transform',
                      'group-hover:scale-110 group-focus:scale-110',
                      isActive
                        ? 'bg-primary text-primary-foreground scale-110'
                        : total > 0
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white text-foreground',
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5" fill="currentColor" />
                  </span>
                  {/* Label */}
                  <span
                    className={cn(
                      'mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap',
                      'bg-background/85 backdrop-blur-sm border border-border/60 shadow-sm',
                      isActive && 'border-primary/60 text-primary',
                    )}
                  >
                    {b.short}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-4 py-2.5 border-t bg-muted/30 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-destructive" />
              Lost reports
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-success" />
              Found reports
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              Click a pin to see items there
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Details panel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm">
            <h2 className="font-semibold">
              {activeBuilding ? activeBuilding : 'All locations'}
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          {activeBuilding && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveBuilding(null)}
            >
              Clear pin
            </Button>
          )}
        </div>

        {visibleItems.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5 text-muted-foreground" />}
            title="No items match"
            description={
              activeBuilding
                ? 'No items reported at this building with the current filters.'
                : 'Try changing the filters above.'
            }
            actionLabel={activeBuilding ? 'View nearby pins' : undefined}
            onAction={activeBuilding ? () => setActiveBuilding(null) : undefined}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => navigate('/app/lost')}
          >
            Browse all items <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Chip({
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
