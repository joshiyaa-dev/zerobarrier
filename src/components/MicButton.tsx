import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, getLanguage } from '@/lib/i18n';
import { sampleJobs } from '@/lib/jobData';
import { useTTS } from '@/hooks/useTTS';
import micImg from '@/assets/icons/mic.png';

type VoiceState = 'idle' | 'listening' | 'processing' | 'result';

interface MicButtonProps {
  mode?: 'worker' | 'employer';
}

const MicButton = ({ mode = 'worker' }: MicButtonProps) => {
  const [state, setState] = useState<VoiceState>('idle');
  const [resultText, setResultText] = useState('');
  const [matchedJobs, setMatchedJobs] = useState<typeof sampleJobs>([]);
  const navigate = useNavigate();
  const { speak } = useTTS();
  const lang = getLanguage();

  const simulateWorkerVoice = () => {
    setState('listening');
    speak(t('listening'));

    setTimeout(() => {
      setState('processing');
      // Simulate finding matching jobs
      const matched = sampleJobs.slice(0, 3);
      setTimeout(() => {
        setMatchedJobs(matched);
        setState('result');
        const msg = lang === 'ta'
          ? `${matched.length} வேலைகள் கிடைத்தன`
          : `Found ${matched.length} matching jobs`;
        setResultText(msg);
        speak(msg);
      }, 1500);
    }, 2500);
  };

  const simulateEmployerVoice = () => {
    setState('listening');
    speak(t('listening'));

    setTimeout(() => {
      setState('processing');
      setTimeout(() => {
        setState('result');
        const msg = lang === 'ta'
          ? 'வேலை பதிவு செய்யப்பட்டது! 20 தொழிலாளர்கள் தேவை'
          : 'Job posted! Need 20 workers';
        setResultText(msg);
        speak(msg);
      }, 1500);
    }, 2500);
  };

  const toggle = () => {
    if (state !== 'idle') {
      setState('idle');
      setMatchedJobs([]);
      setResultText('');
      return;
    }
    if (mode === 'worker') simulateWorkerVoice();
    else simulateEmployerVoice();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {state === 'listening' && (
          <div className="absolute inset-0 rounded-full bg-destructive/20 animate-mic-ring" />
        )}
        {state === 'processing' && (
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
        )}
        <button
          onClick={toggle}
          className={`relative z-10 flex h-32 w-32 items-center justify-center rounded-full shadow-xl transition-all active:scale-90 ${
            state === 'listening'
              ? 'bg-destructive animate-mic-pulse'
              : state === 'processing'
              ? 'bg-accent'
              : 'bg-primary'
          }`}
        >
          <img src={micImg} alt="Microphone" className="h-20 w-20 rounded-full object-cover" />
        </button>
      </div>

      <span className={`text-lg font-semibold ${
        state === 'listening' ? 'text-destructive' :
        state === 'processing' ? 'text-accent' :
        'text-muted-foreground'
      }`}>
        {state === 'idle' && t('tapToSpeak')}
        {state === 'listening' && t('listening')}
        {state === 'processing' && (lang === 'ta' ? 'செயலாக்கம்...' : 'Processing...')}
        {state === 'result' && resultText}
      </span>

      {/* Show matched jobs for worker */}
      {state === 'result' && mode === 'worker' && matchedJobs.length > 0 && (
        <div className="mt-4 w-full max-w-sm flex flex-col gap-2 animate-fade-in-up">
          {matchedJobs.map((job) => (
            <button
              key={job.id}
              onClick={() => navigate(`/worker/jobs/${job.id}`)}
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-md active:scale-[0.98]"
            >
              <img src={job.image} alt={job.titleEn} className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
              <div className="flex-1 text-left">
                <p className="font-bold text-card-foreground">
                  {lang === 'ta' ? job.titleTa : job.titleEn}
                </p>
                <p className="text-sm text-muted-foreground">
                  ₹{job.salary.toLocaleString()}{t('perMonth')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Employer result: job posted confirmation */}
      {state === 'result' && mode === 'employer' && (
        <div className="mt-4 w-full max-w-sm animate-fade-in-up">
          <div className="rounded-2xl bg-success/10 p-6 text-center">
            <img src={micImg} alt="Success" className="mx-auto h-16 w-16 mb-3 rounded-full" loading="lazy" />
            <p className="text-lg font-bold text-foreground">{resultText}</p>
            <button
              onClick={() => navigate('/employer/applicants')}
              className="mt-4 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground active:scale-95"
            >
              {t('viewApplicants')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MicButton;
