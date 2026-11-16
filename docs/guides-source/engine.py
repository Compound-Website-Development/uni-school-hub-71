"""Shared PDF layout engine for the Imagemakers user guides (ReportLab)."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
    TableStyle, Image, PageBreak, KeepTogether, NextPageTemplate, Flowable)
from reportlab.platypus.tableofcontents import TableOfContents

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
LOGO = os.path.join(ROOT, "src", "assets", "imagemakers-logo.png")
SHOTS = os.path.join(HERE, "screenshots")
pdfmetrics.registerFont(TTFont("Body", "/usr/share/fonts/truetype/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("Bold", "/usr/share/fonts/truetype/DejaVuSans-Bold.ttf"))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("Body", normal="Body", bold="Bold", italic="Body", boldItalic="Bold")

NAVY = colors.HexColor("#0B2545"); SKY = colors.HexColor("#1F8FCE"); GOLD = colors.HexColor("#C99A3B")
WASH = colors.HexColor("#EEF6FB"); LINE = colors.HexColor("#D5E3EC"); INK = colors.HexColor("#1E2A33")
MUTED = colors.HexColor("#5B6B77"); WARN = colors.HexColor("#FFF6E5"); WARNL = colors.HexColor("#E2B24F")
W, H = A4; M = 18 * mm

S = {
 "h1": ParagraphStyle("h1", fontName="Bold", fontSize=19, leading=24, textColor=NAVY, spaceBefore=4, spaceAfter=10),
 "h2": ParagraphStyle("h2", fontName="Bold", fontSize=13, leading=17, textColor=SKY, spaceBefore=12, spaceAfter=5),
 "p": ParagraphStyle("p", fontName="Body", fontSize=9.6, leading=14.2, textColor=INK, spaceAfter=6),
 "b": ParagraphStyle("b", fontName="Body", fontSize=9.6, leading=14, textColor=INK, leftIndent=12, bulletIndent=2, spaceAfter=2.5),
 "cap": ParagraphStyle("cap", fontName="Body", fontSize=8, leading=11, textColor=MUTED, alignment=1, spaceBefore=3, spaceAfter=10),
 "cell": ParagraphStyle("cell", fontName="Body", fontSize=8.2, leading=11, textColor=INK),
 "cellh": ParagraphStyle("cellh", fontName="Bold", fontSize=8.2, leading=11, textColor=colors.white),
 "note": ParagraphStyle("note", fontName="Body", fontSize=9, leading=13, textColor=INK),
 "toc1": ParagraphStyle("toc1", fontName="Body", fontSize=10, leading=17, textColor=INK, leftIndent=4),
}

class Doc(BaseDocTemplate):
    def __init__(self, path, title, audience, **kw):
        super().__init__(path, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=22*mm, bottomMargin=20*mm,
                         title=title, author="Imagemakers Nursery and Primary School", **kw)
        self.gtitle, self.audience = title, audience
        fr = Frame(M, 20*mm, W-2*M, H-42*mm, id="f")
        self.addPageTemplates([PageTemplate("cover", [Frame(0, 0, W, H, id="c")], onPage=self.cover),
                               PageTemplate("body", [fr], onPage=self.chrome)])
    def afterFlowable(self, f):
        if isinstance(f, Paragraph) and f.style.name == "h1":
            self.notify("TOCEntry", (0, f.getPlainText(), self.page))
    def cover(self, c, d):
        c.saveState(); c.setFillColor(NAVY); c.rect(0, 0, W, H, fill=1, stroke=0)
        c.setFillColor(SKY); c.rect(0, H*0.36, W, 4, fill=1, stroke=0)
        c.setFillColor(colors.white); c.roundRect(W/2-34*mm, H-95*mm, 68*mm, 62*mm, 8*mm, fill=1, stroke=0)
        c.drawImage(LOGO, W/2-27*mm, H-90*mm, 54*mm, 52*mm, preserveAspectRatio=True, mask="auto")
        c.setFillColor(GOLD); c.setFont("Bold", 9); c.drawCentredString(W/2, H-110*mm, "IMAGEMAKERS NURSERY AND PRIMARY SCHOOL")
        c.setFillColor(colors.white); c.setFont("Bold", 26)
        y = H-128*mm
        for line in self.gtitle.split("\n"):
            c.drawCentredString(W/2, y, line); y -= 11*mm
        c.setFont("Body", 11); c.setFillColor(colors.HexColor("#BFD9EA"))
        c.drawCentredString(W/2, y-2*mm, self.audience)
        c.setFont("Body", 9); c.setFillColor(colors.HexColor("#9DB6C7"))
        c.drawCentredString(W/2, 40*mm, "Imparting Wisdom and Morals")
        c.drawCentredString(W/2, 34*mm, "Academic session 2026/2027  ·  LASG Approval No: SLR/14097")
        c.drawCentredString(W/2, 28*mm, "Edition: November 2026")
        c.restoreState()
    def chrome(self, c, d):
        c.saveState(); c.setStrokeColor(LINE); c.setLineWidth(0.6)
        c.line(M, H-15*mm, W-M, H-15*mm); c.line(M, 14*mm, W-M, 14*mm)
        c.drawImage(LOGO, M, H-13.5*mm, 9*mm, 9*mm, preserveAspectRatio=True, mask="auto")
        c.setFont("Bold", 8); c.setFillColor(NAVY); c.drawString(M+11*mm, H-10*mm, "Imagemakers School Management System")
        c.setFont("Body", 8); c.setFillColor(MUTED); c.drawRightString(W-M, H-10*mm, self.gtitle.replace("\n", " "))
        c.drawString(M, 9*mm, "Imagemakers Nursery and Primary School · 2026/2027")
        c.drawRightString(W-M, 9*mm, f"Page {d.page}")
        c.restoreState()

def H1(t): return Paragraph(t, S["h1"])
def H2(t): return Paragraph(t, S["h2"])
def P(t): return Paragraph(t, S["p"])
def B(items): return [Paragraph(i, S["b"], bulletText="•") for i in items]
def STEPS(items):
    rows = [[Paragraph(f"<b>{n}</b>", ParagraphStyle("n", parent=S["cell"], textColor=colors.white, alignment=1)), Paragraph(t, S["cell"])] for n, t in enumerate(items, 1)]
    t = Table(rows, colWidths=[8*mm, W-2*M-8*mm])
    t.setStyle(TableStyle([("BACKGROUND", (0,0), (0,-1), SKY), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LINEBELOW", (1,0), (1,-1), 0.4, LINE), ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING", (1,0), (1,-1), 7)]))
    return [t, Spacer(1, 7)]
def T(rows, widths=None):
    w = W-2*M
    if not widths: widths = [w/len(rows[0])]*len(rows[0])
    else: widths = [w*x for x in widths]
    data = [[Paragraph(str(c), S["cellh"] if i == 0 else S["cell"]) for c in r] for i, r in enumerate(rows)]
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), NAVY), ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, WASH]),
        ("GRID", (0,0), (-1,-1), 0.4, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4)]))
    return [t, Spacer(1, 8)]
def NOTE(t, kind="info"):
    bg, bar = (WARN, WARNL) if kind == "warn" else (WASH, SKY)
    tb = Table([[Paragraph(t, S["note"])]], colWidths=[W-2*M])
    tb.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), bg), ("LINEBEFORE", (0,0), (0,-1), 3, bar),
        ("LEFTPADDING", (0,0), (-1,-1), 9), ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7)]))
    return [tb, Spacer(1, 8)]
def IMG(name, caption, width_mm=70):
    path = os.path.join(SHOTS, name)
    from PIL import Image as PI
    iw, ih = PI.open(path).size
    w = width_mm*mm; h = w*ih/iw
    if h > 150*mm: h = 150*mm; w = h*iw/ih
    im = Image(path, w, h); im.hAlign = "CENTER"
    fr = Table([[im]], colWidths=[w+6]); fr.setStyle(TableStyle([("BOX", (0,0), (-1,-1), 0.6, LINE), ("ALIGN", (0,0), (-1,-1), "CENTER")]))
    return [KeepTogether([fr, Paragraph(caption, S["cap"])])]

class Flow(Flowable):
    """Simple left-to-right process diagram (original vector drawing)."""
    def __init__(self, steps, caption=None):
        super().__init__(); self.steps = steps; self.width = W-2*M; self.height = 26*mm
    def draw(self):
        c = self.canv; n = len(self.steps); gap = 5*mm; bw = (self.width-gap*(n-1))/n
        for i, s in enumerate(self.steps):
            x = i*(bw+gap); c.setFillColor(WASH if i % 2 else colors.white); c.setStrokeColor(SKY); c.setLineWidth(1)
            c.roundRect(x, 4*mm, bw, 18*mm, 3*mm, fill=1, stroke=1)
            c.setFillColor(NAVY); c.setFont("Bold", 7.4)
            words = s.split(); lines = []; cur = ""
            for w_ in words:
                if pdfmetrics.stringWidth(cur+" "+w_, "Bold", 7.4) > bw-4*mm and cur: lines.append(cur); cur = w_
                else: cur = (cur+" "+w_).strip()
            lines.append(cur)
            y0 = 13*mm + (len(lines)-1)*1.6*mm
            for j, l in enumerate(lines[:4]): c.drawCentredString(x+bw/2, y0-j*3.3*mm, l)
            if i < n-1:
                c.setStrokeColor(GOLD); c.setFillColor(GOLD); ax = x+bw+0.8*mm
                c.line(ax, 13*mm, ax+gap-1.6*mm, 13*mm)
                p = c.beginPath(); p.moveTo(ax+gap-1.6*mm, 14.3*mm); p.lineTo(ax+gap-0.4*mm, 13*mm); p.lineTo(ax+gap-1.6*mm, 11.7*mm); c.drawPath(p, fill=1, stroke=0)
def FLOW(steps, caption): return [Flow(steps), Paragraph(caption, S["cap"])]

def build(path, title, audience, story):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    doc = Doc(path, title, audience)
    toc = TableOfContents(); toc.levelStyles = [S["toc1"]]; toc.dotsMinLevel = 0
    full = [NextPageTemplate("body"), PageBreak(), H2("Contents"), toc, PageBreak()] + story
    doc.multiBuild(full)
