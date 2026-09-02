import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, Upload, FileText, Loader2, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import useUiStore from '../../store/uiStore';

const GENDERS = ['MALE', 'FEMALE', 'MIXED', 'INCLUSIVE'];
const AGE_CATEGORIES = ['U13', 'U15', 'U17', 'U20', 'OPEN'];

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * The two halves of roster registration, side by side: take a blank form for a
 * team, and send the filled one back.
 *
 * Shared by the Amashuri admin's per-school page and the school coordinator's own
 * portal — they differ only in which endpoints are passed in, so the school never
 * sees a different flow from the one the admin walks them through.
 */
const RosterWorkbench = ({ schoolName, schoolCode, onDownloadForm, onImport, onImported }) => {
  const pushToast = useUiStore((s) => s.pushToast);
  const [team, setTeam] = useState({ sportId: '', gender: 'MALE', ageCategory: 'U17', rows: 25 });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const { data: sports } = useQuery({ queryKey: ['sports'], queryFn: getSports });
  const sportList = sports?.data || [];

  const download = useMutation({
    mutationFn: () => onDownloadForm({ ...team, sportId: Number(team.sportId) }),
    onSuccess: (blob) => {
      const sport = sportList.find((s) => String(s.id) === String(team.sportId));
      saveBlob(blob, `amashuri-roster-${schoolCode || 'school'}-${sport?.name || 'team'}-${team.gender}-${team.ageCategory}.csv`);
      pushToast('Registration form downloaded. Send it to the school to fill in.', 'success');
    },
    onError: async (err: any) => {
      // An error body still arrives as a blob because of responseType: 'blob'.
      let message = 'Could not build that form.';
      try { message = JSON.parse(await err.response?.data?.text())?.message || message; } catch { /* keep default */ }
      pushToast(message);
    },
  });

  const upload = useMutation({
    mutationFn: ({ f, dryRun }: any) => onImport(f, { dryRun }),
    onSuccess: (data: any) => {
      const r = data.data;
      setResult(r);
      if (r.dryRun) {
        pushToast(
          `Checked ${r.totalRows} row(s) — ${r.created} ready, ${r.skipped} would be skipped. Nothing saved yet.`,
          r.skipped ? 'info' : 'success'
        );
        return;
      }
      pushToast(`Registered ${r.created} athlete(s), ${r.skipped} skipped.`, r.skipped ? 'info' : 'success');
      onImported?.();
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Could not read that file.'),
  });

  const handleFile = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    setFile(picked);
    setResult(null);
    upload.mutate({ f: picked, dryRun: true });
  };

  const checked = result?.dryRun ? result : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── 1. Give the school its form ── */}
      <div className="bg-white dark:bg-surface-dark2 rounded-3xl border border-surface-3 dark:border-white/5 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rwanda-blue/10 text-rwanda-blue"><Download size={18} /></span>
          <div>
            <h3 className="font-display text-lg uppercase tracking-tight">1 · Registration form</h3>
            <p className="text-[10px] uppercase tracking-widest opacity-40">Give this to {schoolName || 'the school'} to fill in</p>
          </div>
        </div>

        <p className="text-xs opacity-60 leading-relaxed">
          Pick the team the athletes are being registered for. The form remembers that choice in its own header,
          so the school only types athlete details — name, nationality, date of birth, parent/guardian phone,
          class and student code.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Sport</span>
            <select
              value={team.sportId}
              onChange={(e) => setTeam({ ...team, sportId: e.target.value })}
              className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-3 rounded-xl text-sm outline-none"
            >
              <option value="">Choose a sport…</option>
              {sportList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Age category</span>
            <select
              value={team.ageCategory}
              onChange={(e) => setTeam({ ...team, ageCategory: e.target.value })}
              className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-3 rounded-xl text-sm outline-none"
            >
              {AGE_CATEGORIES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Team</span>
            <select
              value={team.gender}
              onChange={(e) => setTeam({ ...team, gender: e.target.value })}
              className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-3 rounded-xl text-sm outline-none"
            >
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Blank rows</span>
            <input
              type="number" min={1} max={200} value={team.rows}
              onChange={(e) => setTeam({ ...team, rows: Number(e.target.value) })}
              className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-3 rounded-xl text-sm outline-none"
            />
          </label>
        </div>

        {(team.gender === 'MIXED' || team.gender === 'INCLUSIVE') && (
          <p className="flex items-start gap-2 text-[11px] text-rwanda-yellow">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            A {team.gender} team form also asks for each athlete's own gender.
          </p>
        )}

        <button
          onClick={() => download.mutate()}
          disabled={!team.sportId || download.isPending}
          className="w-full flex items-center justify-center gap-2 bg-rwanda-blue text-white font-display text-base uppercase tracking-widest py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {download.isPending ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          <span>Download form</span>
        </button>
      </div>

      {/* ── 2. Take the filled form back ── */}
      <div className="bg-white dark:bg-surface-dark2 rounded-3xl border border-surface-3 dark:border-white/5 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green/10 text-green"><Upload size={18} /></span>
          <div>
            <h3 className="font-display text-lg uppercase tracking-tight">2 · Filled form</h3>
            <p className="text-[10px] uppercase tracking-widest opacity-40">Upload it — it is checked before anything is saved</p>
          </div>
        </div>

        <div className="p-8 border-2 border-dashed border-surface-3 dark:border-white/10 rounded-2xl text-center">
          <input type="file" id="roster-upload" className="hidden" accept=".csv,text/csv" onChange={handleFile} disabled={upload.isPending} />
          <label htmlFor="roster-upload" className="block cursor-pointer space-y-3">
            <span className="inline-block p-3 bg-surface-2 dark:bg-white/5 rounded-xl opacity-40">
              {upload.isPending ? <Loader2 size={32} className="animate-spin" /> : <FileText size={32} />}
            </span>
            <span className="block font-bold uppercase text-[10px] tracking-[0.3em]">
              {upload.isPending
                ? (upload.variables?.dryRun ? 'Checking…' : 'Registering…')
                : file?.name || 'Click to choose the filled CSV'}
            </span>
          </label>
        </div>

        {result && (
          <div className="space-y-4 animate-in fade-in">
            <div className={`flex items-center gap-2 ${result.dryRun ? 'text-rwanda-blue' : 'text-green'}`}>
              {result.dryRun ? <ShieldCheck size={18} /> : <CheckCircle2 size={18} />}
              <p className="font-display uppercase tracking-tight">
                {result.dryRun ? 'Checked — nothing saved yet' : 'Athletes registered'}
              </p>
            </div>

            {result.form?.school && (
              <p className="text-[11px] opacity-50">
                Form for <strong>{result.form.school}</strong> · {result.form.sport} · {result.form.gender} · {result.form.ageCategory}
              </p>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[
                ['Rows', result.totalRows, ''],
                [result.dryRun ? 'Ready' : 'Registered', result.created, 'text-green'],
                ['Skipped', result.skipped, 'text-rwanda-yellow'],
              ].map(([label, value, tone]: any) => (
                <div key={label} className="p-3 bg-surface-2 dark:bg-white/5 rounded-xl text-center">
                  <span className={`block text-xl font-display ${tone}`}>{value}</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">{label}</span>
                </div>
              ))}
            </div>

            {result.warnings?.map((w, i) => (
              <p key={i} className="flex items-start gap-2 text-[11px] text-rwanda-yellow">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />{w}
              </p>
            ))}

            {result.report?.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-surface-3 dark:border-white/5">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 bg-surface-2 dark:bg-surface-dark2">
                    <tr className="text-[9px] uppercase font-bold tracking-widest opacity-40">
                      <th className="p-2.5">Line</th><th className="p-2.5">Athlete</th><th className="p-2.5">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-3 dark:divide-white/5">
                    {result.report.map((r) => (
                      <tr key={r.row} className={r.status === 'skipped' ? 'bg-red/[0.03]' : undefined}>
                        <td className="p-2.5 font-mono opacity-40 tabular-nums">{r.line}</td>
                        <td className="p-2.5 font-medium">{r.name || <span className="opacity-30">—</span>}</td>
                        <td className={`p-2.5 ${r.status === 'skipped' ? 'text-red' : 'text-green'}`}>
                          {r.reason || (result.dryRun ? 'Ready' : 'Registered')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {checked && (
              <div className="flex gap-2">
                <button
                  onClick={() => upload.mutate({ f: file, dryRun: false })}
                  disabled={!checked.created || upload.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-green text-white font-display uppercase tracking-widest py-2.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {upload.isPending ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}
                  <span>Register {checked.created}</span>
                </button>
                <button
                  onClick={() => { setFile(null); setResult(null); }}
                  className="px-5 py-2.5 rounded-xl border border-surface-3 dark:border-white/10 font-display uppercase tracking-widest text-xs opacity-60 hover:opacity-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RosterWorkbench;
