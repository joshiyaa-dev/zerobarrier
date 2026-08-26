import { useNavigate } from 'react-router-dom';
import { t, setRole } from '@/lib/i18n';
import { useAutoSpeak } from '@/hooks/useTTS';
import workerImg from '@/assets/icons/worker.png';
import employerImg from '@/assets/icons/employer.png';

const RoleScreen = () => {
  const navigate = useNavigate();
  useAutoSpeak(t('selectRole'));

  const choose = (role: 'worker' | 'employer') => {
    setRole(role);
    navigate(role === 'worker' ? '/worker' : '/employer');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="animate-fade-in-up text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('selectRole')}</h1>
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <button
          onClick={() => choose('worker')}
          className="flex flex-col items-center gap-4 rounded-2xl border-2 border-border bg-card p-8 shadow-md transition-all hover:border-primary hover:shadow-lg active:scale-95"
        >
          <img src={workerImg} alt="Worker" className="h-24 w-24 rounded-full object-cover" />
          <span className="text-lg font-bold text-card-foreground">{t('worker')}</span>
        </button>
        <button
          onClick={() => choose('employer')}
          className="flex flex-col items-center gap-4 rounded-2xl border-2 border-border bg-card p-8 shadow-md transition-all hover:border-primary hover:shadow-lg active:scale-95"
        >
          <img src={employerImg} alt="Employer" className="h-24 w-24 rounded-full object-cover" />
          <span className="text-lg font-bold text-card-foreground">{t('employer')}</span>
        </button>
      </div>
    </div>
  );
};

export default RoleScreen;
