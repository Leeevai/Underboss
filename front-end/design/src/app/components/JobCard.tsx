import { MapPin, Clock, DollarSign, Heart } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

interface JobCardProps {
  id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  payment: string;
  category: string;
  postedBy: string;
  postedTime: string;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenDetail?: (job: JobCardProps) => void;
  hasApplied?: boolean;
}

export function JobCard({
  id,
  title,
  description,
  location,
  duration,
  payment,
  category,
  postedBy,
  postedTime,
  isFavorite,
  onToggleFavorite,
  onOpenDetail,
  hasApplied = false,
}: JobCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <Badge variant="secondary">{category}</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(id);
            }}
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </Button>
        </div>

        <h3
          className="font-semibold text-lg mb-2 cursor-pointer hover:text-primary"
          onClick={() =>
            onOpenDetail?.({
              id,
              title,
              description,
              location,
              duration,
              payment,
              category,
              postedBy,
              postedTime,
              isFavorite,
              onToggleFavorite,
              onOpenDetail,
              hasApplied,
            })
          }
        >
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-primary">
              <DollarSign className="h-4 w-4" />
              <span>{payment}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{postedBy}</span> • {postedTime}
          </div>
          <Button
            size="sm"
            onClick={() =>
              onOpenDetail?.({
                id,
                title,
                description,
                location,
                duration,
                payment,
                category,
                postedBy,
                postedTime,
                isFavorite,
                onToggleFavorite,
                onOpenDetail,
                hasApplied,
              })
            }
          >
            {hasApplied ? "Applied" : "Apply"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}