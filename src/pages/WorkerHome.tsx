import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { useAutoSpeak } from '@/hooks/useTTS';
import MicButton from '@/components/MicButton';
import jobSearchImg from '@/assets/icons/job-search.png';
import appliedImg from '@/assets/icons/applied.png';
import profileImg from '@/assets/icons/profile.png';
import workerImg from '@/assets/icons/worker.png';

const WorkerHome = () => {
  const navigate = useNavigate();
  useAutoSpeak(t('tapToSpeak'));

  const navItems = [
    { image: jobSearchImg, label: t('findJobs'), path: '/worker/jobs' },
    { image: appliedImg, label: t('applied'), path: '/worker/applied' },
    { image: profileImg, label: t('profile'), path: '/worker/profile' },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 pb-8 pt-12">
      <div className="mb-8 animate-fade-in-up text-center">
        <img src={workerImg} alt="Worker" className="mx-auto h-20 w-20 rounded-full object-cover" />
        <h1 className="mt-2 text-xl font-bold text-foreground">{t('appName')}</h1>
      </div>

      <div className="my-12 animate-scale-in">
        <MicButton mode="worker" />
      </div>

      <div className="grid w-full max-w-sm grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-3 rounded-2xl bg-card p-5 shadow-md transition-all hover:shadow-lg active:scale-95"
          >
            <img src={item.image} alt={item.label} className="h-14 w-14 object-contain" loading="lazy" />
            <span className="text-sm font-semibold text-card-foreground">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WorkerHome;
