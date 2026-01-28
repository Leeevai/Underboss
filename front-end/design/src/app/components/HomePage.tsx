import { JobCardCompact } from "@/app/components/JobCardCompact";
import { UserCard } from "@/app/components/UserCard";
import { ScrollArea, ScrollBar } from "@/app/components/ui/scroll-area";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Search, MapPin, Bell, Star, Clock, TrendingUp, User, Settings } from "lucide-react";

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

interface User {
  id: string;
  name: string;
  rating: number;
  completedJobs: number;
  specialty: string;
  initials: string;
}

const NEAR_YOU_JOBS: Job[] = [
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
  {
    id: "4",
    title: "Fix door",
    description: "Balcony door doesn't close properly. Need someone to adjust it.",
    location: "Downtown Madrid",
    duration: "30 min",
    payment: "€20",
    category: "Repairs",
    postedBy: "Jon A.",
    postedTime: "6 hours ago",
  },
];

const URGENT_JOBS: Job[] = [
  {
    id: "5",
    title: "Urgent cleaning",
    description: "Deep cleaning of apartment for inspection visit tomorrow.",
    location: "Barcelona Center",
    duration: "3 hours",
    payment: "€50",
    category: "Cleaning",
    postedBy: "Laura P.",
    postedTime: "30 min ago",
  },
  {
    id: "6",
    title: "Food delivery",
    description: "Need someone to pick up and deliver food today.",
    location: "Valencia Center",
    duration: "1 hour",
    payment: "€18",
    category: "Delivery",
    postedBy: "Miguel S.",
    postedTime: "1 hour ago",
  },
  {
    id: "7",
    title: "Furniture assembly",
    description: "Assemble IKEA furniture this afternoon. I have the tools.",
    location: "Sevilla East",
    duration: "2 hours",
    payment: "€35",
    category: "Assembly",
    postedBy: "Carmen L.",
    postedTime: "2 hours ago",
  },
];

const BEST_PAID_JOBS: Job[] = [
  {
    id: "8",
    title: "Paint room",
    description: "Paint a 12m² room. Paint is already purchased.",
    location: "Málaga Center",
    duration: "1 day",
    payment: "€80",
    category: "Painting",
    postedBy: "Roberto F.",
    postedTime: "3 hours ago",
  },
  {
    id: "9",
    title: "Full moving",
    description: "Complete apartment move. Help with boxes and heavy furniture.",
    location: "Bilbao Center",
    duration: "1 day",
    payment: "€120",
    category: "Moving",
    postedBy: "Elena V.",
    postedTime: "5 hours ago",
  },
  {
    id: "10",
    title: "Complete gardening",
    description: "Full garden maintenance: mow lawn, prune bushes and clean.",
    location: "Zaragoza West",
    duration: "4-5 hours",
    payment: "€90",
    category: "Gardening",
    postedBy: "Pablo M.",
    postedTime: "8 hours ago",
  },
];

const TOP_USERS: User[] = [
  {
    id: "1",
    name: "Carlos Ruiz",
    rating: 4.9,
    completedJobs: 127,
    specialty: "Gardening",
    initials: "CR",
  },
  {
    id: "2",
    name: "Maria Garcia",
    rating: 4.8,
    completedJobs: 95,
    specialty: "Cleaning",
    initials: "MG",
  },
  {
    id: "3",
    name: "Luis Torres",
    rating: 4.9,
    completedJobs: 143,
    specialty: "Repairs",
    initials: "LT",
  },
  {
    id: "4",
    name: "Ana Lopez",
    rating: 5.0,
    completedJobs: 89,
    specialty: "Pets",
    initials: "AL",
  },
  {
    id: "5",
    name: "Pedro Sanz",
    rating: 4.7,
    completedJobs: 112,
    specialty: "Moving",
    initials: "PS",
  },
];

interface HomePageProps {
  onOpenJobDetail?: (job: any) => void;
  onNavigateToProfile?: () => void;
  onNavigateToSettings?: () => void;
  appliedJobs?: string[];
}

export function HomePage({ onOpenJobDetail, onNavigateToProfile, onNavigateToSettings, appliedJobs = [] }: HomePageProps) {
  return (
    <div className="pb-4">
      {/* Header Section */}
      <div className="sticky top-0 bg-background z-10 border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">underboss</h1>
              <p className="text-sm text-muted-foreground">
                Find jobs near you
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon" onClick={onNavigateToProfile}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onNavigateToSettings}>
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search jobs..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Sections */}
      <div className="space-y-6 mt-4">
        {/* Near You Section */}
        <div>
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">NEAR YOU</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              See all
            </Button>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 px-4">
              {NEAR_YOU_JOBS.map((job) => (
                <JobCardCompact
                  key={job.id}
                  {...job}
                  onOpenDetail={onOpenJobDetail}
                  hasApplied={appliedJobs.includes(job.id)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Most Ranked Users Section */}
        <div>
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="font-semibold text-lg">MOST RANKED USERS</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={onNavigateToProfile}>
              See all
            </Button>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 px-4">
              {TOP_USERS.map((user) => (
                <UserCard key={user.id} {...user} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Urgent Jobs Section */}
        <div>
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold text-lg">URGENT</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              See all
            </Button>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 px-4">
              {URGENT_JOBS.map((job) => (
                <JobCardCompact
                  key={job.id}
                  {...job}
                  onOpenDetail={onOpenJobDetail}
                  hasApplied={appliedJobs.includes(job.id)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Best Paid Section */}
        <div>
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h2 className="font-semibold text-lg">BEST PAID</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              See all
            </Button>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 px-4">
              {BEST_PAID_JOBS.map((job) => (
                <JobCardCompact
                  key={job.id}
                  {...job}
                  onOpenDetail={onOpenJobDetail}
                  hasApplied={appliedJobs.includes(job.id)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}