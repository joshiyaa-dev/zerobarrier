import { useNavigate } from 'react-router-dom';
import { t, getLanguage } from '@/lib/i18n';
import { sampleJobs } from '@/lib/jobData';
import { ArrowLeft } from 'lucide-react';
import SpeakButton from '@/components/SpeakButton';
import { useAutoSpeak } from '@/hooks/useTTS';
import jobSearchImg from '@/assets/icons/job-search.png';

const JobListScreen = () => {
  const navigate = useNavigate();
  const lang = getLanguage();
  useAutoSpeak(t('findJobs'));

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/worker')} className="flex h-12 w-12 items-center justify-center rounded-xl bg-card shadow active:scale-95">
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <img src={jobSearchImg} alt="Search" className="h-10 w-10 object-contain" />
        <h1 className="text-xl font-bold text-foreground">{t('findJobs')}</h1>
      </div>

      <div className="flex flex-col gap-3">
        {sampleJobs.map((job, i) => {
          const title = lang === 'ta' ? job.titleTa : job.titleEn;
          const loc = lang === 'ta' ? job.locationTa : job.locationEn;
          return (
            <button
              key={job.id}
              onClick={() => navigate(`/worker/jobs/${job.id}`)}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-md transition-all hover:shadow-lg active:scale-[0.98] animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <img src={job.image} alt={title} className="h-16 w-16 rounded-xl object-cover" loading="lazy" />
              <div className="flex-1 text-left">
                <p className="text-lg font-bold text-card-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">💰 ₹{job.salary.toLocaleString()}{t('perMonth')}</p>
                <p className="text-sm text-muted-foreground">📍 {loc}</p>
              </div>
              <SpeakButton text={`${title}. ${lang === 'ta' ? 'சம்பளம்' : 'Salary'} ${job.salary}. ${loc}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default JobListScreen;
