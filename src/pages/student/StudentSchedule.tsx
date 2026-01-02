import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";

// Mock schedule data - will be replaced with real data
const scheduleData = {
  today: [
    { id: 1, subject: "Mathematics", time: "08:00 - 09:30", room: "Room 101", teacher: "Mr. Johnson" },
    { id: 2, subject: "English Language", time: "09:45 - 11:15", room: "Room 102", teacher: "Mrs. Smith" },
    { id: 3, subject: "Physics", time: "11:30 - 13:00", room: "Lab 1", teacher: "Dr. Williams" },
    { id: 4, subject: "Break", time: "13:00 - 14:00", room: "-", teacher: "-" },
    { id: 5, subject: "Chemistry", time: "14:00 - 15:30", room: "Lab 2", teacher: "Mr. Brown" },
  ],
  weekly: [
    {
      day: "Monday",
      classes: [
        { subject: "Mathematics", time: "08:00 - 09:30" },
        { subject: "English", time: "09:45 - 11:15" },
        { subject: "Physics", time: "11:30 - 13:00" },
        { subject: "Chemistry", time: "14:00 - 15:30" },
      ],
    },
    {
      day: "Tuesday",
      classes: [
        { subject: "Biology", time: "08:00 - 09:30" },
        { subject: "Mathematics", time: "09:45 - 11:15" },
        { subject: "Geography", time: "11:30 - 13:00" },
        { subject: "History", time: "14:00 - 15:30" },
      ],
    },
    {
      day: "Wednesday",
      classes: [
        { subject: "English", time: "08:00 - 09:30" },
        { subject: "Physics", time: "09:45 - 11:15" },
        { subject: "Mathematics", time: "11:30 - 13:00" },
        { subject: "ICT", time: "14:00 - 15:30" },
      ],
    },
    {
      day: "Thursday",
      classes: [
        { subject: "Chemistry", time: "08:00 - 09:30" },
        { subject: "Biology", time: "09:45 - 11:15" },
        { subject: "English", time: "11:30 - 13:00" },
        { subject: "Mathematics", time: "14:00 - 15:30" },
      ],
    },
    {
      day: "Friday",
      classes: [
        { subject: "Physics", time: "08:00 - 09:30" },
        { subject: "Chemistry", time: "09:45 - 11:15" },
        { subject: "Geography", time: "11:30 - 13:00" },
        { subject: "Sports", time: "14:00 - 15:30" },
      ],
    },
  ],
};

const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });

const StudentSchedule = () => {
  return (
    <StudentLayout title="Schedule">
      <div className="space-y-6">
        {/* Today's Schedule */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Today's Schedule
            <Badge variant="secondary" className="ml-3 text-sm font-normal">
              {currentDay}
            </Badge>
          </h2>
          
          <div className="space-y-3">
            {scheduleData.today.map((item) => (
              <Card key={item.id} className={item.subject === "Break" ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.subject}</h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {item.time}
                        </span>
                        {item.room !== "-" && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {item.room}
                          </span>
                        )}
                        {item.teacher !== "-" && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {item.teacher}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Weekly Overview */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Weekly Overview</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scheduleData.weekly.map((day) => (
              <Card key={day.day} className={day.day === currentDay ? "ring-2 ring-primary" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {day.day}
                    {day.day === currentDay && (
                      <Badge className="text-xs">Today</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {day.classes.map((cls, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-foreground">{cls.subject}</span>
                      <span className="text-muted-foreground">{cls.time.split(" - ")[0]}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentSchedule;
