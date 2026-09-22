import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PortalIconArt } from "@/components/PortalIconArt";
import { MapPin, Play, Square, ShieldCheck, Navigation, Wifi, BusFront } from "lucide-react";

const DriverDashboard = () => {
  const { user } = useAuth();
  const [routes,setRoutes]=useState<any[]>([]);
  const [routeId,setRouteId]=useState("");
  const [trip,setTrip]=useState<any>(null);
  const [position,setPosition]=useState<GeolocationPosition|null>(null);
  const [error,setError]=useState("");
  const watchRef=useRef<number|null>(null);

  useEffect(()=>{
    (supabase as any).from("transport_driver_profiles").select("route_id,active").eq("user_id",user?.id).maybeSingle().then(async({data:profile}:any)=>{
      if(!profile?.active||!profile.route_id){setRoutes([]);return;}
      const {data}=await supabase.from("transport_routes").select("id,name,vehicle_number,driver_name,pickup_points").eq("id",profile.route_id);
      setRoutes(data||[]);
    });
    return()=>{if(watchRef.current!==null)navigator.geolocation.clearWatch(watchRef.current);};
  },[user?.id]);

  const sendLocation=async(p:GeolocationPosition,tripId:string)=>{
    setPosition(p);
    const {error:insertError}=await (supabase as any).from("transport_location_points").insert({trip_id:tripId,latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy_m:p.coords.accuracy});
    if(insertError)setError(insertError.message);
  };

  const startTrip=async()=>{
    if(!user?.id||!routeId)return;
    setError("");
    if(!navigator.geolocation){setError("This device does not provide location services.");return;}
    navigator.geolocation.getCurrentPosition(async(p)=>{
      const {data,error:tripError}=await (supabase as any).from("transport_trips").insert({route_id:routeId,driver_user_id:user.id,status:"active"}).select().single();
      if(tripError){setError(tripError.message);return;}
      setTrip(data); await sendLocation(p,data.id);
      watchRef.current=navigator.geolocation.watchPosition(next=>sendLocation(next,data.id),geoError=>setError(geoError.message),{enableHighAccuracy:true,maximumAge:5000,timeout:15000});
    },geoError=>setError(geoError.message),{enableHighAccuracy:true,timeout:15000});
  };

  const stopTrip=async()=>{
    if(!trip)return;
    if(watchRef.current!==null)navigator.geolocation.clearWatch(watchRef.current);
    const {error:stopError}=await (supabase as any).from("transport_trips").update({status:"completed",ended_at:new Date().toISOString()}).eq("id",trip.id);
    if(stopError){setError(stopError.message);return;}
    setTrip(null);setPosition(null);
  };

  const route=routes.find(r=>r.id===routeId);
  return <div className="min-h-screen portal-page-bg p-4 md:p-8">
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="portal-hero min-h-[300px]">
        <div className="portal-hero-copy">
          <p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-primary">Imagemakers transport crew</p>
          <h1 className="portal-display mt-2 text-4xl font-extrabold tracking-tight md:text-6xl">Drive safe.<br/><span className="text-gradient">Stay connected.</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Start a school route only when you are authorised. Your device location is shared with the school and only parents linked to pupils on this route.</p>
        </div>
        <div className="portal-hero-art"><PortalIconArt kind="bus" className="h-full w-full"/></div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="portal-feature-card p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-primary">Route control</p><h2 className="portal-display mt-1 text-2xl font-extrabold">Today's trip</h2></div>
            <div className={trip?"grid h-14 w-14 place-items-center rounded-2xl bg-success/10":"grid h-14 w-14 place-items-center rounded-2xl bg-primary/10"}><PortalIconArt kind="bus" className="h-12 w-12"/></div>
          </div>
          <div className="mt-6 space-y-4">
            <select value={routeId} onChange={e=>setRouteId(e.target.value)} disabled={!!trip} className="h-14 w-full rounded-2xl border border-border/70 bg-background px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Select assigned route</option>{routes.map(r=><option key={r.id} value={r.id}>{r.name}{r.vehicle_number?" — "+r.vehicle_number:""}</option>)}
            </select>
            {route&&<div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-muted/50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vehicle</p><p className="mt-1 font-bold">{route.vehicle_number||"Not configured"}</p></div><div className="rounded-2xl bg-muted/50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pickup points</p><p className="mt-1 line-clamp-2 text-sm font-semibold">{route.pickup_points||"Not configured"}</p></div></div>}
            {!trip?<Button onClick={startTrip} disabled={!routeId} className="h-14 w-full rounded-2xl text-base font-extrabold"><Play className="mr-2 h-5 w-5"/>Start trip & share location</Button>:<Button onClick={stopTrip} variant="destructive" className="h-14 w-full rounded-2xl text-base font-extrabold"><Square className="mr-2 h-5 w-5"/>End trip</Button>}
          </div>
        </section>

        <section className="portal-feature-card overflow-hidden p-0">
          <div className="bg-gradient-to-br from-primary/15 via-card to-accent/15 p-6">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-card shadow-sm"><MapPin className="h-6 w-6 text-primary"/></span><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Location status</p><p className="portal-display text-xl font-extrabold">{trip?"LIVE":"OFF"}</p></div></div>
            <div className="mt-7 rounded-3xl border border-white/50 bg-card/75 p-5 backdrop-blur">
              <div className="flex items-center gap-3"><span className={trip?"grid h-10 w-10 place-items-center rounded-2xl bg-success/10 text-success":"grid h-10 w-10 place-items-center rounded-2xl bg-muted text-muted-foreground"}><Wifi className="h-5 w-5"/></span><div><p className="font-bold">{trip?"Location sharing active":"Location sharing off"}</p><p className="text-xs text-muted-foreground">{position?position.coords.latitude.toFixed(5)+", "+position.coords.longitude.toFixed(5):"No point recorded yet"}</p></div></div>
            </div>
          </div>
          <div className="space-y-3 p-6"><div className="flex items-start gap-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary"/>Only authorised school admins and parents linked to pupils on this route can read live location.</div>{error&&<p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}</div>
        </section>
      </div>
    </div>
  </div>;
};
export default DriverDashboard;