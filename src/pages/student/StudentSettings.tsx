import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Phone, MapPin, Shield } from "lucide-react";

const StudentSettings = () => {
  const { studentData, user } = useAuth();

  return (
    <StudentLayout title="Settings">
      <div className="space-y-6 max-w-2xl">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your personal information as registered in the school system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input 
                  value={studentData?.first_name || ""} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input 
                  value={studentData?.last_name || ""} 
                  disabled 
                  className="bg-muted"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Student ID</Label>
              <Input 
                value={studentData?.student_id || ""} 
                disabled 
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input 
                value={user?.email || studentData?.email || ""} 
                disabled 
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </Label>
              <Input 
                value={studentData?.phone || "Not provided"} 
                disabled 
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </Label>
              <Input 
                value={studentData?.address || "Not provided"} 
                disabled 
                className="bg-muted"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Contact your school administrator to update your personal information.
            </p>
          </CardContent>
        </Card>

        {/* Guardian Information */}
        <Card>
          <CardHeader>
            <CardTitle>Guardian Information</CardTitle>
            <CardDescription>
              Your registered guardian/parent contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Guardian Name</Label>
              <Input 
                value={studentData?.guardian_name || "Not provided"} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Guardian Phone</Label>
              <Input 
                value={studentData?.guardian_phone || "Not provided"} 
                disabled 
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Last changed: Unknown
                </p>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Account Email</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default StudentSettings;
