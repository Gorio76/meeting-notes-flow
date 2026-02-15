import { useMeeting } from './MeetingContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, Menu } from 'lucide-react';
import { QUESTIONS } from '@/lib/questions';
import { useRef, useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OrderManager } from './OrderManager';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";

export function QuestionStep() {
  const { 
    currentQuestion, 
    answers, 
    setAnswer, 
    nextStep, 
    prevStep, 
    goToStep,
    currentStepIndex, 
    totalSteps 
  } = useMeeting();
  
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Composite State for Company/Referent
  const [companyName, setCompanyName] = useState('');
  const [referentName, setReferentName] = useState('');

  // Sync composite state with answers when mounting or changing step
  useEffect(() => {
    if (currentQuestion.inputType === 'composite_company') {
      const saved = answers[currentQuestion.id];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCompanyName(parsed.company || '');
          setReferentName(parsed.referent || '');
        } catch {
          // Fallback if legacy or simple string
          setCompanyName(saved);
        }
      } else {
        setCompanyName('');
        setReferentName('');
      }
    }
  }, [currentQuestion.id, answers]);

  // Update composite answer
  useEffect(() => {
    if (currentQuestion.inputType === 'composite_company') {
      const compositeValue = JSON.stringify({ company: companyName, referent: referentName });
      if (compositeValue !== answers[currentQuestion.id]) {
         setAnswer(currentQuestion.id, compositeValue);
      }
    }
  }, [companyName, referentName, currentQuestion.inputType]);

  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Auto-focus logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentQuestion.inputType !== 'order_manager') {
         inputRef.current?.focus();
      }
      
      // Smart bullet initialization
      if (currentQuestion.inputType === 'bullets' && !answers[currentQuestion.id]) {
        setAnswer(currentQuestion.id, '• ');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [currentQuestion.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        
        // Bullet logic
        if (currentQuestion.inputType === 'bullets') {
          e.preventDefault();
          const textarea = e.currentTarget as HTMLTextAreaElement;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const currentVal = textarea.value;
          
          // Check if current line is empty bullet "• "
          const lastNewLine = currentVal.lastIndexOf('\n', start - 1);
          const currentLine = currentVal.substring(lastNewLine + 1, start);
          
          if (currentLine.trim() === '•') {
             const newValue = currentVal.substring(0, lastNewLine !== -1 ? lastNewLine : 0) + currentVal.substring(end);
             setAnswer(currentQuestion.id, newValue.trim());
             nextStep();
             return;
          }

          const newValue = currentVal.substring(0, start) + '\n• ' + currentVal.substring(end);
          setAnswer(currentQuestion.id, newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 3;
            textarea.scrollTop = textarea.scrollHeight;
          }, 0);
          return;
        }
        
        if (currentQuestion.inputType !== 'textarea' && currentQuestion.inputType !== 'order_manager') {
           e.preventDefault();
           nextStep();
           return;
        }
      }
    }
  };

  const handleBulletChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswer(currentQuestion.id, e.target.value);
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-6 relative">
      {/* Header with Menu */}
      <div className="flex items-center justify-between mb-6">
         <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
            <SheetHeader className="p-6 border-b">
              <SheetTitle className="text-left font-display text-xl">Indice</SheetTitle>
            </SheetHeader>
            <div className="py-2 overflow-y-auto max-h-[calc(100vh-80px)]">
              {QUESTIONS.map((q, idx) => (
                <SheetClose key={q.id} asChild>
                  <button
                    onClick={() => goToStep(idx)}
                    className={`w-full text-left px-6 py-4 transition-colors hover:bg-muted/50 flex items-center gap-3 ${
                      idx === currentStepIndex ? 'bg-primary/5 font-medium text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs border ${
                       idx === currentStepIndex ? 'border-primary bg-primary text-primary-foreground' : 
                       answers[q.id] ? 'border-primary/50 text-primary/50' : 'border-muted-foreground/30 text-muted-foreground/50'
                    }`}>
                      {idx + 1}
                    </div>
                    {q.title}
                  </button>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex-1 mx-4">
           <Progress value={progress} className="h-2" />
        </div>
        
        <div className="text-xs font-mono text-muted-foreground w-12 text-right">
          {currentStepIndex + 1}/{totalSteps}
        </div>
      </div>

      <AnimatePresence mode='wait'>
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col min-h-0"
        >
          <h1 className="text-3xl font-display font-bold leading-tight mb-2">
            {currentQuestion.title}
          </h1>
          {currentQuestion.helper && (
            <p className="text-muted-foreground mb-6">{currentQuestion.helper}</p>
          )}

          <div className="flex-1 relative mt-2 min-h-[200px] flex flex-col">
            {currentQuestion.inputType === 'composite_company' ? (
              <div className="space-y-6 pt-4">
                 <div className="space-y-2">
                    <Label htmlFor="company" className="text-base font-medium text-primary/80">Ragione Sociale</Label>
                    <Input 
                      id="company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Nome Azienda S.p.A."
                      className="text-lg p-6 h-14"
                      autoFocus
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="referent" className="text-base font-medium text-primary/80">Referente</Label>
                    <Input 
                      id="referent"
                      value={referentName}
                      onChange={(e) => setReferentName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Nome e Ruolo"
                      className="text-lg p-6 h-14"
                    />
                 </div>
              </div>
            ) : currentQuestion.inputType === 'order_manager' ? (
              <OrderManager />
            ) : currentQuestion.inputType === 'text' ? (
               <Input
                 ref={inputRef as any}
                 value={answers[currentQuestion.id] || ''}
                 onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder={currentQuestion.placeholder}
                 className="text-lg p-4 h-14 border-input focus-visible:ring-1"
               />
            ) : (
              <Textarea
                ref={inputRef as any}
                value={answers[currentQuestion.id] || ''}
                onChange={currentQuestion.inputType === 'bullets' ? handleBulletChange : (e) => setAnswer(currentQuestion.id, e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentQuestion.placeholder}
                className="w-full h-full text-lg p-0 border-none resize-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40 leading-relaxed font-sans"
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-auto pt-6 flex gap-4">
        {currentStepIndex > 0 && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevStep}
            className="h-14 w-14 rounded-full shrink-0 border border-input"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        
        <Button 
          onClick={nextStep}
          className="h-14 flex-1 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all"
        >
          {currentStepIndex === totalSteps - 1 ? 'Termina' : 'Avanti'}
          {currentStepIndex !== totalSteps - 1 && <ChevronRight className="ml-2 h-5 w-5" />}
          {currentStepIndex === totalSteps - 1 && <Check className="ml-2 h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
