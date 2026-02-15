import React, { createContext, useContext, useState, ReactNode } from 'react';
import { QuestionId, QUESTIONS } from '@/lib/questions';

// Order Item Interface
export interface OrderItem {
  id: string;
  code: string;
  description: string;
  grossPrice: number;
  discounts: [number, number, number, number]; // 4 discounts
  quantity: number;
}

// Helper to calculate net price and total
export const calculateLineItem = (item: OrderItem) => {
  let netPrice = item.grossPrice;
  item.discounts.forEach(d => {
    if (d > 0) {
      netPrice = netPrice * (1 - d / 100);
    }
  });
  // Round to 2 decimals for currency stability
  netPrice = Math.round(netPrice * 100) / 100;
  const total = Math.round(netPrice * item.quantity * 100) / 100;
  return { netPrice, total };
};

type Answers = Record<string, string>;

interface MeetingContextType {
  currentStepIndex: number;
  answers: Answers;
  orderItems: OrderItem[]; // New state for order items
  setAnswer: (id: string, value: string) => void;
  addOrderItem: (item: OrderItem) => void;
  updateOrderItem: (id: string, item: OrderItem) => void;
  removeOrderItem: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  reset: () => void;
  isComplete: boolean;
  totalSteps: number;
  currentQuestion: typeof QUESTIONS[0];
  emailRecipient: string;
  setEmailRecipient: (email: string) => void;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [emailRecipient, setEmailRecipient] = useState('');
  
  const totalSteps = QUESTIONS.length;
  const isComplete = currentStepIndex >= totalSteps;

  const setAnswer = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const addOrderItem = (item: OrderItem) => {
    setOrderItems(prev => [...prev, item]);
  };

  const updateOrderItem = (id: string, updatedItem: OrderItem) => {
    setOrderItems(prev => prev.map(item => item.id === id ? updatedItem : item));
  };

  const removeOrderItem = (id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const nextStep = () => {
    if (currentStepIndex < totalSteps) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index <= totalSteps) {
      setCurrentStepIndex(index);
    }
  };

  const reset = () => {
    setAnswers({});
    setOrderItems([]);
    setCurrentStepIndex(0);
    setEmailRecipient('');
  };

  const value = {
    currentStepIndex,
    answers,
    orderItems,
    setAnswer,
    addOrderItem,
    updateOrderItem,
    removeOrderItem,
    nextStep,
    prevStep,
    goToStep,
    reset,
    isComplete,
    totalSteps,
    currentQuestion: QUESTIONS[currentStepIndex] || QUESTIONS[QUESTIONS.length - 1],
    emailRecipient,
    setEmailRecipient
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}
