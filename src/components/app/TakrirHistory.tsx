import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { takrirDaysInRange } from "@/lib/takrir";
import { localIso } from "@/lib/utils";

const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** All takrir days up to today, newest first, as a list linking to that day. */
export function TakrirHistory() {
  const { students, takrirler } = useStore();
  const [all, setAll] = useState(false);
  const days = takrirDaysInRange(takrirler, "0000-01-01", localIso());
  const ids = new Set(students.map((s) => s.id));
  const shown = all ? days : days.slice(0, 7);

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
  </div>;
}
