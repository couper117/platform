import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShieldAlert, ShieldCheck, Download, Upload, Loader2, FileText, AlertCircle } from 'lucide-react';
import useUiStore from '../../store/uiStore';

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const STATUS_TONE = {
  consented: 'text-green',
  refused: 'text-red',
  skipped: 'text-rwanda-yellow',
};

/**
 * Collecting parent/guardian consent for athletes registered before it was
 * required (Law N° 058/2021 art. 9).
 *
 * Shared by the admin's per-school page and the school's own portal — the two
 * differ only in which endpoints are passed in, so a coordinator sees the same
 * flow an admin would walk them through.
 */
const ConsentPanel = ({ schoolName, schoolCode, queryKey, onLoad, onDownload, onImport, onDone }) => {
  const pushToast = useUiStore((s) => s.pushToast);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const { data, isLoading, refetch } = useQuery<any>({ queryKey, queryFn: onLoad });
  const status = data?.data;
  const outstanding = status?.outstanding ?? 0;

  const download = useMutation({
    mutationFn: onDownload,
    onSuccess: (blob) => {
      saveBlob(blob, `amashuri-consent-${schoolCode || 'school'}.csv`);
      pushToast('Consent form downloaded. Send it to the school to complete.', 'success');
    },
    onError: async (err: any) => {
      let message = 'Could not build that form.';
      try { message = JSON.parse(await err.response?.data?.text())?.message || message; } catch { /* keep default */ }
      pushToast(message);
    },
  });

  const upload = useMutation({
    mutationFn: ({ f, dryRun }: any) => onImport(f, { dryRun }),
    onSuccess: (res: any) => {
      const r = res.data;
      setResult(r);
      if (r.dryRun) {
        pushToast(`Checked ${r.totalRows} row(s) — ${r.consented} consent(s) ready, ${r.refused} refused. Nothing saved yet.`, 'info');
        return;
      }
      pushToast(`${r.consented} consent(s) recorded, ${r.refused} refused.`, r.refused ? 'info' : 'success');
      refetch();
      onDone?.();
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

  if (isLoading) {
    return <div className="rounded-3xl border border-surface-3 dark:border-white/5 p-6 opacity-40 text-sm">Checking consent…</div>;
  }

  if (outstanding === 0) {
    return (
      <div className="rounded-3xl border border-green/20 bg-green/5 p-6 flex items-start gap-3">
        <ShieldCheck size={20} className="text-green mt-0.5 shrink-0" />
        <div>
          <p className="font-display uppercase tracking-tight text-green">Consent complete</p>
          <p className="text-xs opacity-60 mt-1">
            Every athlete at {schoolName || 'this school'} who needs a parent or guardian&rsquo;s consent has it on file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-rwanda-yellow/30 bg-rwanda-yellow/[0.04] p-6 space-y-5">
      <div className="flex items-start gap-3">
        <ShieldAlert size={20} className="text-rwanda-yellow mt-0.5 shrink-0" />
        <div>
          <p className="font-display text-lg uppercase tracking-tight">
            {outstanding} athlete{outstanding === 1 ? '' : 's'} awaiting guardian consent
          </p>
          <p className="text-xs opacity-60 mt-1 leading-relaxed max-w-2xl">
            These were registered before consent was recorded. Rwandan law N&deg; 058/2021 (article 9) allows a child
            under 16&rsquo;s data to be processed only with a parent or guardian&rsquo;s consent, so they are
            <strong> withheld from published team sheets</strong> until it arrives. If consent is refused, their records
            must be erased.
          </p>
        </div>
      </div>

      {status?.athletes?.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-xl border border-surface-3 dark:border-white/5 bg-white dark:bg-surface-dark2">
          <table className="w-full text-left text-[11px]">
            <tbody className="divide-y divide-surface-3 dark:divide-white/5">
              {status.athletes.map((a) => (
                <tr key={a.id}>
                  <td className="p-2.5 font-mono opacity-30 tabular-nums w-12">{a.id}</td>
                  <td className="p-2.5 font-medium">{a.fullName}</td>
                  <td className="p-2.5 opacity-50">{a.schoolClass || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => download.mutate()}
          disabled={download.isPending}
          className="flex-1 flex items-center justify-center gap-2 bg-rwanda-blue text-white font-display uppercase tracking-widest py-2.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-40"
        >
          {download.isPending ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />}
          <span>Consent form</span>
        </button>
        <label className="flex-1 flex items-center justify-center gap-2 border border-surface-3 dark:border-white/10 font-display uppercase tracking-widest py-2.5 rounded-xl cursor-pointer hover:bg-surface-2 dark:hover:bg-white/5 transition-all">
          <input type="file" className="hidden" accept=".csv,text/csv" onChange={handleFile} disabled={upload.isPending} />
          {upload.isPending ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}
          <span>{file?.name ? 'Choose another' : 'Upload completed form'}</span>
        </label>
      </div>

      {result && (
        <div className="space-y-3 border-t border-surface-3 dark:border-white/5 pt-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs">
            <FileText size={14} className="opacity-40" />
            <span className="font-bold uppercase tracking-widest opacity-60">
              {result.dryRun ? 'Checked — nothing saved yet' : 'Recorded'}
            </span>
            <span className="opacity-40">
              · {result.consented} consented · {result.refused} refused · {result.skipped} skipped
            </span>
          </div>

          {result.refusedAthletes?.length > 0 && (
            <p className="flex items-start gap-2 text-[11px] text-red">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              Consent refused for {result.refusedAthletes.map((a) => a.name).join(', ')} — those records must be erased.
            </p>
          )}

          <div className="max-h-48 overflow-y-auto rounded-xl border border-surface-3 dark:border-white/5 bg-white dark:bg-surface-dark2">
            <table className="w-full text-left text-[11px]">
              <tbody className="divide-y divide-surface-3 dark:divide-white/5">
                {result.report.map((r) => (
                  <tr key={r.row}>
                    <td className="p-2.5 font-mono opacity-30 tabular-nums w-12">{r.line}</td>
                    <td className="p-2.5 font-medium">{r.name || <span className="opacity-30">—</span>}</td>
                    <td className={`p-2.5 ${STATUS_TONE[r.status] || 'opacity-60'}`}>
                      {r.reason || (r.status === 'consented' ? `consent by ${r.guardianName}` : r.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {checked && checked.consented > 0 && (
            <button
              onClick={() => upload.mutate({ f: file, dryRun: false })}
              disabled={upload.isPending}
              className="w-full flex items-center justify-center gap-2 bg-green text-white font-display uppercase tracking-widest py-2.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-40"
            >
              {upload.isPending ? <Loader2 className="animate-spin" size={15} /> : <ShieldCheck size={15} />}
              <span>Record {checked.consented} consent{checked.consented === 1 ? '' : 's'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsentPanel;
