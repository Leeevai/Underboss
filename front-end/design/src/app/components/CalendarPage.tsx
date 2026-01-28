import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

interface CalendarPageProps {
  confirmedJobs?: any[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CalendarPage({ confirmedJobs = [] }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get calendar days for current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const hasJobOnDate = (date: Date | null) => {
    if (!date) return false;
    // For demo, we'll show some confirmed jobs on specific dates
    const day = date.getDate();
    return day === 15 || day === 22 || day === 28;
  };

  const getJobsForDate = (date: Date | null) => {
    if (!date) return [];
    const day = date.getDate();
    
    // Mock confirmed jobs for demo
    if (day === 15) {
      return [{
        id: "1",
        title: "Mow the lawn",
        time: "10:00 AM",
        location: "Downtown Madrid",
        payment: "€30"
      }];
    }
    if (day === 22) {
      return [{
        id: "2",
        title: "Move furniture",
        time: "2:00 PM",
        location: "Barcelona, Eixample",
        payment: "€25"
      }];
    }
    if (day === 28) {
      return [{
        id: "3",
        title: "Walk dog",
        time: "5:00 PM",
        location: "Valencia, Ruzafa",
        payment: "€15"
      }];
    }
    return [];
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const todayJobs = getJobsForDate(today);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Calendar</h1>
        <p className="text-muted-foreground">
          Your confirmed jobs schedule
        </p>
      </div>

      {/* Today's Jobs */}
      {todayJobs.length > 0 && (
        <Card className="mb-6 border-primary">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Today's Jobs
            </h3>
            <div className="space-y-3">
              {todayJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">{job.time} • {job.location}</p>
                  </div>
                  <Badge variant="default">{job.payment}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card>
        <CardContent className="pt-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              const hasJob = hasJobOnDate(date);
              const jobs = getJobsForDate(date);
              
              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-2 rounded-lg border ${
                    date
                      ? isToday(date)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                      : "border-transparent"
                  } ${hasJob ? "bg-green-50 dark:bg-green-950/20" : ""}`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isToday(date) ? "text-primary" : ""
                      }`}>
                        {date.getDate()}
                      </div>
                      {hasJob && (
                        <div className="space-y-1">
                          {jobs.slice(0, 2).map((job) => (
                            <div
                              key={job.id}
                              className="text-xs p-1 bg-primary/10 rounded truncate"
                              title={job.title}
                            >
                              {job.time.split(" ")[0]} {job.title.split(" ").slice(0, 2).join(" ")}
                            </div>
                          ))}
                          {jobs.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{jobs.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Jobs List */}
      <div className="mt-6">
        <h3 className="font-semibold mb-4">Upcoming Confirmed Jobs</h3>
        <div className="space-y-3">
          {[
            {
              id: "1",
              title: "Mow the lawn",
              date: "Jan 15, 2026",
              time: "10:00 AM",
              location: "Downtown Madrid",
              payment: "€30"
            },
            {
              id: "2",
              title: "Move furniture",
              date: "Jan 22, 2026",
              time: "2:00 PM",
              location: "Barcelona, Eixample",
              payment: "€25"
            },
            {
              id: "3",
              title: "Walk dog",
              date: "Jan 28, 2026",
              time: "5:00 PM",
              location: "Valencia, Ruzafa",
              payment: "€15"
            }
          ].map((job) => (
            <Card key={job.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">{job.title}</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {job.date} at {job.time}
                      </p>
                      <p>{job.location}</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-base">
                    {job.payment}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
