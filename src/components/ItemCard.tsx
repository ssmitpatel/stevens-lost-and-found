import { MapPin, Clock, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Item, CATEGORY_LABELS } from '@/data/mock-data';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function ItemCard({ item }: { item: Item }) {
  const navigate = useNavigate();
  const thumbnail = item.photos[0];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
      onClick={() => navigate(`/item/${item.id}`)}
    >
      {thumbnail && (
        <div className="h-36 w-full overflow-hidden bg-muted">
          <img src={thumbnail} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Badge variant={item.type === 'lost' ? 'destructive' : 'default'} className="text-[10px] uppercase tracking-wider px-1.5 py-0">
              {item.type}
            </Badge>
            <StatusBadge status={item.status} />
          </div>
        </div>

        <h3 className="font-medium text-sm mb-1 line-clamp-1">{item.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.description}</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />{CATEGORY_LABELS[item.category]}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />{item.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />{format(parseISO(item.date), 'MMM d, h:mm a')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
