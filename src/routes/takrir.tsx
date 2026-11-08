import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Calendar, CalendarCheck, Check, Plus, Trash2 } from "@/components/app/icons";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { groupLabel } from "@/lib/groups";
import { localIso } from "@/lib/utils";
import { takrirRange, takrirDaysInRange, takrirStats, type TakrirRange } from "@/lib/takrir";

export const Route = createFileRoute("/takrir")({
  head: () => ({ meta: [
    { title: "Takrir — Kur'an Kursu" },
    { name: "description", content: "Takrir yapılan günleri oluşturun ve talebelerin takrir verdiğini kaydedin." },
    { property: "og:title", content: "Takrir — Kur'an Kursu" },
    { property: "og:description", content: "Takrir günleri ve talebelerin takrir kayıtları." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Takrir,
});

function Takrir() {
  const { students, takrirler, addTakrirDay, markTakrir, removeTakrirDay, group } = useStore();
  const [date, setDate] = useState(localIso());
  const [filter, setFilter] = useState<"all" | "verdi" | "vermedi">("all");
  const session = takrirler.find((d) => d.date === date);
  const verdiCount = students.filter((s) => session?.results[s.id] === true).length;
  const visibleStudents = filter === "all" ? students : students.filter((s) => (session?.results[s.id] === true) === (filter === "verdi"));

  return <>
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-serif text-3xl font-bold">Takrir</h2>
        <p className="mt-1 text-sm text-muted-foreground">{groupLabel(group)} Grubu</p>
      </div>
      <Button variant="ghost" size="sm" asChild className="shrink-0"><Link to="/menu"><ArrowLeft /> Menü</Link></Button>
    </div>
    <div className="mt-5 border-y border-border py-4">
      <label className="block text-xs font-medium text-muted-foreground" htmlFor="takrir-date">Takrir tarihi</label>
      <div className="mt-2 flex min-w-0 items-center gap-2">
      <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3">
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input id="takrir-date" aria-label="Takrir tarihi" type="date" value={date} onChange={(e) => { if (e.target.value) setDate(e.target.value); }} className="h-full w-full min-w-0 bg-transparent text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>
      {session ? <Button variant="outline" size="icon" aria-label="Takriri sil" title="Takriri sil" className="h-11 w-11 shrink-0 text-destructive" onClick={() => { if (confirm("Bu günün takririni silmek istiyor musunuz?")) removeTakrirDay(date); }}><Trash2 /></Button>
        : <Button className="h-11 shrink-0 gap-1.5 px-3 text-xs" disabled={!students.length} onClick={() => addTakrirDay(date)}><Plus className="h-4 w-4" />Takrir Oluştur</Button>}
      </div>
    </div>
    {!students.length || !session ? <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
        <CalendarCheck className="h-9 w-9 text-primary/60" strokeWidth={1.5} />
        <p className="text-center text-sm">{!students.length ? "Henüz talebe yok." : "Bu gün takrir yok."}</p>
      </div>
      : <div className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-2 text-sm">
          <button type="button" aria-pressed={filter === "verdi"} onClick={() => setFilter((current) => current === "verdi" ? "all" : "verdi")} className={`rounded-md px-2 py-1 font-semibold transition-colors ${filter === "verdi" ? "bg-primary text-primary-foreground" : "text-primary hover:bg-accent"}`}>{verdiCount} verdi</button>
          <button type="button" aria-pressed={filter === "vermedi"} onClick={() => setFilter((current) => current === "vermedi" ? "all" : "vermedi")} className={`rounded-md px-2 py-1 transition-colors ${filter === "vermedi" ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>{students.length - verdiCount} vermedi</button>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
        {visibleStudents.map((s) => {
          const verdi = session.results[s.id] === true;
          return <div key={s.id} className="flex min-h-16 items-center gap-3 border-t border-border px-3 py-3 first:border-t-0">
            <Link to="/talebe/$name" params={{ name: s.id }} className="min-w-0 flex-1 break-words text-sm font-medium leading-relaxed hover:text-primary hover:underline">{s.name}</Link>
            <Button variant="outline" size="sm" aria-label={`${s.name} Takrir ${verdi ? "Verdi" : "Vermedi"}`} aria-pressed={verdi} onClick={() => markTakrir(date, s.id, !verdi)} className={`relative h-10 w-24 shrink-0 justify-center px-2 ${verdi ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-foreground"}`}>
              <Check className={`absolute left-2 h-4 w-4 ${verdi ? "opacity-100" : "opacity-0"}`} />
              <span className="text-center">{verdi ? "Verdi" : "Vermedi"}</span>
            </Button>
          </div>;
        })}
        </div>
      </div>}
    <TakrirHistory onOpen={(d) => { setDate(d); setFilter("all"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
  </>;
}

const RANGES: { id: TakrirRange; label: string }[] = [
  { id: "dun", label: "Dün" },
  { id: "bu-hafta", label: "Bu Hafta" },
  { id: "gecen-hafta", label: "Geçen Hafta" },
];

function fmt(dateIso: string) {
  const [y, m, d] = dateIso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
}

function TakrirHistory({ onOpen }: { onOpen: (date: string) => void }) {
  const { students, takrirler } = useStore();
  const [range, setRange] = useState<TakrirRange>("dun");
  const { from, to } = takrirRange(range, new Date());
  const days = takrirDaysInRange(takrirler, from, to);
  const ids = new Set(students.map((s) => s.id));
  const summary = students.map((s) => ({ s, ...takrirStats(days, s.id) })).filter((r) => r.verdi + r.vermedi > 0);

  return <section className="mt-8 border-t border-border pt-5">
    <h3 className="font-serif text-xl font-bold">Geçmiş Takrirler</h3>
    <div className="mt-3 grid grid-cols-3 gap-2">
      {RANGES.map((r) => <Button key={r.id} variant={range === r.id ? "default" : "outline"} size="sm" onClick={() => setRange(r.id)}>{r.label}</Button>)}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`}</p>
    {!days.length ? <p className="py-8 text-center text-sm text-muted-foreground">Bu aralıkta takrir yok.</p> : <>
      <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
        {days.map((d) => {
          const listed = Object.keys(d.results).filter((id) => ids.has(id));
          const verdi = listed.filter((id) => d.results[id]).length;
          return <button key={d.id} type="button" onClick={() => onOpen(d.date)} className="flex w-full items-center justify-between gap-3 border-t border-border px-3 py-3 text-left text-sm first:border-t-0 hover:bg-accent">
            <span className="font-medium capitalize">{fmt(d.date)}</span>
            <span className="shrink-0"><span className="font-semibold text-primary">{verdi} verdi</span> · <span className="text-muted-foreground">{listed.length - verdi} vermedi</span></span>
          </button>;
        })}
      </div>
      {days.length > 1 && summary.length > 0 && <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">Talebe özeti ({days.length} takrir günü)</div>
        {summary.map(({ s, verdi, vermedi }) => <div key={s.id} className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5 text-sm">
          <span className="min-w-0 break-words">{s.name}</span>
          <span className="shrink-0"><span className="font-semibold text-primary">{verdi} verdi</span> · <span className="text-muted-foreground">{vermedi} vermedi</span></span>
        </div>)}
      </div>}
    </>}
  </section>;
}