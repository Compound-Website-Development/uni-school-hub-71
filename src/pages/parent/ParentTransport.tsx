import { useEffect, useState } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, ShieldCheck, BusFront, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalIllustration } from "@/components/PortalIllustration";

const ParentTransport = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: links } = await (supabase as any).from("transport_student_links").select("route_id, student_id").eq("active", true);
    const routeIds = [...new Set((links || []).map((x: any) => x.route_id))];
    if (!routeIds.length) { setTrips([]); setLoading(false); return; }
    const { data: activeTrips } = await (supabase as any).from("transport_trips").select("id,route_id,started_at,status,transport_routes(name,vehicle_number,driver_name)").in("route_id", routeIds).eq("status", "active");
    const rows:any[] = [];
    for (const trip of activeTrips || []) {
      const { data: point } = await (supabase as any).from("transport_location_points").select("latitude,longitude,accuracy_m,recorded_at").eq("trip_id", trip.id).order("recorded_at", { ascending: false }).limit(1).maybeSingle();
      rows.push({ ...trip, point });
    }
    setTrips(rows); setLoading(false);
  };

  useEffect(() => { load(); const id = window.setInterval(load, 10000); return () => window.clearInterval(id); }, []);

  return <ParentLayout title="School Bus">
    <div className="dashboard-surface dashboard-parent mx-auto max-w-6xl space-y-6">
      <section className="portal-hero">
        <PortalIllustration kind="bus" size="lg" className="portal-hero-art opacity-70" />
        <div className="portal-hero-copy">
          <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-primary">Authorised family transport</p>
          <h1 className="portal-display mt-2 text-4xl font-extrabold">Know when the bus is moving.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">This view only appears for children the school has explicitly linked to a bus route. When a driver starts a trip, the latest location is refreshed automatically.</p>
        </div>
      </section>
      <div className="hidden">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary-foreground/70">Transport</p><h1 className="mt-2 text-3xl font-black">School bus tracking</h1><p className="mt-2 max-w-xl text-sm text-primary-foreground/80">Only routes linked to your children are visible. Location refreshes automatically while a trip is active.</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><BusFront /></div></div>
      </div>
      {loading ? <div className="py-16 text-center text-muted-foreground">Loading live routes…</div> : trips.length === 0 ? <Card><CardContent className="py-14 text-center"><MapPin className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" /><p className="font-semibold">No active bus trip</p><p className="mt-1 text-sm text-muted-foreground">When your child’s assigned bus starts a trip, it will appear here.</p></CardContent></Card> : trips.map((trip:any) => { const p=trip.point; const maps=p ? "https://www.google.com/maps/search/?api=1&query="+p.latitude+","+p.longitude : ""; return <Card key={trip.id} className="overflow-hidden shadow-lg"><CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5 text-primary" />{trip.transport_routes?.name || "School bus"}</CardTitle><Badge>LIVE</Badge></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Vehicle</p><p className="mt-1 font-semibold">{trip.transport_routes?.vehicle_number || "Not configured"}</p></div><div className="rounded-2xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Driver</p><p className="mt-1 font-semibold">{trip.transport_routes?.driver_name || "Assigned by school"}</p></div><div className="rounded-2xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Last update</p><p className="mt-1 font-semibold">{p ? new Date(p.recorded_at).toLocaleTimeString("en-NG") : "Waiting…"}</p></div></div>{p ? <><div className="rounded-2xl border p-4"><div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><div><p className="font-semibold">Current location recorded</p><p className="text-xs text-muted-foreground">{p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}{p.accuracy_m ? " · ±" + Math.round(p.accuracy_m) + "m" : ""}</p></div></div></div><Button asChild className="w-full"><a href={maps} target="_blank" rel="noreferrer"><Navigation className="mr-2 h-4 w-4" /> Open location in Google Maps</a></Button></> : null}<div className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Location is available only because this parent account is explicitly linked to a pupil on this route.</div></CardContent></Card>; })}
      <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Refresh now</Button>
    </div>
  </ParentLayout>;
};
export default ParentTransport;