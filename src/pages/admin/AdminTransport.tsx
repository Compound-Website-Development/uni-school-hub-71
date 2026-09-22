import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Bus, Plus, Loader2, Trash2, MapPin, UserRound, Users, ShieldCheck, Link2, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminTransport = () => {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [routeForm, setRouteForm] = useState({ name: "", pickup_points: "", vehicle_number: "" });
  const [driverForm, setDriverForm] = useState({ user_id: "", route_id: "" });
  const [linkForm, setLinkForm] = useState({ parent_user_id: "", student_id: "", route_id: "" });

  const load = async () => {
    setLoading(true);
    const [{ data: routeRows }, { data: roleRows }, { data: profileRows }, { data: studentRows }] = await Promise.all([
      supabase.from("transport_routes").select("*").order("name"),
      supabase.from("user_roles").select("user_id,role").eq("role", "parent"),
      supabase.from("profiles").select("user_id,first_name,last_name,email,phone").order("first_name"),
      supabase.from("students").select("id,student_id,first_name,last_name").eq("status", "active").order("last_name"),
    ]);
    const parentIds = new Set((roleRows || []).map((x: any) => x.user_id));
    setParents((profileRows || []).filter((p: any) => parentIds.has(p.user_id)));
    setUsers(profileRows || []);
    setStudents(studentRows || []);
    setRoutes(routeRows || []);

    const { data: driverProfiles } = await (supabase as any)
      .from("transport_driver_profiles")
      .select("id,user_id,driver_name,phone,active,route_id,transport_routes(name,vehicle_number)")
      .order("driver_name");
    setDrivers(driverProfiles || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addRoute = async () => {
    if (!routeForm.name.trim()) return toast({ title: "Route name required", variant: "destructive" });
    const { error } = await supabase.from("transport_routes").insert(routeForm);
    if (error) return toast({ title: "Could not create route", description: error.message, variant: "destructive" });
    setRouteForm({ name: "", pickup_points: "", vehicle_number: "" });
    toast({ title: "Route created" });
    load();
  };

  const assignDriver = async () => {
    if (!driverForm.user_id || !driverForm.route_id) return toast({ title: "Select a user and route", variant: "destructive" });
    const person = parents.find(() => false); // no-op keeps this action independent from parent data
    const { data: profile } = await (supabase as any).from("profiles").select("first_name,last_name,phone").eq("user_id", driverForm.user_id).maybeSingle();
    if (!profile) return toast({ title: "Profile not found", variant: "destructive" });
    const { error: roleError } = await (supabase as any).from("user_roles").upsert({ user_id: driverForm.user_id, role: "driver" }, { onConflict: "user_id,role" });
    if (roleError) return toast({ title: "Could not grant driver role", description: roleError.message, variant: "destructive" });
    const { error } = await (supabase as any).from("transport_driver_profiles").upsert({
      user_id: driverForm.user_id,
      driver_name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Driver",
      phone: profile.phone || null,
      route_id: driverForm.route_id,
      active: true,
    }, { onConflict: "user_id" });
    if (error) return toast({ title: "Could not assign driver", description: error.message, variant: "destructive" });
    toast({ title: "Driver assigned", description: "The user can now sign in to /driver." });
    setDriverForm({ user_id: "", route_id: "" });
    load();
  };

  const linkChild = async () => {
    if (!linkForm.parent_user_id || !linkForm.student_id || !linkForm.route_id) return toast({ title: "Select parent, pupil and route", variant: "destructive" });
    const { error } = await (supabase as any).from("transport_student_links").upsert({
      parent_user_id: linkForm.parent_user_id,
      student_id: linkForm.student_id,
      route_id: linkForm.route_id,
      active: true,
    }, { onConflict: "parent_user_id,student_id" });
    if (error) return toast({ title: "Could not link pupil", description: error.message, variant: "destructive" });
    toast({ title: "Bus access granted", description: "Only this linked parent can see the route while a trip is active." });
    setLinkForm({ parent_user_id: "", student_id: "", route_id: "" });
    load();
  };

  const deleteRoute = async (id: string) => {
    if (!confirm("Delete this route? Existing trip history may depend on it.")) return;
    const { error } = await supabase.from("transport_routes").delete().eq("id", id);
    if (error) toast({ title: "Could not delete route", description: error.message, variant: "destructive" });
    else load();
  };

  if (loading) return <AdminLayout title="Transport"><div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AdminLayout>;

  return (
    <AdminLayout title="Driver & Bus Tracking">
      <div className="dashboard-surface dashboard-admin space-y-6 animate-fade-in">
        <section className="portal-hero">
          <div className="portal-hero-copy">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Controlled school transport</p>
            <h1 className="portal-display mt-2 text-3xl font-bold md:text-4xl">Driver, route and parent access control.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Create real routes, give an authorised user the driver role, and link only the parents whose children actually use that route. No parent gets bus location by default.</p>
          </div>
          <div className="portal-hero-art"><Bus className="absolute right-20 top-20 h-28 w-28 text-primary/20" /><Navigation className="absolute right-10 bottom-12 h-14 w-14 text-accent/30" /></div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="border-primary/15 shadow-lg">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />Create route</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Route name" value={routeForm.name} onChange={e => setRouteForm({ ...routeForm, name: e.target.value })} />
              <Input placeholder="Vehicle number" value={routeForm.vehicle_number} onChange={e => setRouteForm({ ...routeForm, vehicle_number: e.target.value })} />
              <Input placeholder="Pickup points" value={routeForm.pickup_points} onChange={e => setRouteForm({ ...routeForm, pickup_points: e.target.value })} />
              <Button className="w-full" onClick={addRoute}>Create route</Button>
            </CardContent>
          </Card>

          <Card className="border-primary/15 shadow-lg">
            <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />Authorise driver</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={driverForm.user_id} onValueChange={v => setDriverForm({ ...driverForm, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select existing user" /></SelectTrigger>
                <SelectContent>
                  {users.filter((p: any) => !drivers.some((d: any) => d.user_id === p.user_id)).map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{[p.first_name,p.last_name].filter(Boolean).join(" ") || p.email}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={driverForm.route_id} onValueChange={v => setDriverForm({ ...driverForm, route_id: v })}>
                <SelectTrigger><SelectValue placeholder="Assign route" /></SelectTrigger>
                <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Create the user's account first in Manage Users. This action grants the driver role and binds the account to one route.</p>
              <Button className="w-full" onClick={assignDriver}><ShieldCheck className="mr-2 h-4 w-4" />Authorise driver</Button>
            </CardContent>
          </Card>

          <Card className="border-primary/15 shadow-lg">
            <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" />Give bus access</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={linkForm.parent_user_id} onValueChange={v => setLinkForm({ ...linkForm, parent_user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                <SelectContent>{parents.map(p => <SelectItem key={p.user_id} value={p.user_id}>{[p.first_name,p.last_name].filter(Boolean).join(" ") || p.email}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={linkForm.student_id} onValueChange={v => setLinkForm({ ...linkForm, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.last_name} {s.first_name} · {s.student_id}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={linkForm.route_id} onValueChange={v => setLinkForm({ ...linkForm, route_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button className="w-full" onClick={linkChild}><Users className="mr-2 h-4 w-4" />Grant tracking access</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-border/60 shadow-lg">
          <CardHeader><CardTitle>Configured routes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {routes.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No routes yet. Add the school's real route information.</div> : routes.map(r => (
              <div key={r.id} className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-4 md:flex-row md:items-center">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Bus className="h-5 w-5" /></div>
                <div className="flex-1"><p className="font-bold">{r.name}</p><p className="text-xs text-muted-foreground">{r.vehicle_number || "Vehicle not configured"} · {r.pickup_points || "Pickup points not configured"}</p></div>
                <Badge variant="outline">{drivers.filter(d => d.route_id === r.id && d.active).length} driver(s)</Badge>
                <Button variant="ghost" size="icon" onClick={() => deleteRoute(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card/70 p-5"><p className="text-xs uppercase tracking-widest text-muted-foreground">Routes</p><p className="portal-display mt-2 text-3xl font-bold">{routes.length}</p></div>
          <div className="rounded-2xl border bg-card/70 p-5"><p className="text-xs uppercase tracking-widest text-muted-foreground">Authorised drivers</p><p className="portal-display mt-2 text-3xl font-bold">{drivers.filter(d => d.active).length}</p></div>
          <div className="rounded-2xl border bg-card/70 p-5"><p className="text-xs uppercase tracking-widest text-muted-foreground">Parent route links</p><p className="portal-display mt-2 text-3xl font-bold">Controlled by live links</p></div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTransport;
