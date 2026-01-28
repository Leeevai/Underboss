import { Star, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";

interface UserCardProps {
  id: string;
  name: string;
  rating: number;
  completedJobs: number;
  specialty: string;
  initials: string;
}

export function UserCard({
  name,
  rating,
  completedJobs,
  specialty,
  initials,
}: UserCardProps) {
  return (
    <Card className="w-[160px] flex-shrink-0 hover:shadow-lg transition-shadow">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 mb-3">
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        
        <h3 className="font-semibold text-sm mb-1 line-clamp-1">{name}</h3>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
          {specialty}
        </p>

        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold">{rating}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <Briefcase className="h-3 w-3" />
          <span>{completedJobs} jobs</span>
        </div>

        <Button size="sm" variant="outline" className="w-full h-7 text-xs">
          View profile
        </Button>
      </CardContent>
    </Card>
  );
}