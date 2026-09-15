import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SCHOOL } from "@/lib/schoolConfig";
import { Clock, LogIn, LogOut, MapPin, Loader2 } from "lucide-react";

const todayISO = () => new Date().toISOString().slice(0, 10);

const distanceM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const getPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported on this device."));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
  });

const fmt = (v?: string | null) =>
  v ? new Date(v).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";

export const StaffClockIn = () => {
  const { user, teacherData } = useAuth();
  const { toast } = useToast();
  const [record, setRecord] = useState<{ id: string; clock_in: string | null; clock_out: string | null; is_late: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("staff_attendance")
      .select("id, clock_in, clock_out, is_late")
      .eq("user_id", user.id)
      .eq("date", todayISO())
      .maybeSingle();
    setRecord(data ?? null);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const verifyLocation = async () => {
    const pos = await getPosition();
    const d = distanceM(pos.coords.latitude, pos.coords.longitude, SCHOOL.coords.lat, SCHOOL.coords.lng);
    if (d > SCHOOL.geofenceRadiusM) {
      throw new Error(`You are about ${Math.round(d)}m from the school. Clock-in only works on campus.`);
    }
    return d;
  };

  const handleClockIn = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await verifyLocation();
      const now = new Date();
      const [h, m] = SCHOOL.clockInCutoff.split(":").map(Number);
      const isLate = now.getHours() * 60 + now.getMinutes() > h * 60 + m;
      const { error } = await supabase.from("staff_attendance").insert({
        user_id: user.id,
        teacher_id: teacherData?.id ?? null,
        date: todayISO(),
        clock_in: now.toISOString(),
        is_late: isLate,
      });
      if (error) throw error;
      toast({ title: isLate ? "Clocked in (late)" : "Clocked in", description: `Recorded at ${fmt(now.toISOString())}.` });
      load();
    } catch (e: unknown) {
      toast({ title: "Clock-in failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleClockOut = async () => {
    if (!record) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("staff_attendance")
        .update({ clock_out: new Date().toISOString() })
        .eq("id", record.id);
      if (error) throw error;
      toast({ title: "Clocked out", description: "Have a great evening." });
      load();
    } catch (e: unknown) {
      toast({ title: "Clock-out failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Staff Clock-In
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" /> On-campus only · {SCHOOL.geofenceRadiusM}m of {SCHOOL.address}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Clock in</p>
            <p className="font-semibold">{fmt(record?.clock_in)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Clock out</p>
            <p className="font-semibold">{fmt(record?.clock_out)}</p>
          </div>
        </div>
        {record?.clock_in && (
          <Badge variant={record.is_late ? "destructive" : "secondary"}>
            {record.is_late ? "Late arrival" : `On time (before ${SCHOOL.clockInCutoff})`}
          </Badge>
        )}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleClockIn} disabled={busy || !!record?.clock_in}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />} Clock In
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleClockOut} disabled={busy || !record?.clock_in || !!record?.clock_out}>
            <LogOut className="w-4 h-4 mr-2" /> Clock Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffClockIn;
