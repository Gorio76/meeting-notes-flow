import { useMeeting, calculateLineItem } from './MeetingContext';
import { QUESTIONS } from '@/lib/questions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Mail, RefreshCw, ArrowLeft, PenLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export function SummaryStep() {
  const { answers, orderItems, reset, prevStep, emailRecipient, setEmailRecipient, goToStep } =
    useMeeting();
  const { toast } = useToast();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);

  // ===== Helpers robusti per testo email / CRM =====

  const fmt2it = (n: number) => {
    const v = Number.isFinite(n) ? n : 0;
    return v.toFixed(2).replace('.', ',');
  };

  const fmtPct = (x: unknown) => {
    const n = Number(x ?? 0);
    if (!Number.isFinite(n)) return '0';
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(2).replace('.', ',');
  };

  const oneLine = (s: unknown) => (s ?? '').toString().replace(/\s+/g, ' ').trim();

  const cleanBulletLine = (s: string) =>
    s
      .toString()
      .replace(/^[-•\s]+/, '')
      .replace(/\s+/g, ' ')
      .trim();

  const splitToBullets = (val: string) =>
    val
      .split('\n')
      .map((l) => cleanBulletLine(l))
      .filter((l) => l.length > 0);

  const labelify = (title: string) =>
    title
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .replace(/[’']/g, "'")
      .trim();

  // Escape stile CSV con separatore ;
  const csvCell = (v: unknown) => {
    const s = oneLine(v);
    if (/[;"]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  // ===== Generazione Report =====

  const generateReport = () => {
    const dateStr = new Date().toLocaleDateString('it-IT');

    let company = '';
    let referent = '';

    const compositeKey = QUESTIONS.find((q) => q.inputType === 'composite_company')?.id;
    const compositeVal =
      (compositeKey && answers[compositeKey]) || (answers as any)['company_referent'];

    if (compositeVal) {
      try {
        const p = JSON.parse(compositeVal);
        company = oneLine(p.company || '');
        referent = oneLine(p.referent || p.referente || '');
      } catch {
        // ignore
      }
    }

    const lines: string[] = [];

    // Header compatto
    lines.push(`MEETING_REPORT;${dateStr}`);
    if (company) lines.push(`RAGIONE_SOCIALE;${csvCell(company)}`);
    if (referent) lines.push(`REFERENTE;${csvCell(referent)}`);
    lines.push('');

    // Domande
    QUESTIONS.forEach((q) => {
      if (q.inputType === 'order_manager') return;

      const val = answers[q.id];
      if (!val) return;

      const label = labelify(q.title);

      if (q.inputType === 'composite_company') {
        try {
          const p = JSON.parse(val);
          const c = oneLine(p.company || '');
          const r = oneLine(p.referent || p.referente || '');
          if (c) lines.push(`${label};AZIENDA;${csvCell(c)}`);
          if (r) lines.push(`${label};REFERENTE;${csvCell(r)}`);
        } catch {
          lines.push(`${label};${csvCell(val)}`);
        }
        return;
      }

      if (typeof val === 'string' && val.includes('\n')) {
        const bullets = splitToBullets(val);
        if (bullets.length) {
          bullets.forEach((b, i) => lines.push(`${label};${i + 1};${csvCell(b)}`));
          return;
        }
      }

      lines.push(`${label};${csvCell(val)}`);
    });

    // ORDINE
    if (orderItems.length > 0) {
      lines.push('');
      lines.push('ORDINE;');
      lines.push(
        'CODICE;DESCRIZIONE;QTA;LISTINO_LORDO;SCONTO1_%;SCONTO2_%;SCONTO3_%;SCONTO4_%;NETTO_UNIT;TOTALE_RIGA'
      );

      let grandTotal = 0;

      orderItems.forEach((item: any) => {
        const { netPrice, total } = calculateLineItem(item);
        grandTotal += total;

        const d1 = item?.discount1 ?? item?.discount_1 ?? item?.discounts?.[0] ?? 0;
        const d2 = item?.discount2 ?? item?.discount_2 ?? item?.discounts?.[1] ?? 0;
        const d3 = item?.discount3 ?? item?.discount_3 ?? item?.discounts?.[2] ?? 0;
        const d4 = item?.discount4 ?? item?.discount_4 ?? item?.discounts?.[3] ?? 0;

        const code = csvCell(item.code);
        const desc = csvCell(item.description);
        const qty = csvCell(item.quantity ?? 0);

        const gross = Number(item.grossPrice ?? item.listPrice ?? 0);

        lines.push(
          `${code};${desc};${qty};${fmt2it(gross)};${fmtPct(d1)};${fmtPct(
            d2
          )};${fmtPct(d3)};${fmtPct(d4)};${fmt2it(netPrice)};${fmt2it(total)}`
        );
      });

      lines.push('');
      lines.push(`TOTALE_NETTO_ORDINE;${fmt2it(grandTotal)}`);
    }

    return lines.join('\r\n');
  };

  // ===== Actions =====

  const handleCopy = () => {
    const text = generateReport();
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiato negli appunti', duration: 2000 });
  };

  const handleEmail = () => {
    if (!emailRecipient?.trim()) {
      toast({ title: 'Inserisci una email destinatario', duration: 2500 });
      return;
    }

    const text = generateReport();

    let clientName = 'Nuovo Meeting';

    const compositeKey = QUESTIONS.find((q) => q.inputType === 'composite_company')?.id;
    const compositeVal =
      (compositeKey && answers[compositeKey]) || (answers as any)['company_referent'];

    if (compositeVal) {
      try {
        const cData = JSON.parse(compositeVal || '{}');
        if (cData.company) clientName = oneLine(cData.company);
      } catch {}
    }

    const dateStr = new Date().toLocaleDateString('it-IT');
    const subject = `Meeting Report; ${clientName}; ${dateStr}`;

    const body = encodeURIComponent(text);

    const mailtoLink = `mailto:${emailRecipient}?subject=${encodeURIComponent(
      subject
    )}&body=${body}`;

    window.location.href = mailtoLink;
  };

  // ===== UI =====

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-6 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 overflow-y-auto pb-6 scrollbar-none"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Riepilogo</h1>
          <p className="text-muted-foreground">Ecco i tuoi appunti strutturati.</p>
        </div>

        <div className="space-y-6">
          {QUESTIONS.map((q, idx) => {
            if (q.inputType === 'order_manager') {
              if (orderItems.length === 0) return null;
              const grandTotal = orderItems.reduce(
                (acc, i) => acc + calculateLineItem(i).total,
                0
              );

              return (
                <div key={q.id} className="border-b border-border pb-4 last:border-0 group relative">
                  <div className="flex justify-between items-baseline mb-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {q.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => goToStep(idx)}
                    >
                      <PenLine className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden text-sm">
                    <table className="w-full">
                      <thead className="bg-muted/50 text-xs">
                        <tr>
                          <th className="p-2 text-left">Articolo</th>
                          <th className="p-2 text-right">Qta</th>
                          <th className="p-2 text-right">Tot</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orderItems.map((item) => {
                          const { total } = calculateLineItem(item);
                          return (
                            <tr key={item.id}>
                              <td className="p-2">
                                <div className="font-mono font-bold text-xs">
                                  {item.code}
                                </div>
                                <div className="truncate max-w-[120px]">
                                  {item.description}
                                </div>
                              </td>
                              <td className="p-2 text-right">{item.quantity}</td>
                              <td className="p-2 text-right font-medium">
                                {formatCurrency(total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-muted/30 font-bold">
                        <tr>
                          <td colSpan={2} className="p-2 text-right">
                            TOTALE
                          </td>
                          <td className="p-2 text-right">
                            {formatCurrency(grandTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            }

            const val = answers[q.id];
            if (!val) return null;

            let displayVal = val;
            if (q.inputType === 'composite_company') {
              try {
                const p = JSON.parse(val);
                displayVal = `Azienda: ${p.company}\nReferente: ${p.referent}`;
              } catch {}
            }

            return (
              <div key={q.id} className="border-b border-border pb-4 last:border-0 group relative">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {q.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => goToStep(idx)}
                  >
                    <PenLine className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-base whitespace-pre-wrap leading-relaxed">
                  {displayVal}
                </div>
              </div>
            );
          })}

          {Object.values(answers).every((v) => !v) && orderItems.length === 0 && (
            <p className="text-center text-muted-foreground italic py-10">
              Nessun appunto preso.
            </p>
          )}
        </div>
      </motion.div>

      <div className="pt-4 mt-auto border-t bg-background/80 backdrop-blur-sm space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground ml-1">
            Invia a:
          </label>
          <Input
            type="email"
            placeholder="email@esempio.com"
            value={emailRecipient}
            onChange={(e) => setEmailRecipient(e.target.value)}
            className="bg-muted/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copia
          </Button>
          <Button className="h-12" onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Invia Email
          </Button>
        </div>

        <div className="flex justify-between items-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevStep}
            className="text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Nuovo Meeting
          </Button>
        </div>

        <div className="text-center pt-2 pb-1">
          <p className="text-[10px] text-muted-foreground/50 font-medium">
            Strumento sviluppato da Christian Gorio – www.gorio.org
          </p>
        </div>
      </div>
    </div>
  );
}
