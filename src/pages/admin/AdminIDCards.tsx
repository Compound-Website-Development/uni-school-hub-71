import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const AdminIDCards = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardType, setCardType] = useState<"student" | "staff">("student");

  useEffect(() => {
    const fetchData = async () => {
      const [sRes, tRes] = await Promise.all([
        supabase.from("students").select("*").eq("status", "active").order("first_name"),
        supabase.from("teachers").select("*").eq("status", "active").order("first_name"),
      ]);
      setStudents(sRes.data || []);
      setTeachers(tRes.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const generateIDCard = (person: any, type: "student" | "staff") => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [86, 54] });
    doc.setFillColor(0, 100, 0);
    doc.rect(0, 0, 86, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("NIGERIAN PRIVATE SCHOOLS", 43, 6, { align: "center" });
    doc.setFontSize(6);
    doc.text(type === "student" ? "STUDENT ID CARD" : "STAFF ID CARD", 43, 11, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(200, 200, 200);
    doc.rect(5, 18, 20, 24);
    doc.setFontSize(5);
    doc.text("PHOTO", 15, 31, { align: "center" });
    doc.setFontSize(8);
    doc.text(`${person.first_name} ${person.last_name}`, 30, 22);
    doc.setFontSize(6);
    doc.text(`ID: ${type === "student" ? person.student_id : person.employee_id}`, 30, 27);
    if (type === "student") {
      doc.text(`Email: ${person.email || "N/A"}`, 30, 32);
    } else {
      doc.text(`Dept: ${person.department || "N/A"}`, 30, 32);
      doc.text(`Email: ${person.email}`, 30, 37);
    }
    doc.setFillColor(0, 100, 0);
    doc.rect(0, 48, 86, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(4);
    doc.text("This card is the property of NPS. If found, please return to the school.", 43, 52, { align: "center" });
    doc.save(`${person.first_name}_${person.last_name}_ID.pdf`);
    toast({ title: "ID Card generated" });
  };

  if (isLoading) {
    return <AdminLayout title="ID Cards"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  const list = cardType === "student" ? students : teachers;

  return (
    <AdminLayout title="ID Card Generator">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">ID Cards</h2>
          <Select value={cardType} onValueChange={(v) => setCardType(v as any)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {list.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><CreditCard className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No {cardType}s found.</p></CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((person) => (
              <Card key={person.id} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{person.first_name} {person.last_name}</p>
                    <p className="text-xs text-muted-foreground">{cardType === "student" ? person.student_id : person.employee_id}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => generateIDCard(person, cardType)}>
                    <Download className="w-4 h-4 mr-1" /> PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminIDCards;
