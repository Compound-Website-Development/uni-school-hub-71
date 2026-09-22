import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Play, Square, Navigation, ShieldCheck, BusFront } from "lucide-react";
import portalIllustration from "@/assets/portal-illustration.png";

const DriverDashboard = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<any[]>([]);
  const [routeId, setRouteId] = useState("");
  const [trip, setTrip] = useState<any>(null);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState("");
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    (supabase as any).from("transport_driver_profiles").select("route_id,active").eq("user_id", user?.id).maybeSingle().then(async ({ data: profile }) => {
      if (!profile?.active || !profile.route_id) { setRoutes([]); return; }
      const { data } = await supabase.from("transport_routes").select("id,name,vehicle_number,driver_name").eq("id", profile.route_id);
      setRoutes(data || []);
    });
    return () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  const sendLocation = async (p: GeolocationPosition, tripId: string) => {
    setPosition(p);
    const { error: insertError } = await supabase.from("transport_location_points").insert({ trip_id: tripId, latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy_m: p.coords.accuracy });
    if (insertError) setError(insertError.message);
  };

  const startTrip = async () => {
    if (!user?.id || !routeId) return;
    setError("");
    if (!navigator.geolocation) { setError("This device does not provide location services."); return; }
    navigator.geolocation.getCurrentPosition(async (p) => {
      const { data, error: tripError } = await supabase.from("transport_trips").insert({ route_id: routeId, driver_user_id: user.id, status: "active" }).select().single();
      if (tripError) { setError(tripError.message); return; }
      setTrip(data);
      await sendLocation(p, data.id);
      watchRef.current = navigator.geolocation.watchPosition((next) => sendLocation(next, data.id), (geoError) => setError(geoError.message), { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    }, (geoError) => setError(geoError.message), { enableHighAccuracy: true, timeout: 15000 });
  };

  const stopTrip = async () => {
    if (!trip) return;
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    await supabase.from("transport_trips").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", trip.id);
    setTrip(null); setPosition(null);
  };

  const selectedRoute = routes.find(r => r.id === routeId);
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Imagemakers Transport</p><h1 className="mt-1 text-3xl font-black tracking-tight">Driver Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Start a trip, keep location on, and stop when the route ends.</p></div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg"><BusFront className="h-6 w-6" /></div>
        </header>
        <section className="portal-illustration-card relative overflow-hidden rounded-[28px] p-5 md:flex md:items-center md:justify-between">
          <div className="relative z-10"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">On the road</p><h2 className="mt-2 font-display text-2xl font-extrabold">Safe routes, visible journeys.</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Your live trip controls are designed to keep the school community informed without slowing you down.</p></div>
          <img src={portalIllustration} alt="School bus and connected school community" className="relative h-28 w-1/2 object-contain object-right md:h-36" />
        </section>
        <Card className="overflow-hidden rounded-[28px] border-primary/15 shadow-xl">
          <CardHeader className="bg-primary text-primary-foreground"><CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5" /> Route control</CardTitle></CardHeader>
          <CardContent className="space-y-5 p-5">
            <select value={routeId} onChange={e => setRouteId(e.target.value)} disabled={!!trip} className="w-full rounded-xl border bg-background px-3 py-3 text-sm"><option value="">Select assigned route</option>{routes.map(r => <option key={r.id} value={r.id}>{r.name}{r.vehicle_number ? " — " + r.vehicle_number : ""}</option>)}</select>
            {selectedRoute && <div className="rounded-2xl bg-muted/40 p-4 text-sm"><b>{selectedRoute.name}</b><div className="mt-1 text-muted-foreground">Vehicle: {selectedRoute.vehicle_number || "Not configured"}</div></div>}
            {!trip ? <Button onClick={startTrip} disabled={!routeId} className="h-12 w-full rounded-xl text-base"><Play className="mr-2 h-5 w-5" /> Start trip & share location</Button> : <Button onClick={stopTrip} variant="destructive" className="h-12 w-full rounded-xl text-base"><Square className="mr-2 h-5 w-5" /> Stop trip</Button>}
            <div className="flex items-center gap-3 rounded-2xl border p-4"><div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div><div className="flex-1"><p className="font-semibold">{trip ? "Location sharing is active" : "Location sharing is off"}</p><p className="text-xs text-muted-foreground">{position ? position.coords.latitude.toFixed(5) + ", " + position.coords.longitude.toFixed(5) : "No location recorded yet"}</p></div>{trip && <Badge>LIVE</Badge>}</div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Only authorised school admins and parents linked to pupils on this route can read the trip location.</div>
            {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverDashboard;
