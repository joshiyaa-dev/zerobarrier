import { useNavigate, useParams } from 'react-router-dom';
import { t, getLanguage } from '@/lib/i18n';
import { sampleJobs } from '@/lib/jobData';
import { ArrowLeft } from 'lucide-react';
import SpeakButton from '@/components/SpeakButton';
import { useAutoSpeak } from '@/hooks/useTTS';

const JobDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const lang = getLanguage();
  const job = sampleJobs.find((j) => j.id === id);

  const title = job ? (lang === 'ta' ? job.titleTa : job.titleEn) : '';
  const loc = job ? (lang === 'ta' ? job.locationTa : job.locationEn) : '';
  const skill = job ? (lang === 'ta' ? job.skillTa : job.skillEn) : '';

  useAutoSpeak(job ? `${title}. ₹${job.salary}. ${loc}` : '');

  if (!job) return <div className="flex min-h-screen items-center justify-center">Not found</div>;

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-6">
      <button onClick={() => navigate(-1)} className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-card shadow active:scale-95">
        <ArrowLeft className="h-6 w-6 text-foreground" />
      </button>

      <div className="animate-fade-in-up rounded-2xl bg-card p-6 shadow-lg">
        <div className="mb-6 text-center">
          <img src={job.image} alt={title} className="mx-auto h-32 w-32 rounded-2xl object-cover" />
          <h1 className="mt-4 text-2xl font-bold text-card-foreground">{title}</h1>
          <SpeakButton text={`${title}. ${t('salary')} ${job.salary}. ${t('location')} ${loc}. ${t('skill')} ${skill}`} className="mx-auto mt-2" />
        </div>

        <div className="mb-8 flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface-warm p-4">
            <span className="text-3xl">💰</span>
            <div>
              <p className="text-sm text-muted-foreground">{t('salary')}</p>
              <p className="text-xl font-bold text-foreground">₹{job.salary.toLocaleString()}{t('perMonth')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-surface-warm p-4">
            <span className="text-3xl">📍</span>
            <div>
              <p className="text-sm text-muted-foreground">{t('location')}</p>
              <p className="text-xl font-bold text-foreground">{loc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-surface-warm p-4">
            <span className="text-3xl">🛠️</span>
            <div>
              <p className="text-sm text-muted-foreground">{t('skill')}</p>
              <p className="text-xl font-bold text-foreground">{skill}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/worker/apply-success')}
          className="w-full rounded-2xl bg-success p-5 text-xl font-bold text-success-foreground shadow-lg transition-all active:scale-95"
        >
          ✅ {t('apply')}
        </button>
      </div>
    </div>
  );
};

export default JobDetailScreen;
