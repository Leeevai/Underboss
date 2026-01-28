import { Heart } from "lucide-react";
import { JobCard } from "@/app/components/JobCard";
import { Badge } from "@/app/components/ui/badge";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  payment: string;
  category: string;
  postedBy: string;
  postedTime: string;
}

const ALL_JOBS: Job[] = [
  {
    id: "1",
    title: "Mow the lawn",
    description: "Need help mowing my front and backyard lawn. Approximately 200m².",
    location: "Downtown Madrid",
    duration: "2-3 hours",
    payment: "€30",
    category: "Gardening",
    postedBy: "Maria G.",
    postedTime: "2 hours ago",
  },
  {
    id: "2",
    title: "Move furniture",
    description: "Help moving furniture within the same building. Sofa, table and some boxes.",
    location: "Barcelona, Eixample",
    duration: "1 hour",
    payment: "€25",
    category: "Moving",
    postedBy: "Carlos R.",
    postedTime: "4 hours ago",
  },
  {
    id: "3",
    title: "Walk dog",
    description: "Need someone to walk my golden retriever in the afternoons this week.",
    location: "Valencia, Ruzafa",
    duration: "1 hour/day",
    payment: "€15/day",
    category: "Pets",
    postedBy: "Ana M.",
    postedTime: "1 day ago",
  },
];

interface FavoritesPageProps {
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenJobDetail?: (job: any) => void;
  appliedJobs?: any[];
}

export function FavoritesPage({ favorites, onToggleFavorite, onOpenJobDetail, appliedJobs = [] }: FavoritesPageProps) {
  const favoriteJobs = ALL_JOBS.filter((job) => favorites.includes(job.id));
  
  // Get application status for each job
  const getApplicationStatus = (jobId: string) => {
    const appliedJob = appliedJobs.find((job) => job.id === jobId);
    if (!appliedJob) return null;
    
    // Randomly assign status for demo purposes (in real app, this would come from backend)
    const statuses = ['pending', 'confirmed', 'rejected'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    return randomStatus;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SPAP</h1>
        <p className="text-muted-foreground">
          Jobs you've saved and applied to
        </p>
      </div>

      {favoriteJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favoriteJobs.map((job) => {
            const isApplied = appliedJobs.some((appliedJob) => appliedJob.id === job.id);
            const status = isApplied ? getApplicationStatus(job.id) : null;
            
            return (
              <div key={job.id} className="relative">
                <JobCard
                  {...job}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  onOpenDetail={onOpenJobDetail}
                />
                {isApplied && status && (
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        status === 'confirmed' ? 'default' :
                        status === 'pending' ? 'secondary' :
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {status === 'confirmed' ? '✓ Confirmed' :
                       status === 'pending' ? '⏳ Pending' :
                       '✗ Rejected'}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No jobs saved yet</h3>
          <p className="text-muted-foreground">
            Start saving jobs you're interested in
          </p>
        </div>
      )}
    </div>
  );
}