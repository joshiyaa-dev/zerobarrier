import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';
import { useAutoSpeak } from '@/hooks/useTTS';
import addJobImg from '@/assets/icons/add-job.png';
import successImg from '@/assets/icons/success.png';

const AddJobScreen = () => {
  const navigate = useNavigate();
  const [posted, setPosted] = useState(false);
  useAutoSpeak(posted ? t('jobPosted') : t('addJob'));

  const fields = [
    { emoji: '📝', label: t('title') },
    { emoji: '💰', label: t('salary') },
    { emoji: '📍', label: t('location') },
    { emoji: '🛠️', label: t('skill') },
  ];

  if (posted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
        <img src={successImg} alt="Posted" className="h-32 w-32 animate-bounce-in object-contain" />
        <h1 className="animate-fade-in-up text-2xl font-bold text-foreground">{t('jobPosted')}</h1>
        <button
          onClick={() => navigate('/employer')}
          className="mt-8 animate-fade-in-up rounded-2xl bg-primary px-10 py-5 text-xl font-bold text-primary-foreground shadow-lg active:scale-95"
          style={{ animationDelay: '0.3s' }}
        >
          🏠 {t('goHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/employer')} className="flex h-12 w-12 items-center justify-center rounded-xl bg-card shadow active:scale-95">
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <img src={addJobImg} alt="Add Job" className="h-10 w-10 object-contain" />
        <h1 className="text-xl font-bold text-foreground">{t('addJob')}</h1>
      </div>

      <div className="flex flex-col gap-4 animate-fade-in-up">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow">
            <span className="text-3xl">{f.emoji}</span>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-muted-foreground">{f.label}</label>
              <input
                type="text"
                className="w-full rounded-xl border border-input bg-background p-3 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        ))}

        <button
          onClick={() => setPosted(true)}
          className="mt-4 w-full rounded-2xl bg-success p-5 text-xl font-bold text-success-foreground shadow-lg active:scale-95"
        >
          ✅ {t('postJob')}
        </button>
      </div>
    </div>
  );
};

export default AddJobScreen;
