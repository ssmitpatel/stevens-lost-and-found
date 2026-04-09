import { Badge } from '@/components/ui/badge';
import { ItemStatus, STATUS_LABELS } from '@/data/mock-data';
import { cn } from '@/lib/utils';

const statusStyles: Record<ItemStatus, string> = {
  open: 'bg-info/15 text-info border-info/30',
  potential_match: 'bg-warning/15 text-warning border-warning/30',
  claimed: 'bg-primary/15 text-primary border-primary/30',
  returned: 'bg-success/15 text-success border-success/30',
  closed: 'bg-muted text-muted-foreground border-border',
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <Badge variant="outline" className={cn('text-[11px] font-medium', statusStyles[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
