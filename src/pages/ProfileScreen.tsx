import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';
import { useAutoSpeak } from '@/hooks/useTTS';
import profileImg from '@/assets/icons/profile.png';
import successImg from '@/assets/icons/success.png';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('');
  const [skill, setSkill] = useState('');
  const [location, setLocation] = useState('');
  useAutoSpeak(t('profile'));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/worker')} className="flex h-12 w-12 items-center justify-center rounded-xl bg-card shadow active:scale-95">
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <img src={profileImg} alt="Profile" className="h-10 w-10 object-contain" />
        <h1 className="text-xl font-bold text-foreground">{t('profile')}</h1>
      </div>

      <div className="flex flex-col gap-4 animate-fade-in-up">
        {[
          { emoji: '👤', label: t('name'), value: name, set: setName },
          { emoji: '🛠️', label: t('skill'), value: skill, set: setSkill },
          { emoji: '📍', label: t('location'), value: location, set: setLocation },
        ].map((field) => (
          <div key={field.label} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow">
            <span className="text-3xl">{field.emoji}</span>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-muted-foreground">{field.label}</label>
              <input
                type="text"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                className="w-full rounded-xl border border-input bg-background p-3 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          className={`mt-4 flex items-center justify-center gap-2 w-full rounded-2xl p-5 text-xl font-bold shadow-lg transition-all active:scale-95 ${
            saved ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground'
          }`}
        >
          {saved ? (
            <>
              <img src={successImg} alt="Saved" className="h-8 w-8 object-contain" />
              {t('saved')}
            </>
          ) : (
            `💾 ${t('save')}`
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
