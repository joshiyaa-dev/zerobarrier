import { useNavigate } from 'react-router-dom';
import { t, getLanguage } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';
import { sampleJobs } from '@/lib/jobData';
import { useAutoSpeak } from '@/hooks/useTTS';
import appliedImg from '@/assets/icons/applied.png';

const AppliedScreen = () => {
  const navigate = useNavigate();
  const lang = getLanguage();
  const appliedJobs = sampleJobs.slice(0, 2);
  useAutoSpeak(t('applied'));

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/worker')} className="flex h-12 w-12 items-center justify-center rounded-xl bg-card shadow active:scale-95">
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <img src={appliedImg} alt="Applied" className="h-10 w-10 object-contain" />
        <h1 className="text-xl font-bold text-foreground">{t('applied')}</h1>
      </div>

      <div className="flex flex-col gap-3">
        {appliedJobs.map((job, i) => (
          <div
            key={job.id}
            className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-md animate-fade-in-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <img src={job.image} alt={lang === 'ta' ? job.titleTa : job.titleEn} className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
            <div className="flex-1">
              <p className="text-lg font-bold text-card-foreground">
                {lang === 'ta' ? job.titleTa : job.titleEn}
              </p>
              <p className="text-sm text-success font-semibold">✅ {t('applied_success')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppliedScreen;
