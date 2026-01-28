import { ArrowLeft, MapPin, Star, Briefcase, CheckCircle, Edit } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { EditProfilePage, ProfileData } from "@/app/components/EditProfilePage";
import { useState } from "react";

interface ProfilePageProps {
  onBack: () => void;
}

const POSTED_JOBS = [
  {
    id: "p1",
    title: "Garden maintenance",
    description: "Need help with garden maintenance this weekend.",
    payment: "€40",
    status: "active",
    applicants: 5,
    postedDate: "2 days ago",
  },
  {
    id: "p2",
    title: "Furniture assembly",
    description: "IKEA furniture assembly needed.",
    payment: "€30",
    status: "completed",
    applicants: 3,
    postedDate: "1 week ago",
  },
];

const COMPLETED_JOBS = [
  {
    id: "c1",
    title: "Mow the lawn",
    employer: "Maria G.",
    payment: "€30",
    rating: 5,
    completedDate: "3 days ago",
  },
  {
    id: "c2",
    title: "Move furniture",
    employer: "Carlos R.",
    payment: "€25",
    rating: 4,
    completedDate: "1 week ago",
  },
  {
    id: "c3",
    title: "Walk dog",
    employer: "Ana M.",
    payment: "€15",
    rating: 5,
    completedDate: "2 weeks ago",
  },
];

export function ProfilePage({ onBack }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "John",
    lastName: "Doe",
    displayName: "John Doe",
    dateOfBirth: "1990-05-15",
    gender: "male",
    biography: "Experienced worker with expertise in gardening, moving, and general maintenance tasks. Available for weekend jobs!",
    photoUrl: null,
  });

  const handleSaveProfile = (newProfileData: ProfileData) => {
    setProfileData(newProfileData);
    setIsEditing(false);
  };

  const getInitials = () => {
    return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
  };

  if (isEditing) {
    return (
      <EditProfilePage
        onBack={() => setIsEditing(false)}
        onSave={handleSaveProfile}
        currentProfile={profileData}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      {/* Profile Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="h-24 w-24 mb-4">
                {profileData.photoUrl ? (
                  <AvatarImage src={profileData.photoUrl} alt={profileData.displayName} />
                ) : (
                  <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                )}
              </Avatar>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{profileData.displayName}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>Madrid, Spain</span>
                  </div>
                </div>
              </div>

              {/* Biography Section */}
              {profileData.biography && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">About</h3>
                  <p className="text-sm text-muted-foreground">{profileData.biography}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-xl font-bold">4.8</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xl font-bold">24</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Gardening</Badge>
                  <Badge variant="secondary">Moving</Badge>
                  <Badge variant="secondary">Cleaning</Badge>
                  <Badge variant="secondary">Pet Care</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="posted" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posted">Posted Jobs</TabsTrigger>
          <TabsTrigger value="completed">Completed Work</TabsTrigger>
        </TabsList>

        <TabsContent value="posted" className="mt-6">
          <div className="space-y-4">
            {POSTED_JOBS.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {job.description}
                      </p>
                    </div>
                    <Badge
                      variant={job.status === "active" ? "default" : "secondary"}
                    >
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary">
                        {job.payment}
                      </span>
                      <span className="text-muted-foreground">
                        {job.applicants} applicants
                      </span>
                      <span className="text-muted-foreground">
                        {job.postedDate}
                      </span>
                    </div>
                    {job.status === "active" && (
                      <Button variant="outline" size="sm">
                        View Applicants
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {COMPLETED_JOBS.map((job) => (
              <Card key={job.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Employer: {job.employer}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold text-primary">
                          {job.payment}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span>{job.rating}.0</span>
                        </div>
                        <span className="text-muted-foreground">
                          {job.completedDate}
                        </span>
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
