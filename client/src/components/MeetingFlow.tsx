import { MeetingProvider, useMeeting } from './MeetingContext';
import { QuestionStep } from './QuestionStep';
import { SummaryStep } from './SummaryStep';

function FlowController() {
  const { isComplete } = useMeeting();

  return (
    <div className="h-[100dvh] w-full bg-background text-foreground overflow-hidden">
      {isComplete ? <SummaryStep /> : <QuestionStep />}
    </div>
  );
}

export function MeetingApp() {
  return (
    <MeetingProvider>
      <FlowController />
    </MeetingProvider>
  );
}
