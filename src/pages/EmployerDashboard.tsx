import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { useAutoSpeak } from '@/hooks/useTTS';
import MicButton from '@/components/MicButton';
import dashboardImg from '@/assets/icons/dashboard.png';
import addJobImg from '@/assets/icons/add-job.png';
import applicantsImg from '@/assets/icons/applicants.png';
import employerImg from '@/assets/icons/employer.png';

const EmployerDashboard = () => {
  const navigate = useNavigate();
  useAutoSpeak(t('dashboard'));

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-12">
      <div className="mb-8 animate-fade-in-up text-center">
        <img src={employerImg} alt="Employer" className="mx-auto h-20 w-20 rounded-full object-cover" />
        <h1 className="mt-2 text-xl font-bold text-foreground">{t('dashboard')}</h1>
      </div>

      {/* Voice Bot for Employer */}
      <div className="mb-8 flex justify-center animate-scale-in">
        <MicButton mode="employer" />
      </div>

      <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 shadow-md">
          <img src={dashboardImg} alt="Jobs" className="h-14 w-14 object-contain" loading="lazy" />
          <span className="text-3xl font-bold text-primary">3</span>
          <span className="text-sm font-semibold text-muted-foreground">{t('jobsPosted')}</span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 shadow-md">
          <img src={applicantsImg} alt="Applicants" className="h-14 w-14 object-contain" loading="lazy" />
          <span className="text-3xl font-bold text-accent">12</span>
          <span className="text-sm font-semibold text-muted-foreground">{t('applicants')}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <button
          onClick={() => navigate('/employer/add-job')}
          className="flex items-center justify-center gap-3 rounded-2xl bg-primary p-5 text-xl font-bold text-primary-foreground shadow-lg transition-all active:scale-95"
        >
          <img src={addJobImg} alt="Add" className="h-8 w-8 object-contain" /> {t('addJob')}
        </button>
        <button
          onClick={() => navigate('/employer/applicants')}
          className="flex items-center justify-center gap-3 rounded-2xl bg-card p-5 text-xl font-bold text-card-foreground shadow-md transition-all active:scale-95"
        >
          <img src={applicantsImg} alt="Applicants" className="h-8 w-8 object-contain" /> {t('viewApplicants')}
        </button>
      </div>
    </div>
  );
};

export default EmployerDashboard;
