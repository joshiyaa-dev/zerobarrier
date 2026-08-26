// Guided worker-profile creation. Voice-first (Web Speech STT), text fallback,
// review step, saved to localStorage only. Feeds job alerts + search defaults.
import { useState } from 'react';
import { Mic, UserRoundCheck, RotateCcw } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { getProfile, saveProfile, clearProfile, type WorkerProfile } from '@/lib/zbt/store';
import { ALL_CATEGORIES } from '@/lib/zbt/browse';
import { districtOptions, parseDistrict } from '@/lib/zbt/nlu';

type Step = 'intro' | 'name' | 'work' | 'place' | 'pay' | 'shift' | 'review';
const FLOW: Exclude<Step, 'intro' | 'review'>[] = ['name', 'work', 'place', 'pay', 'shift'];

const STEP_PROMPTS: Record<Exclude<Step, 'intro' | 'review'>, { en: string; ta: string }> = {
  name: { en: 'What is your name?', ta: 'உங்கள் பெயர் என்ன?' },
  work: { en: 'What work do you do? Say or pick one.', ta: 'என்ன வேலை? சொல்லுங்கள்.' },
  place: { en: 'Which district do you want to work in?', ta: 'எந்த மாவட்டம்?' },
  pay: { en: 'Minimum monthly salary you need? e.g. "fifteen thousand"', ta: 'குறைந்தது எவ்வளவு சம்பளம்? உதா: பதினைந்தாயிரம்' },
  shift: { en: 'Any shift you cannot work? e.g. "night shift vendam" (or say no)', ta: 'எந்த ஷிஃப்ட் வேண்டாம்? (இல்லை என்று சொல்லலாம்)' },
};

