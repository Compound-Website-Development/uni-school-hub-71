import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Shield } from "lucide-react";
import npsLogo from "@/assets/nps-logo.png";

const VerifyCertificate = () => {
  const [searchParams] = useSearchParams();
  const certSerial = searchParams.get("cert");
  const [certificate, setCertificate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!certSerial) { setIsLoading(false); return; }
      const { data } = await supabase
        .from("certificates")
        .select("*, students(first_name, last_name, student_id)")
        .eq("serial_number", certSerial)
        .maybeSingle();
      if (data) { setCertificate(data); setIsValid(true); }
      setIsLoading(false);
    };
    verify();
  }, [certSerial]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="p-8 text-center">
          <img src={npsLogo} alt="NPS" className="h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-1">Certificate Verification</h1>
          <p className="text-sm text-muted-foreground mb-6">Nigerian Private Schools — Digital Verification Portal</p>

          {isLoading ? (
            <div className="py-8"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /><p className="text-sm text-muted-foreground mt-3">Verifying certificate...</p></div>
          ) : !certSerial ? (
            <div className="py-8">
              <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No certificate serial number provided.</p>
            </div>
          ) : isValid && certificate ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <Badge className="bg-success/10 text-success border-success/20 mb-2">✓ VERIFIED</Badge>
                <h2 className="text-lg font-bold text-foreground">{certificate.students?.first_name} {certificate.students?.last_name}</h2>
                <p className="text-sm text-muted-foreground">Student ID: {certificate.students?.student_id}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium text-foreground capitalize">{certificate.type} Certificate</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Serial</span><span className="font-mono text-foreground text-xs">{certificate.serial_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Issued</span><span className="text-foreground">{new Date(certificate.issued_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span></div>
              </div>
              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <Shield className="w-3 h-3" /> Digitally verified by NPS Portal
              </div>
            </div>
          ) : (
            <div className="py-8">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 mb-2">✗ INVALID</Badge>
              <p className="text-sm text-muted-foreground">This certificate could not be verified. It may be forged or the serial number is incorrect.</p>
              <p className="text-xs text-muted-foreground mt-2 font-mono">Serial: {certSerial}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyCertificate;
