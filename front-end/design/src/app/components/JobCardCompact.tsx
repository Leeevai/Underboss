import { MapPin, Clock, DollarSign, Heart, Star } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";

interface JobCardCompactProps {
  id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  payment: string;
  category: string;
  postedBy: string;
  postedTime: string;
  onOpenDetail?: (job: any) => void;
  hasApplied?: boolean;
}

export function JobCardCompact({
  id,
  title,
  description,
  location,
  duration,
  payment,
  category,
  postedBy,
  postedTime,
  onOpenDetail,
  hasApplied = false,
}: JobCardCompactProps) {
  return (
    <Card
      className="overflow-hidden flex-shrink-0 w-64 hover:shadow-lg transition-shadow cursor-pointer"
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
        })
      }
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        </div>

        <h3 className="font-semibold mb-2 line-clamp-1">{title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <DollarSign className="h-3 w-3" />
              <span>{payment}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs font-medium text-muted-foreground">
            {postedBy}
          </span>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
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
              });
            }}
          >
            {hasApplied ? "Applied" : "Apply"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}