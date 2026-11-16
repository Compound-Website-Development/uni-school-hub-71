import { useState, useEffect, useMemo, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import StudentPhoto from "@/components/StudentPhoto";
import { resolveStudentPhoto } from "@/lib/studentPhotos";
import { CreditCard, Download, Loader2, Search, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import npsLogo from "@/assets/logo";
import { SCHOOL } from "@/lib/schoolConfig";
import { generateParentId, generateParentCode } from "@/lib/studentUtils";

/** Print brand colours for the physical card (not UI chrome). Sky blue is the school colour. */
const NAVY = "#0A6DA8"; // deep sky
const SKY = "#38BDF8";
const GOLD = "#C9A227";

const CARD_W = 54; // mm (portrait ID-1)
const CARD_H = 86;

const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

const personCode = (p: any, type: "student" | "staff") =>
  (type === "student" ? p.student_id : p.employee_id) || p.id.slice(0, 8).toUpperCase();

const parentCode = (p: any) => p.parent_id || "—";
const parentAccessCode = (p: any) => p.parent_code || "—";

const profileUrl = (p: any, type: "student" | "staff") =>
  type === "student" && p.public_token
    ? `${window.location.origin}/s/${p.public_token}`
    : `${window.location.origin}/verify?${type === "student" ? "student" : "staff"}=${encodeURIComponent(personCode(p, type))}`;

async function toDataUrl(src: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d")!.drawImage(img, 0, 0);
    return c.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** Navy "roof" peak shape used on both faces, inspired by the school crest. */
function drawPeak(doc: jsPDF, topY: number) {
  doc.setFillColor(...hex(NAVY));
  // peaks
  doc.triangle(0, topY + 8, 13.5, topY - 2, 27, topY + 8, "F");
  doc.triangle(27, topY + 8, 40.5, topY + 1, CARD_W, topY + 8, "F");
  doc.rect(0, topY + 7, CARD_W, CARD_H - topY - 7, "F");
}

const AdminIDCards = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardType, setCardType] = useState<"student" | "staff">("student");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [previewQR, setPreviewQR] = useState<string>("");
  const logoRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [sRes, tRes, cRes] = await Promise.all([
        supabase.from("students").select("*").eq("status", "active").order("first_name"),
        (supabase as any).rpc("staff_teacher_records"),
        supabase.from("classes").select("id, name, level, arm"),
      ]);
      setStudents(sRes.data || []);
      setTeachers(((tRes.data as any[]) || []).filter((t: any) => t.status === "active").sort((a: any, b: any) => (a.first_name || "").localeCompare(b.first_name || "")));
      setClasses(cRes.data || []);
      setIsLoading(false);
    };
    fetchData();
    toDataUrl(npsLogo).then((d) => (logoRef.current = d));
  }, []);

  const list = useMemo(() => {
    const base = cardType === "student" ? students : teachers;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((p) =>
      `${p.first_name} ${p.last_name} ${personCode(p, cardType)}`.toLowerCase().includes(q)
    );
  }, [cardType, students, teachers, query]);

  useEffect(() => {
    const first = list[0] || null;
    setSelected((prev) => (prev && list.some((p) => p.id === prev.id) ? prev : first));
  }, [list]);

  /** Make sure the student has a Parent ID + access code stored before it is printed. */
  const ensureParentAccess = async (person: any) => {
    if (person.parent_id && person.parent_code) return person;
    const parent_id = person.parent_id || generateParentId();
    const parent_code = person.parent_code || generateParentCode();
    const { data } = await supabase
      .from("students")
      .update({ parent_id, parent_code })
      .eq("id", person.id)
      .select()
      .maybeSingle();
    const updated = data || { ...person, parent_id, parent_code };
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelected((prev) => (prev && prev.id === updated.id ? updated : prev));
    return updated;
  };

  useEffect(() => {
    if (!selected) { setPreviewQR(""); return; }
    if (cardType === "student" && (!selected.parent_id || !selected.parent_code)) {
      ensureParentAccess(selected);
    }
    QRCode.toDataURL(profileUrl(selected, cardType), { margin: 0, width: 320, color: { dark: NAVY, light: "#FFFFFF" } })
      .then(setPreviewQR)
      .catch(() => setPreviewQR(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, cardType]);

  const classLabel = (p: any) => {
    const c = classes.find((c) => c.id === p.class_id);
    return c ? (c.arm ? `${c.level || c.name} (${c.arm})` : c.name) : "—";
  };

  const generateIDCard = async (rawPerson: any, type: "student" | "staff") => {
    const person = type === "student" ? await ensureParentAccess(rawPerson) : rawPerson;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [CARD_W, CARD_H] });
    const qr = await QRCode.toDataURL(profileUrl(person, type), { margin: 0, width: 512, color: { dark: NAVY, light: "#FFFFFF" } });
    const logo = logoRef.current ?? (await toDataUrl(npsLogo));
    const photoUrl = await resolveStudentPhoto(person.photo_url);
    const photo = photoUrl ? await toDataUrl(photoUrl) : null;
    const fullName = `${person.first_name} ${person.last_name}`.toUpperCase();

    /* ---------- FRONT ---------- */
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, CARD_W, CARD_H, "F");

    // top brand bar
    doc.setFillColor(...hex(NAVY));
    doc.rect(0, 0, CARD_W, 15, "F");
    doc.setFillColor(...hex(GOLD));
    doc.rect(0, 15, CARD_W, 0.8, "F");
    // white disc so the crest reads cleanly on the sky-blue bar
    doc.setFillColor(255, 255, 255);
    doc.circle(8, 7.5, 5.6, "F");
    if (logo) doc.addImage(logo, "PNG", 3.6, 3.1, 8.8, 8.8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold").setFontSize(6.2);
    doc.text("IMAGEMAKERS", 15, 6);
    doc.setFont("helvetica", "normal").setFontSize(4.2);
    doc.text("Nursery & Primary School", 15, 9.2);
    doc.setTextColor(...hex(GOLD));
    doc.setFontSize(3.6);
    doc.text(SCHOOL.motto.toUpperCase(), 15, 12.2);

    // role chip
    doc.setFillColor(...hex(GOLD));
    doc.roundedRect(3, 18.5, 20, 4.6, 2.3, 2.3, "F");
    doc.setTextColor(...hex(NAVY));
    doc.setFont("helvetica", "bold").setFontSize(3.9);
    doc.text(type === "student" ? "STUDENT" : "STAFF", 13, 21.6, { align: "center" });

    // photo frame / placeholder
    const px = (CARD_W - 24) / 2, py = 25, pw = 24, ph = 30;
    doc.setFillColor(238, 242, 247);
    doc.rect(px, py, pw, ph, "F");
    if (photo) {
      doc.addImage(photo, "PNG", px, py, pw, ph);
    } else {
      doc.setDrawColor(...hex(SKY));
      doc.setLineWidth(0.4);
      doc.rect(px, py, pw, ph);
      doc.setTextColor(150, 160, 175);
      doc.setFont("helvetica", "normal").setFontSize(4);
      doc.text("PASSPORT", CARD_W / 2, py + ph / 2 - 1, { align: "center" });
      doc.text("PHOTOGRAPH", CARD_W / 2, py + ph / 2 + 3, { align: "center" });
    }
    doc.setDrawColor(...hex(GOLD));
    doc.setLineWidth(0.5);
    doc.rect(px, py, pw, ph);

    // navy peak footer
    drawPeak(doc, 58);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold").setFontSize(7);
    doc.text(fullName, CARD_W / 2, 70, { align: "center", maxWidth: CARD_W - 6 });
    doc.setDrawColor(...hex(GOLD));
    doc.setLineWidth(0.4);
    doc.line(CARD_W / 2 - 9, 72.2, CARD_W / 2 + 9, 72.2);

    const rows: [string, string][] =
      type === "student"
        ? [["ID NO", personCode(person, type)], ["CLASS", classLabel(person)], ["SESSION", "2026/2027"]]
        : [["ID NO", personCode(person, type)], ["DEPT", person.department || "Academics"], ["SESSION", "2026/2027"]];
    let ry = 76.5;
    rows.forEach(([k, v]) => {
      doc.setFont("helvetica", "normal").setFontSize(3.8);
      doc.setTextColor(...hex(GOLD));
      doc.text(k, 5, ry);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold").setFontSize(4.2);
      doc.text(String(v), 18, ry, { maxWidth: 32 });
      ry += 3.6;
    });

    /* ---------- BACK ---------- */
    doc.addPage([CARD_W, CARD_H], "portrait");
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, CARD_W, CARD_H, "F");

    doc.setTextColor(...hex(NAVY));
    doc.setFont("helvetica", "bold").setFontSize(6);
    doc.text("TERMS OF USE", CARD_W / 2, 8, { align: "center" });
    doc.setDrawColor(...hex(GOLD));
    doc.setLineWidth(0.4);
    doc.line(CARD_W / 2 - 10, 9.5, CARD_W / 2 + 10, 9.5);
    doc.setFont("helvetica", "normal").setFontSize(3.6);
    doc.setTextColor(70, 80, 95);
    doc.text(
      "This card remains the property of the school and must be carried at all times while on the premises. Scan the QR code to open the verified digital profile, results and attendance record. If found, please return to the school address below.",
      4, 13.5, { maxWidth: CARD_W - 8, align: "left", lineHeightFactor: 1.35 }
    );

    drawPeak(doc, 34);

    // QR panel
    const qs = 24;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(CARD_W / 2 - qs / 2 - 1.5, 41.5, qs + 3, qs + 3, 1.5, 1.5, "F");
    doc.addImage(qr, "PNG", CARD_W / 2 - qs / 2, 43, qs, qs);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold").setFontSize(4);
    doc.text("SCAN TO OPEN STUDENT PROFILE", CARD_W / 2, 71, { align: "center" });

    if (type === "student") {
      doc.setFillColor(...hex(GOLD));
      doc.roundedRect(4, 73, CARD_W - 8, 4.2, 2.1, 2.1, "F");
      doc.setTextColor(...hex(NAVY));
      doc.setFontSize(3.8);
      doc.text(`PARENT ID: ${parentCode(person)}`, CARD_W / 2, 75.9, { align: "center" });

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(4, 78, CARD_W - 8, 4.2, 2.1, 2.1, "F");
      doc.setTextColor(...hex(NAVY));
      doc.setFontSize(3.8);
      doc.text(`ACCESS CODE: ${parentAccessCode(person)}`, CARD_W / 2, 80.9, { align: "center" });
    } else {
      doc.setTextColor(...hex(GOLD));
      doc.setFontSize(3.6);
      doc.text(person.email || SCHOOL.email, CARD_W / 2, 79, { align: "center" });
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal").setFontSize(3);
    doc.text(`${SCHOOL.phones.join(" • ")}  |  ${SCHOOL.approvalNo}`, CARD_W / 2, 84.5, { align: "center" });

    doc.save(`${person.first_name}_${person.last_name}_ID.pdf`);
    toast({ title: "ID card generated", description: "Front and back exported as a print-ready PDF." });
  };

  const generateAll = async () => {
    for (const p of list) await generateIDCard(p, cardType);
  };

  if (isLoading) {
    return <AdminLayout title="ID Cards"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout title="ID Card Generator">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="w-6 h-6 text-primary" /> QR ID Cards</h2>
            <p className="text-sm text-muted-foreground mt-1">Print-ready double-sided cards with school branding, passport placeholder and QR verification.</p>
          </div>
          <div className="flex gap-2">
            <Select value={cardType} onValueChange={(v) => setCardType(v as any)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={generateAll} disabled={!list.length}>Export all ({list.length})</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder={`Search ${cardType}s by name or ID`} value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              {list.length === 0 ? (
                <div className="p-8 text-center">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No {cardType}s found.</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 max-h-[520px] overflow-y-auto pr-1">
                  {list.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => setSelected(person)}
                      className={`text-left rounded-lg border p-3 transition-colors ${selected?.id === person.id ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/50"}`}
                    >
                      <p className="font-semibold text-sm truncate">{person.first_name} {person.last_name}</p>
                      <p className="text-xs text-muted-foreground">{personCode(person, cardType)}{cardType === "student" ? ` • ${classLabel(person)}` : ""}</p>
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary"
                        onClick={(e) => { e.stopPropagation(); generateIDCard(person, cardType); }}
                      >
                        <Download className="w-3 h-3" /> PDF
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live preview */}
          <div className="space-y-3">
            {selected ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {/* FRONT */}
                  <div className="rounded-xl overflow-hidden shadow-lg bg-white aspect-[54/86] flex flex-col">
                    <div className="px-2 py-1.5 flex items-center gap-1.5" style={{ background: NAVY }}>
                      <span className="h-6 w-6 rounded-full bg-white flex items-center justify-center shrink-0">
                        <img src={npsLogo} alt="School crest" className="h-5 w-5 object-contain" />
                      </span>
                      <div className="leading-tight">

                        <p className="text-[7px] font-bold text-white">IMAGEMAKERS</p>
                        <p className="text-[5px] text-white/70">Nursery &amp; Primary School</p>
                        <p className="text-[4px]" style={{ color: GOLD }}>{SCHOOL.motto.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="h-[2px]" style={{ background: GOLD }} />
                    <div className="flex-1 flex flex-col items-center pt-2">
                      <span className="self-start ml-2 px-2 rounded-full text-[6px] font-bold" style={{ background: GOLD, color: NAVY }}>
                        {cardType === "student" ? "STUDENT" : "STAFF"}
                      </span>
                      <div className="mt-2 w-[46%] aspect-[4/5] border-2 flex items-center justify-center text-center" style={{ borderColor: GOLD, background: "#eef2f7" }}>
                        <StudentPhoto
                          photoRef={selected.photo_url}
                          alt={`${selected.first_name} ${selected.last_name}`}
                          fallback={<span className="text-[5px] text-slate-400 leading-tight">PASSPORT<br />PHOTOGRAPH</span>}
                        />
                      </div>
                    </div>
                    <div className="relative pt-3 pb-2 px-2" style={{ background: NAVY, clipPath: "polygon(0 22%, 25% 0, 50% 22%, 75% 6%, 100% 22%, 100% 100%, 0 100%)" }}>
                      <p className="text-[7px] font-bold text-white text-center leading-tight mt-1">{`${selected.first_name} ${selected.last_name}`.toUpperCase()}</p>
                      <div className="h-px w-8 mx-auto my-1" style={{ background: GOLD }} />
                      <div className="space-y-0.5">
                        <p className="text-[5px]"><span style={{ color: GOLD }}>ID NO </span><span className="text-white font-semibold">{personCode(selected, cardType)}</span></p>
                        <p className="text-[5px]"><span style={{ color: GOLD }}>{cardType === "student" ? "CLASS " : "DEPT "}</span><span className="text-white font-semibold">{cardType === "student" ? classLabel(selected) : selected.department || "Academics"}</span></p>
                        <p className="text-[5px]"><span style={{ color: GOLD }}>SESSION </span><span className="text-white font-semibold">2026/2027</span></p>
                      </div>
                    </div>
                  </div>

                  {/* BACK */}
                  <div className="rounded-xl overflow-hidden shadow-lg bg-white aspect-[54/86] flex flex-col">
                    <div className="p-2 text-center">
                      <p className="text-[6px] font-bold" style={{ color: NAVY }}>TERMS OF USE</p>
                      <div className="h-px w-8 mx-auto my-1" style={{ background: GOLD }} />
                      <p className="text-[4.5px] text-slate-500 leading-snug">
                        This card remains the property of the school and must be carried at all times while on the premises. Scan the QR code to open the verified digital profile, results and attendance record.
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center pt-4 pb-2 px-2" style={{ background: NAVY, clipPath: "polygon(0 14%, 25% 0, 50% 14%, 75% 3%, 100% 14%, 100% 100%, 0 100%)" }}>
                      {previewQR ? (
                        <img src={previewQR} alt="QR code linking to the digital profile" className="w-[58%] bg-white p-1 rounded" />
                      ) : (
                        <QrCode className="w-10 h-10 text-white/40" />
                      )}
                      <p className="text-[5px] font-bold text-white mt-1.5">SCAN TO OPEN STUDENT PROFILE</p>
                      {cardType === "student" ? (
                        <>
                          <span className="mt-1 px-2 rounded-full text-[5px] font-bold" style={{ background: GOLD, color: NAVY }}>
                            PARENT ID: {parentCode(selected)}
                          </span>
                          <span className="mt-1 px-2 rounded-full text-[5px] font-bold bg-white" style={{ color: NAVY }}>
                            ACCESS CODE: {parentAccessCode(selected)}
                          </span>
                        </>
                      ) : (
                        <span className="mt-1 text-[5px]" style={{ color: GOLD }}>{selected.email || SCHOOL.email}</span>
                      )}

                      <p className="text-[4px] text-white/70 mt-1 text-center">{SCHOOL.phones.join(" • ")}</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full gap-2" onClick={() => generateIDCard(selected, cardType)}>
                  <Download className="w-4 h-4" /> Download PDF (front &amp; back)
                </Button>
              </>
            ) : (
              <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Select a person to preview their card.</CardContent></Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminIDCards;
