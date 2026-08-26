import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { useAutoSpeak } from '@/hooks/useTTS';
import successImg from '@/assets/icons/success.png';

const ApplySuccessScreen = () => {
  const navigate = useNavigate();
  useAutoSpeak(`${t('applied_success')}. ${t('successMessage')}`);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <img src={successImg} alt="Success" className="h-32 w-32 animate-bounce-in object-contain" />
      <h1 className="animate-fade-in-up text-2xl font-bold text-foreground">{t('applied_success')}</h1>
      <p className="animate-fade-in-up text-lg text-muted-foreground" style={{ animationDelay: '0.2s' }}>{t('successMessage')}</p>
      <button
        onClick={() => navigate('/worker')}
        className="mt-8 animate-fade-in-up rounded-2xl bg-primary px-10 py-5 text-xl font-bold text-primary-foreground shadow-lg transition-all active:scale-95"
        style={{ animationDelay: '0.4s' }}
      >
        🏠 {t('goHome')}
      </button>
    </div>
  );
};

export default ApplySuccessScreen;
