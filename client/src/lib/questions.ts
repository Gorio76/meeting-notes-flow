
export type QuestionId = 
  | 'company_referent' // Merged
  | 'context'
  | 'goals'
  | 'positives'
  | 'problems'
  | 'constraints'
  | 'signals'
  | 'order' // New
  | 'next_steps';

export interface Question {
  id: QuestionId;
  title: string;
  placeholder?: string;
  helper?: string;
  inputType: 'text' | 'textarea' | 'bullets' | 'composite_company' | 'order_manager';
}

export const QUESTIONS: Question[] = [
  {
    id: 'company_referent',
    title: "Dati Cliente",
    inputType: 'composite_company',
    placeholder: "Dati generali"
  },
  {
    id: 'context',
    title: "Contesto dell'incontro",
    placeholder: "Meeting conoscitivo, Demo, Follow-up...",
    inputType: 'text'
  },
  {
    id: 'goals',
    title: "Obiettivi", 
    placeholder: "• Obiettivo 1\n• Obiettivo 2",
    helper: "Cosa vogliono ottenere? (Un punto per riga)",
    inputType: 'bullets'
  },
  {
    id: 'positives',
    title: "Punti positivi / Cose che funzionano",
    placeholder: "• Punti di forza attuali\n• Cosa vogliono mantenere",
    helper: "Cosa va bene oggi?",
    inputType: 'bullets'
  },
  {
    id: 'problems',
    title: "Problemi emersi / Esigenze", // Renamed
    placeholder: "• Punti di dolore\n• Inefficienze\n• Rischi",
    helper: "Cosa non funziona oggi?",
    inputType: 'bullets'
  },
  {
    id: 'constraints',
    title: "Vincoli & Budget",
    placeholder: "Tempistiche, budget, tecnologie obbligatorie...",
    inputType: 'textarea'
  },
  {
    id: 'signals',
    title: "Segnali deboli",
    placeholder: "Non detto, dinamiche tra colleghi, dubbi...",
    helper: "Impressioni 'a pelle'.",
    inputType: 'textarea'
  },
  {
    id: 'order',
    title: "Ordine / Preventivo",
    inputType: 'order_manager', // New custom type
    placeholder: "Gestione articoli"
  },
  {
    id: 'next_steps',
    title: "Prossimo Follow-up",
    placeholder: "Data e azione concordata",
    inputType: 'text'
  }
];
