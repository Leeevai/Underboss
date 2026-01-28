import { useState } from "react";
import { Home, Heart, PlusCircle, MessageCircle, Settings, Calendar as CalendarIcon } from "lucide-react";
import { HomePage } from "@/app/components/HomePage";
import { FavoritesPage } from "@/app/components/FavoritesPage";
import { PostPage } from "@/app/components/PostPage";
import { MessagesPage } from "@/app/components/MessagesPage";
import { SettingsPage } from "@/app/components/SettingsPage";
import { ProfilePage } from "@/app/components/ProfilePage";
import { CalendarPage } from "@/app/components/CalendarPage";
import { JobDetailModal } from "@/app/components/JobDetailModal";
import { LoginPage } from "@/app/components/LoginPage";
import { CreateProfilePage } from "@/app/components/CreateProfilePage";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";

type Tab = "home" | "favorites" | "post" | "messages" | "calendar";
type AuthState = "login" | "create-profile" | "authenticated";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("login");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogin = (email: string, password: string) => {
    // In a real app, this would validate credentials with a backend
    toast.success("Welcome back!");
    setAuthState("authenticated");
  };

  const handleCreateAccount = () => {
    setAuthState("create-profile");
  };

  const handleCompleteProfile = (profileData: any) => {
    // In a real app, this would save the profile to a backend
    toast.success("Account created successfully!");
    setAuthState("authenticated");
  };

  // Get application status for a job
  const getApplicationStatus = (jobId: string): 'pending' | 'confirmed' | 'rejected' | null => {
    const appliedJob = appliedJobs.find((job) => job.id === jobId);
    if (!appliedJob) return null;
    
    // For demo purposes, assign random status (in real app, this would come from backend)
    const statuses: ('pending' | 'confirmed' | 'rejected')[] = ['pending', 'confirmed', 'rejected'];
    // Use jobId to deterministically assign a status for consistency
    const index = parseInt(jobId) % statuses.length;
    return statuses[index];
  };

  const hasApplied = (jobId: string): boolean => {
    return appliedJobs.some((job) => job.id === jobId);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  };

  const handleOpenJobDetail = (job: any) => {
    setSelectedJob(job);
  };

  const handleCloseJobDetail = () => {
    setSelectedJob(null);
  };

  const handleApplyJob = (job: any) => {
    // Add to applied jobs
    setAppliedJobs((prev) => [...prev, job]);
    
    // Add to favorites
    if (!favorites.includes(job.id)) {
      setFavorites((prev) => [...prev, job.id]);
    }
    
    // Close modal
    setSelectedJob(null);
    
    // Show success toast
    toast.success("Successfully applied!", {
      description: `A chat has been opened with ${job.postedBy}`,
      duration: 3000,
    });
    
    // Switch to messages tab after a short delay
    setTimeout(() => {
      setActiveTab("messages");
    }, 1000);
  };

  const handleLogout = () => {
    toast.success("Logged out successfully");
    setAuthState("login");
    setActiveTab("home");
    setShowProfile(false);
    setShowSettings(false);
  };

  const renderPage = () => {
    if (showProfile) {
      return <ProfilePage onBack={() => setShowProfile(false)} />;
    }

    if (showSettings) {
      return <SettingsPage onBack={() => setShowSettings(false)} onLogout={handleLogout} />;
    }

    switch (activeTab) {
      case "home":
        return (
          <HomePage 
            onOpenJobDetail={handleOpenJobDetail}
            onNavigateToProfile={() => setShowProfile(true)}
            onNavigateToSettings={() => setShowSettings(true)}
            appliedJobs={appliedJobs.map(job => job.id)}
          />
        );
      case "favorites":
        return (
          <FavoritesPage
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onOpenJobDetail={handleOpenJobDetail}
            appliedJobs={appliedJobs}
          />
        );
      case "post":
        return <PostPage />;
      case "messages":
        return <MessagesPage appliedJobs={appliedJobs} />;
      case "calendar":
        return <CalendarPage />;
      default:
        return (
          <HomePage 
            onOpenJobDetail={handleOpenJobDetail}
            onNavigateToProfile={() => setShowProfile(true)}
            onNavigateToSettings={() => setShowSettings(true)}
            appliedJobs={appliedJobs.map(job => job.id)}
          />
        );
    }
  };

  const navItems = [
    { id: "home" as Tab, label: "HOME", icon: Home },
    { id: "favorites" as Tab, label: "SPAP", icon: Heart },
    { id: "post" as Tab, label: "POST", icon: PlusCircle },
    { id: "messages" as Tab, label: "MESSAGES", icon: MessageCircle },
    { id: "calendar" as Tab, label: "CALENDAR", icon: CalendarIcon },
  ];

  // Show login or create profile if not authenticated
  if (authState === "login") {
    return (
      <>
        <LoginPage onLogin={handleLogin} onCreateAccount={handleCreateAccount} />
        <Toaster />
      </>
    );
  }

  if (authState === "create-profile") {
    return (
      <>
        <CreateProfilePage onComplete={handleCompleteProfile} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">{renderPage()}</div>

      {/* Bottom Navigation Bar */}
      <nav className="border-t bg-background sticky bottom-0">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "fill-primary" : ""}`} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal 
          job={selectedJob} 
          onClose={handleCloseJobDetail} 
          onApply={handleApplyJob}
          hasApplied={hasApplied(selectedJob.id)}
          applicationStatus={getApplicationStatus(selectedJob.id)}
        />
      )}

      {/* Toaster */}
      <Toaster />
    </div>
  );
}