export default function ProfileWizard({ lang, onSaved }: { lang: 'ta' | 'en'; onSaved?: () => void }) {
  const [step, setStep] = useState<Step>('intro');
  const [draft, setDraft] = useState<Partial<WorkerProfile>>({ fresher: false, excludeShifts: [] });
  const [typed, setTyped] = useState('');
  const [error, setError] = useState('');
  const [heard, setHeard] = useState('');
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  const speech = useSpeechRecognition(lang === 'ta' ? 'ta-IN' : 'en-IN');

  const startListening = () => {
    if (!speech.supported) {
      setError(t('Voice not supported here — please type.', 'குரல் support இல்லை — type செய்யுங்கள்.'));
      return;
    }
    setError('');
    speech.start((text) => {
      setHeard(text);
      handleAnswer(text);
    });
  };

  const handleAnswer = (answerRaw: string) => {
    const answer = answerRaw.trim();
    if (!answer) return;
    setError('');
    switch (step) {
      case 'name':
        setDraft((d) => ({ ...d, name: answer }));
        setStep('work');
        break;
      case 'work': {
        const lower = answer.toLowerCase();
        const match =
          ALL_CATEGORIES.find((c) => lower.includes(c.toLowerCase())) ??
          ALL_CATEGORIES.find((c) => lower.includes(c.split(' ')[0].toLowerCase()));
        if (!match) {
          setError(t('Pick one of the listed works', 'பட்டியலில் ஒன்றைத் தேர்வு செய்யுங்கள்'));
          return;
        }
        setDraft((d) => ({ ...d, category: match }));
        setStep('place');
        break;
      }
      case 'place': {
        const d = parseDistrict(answer);
        if (!d) {
          setError(t('Say a Tamil Nadu district, e.g. Coimbatore', 'மாவட்டம் சொல்லுங்கள், உதா: கோயம்புத்தூர்'));
          return;
        }
        setDraft((prev) => ({ ...prev, district: d }));
        setStep('pay');
        break;
      }
      case 'pay': {
        let num = Number(answer.replace(/[^0-9]/g, ''));
        if (/lakh|லட்சம்/.test(answer.toLowerCase()) && num >= 1 && num < 100) num *= 100000;
        if (!num) {
          const words: Array<[RegExp, number]> = [
            [/fifteen|பதினைந்த/, 15000], [/twenty\s*five/, 25000], [/twenty|இருபத(?!ு)/, 20000],
            [/ten|பதினாயிர|பத்தாயிர/, 10000], [/five|ஐந்தாயிர/, 5000], [/thirty|முப்பதாயிர/, 30000],
            [/forty/, 40000], [/fifty|ஐம்பதாயிர/, 50000],
          ];
          for (const [re, v] of words) if (re.test(answer.toLowerCase())) { num = v; break; }
        }
        if (!num || num < 1000 || num > 500000) {
          setError(t('Say an amount like "fifteen thousand"', '"பதினைந்தாயிரம்" போல சொல்லுங்கள்'));
          return;
        }
        setDraft((d) => ({ ...d, salaryMin: num }));
        setStep('shift');
        break;
      }
      case 'shift': {
        const lower = answer.toLowerCase();
        const excl: string[] = [];
        if (/night|இரவு/.test(lower)) excl.push('Night');
        if (/morning|காலை/.test(lower)) excl.push('Morning');
        if (/evening|மாலை/.test(lower)) excl.push('Evening');
        setDraft((d) => ({ ...d, excludeShifts: [...new Set([...(d.excludeShifts ?? []), ...excl])] }));
        setStep('review');
        break;
      }
      default:
        break;
    }
    setTyped('');
  };

  const goBack = () => {
    const i = FLOW.indexOf(step as Exclude<Step, 'intro' | 'review'>);
    if (i <= 0) setStep('intro');
    else setStep(FLOW[i - 1]);
  };

  const finish = () => {
    saveProfile({
      name: draft.name || 'Friend',
      category: draft.category,
      district: draft.district,
      salaryMin: draft.salaryMin,
      experienceYears: draft.experienceYears ?? 0,
      fresher: !draft.experienceYears,
      education: draft.education,
      excludeShifts: draft.excludeShifts ?? [],
      updatedAt: new Date().toISOString(),
    });
    setStep('intro');
    onSaved?.();
  };

  const existing = getProfile();
  const prompt = step !== 'intro' && step !== 'review' ? t(STEP_PROMPTS[step].en, STEP_PROMPTS[step].ta) : '';

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-white">{t('My Work Profile', 'என் வேலை விவரம்')}</h3>
        {existing && (
          <button
            onClick={() => { clearProfile(); setDraft({ fresher: false, excludeShifts: [] }); setStep('name'); }}
            className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-rose-300 hover:bg-slate-700"
          >
            <RotateCcw size={12} /> reset
          </button>
        )}
      </div>

      {step === 'intro' && (
        <div className="space-y-4 text-center">
          <p className="text-sm leading-relaxed text-slate-300">
            {t(
              'Create your free voice profile — a few questions, you speak or type. Stored ONLY on this device.',
              'சில கேள்விகள். பேசி அல்லது type செய்யவும். உங்கள் phone-ல மட்டுமே சேமிக்கப்படும்.',
            )}
          </p>
          {existing && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-left text-sm">
              <p className="font-bold text-emerald-300">✓ {existing.name}</p>
              <p className="mt-1 text-slate-300">
                {[existing.category, existing.district, existing.salaryMin ? `₹${existing.salaryMin.toLocaleString('en-IN')}+` : null]
                  .filter(Boolean)
                  .join(' · ') || t('No details yet', 'விவரம் இல்லை')}
              </p>
            </div>
          )}
          <button
            onClick={() => setStep(existing ? 'work' : 'name')}
            className="mx-auto flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-black text-black hover:bg-cyan-400"
          >
            <UserRoundCheck size={16} /> {t(existing ? 'Edit profile' : 'Start profile', existing ? 'திருத்து' : 'தொடங்கு')}
          </button>
        </div>
      )}

      {step !== 'intro' && step !== 'review' && (
        <div className="space-y-4">
          <p className="text-base font-bold text-white">{prompt}</p>

          {step === 'work' && (
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((c) => (
                <button key={c} onClick={() => handleAnswer(c)}
                  className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-cyan-500 hover:text-black">
                  {c}
                </button>
              ))}
            </div>
          )}

          {step === 'place' && (
            <div className="flex flex-wrap gap-1.5">
              {districtOptions().slice(0, 12).map((d) => (
                <button key={d} onClick={() => handleAnswer(d)}
                  className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-cyan-500 hover:text-black">
                  {d}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleAnswer(typed); }} className="flex gap-2">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={t('Speak or type…', 'பேசுங்கள் அல்லது type செய்யுங்கள்…')}
              className="flex-1 rounded-full border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
            <button type="button" onClick={() => (speech.listening ? speech.stop() : startListening())}
              className={`rounded-full p-3 ${speech.listening ? 'animate-pulse bg-rose-500 text-white' : 'bg-slate-800 text-cyan-300'}`}
              aria-label="speak">
              <Mic size={16} />
            </button>
            <button type="submit" className="rounded-full bg-cyan-500 px-4 text-sm font-black text-black hover:bg-cyan-400">→</button>
          </form>
          {speech.listening && <p className="text-xs italic text-cyan-300">🎙️ {t('listening…', 'கேட்கிறேன்…')}</p>}
          {heard && !speech.listening && <p className="text-xs text-slate-500">“{heard}”</p>}
          {error && <p className="text-xs text-amber-300">{error}</p>}

          <div className="flex items-center justify-between text-xs">
            <button onClick={goBack} className="text-slate-400 hover:text-white">← back</button>
            <span className="text-slate-600">{FLOW.indexOf(step as Exclude<Step, 'intro' | 'review'>) + 1}/5</span>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <div className="space-y-1.5 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">
            <p><b>{t('Name', 'பெயர்')}:</b> {draft.name}</p>
            <p><b>{t('Work', 'வேலை')}:</b> {draft.category}</p>
            <p><b>{t('District', 'மாவட்டம்')}:</b> {draft.district}</p>
            <p><b>{t('Minimum salary', 'குறைந்த சம்பளம்')}:</b> ₹{(draft.salaryMin ?? 0).toLocaleString('en-IN')}</p>
            <p><b>{t('Cannot work', 'வேண்டாத shift')}:</b> {draft.excludeShifts?.length ? draft.excludeShifts.join(', ') : t('any shift OK', 'எல்லாம் OK')}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={finish} className="flex-1 rounded-full bg-emerald-500 py-3 text-sm font-black text-black hover:bg-emerald-400">
              ✓ {t('Save profile', 'சேமி')}
            </button>
            <button onClick={() => setStep('intro')} className="rounded-full bg-slate-800 px-5 py-3 text-sm font-bold text-slate-300">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
