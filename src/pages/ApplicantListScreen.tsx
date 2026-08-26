import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';
import { useAutoSpeak } from '@/hooks/useTTS';
import SpeakButton from '@/components/SpeakButton';
import applicantsImg from '@/assets/icons/applicants.png';
import constructionImg from '@/assets/icons/construction.png';
import cookingImg from '@/assets/icons/cooking.png';
import plumbingImg from '@/assets/icons/plumbing.png';

const applicants = [
  { id: 1, name: 'Ravi', skill: 'Construction', image: constructionImg, location: 'Chennai' },
  { id: 2, name: 'Priya', skill: 'Cooking', image: cookingImg, location: 'Madurai' },
  { id: 3, name: 'Kumar', skill: 'Plumbing', image: plumbingImg, location: 'Coimbatore' },
];

const ApplicantListScreen = () => {
  const navigate = useNavigate();
  useAutoSpeak(t('applicants'));

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/employer')} className="flex h-12 w-12 items-center justify-center rounded-xl bg-card shadow active:scale-95">
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <img src={applicantsImg} alt="Applicants" className="h-10 w-10 object-contain" />
        <h1 className="text-xl font-bold text-foreground">{t('applicants')}</h1>
      </div>

      <div className="flex flex-col gap-3">
        {applicants.map((a, i) => (
          <div
            key={a.id}
            className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-md animate-fade-in-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <img src={a.image} alt={a.skill} className="h-14 w-14 rounded-full object-cover" loading="lazy" />
            <div className="flex-1">
              <p className="text-lg font-bold text-card-foreground">👤 {a.name}</p>
              <p className="text-sm text-muted-foreground">📍 {a.location}</p>
            </div>
            <SpeakButton text={`${a.name}. ${a.skill}. ${a.location}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicantListScreen;
