import { mockItems } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { ItemCard } from '@/components/ItemCard';
import { EmptyState } from '@/components/EmptyState';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function MyPostsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const myItems = mockItems.filter(i => i.reporterId === user?.id);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold mb-1">My Posts</h1>
      <p className="text-sm text-muted-foreground mb-4">{myItems.length} items you've reported</p>

      {myItems.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Items you report as lost or found will show up here."
          actionLabel="Report an Item"
          onAction={() => navigate('/post')}
          icon={<FileText className="h-6 w-6 text-muted-foreground" />}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {myItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
