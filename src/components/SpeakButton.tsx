import { Volume2 } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';

interface SpeakButtonProps {
  text: string;
  className?: string;
}

const SpeakButton = ({ text, className = '' }: SpeakButtonProps) => {
  const { speak } = useTTS();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-all active:scale-90 ${className}`}
      aria-label="Speak"
    >
      <Volume2 className="h-5 w-5" />
    </button>
  );
};

export default SpeakButton;
