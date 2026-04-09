import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CAMPUS_LOCATIONS, CATEGORY_LABELS, ItemType } from '@/data/mock-data';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X } from 'lucide-react';

export default function PostItemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [type, setType] = useState<ItemType>((searchParams.get('type') as ItemType) || 'lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [date, setDate] = useState('');
  const [contact, setContact] = useState<'email' | 'in_app'>('email');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotos(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category || !location || !date) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (photos.length === 0) {
      toast.error('Please upload at least one photo.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success(`${type === 'lost' ? 'Lost' : 'Found'} item reported successfully!`);
      navigate(type === 'lost' ? '/lost' : '/found');
    }, 800);
  };

  return (
    <div className="p-6 max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report an Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs">Item Type</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={type === 'lost' ? 'default' : 'outline'} onClick={() => setType('lost')}>Lost Item</Button>
                <Button type="button" size="sm" variant={type === 'found' ? 'default' : 'outline'} onClick={() => setType('found')}>Found Item</Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs">Title *</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Blue backpack" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs">Description</Label>
              <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the item, any unique marks, colors, brand..." className="text-sm min-h-[80px]" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Location *</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Where was it?" /></SelectTrigger>
                  <SelectContent>
                    {CAMPUS_LOCATIONS.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">Date / Time *</Label>
                <Input id="date" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Photos *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {photos.map((src, idx) => (
                    <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border">
                      <img src={src} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-foreground/70 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
              >
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Click to upload or drag & drop</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Contact Preference</Label>
              <RadioGroup value={contact} onValueChange={(v: 'email' | 'in_app') => setContact(v)} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="email" id="c-email" />
                  <Label htmlFor="c-email" className="text-xs font-normal">Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="in_app" id="c-app" />
                  <Label htmlFor="c-app" className="text-xs font-normal">In-app message</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Report'}</Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
