import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PdfButton } from "@/components/app/PdfButton";
import { useStore } from "@/lib/store";
import { groupLabel } from "@/lib/groups";
import { takrirDaysInRange, takrirWeeks, weekEnd, weekStart } from "@/lib/takrir";
import { localIso } from "@/lib/utils";

const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const short = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

/** All takrir days up to today, newest first, plus a weekly printable report. */
export function TakrirHistory() {
  const { students, takrirler, group } = useStore();
  const [all, setAll] = useState(false);
  const days = takrirDaysInRange(takrirler, "0000-01-01", localIso());
  const ids = new Set(students.map((s) => s.id));
  const shown = all ? days : days.slice(0, 7);
  const weeks = takrirWeeks(takrirler);
  const thisWeek = weekStart(localIso());
  const options = weeks.includes(thisWeek) ? weeks : [thisWeek, ...weeks];
  const [week, setWeek] = useState(options[0] ?? thisWeek);
  const weekDays = takrirDaysInRange(takrirler, week, weekEnd(week));

  const make = async () => {
    const { makeTakrirPdf } = await import("@/lib/takrir-pdf");
    const blob = await makeTakrirPdf(students, weekDays, week, weekEnd(week), groupLabel(group));
    return { blob, name: `takrir-raporu-${week}.pdf` };
  };
  const print = async () => {
    const w = window.open("", "_blank");
    const { blob } = await make();
    const url = URL.createObjectURL(blob);
    if (w) w.location.href = url; else window.location.href = url;
  };

  return <div className="overflow-hidden rounded-lg border border-border bg-card">
    <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">Geçmiş Takrirler</div>
    {!days.length ? <p className="px-3 py-4 text-sm text-muted-foreground">Henüz takrir yok.</p> : shown.map((d) => {
      const listed = Object.keys(d.results).filter((id) => ids.has(id));
      const verdi = listed.filter((id) => d.results[id]).length;
      return <Link key={d.id} to="/takrir" search={{ date: d.date }} className="flex items-center justify-between gap-3 border-t border-border px-3 py-3 text-sm first:border-t-0 hover:bg-accent">
        <span className="font-medium capitalize">{fmt(d.date)}</span>
        <span className="shrink-0"><span className="font-semibold text-primary">{verdi} verdi</span> · <span className="text-muted-foreground">{listed.length - verdi} vermedi</span></span>
      </Link>;
    })}
    {days.length > 7 && <Button variant="ghost" className="w-full rounded-none border-t border-border" onClick={() => setAll((v) => !v)}>{all ? "Daha az göster" : `Tümünü göster (${days.length})`}</Button>}
    <div className="space-y-2 border-t border-border p-3">
      <label htmlFor="takrir-week" className="block text-xs font-medium text-muted-foreground">Haftalık takrir raporu</label>
      <select id="takrir-week" value={week} onChange={(e) => setWeek(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">
        {options.map((w) => <option key={w} value={w}>{short(w)} – {short(weekEnd(w))}{w === thisWeek ? " (bu hafta)" : ""}</option>)}
      </select>
      <p className="text-xs text-muted-foreground">{weekDays.length ? `${weekDays.length} takrir günü` : "Bu hafta takrir yok."}</p>
      <div className="grid grid-cols-2 gap-2">
        <PdfButton make={make} depsKey={`${week}-${JSON.stringify(weekDays)}-${students.length}`} label="PDF İndir" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-accent disabled:opacity-50" />
        <Button variant="outline" className="h-11" disabled={!weekDays.length} onClick={print}>Yazdır</Button>
      </div>
    </div>
  </div>;
}
