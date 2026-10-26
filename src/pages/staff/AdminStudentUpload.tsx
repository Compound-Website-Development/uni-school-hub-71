import { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ParsedStudent {
  student_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  guardian_name?: string;
  guardian_phone?: string;
  class_name?: string;
}

const AdminStudentUpload = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid File",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  // Parse quoted CSV fields correctly, including commas and escaped quotes.
  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const source = String(e.target?.result ?? "").replace(/^\\uFEFF/, "");
      const rows: string[][] = [];
      let row: string[] = [];
      let field = "";
      let quoted = false;
      for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        if (ch === '"' && quoted && source[i + 1] === '"' ) { field += '"' ; i++; }
        else if (ch === '"' ) quoted = !quoted;
        else if (ch === "," && !quoted) { row.push(field.trim()); field = ""; }
        else if ((ch === "\\n" || ch === "\\r") && !quoted) {
          if (ch === "\\r" && source[i + 1] === "\\n") i++;
          row.push(field.trim());
          if (row.some((cell) => cell !== "")) rows.push(row);
          row = []; field = "";
        } else field += ch;
      }
      if (field.length || row.length) { row.push(field.trim()); if (row.some((cell) => cell !== "")) rows.push(row); }
      if (rows.length < 2) {
        setParsedData([]);
        toast({ title: "No pupil rows found", description: "The CSV needs a header row and at least one pupil row.", variant: "destructive" });
        return;
      }
      const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\\s+/g, "_"));
      const get = (values: string[], ...keys: string[]) => {
        const index = keys.map((key) => headers.indexOf(key)).find((i) => i >= 0);
        return index === undefined ? "" : (values[index] ?? "").trim();
      };
      const students: ParsedStudent[] = rows.slice(1).map((values) => ({
        student_id: get(values, "student_id", "admission_number", "admission_no") || undefined,
        first_name: get(values, "first_name", "firstname") || values[0] || "",
        last_name: get(values, "last_name", "lastname", "surname") || values[1] || "",
        email: get(values, "email") || undefined,
        gender: get(values, "gender") || undefined,
        date_of_birth: get(values, "date_of_birth", "dob") || undefined,
        guardian_name: get(values, "guardian_name", "parent_name") || undefined,
        guardian_phone: get(values, "guardian_phone", "parent_phone") || undefined,
        class_name: get(values, "class_name", "class", "arm") || undefined,
      })).filter((student) => student.first_name || student.last_name);
      const invalid = students.filter((student) => !student.first_name || !student.last_name);
      if (invalid.length) toast({ title: "Some rows need attention", description: invalid.length + " pupil row(s) are missing a first or last name. Correct the CSV before importing.", variant: "destructive" });
      setParsedData(students);
      toast({ title: "File parsed", description: "Found " + students.length + " pupil rows. Review duplicates and incomplete details before importing." });
    };
    reader.readAsText(file);
  };

  const duplicateRows = parsedData.filter((student, index) => {
    const signature = (row: ParsedStudent) =>
      [row.first_name, row.last_name, row.guardian_phone]
        .map((value) => (value || "").trim().toLowerCase().replace(/\s+/g, " "))
        .join("|");
    return parsedData.findIndex((candidate) => signature(candidate) === signature(student)) !== index;
  });

  const uploadStudents = async () => {
    if (parsedData.length === 0) return;
    if (duplicateRows.length > 0) {
      toast({
        title: "Possible duplicate rows",
        description: "Review the repeated pupil details in the preview and correct the CSV before importing. No records have been merged or deleted.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    // Validate existing records and class names before inserting anything.
    const [{ data: classesData }, { data: existingStudents, error: existingError }] = await Promise.all([
      supabase.from("classes").select("id, name, arm"),
      supabase.from("students").select("first_name, last_name, guardian_phone, student_id"),
    ]);
    if (existingError) {
      setIsUploading(false);
      toast({ title: "Could not check existing pupils", description: existingError.message, variant: "destructive" });
      return;
    }
    const normalise = (value?: string | null) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
    const classMap = new Map((classesData || []).flatMap(c => [[normalise(c.name), c.id] as [string, string], ...(c.arm ? [[normalise(c.name + " " + c.arm), c.id] as [string, string]] : [])]));
    const existingSignatures = new Set((existingStudents || []).filter(s => normalise(s.guardian_phone)).map(s => [normalise(s.first_name), normalise(s.last_name), normalise(s.guardian_phone)].join("|")));
    const existingIds = new Set((existingStudents || []).map(s => normalise(s.student_id)).filter(Boolean));
    const duplicates = parsedData.filter(s => (normalise(s.guardian_phone) && existingSignatures.has([normalise(s.first_name), normalise(s.last_name), normalise(s.guardian_phone)].join("|"))) || (s.student_id && existingIds.has(normalise(s.student_id))));
    if (duplicates.length) {
      setIsUploading(false);
      toast({ title: "Possible existing duplicates", description: duplicates.length + " imported pupil row(s) match an existing pupil or admission number. Review the records and correct the file; nothing was merged or deleted.", variant: "destructive" });
      return;
    }
    const unknownClasses = parsedData.filter(s => s.class_name && !classMap.has(normalise(s.class_name)));
    if (unknownClasses.length) {
      setIsUploading(false);
      toast({ title: "Class names need correction", description: unknownClasses.length + " row(s) refer to a class/arm that was not found. Correct the names before importing so pupils are not silently left unassigned.", variant: "destructive" });
      return;
    }

    for (let i = 0; i < parsedData.length; i++) {
      const student = parsedData[i];
      
      try {
        // Generate student ID
        const studentId = student.student_id?.trim() || `STU-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        
        // Find class ID if class name provided
        let classId = null;
        if (student.class_name) {
          classId = classMap.get(normalise(student.class_name)) || null;
        }

        const { error } = await supabase.from("students").insert({
          student_id: studentId,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email || null,
          gender: student.gender || null,
          date_of_birth: student.date_of_birth || null,
          guardian_name: student.guardian_name || null,
          guardian_phone: student.guardian_phone || null,
          class_id: classId,
          status: 'active',
        });

        if (error) throw error;
        success++;
      } catch (error) {
        console.error("Error uploading student:", student, error);
        failed++;
      }

      setProgress(Math.round(((i + 1) / parsedData.length) * 100));
    }

    setUploadResults({ success, failed });
    setIsUploading(false);
    
    toast({
      title: "Upload Complete",
      description: `Successfully added ${success} students. ${failed > 0 ? `${failed} failed.` : ''}`,
    });
  };

  const downloadTemplate = () => {
    const template = "student_id,first_name,last_name,email,gender,date_of_birth,guardian_name,guardian_phone,class_name\nADM-2026-001,John,Doe,john@example.com,male,2010-05-15,Jane Doe,+2348012345678,Grade 7A";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Bulk Student Upload">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Bulk Student Upload</h2>
          <p className="text-muted-foreground text-sm">Upload multiple students at once using a CSV file</p>
        </div>

        {/* Template Download */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Download Template</h3>
                <p className="text-sm text-muted-foreground">
                  Use this template to format your student data correctly
                </p>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Select a CSV file containing student data. The file should include columns for first_name, last_name, and optionally email, gender, date_of_birth, guardian_name, guardian_phone, and class_name.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{parsedData.length} students found</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Click to select a CSV file or drag and drop</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {parsedData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview ({parsedData.length} students)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3">First Name</th>
                      <th className="text-left py-2 px-3">Last Name</th>
                      <th className="text-left py-2 px-3">Class</th>
                      <th className="text-left py-2 px-3">Guardian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((student, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-2 px-3">{student.first_name}</td>
                        <td className="py-2 px-3">{student.last_name}</td>
                        <td className="py-2 px-3">{student.class_name || "-"}</td>
                        <td className="py-2 px-3">{student.guardian_name || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    ... and {parsedData.length - 10} more students
                  </p>
                )}
              </div>

              {duplicateRows.length > 0 && (
                <div role="alert" className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    {duplicateRows.length} possible duplicate row(s) detected
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Compare the repeated names and guardian phone numbers in your spreadsheet. The system will not merge or delete records automatically.
                  </p>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4 space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-muted-foreground text-center">
                    Uploading... {progress}%
                  </p>
                </div>
              )}

              {/* Results */}
              {!isUploading && uploadResults.success > 0 && (
                <div className="mt-4 flex items-center gap-4 justify-center">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span>{uploadResults.success} successful</span>
                  </div>
                  {uploadResults.failed > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      <span>{uploadResults.failed} failed</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={uploadStudents} 
                  disabled={isUploading}
                  className="bg-gradient-primary"
                >
                  {isUploading ? "Uploading..." : `Upload ${parsedData.length} Students`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStudentUpload;