import { useParams, useNavigate } from 'react-router-dom';
import { mockItems, mockMatches, mockUsers, CATEGORY_LABELS, STATUS_LABELS } from '@/data/mock-data';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Clock, Package, User, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claimOpen, setClaimOpen] = useState(false);
  const item = mockItems.find(i => i.id === id);

  if (!item) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
        </Button>
        <p className="mt-8 text-center text-muted-foreground">Item not found.</p>
      </div>
    );
  }

  const reporter = mockUsers.find(u => u.id === item.reporterId);
  const relatedMatches = mockMatches.filter(m => m.lostItemId === item.id || m.foundItemId === item.id);

  const statusSteps = ['open', 'potential_match', 'claimed', 'returned'] as const;
  const currentStepIndex = statusSteps.indexOf(item.status as any);

  const handleClaim = () => {
    toast.success('Claim submitted! The finder will review your answers.');
    setClaimOpen(false);
  };

  return (
    <div className="p-6 max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
      </Button>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={item.type === 'lost' ? 'destructive' : 'default'} className="text-[10px] uppercase tracking-wider px-1.5 py-0">
                {item.type}
              </Badge>
              <StatusBadge status={item.status} />
            </div>
            <h1 className="text-xl font-semibold">{item.title}</h1>
          </div>
          {item.type === 'found' && item.status === 'open' && (
            <Button size="sm" onClick={() => setClaimOpen(true)}>Claim This Item</Button>
          )}
        </div>

        {/* Status stepper */}
        <div className="flex items-center gap-1">
          {statusSteps.map((step, idx) => (
            <div key={step} className="flex items-center gap-1 flex-1">
              <div className={`h-2 flex-1 rounded-full ${idx <= currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
              {idx < statusSteps.length - 1 && <div className="w-1" />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
          {statusSteps.map(s => <span key={s}>{STATUS_LABELS[s]}</span>)}
        </div>


        {item.photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {item.photos.map((src, idx) => (
              <div key={idx} className="shrink-0 w-full max-w-md h-64 rounded-lg overflow-hidden bg-muted">
                <img src={src} alt={`${item.title} photo ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm">{item.description}</p>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" /><span>{CATEGORY_LABELS[item.category]}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" /><span>{item.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" /><span>{format(parseISO(item.date), 'MMM d, yyyy h:mm a')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" /><span>{reporter?.name || 'Unknown'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {relatedMatches.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Potential Matches</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {relatedMatches.map(match => {
                const otherId = match.lostItemId === item.id ? match.foundItemId : match.lostItemId;
                const other = mockItems.find(i => i.id === otherId);
                return (
                  <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{other?.title}</p>
                      <p className="text-xs text-muted-foreground">{match.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{match.score}% match</Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/item/${otherId}`)}>
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={claimOpen} onOpenChange={setClaimOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Claim Verification</SheetTitle>
            <SheetDescription>Answer a few questions to verify this is your item.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs">What brand is this item?</Label>
              <Input className="h-9 text-sm" placeholder="e.g. Apple, Nike, etc." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Describe any unique marks</Label>
              <Input className="h-9 text-sm" placeholder="Scratches, stickers, engravings..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">What was inside (if bag/case)?</Label>
              <Input className="h-9 text-sm" placeholder="Contents description" />
            </div>
            <Button onClick={handleClaim} className="w-full">Submit Claim</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
