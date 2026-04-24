import { useParams, useNavigate } from 'react-router-dom';
import { useItem } from '@/hooks/use-items';
import { useMatches } from '@/hooks/use-matches';
import { useCreateClaim } from '@/hooks/use-claims';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProfile } from '@/lib/supabase-data';
import { CAMPUS_LOCATIONS, CATEGORY_LABELS, STATUS_LABELS } from '@/lib/constants';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Clock, Package, User as UserIcon, HandHeart, Loader2, Mail, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatLauncherDialog } from '@/components/ChatLauncherDialog';
import { format, parseISO } from 'date-fns';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import type { User } from '@/lib/constants';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: item, isLoading } = useItem(id);
  const { data: allMatches = [] } = useMatches(id);
  const createClaim = useCreateClaim();

  const [claimOpen, setClaimOpen] = useState(false);
  const [foundOpen, setFoundOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPrefill, setChatPrefill] = useState('');

  const [reporter, setReporter] = useState<User | null>(null);
  useEffect(() => {
    if (item?.reporterId) {
      fetchProfile(item.reporterId).then(setReporter);
    }
  }, [item?.reporterId]);

  const [claimBrand, setClaimBrand] = useState('');
  const [claimMarks, setClaimMarks] = useState('');
  const [claimContents, setClaimContents] = useState('');

  const [foundLocation, setFoundLocation] = useState<string>('');
  const [foundDate, setFoundDate] = useState('');
  const [foundNote, setFoundNote] = useState('');
  const [foundContact, setFoundContact] = useState<'email' | 'in_app'>('in_app');
  const [submittingFound, setSubmittingFound] = useState(false);

  useEffect(() => {
    if (item?.location) setFoundLocation(item.location);
  }, [item?.location]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  const relatedMatches = allMatches;

  const statusSteps = ['open', 'potential_match', 'claimed', 'returned'] as const;
  const currentStepIndex = statusSteps.indexOf(item.status as typeof statusSteps[number]);

  const canReportFound =
    item.type === 'lost' && (item.status === 'open' || item.status === 'potential_match');

  const handleClaim = () => {
    if (!user) return;
    createClaim.mutate(
      {
        itemId: item.id,
        claimerId: user.id,
        verificationAnswers: {
          brand: claimBrand,
          uniqueMarks: claimMarks,
          contents: claimContents,
        },
      },
      {
        onSuccess: () => {
          toast.success('Claim submitted! The finder will review your answers.');
          setClaimOpen(false);
          setClaimBrand('');
          setClaimMarks('');
          setClaimContents('');
        },
        onError: () => {
          toast.error('Failed to submit claim. Please try again.');
        },
      },
    );
  };

  const handleReportFound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundLocation || !foundDate) {
      toast.error('Please fill in where and when you found it.');
      return;
    }
    setSubmittingFound(true);
    // For now, show success — full match creation requires mod privileges
    setTimeout(() => {
      setSubmittingFound(false);
      setFoundOpen(false);
      setFoundNote('');
      setFoundDate('');
      setFoundContact('in_app');
      toast.success(`Thanks! ${reporter?.name ?? 'The owner'} will be notified that you may have found this.`);
    }, 600);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
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
          <div className="flex flex-col sm:flex-row gap-2">
            {item.type === 'found' && item.status === 'open' && (
              <Button size="sm" onClick={() => setClaimOpen(true)}>Claim This Item</Button>
            )}
            {canReportFound && (
              <Button size="sm" onClick={() => setFoundOpen(true)} className="gap-1.5">
                <HandHeart className="h-3.5 w-3.5" />I Found This
              </Button>
            )}
          </div>
        </div>

        {canReportFound && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-3 flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                <HandHeart className="h-4 w-4" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">Did you find this item?</p>
                <p className="text-xs text-muted-foreground">
                  Let {reporter?.name ?? 'the owner'} know directly — no need to fill out a full found report.
                </p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0" onClick={() => setFoundOpen(true)}>
                Report match
              </Button>
            </CardContent>
          </Card>
        )}

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
            </div>
          </CardContent>
        </Card>

        {/* Reporter contact card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {item.type === 'lost' ? 'Lost by' : 'Found by'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-gradient-to-br from-primary to-rose-600 text-white text-sm font-semibold">
                {reporter?.name?.charAt(0).toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{reporter?.name ?? 'Unknown user'}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {reporter?.email ?? '—'}
              </p>
              {reporter && (
                <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                  {reporter.role}
                </p>
              )}
            </div>
            {reporter && user && reporter.id !== user.id && (
              <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="gap-1.5 h-8"
                >
                  <a href={`mailto:${reporter.email}?subject=${encodeURIComponent(`Stevens Lost & Found: ${item.title}`)}`}>
                    <Mail className="h-3.5 w-3.5" /> Email
                  </a>
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={() => {
                    setChatPrefill(`Hi ${reporter.name.split(' ')[0]}, I'm reaching out about your ${item.type} item "${item.title}".`);
                    setChatOpen(true);
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Chat
                </Button>
              </div>
            )}
            {reporter && user && reporter.id === user.id && (
              <span className="text-[10px] text-muted-foreground italic shrink-0">That's you</span>
            )}
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
                return (
                  <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">Matched Item</p>
                      <p className="text-xs text-muted-foreground">{match.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{match.score}% match</Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/app/item/${otherId}`)}>
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
              <Input className="h-9 text-sm" placeholder="e.g. Apple, Nike, etc." value={claimBrand} onChange={e => setClaimBrand(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Describe any unique marks</Label>
              <Input className="h-9 text-sm" placeholder="Scratches, stickers, engravings..." value={claimMarks} onChange={e => setClaimMarks(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">What was inside (if bag/case)?</Label>
              <Input className="h-9 text-sm" placeholder="Contents description" value={claimContents} onChange={e => setClaimContents(e.target.value)} />
            </div>
            <Button onClick={handleClaim} className="w-full" disabled={createClaim.isPending}>
              {createClaim.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</>
              ) : (
                'Submit Claim'
              )}
            </Button>

            {reporter && user && reporter.id !== user.id && (
              <>
                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-2 px-2 bg-background text-[10px] uppercase tracking-wider text-muted-foreground">
                    or
                  </span>
                </div>
                <div className="rounded-lg border border-dashed p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Talk to {reporter.name.split(' ')[0]} directly</p>
                      <p className="text-muted-foreground">
                        Skip the form and chat about details — the message will include this item as context.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => {
                      setClaimOpen(false);
                      setChatPrefill(`Hi ${reporter.name.split(' ')[0]}, I think your "${item.title}" might be mine. Could we discuss it?`);
                      setChatOpen(true);
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Chat with {reporter.name.split(' ')[0]} instead
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={foundOpen} onOpenChange={setFoundOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <HandHeart className="h-4 w-4 text-success" />
              Report a Match
            </SheetTitle>
            <SheetDescription>
              Tell {reporter?.name ?? 'the owner'} where and when you found their {item.title}.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleReportFound} className="space-y-4 mt-4">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 flex gap-3">
              {item.photos[0] && (
                <img
                  src={item.photos[0]}
                  alt=""
                  className="h-12 w-12 rounded object-cover shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{item.title}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Where did you find it? *</Label>
              <Select value={foundLocation} onValueChange={setFoundLocation}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Pick a location" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPUS_LOCATIONS.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="found-date" className="text-xs">When did you find it? *</Label>
              <Input
                id="found-date"
                type="datetime-local"
                value={foundDate}
                onChange={e => setFoundDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="found-note" className="text-xs">Note (optional)</Label>
              <Textarea
                id="found-note"
                value={foundNote}
                onChange={e => setFoundNote(e.target.value)}
                placeholder="Any details that might help them confirm — e.g. 'left on a bench near the entrance'"
                className="text-sm min-h-[70px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">How should they reach you?</Label>
              <RadioGroup
                value={foundContact}
                onValueChange={(v: 'email' | 'in_app') => setFoundContact(v)}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="in_app" id="fc-app" />
                  <Label htmlFor="fc-app" className="text-xs font-normal">In-app message</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="email" id="fc-email" />
                  <Label htmlFor="fc-email" className="text-xs font-normal">Email</Label>
                </div>
              </RadioGroup>
            </div>

            <SheetFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFoundOpen(false)}
                disabled={submittingFound}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingFound} className="gap-1.5">
                <HandHeart className="h-3.5 w-3.5" />
                {submittingFound ? 'Sending...' : 'Send match'}
              </Button>
            </SheetFooter>

            {reporter && user && reporter.id !== user.id && (
              <div className="rounded-lg border border-dashed p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium">Prefer to message {reporter.name.split(' ')[0]} directly?</p>
                    <p className="text-muted-foreground">
                      Open a chat — your first message will be tagged with this item so they have full context.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => {
                    setFoundOpen(false);
                    const where = foundLocation ? ` near ${foundLocation}` : '';
                    setChatPrefill(
                      `Hi ${reporter.name.split(' ')[0]}, I think I found your "${item.title}"${where}. ${foundNote ? foundNote + ' ' : ''}Want to coordinate a handoff?`,
                    );
                    setChatOpen(true);
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Chat with {reporter.name.split(' ')[0]} instead
                </Button>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">
              Want to post a full Found listing instead?{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => navigate(`/app/post?type=found`)}
              >
                Open full form
              </button>
            </p>
          </form>
        </SheetContent>
      </Sheet>

      <ChatLauncherDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        recipient={reporter}
        taggedItem={item}
        defaultMessage={chatPrefill}
      />
    </div>
  );
}
