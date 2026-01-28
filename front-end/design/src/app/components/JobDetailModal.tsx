import { X, MapPin, Clock, DollarSign, User, Star, Briefcase, Calendar } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";

interface JobDetailModalProps {
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    duration: string;
    payment: string;
    category: string;
    postedBy: string;
    postedTime: string;
  };
  onClose: () => void;
  onApply: (job: any) => void;
  hasApplied?: boolean;
  applicationStatus?: 'pending' | 'confirmed' | 'rejected' | null;
}

export function JobDetailModal({ job, onClose, onApply, hasApplied = false, applicationStatus = null }: JobDetailModalProps) {
  const posterInitials = job.postedBy
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-background w-full md:max-w-2xl md:rounded-lg rounded-t-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom md:slide-in-from-bottom-0">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Job details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Category */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <h1 className="text-2xl font-bold flex-1">{job.title}</h1>
              <Badge variant="secondary">{job.category}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Posted {job.postedTime}</span>
            </div>
          </div>

          <Separator />

          {/* Key Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="font-semibold">{job.payment}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold">{job.duration}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-semibold text-sm">{job.location}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {job.description}
            </p>
          </div>

          <Separator />

          {/* Posted By */}
          <div>
            <h3 className="font-semibold mb-3">Posted by</h3>
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{posterInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">{job.postedBy}</div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>4.8</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    <span>23 jobs</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View profile
              </Button>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="font-semibold mb-3">Additional information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Job ID</span>
                <span className="font-medium">#{job.id.padStart(6, '0')}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="default" className="bg-green-500">Open</Badge>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Applications</span>
                <span className="font-medium">3 people applied</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4">
          {hasApplied && applicationStatus ? (
            <div className="space-y-3">
              <div className="text-center">
                <Badge
                  variant={
                    applicationStatus === 'confirmed' ? 'default' :
                    applicationStatus === 'pending' ? 'secondary' :
                    'destructive'
                  }
                  className="text-base px-4 py-2"
                >
                  {applicationStatus === 'confirmed' ? '✓ Application Confirmed' :
                   applicationStatus === 'pending' ? '⏳ Application Pending' :
                   '✗ Application Rejected'}
                </Badge>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {applicationStatus === 'confirmed' ? 'The employer has confirmed your application!' :
                 applicationStatus === 'pending' ? 'Waiting for the employer to review your application' :
                 'Unfortunately, your application was not accepted'}
              </p>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
              <Button className="flex-1" onClick={() => onApply(job)}>
                Apply for this job
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}