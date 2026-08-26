import { useNavigate } from 'react-router-dom';
import { setLanguage } from '@/lib/i18n';

const LanguageScreen = () => {
  const navigate = useNavigate();

  const choose = (lang: 'ta' | 'en') => {
    setLanguage(lang);
    navigate('/role');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="animate-fade-in-up text-center">
        <div className="mb-4 text-6xl">🌐</div>
        <h1 className="text-2xl font-bold text-foreground">Choose Language</h1>
        <p className="mt-1 text-lg text-muted-foreground">மொழி தேர்வு</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => choose('ta')}
          className="touch-target flex items-center justify-center gap-3 rounded-2xl border-2 border-border bg-card p-6 text-2xl font-bold text-card-foreground shadow-md transition-all hover:shadow-lg active:scale-95"
        >
          <span className="text-3xl">🇮🇳</span>
          தமிழ்
        </button>
        <button
          onClick={() => choose('en')}
          className="touch-target flex items-center justify-center gap-3 rounded-2xl border-2 border-border bg-card p-6 text-2xl font-bold text-card-foreground shadow-md transition-all hover:shadow-lg active:scale-95"
        >
          <span className="text-3xl">🇬🇧</span>
          English
        </button>
      </div>
    </div>
  );
};

export default LanguageScreen;
