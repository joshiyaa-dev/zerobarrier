import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Globe, Power, Zap, Activity, RotateCcw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { handleUserInput, welcome, emptyState, type AgentState } from '@/lib/zbt/agent';
import type { ScoredJob } from '@/lib/zbt/search';
import { DATASET_META } from '@/lib/zbt/search';
import JobResultsPanel from '@/components/JobResultsPanel';
import BrowseJobs from '@/components/BrowseJobs';
import SavedPanel from '@/components/SavedPanel';
import ProfileWizard from '@/components/ProfileWizard';
import { getA11y, saveA11y, getProfile, getSavedJobs } from '@/lib/zbt/store';
import { JOBS } from '@/lib/zbt/search';
import { Type, Contrast, Bell, Briefcase, LayoutGrid, Search as SearchIcon } from 'lucide-react';

type Tab = 'search' | 'browse' | 'saved' | 'profile';

type Emotion = 'HAPPY' | 'CONCERNED' | 'EXCITED' | 'SERIOUS' | 'NEUTRAL';
type AppState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

// Optional enhanced backend (whisper STT + piper TTS). When unreachable,
// the app runs fully on-device: Web Speech API + rule-based NLU.
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default function VoiceUI() {
  const [hasStarted, setHasStarted] = useState(false);
  const [engineMode, setEngineMode] = useState<'backend' | 'local'>('local');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('HAPPY');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [volume, setVolume] = useState(0);
  const [manualInput, setManualInput] = useState('');
  const [results, setResults] = useState<ScoredJob[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<'ta-IN' | 'en-IN'>('ta-IN');
const [tab, setTab] = useState<Tab>('search');
const [a11y, setA11yState] = useState(getA11y);

  const selectedLanguageRef = useRef<'ta-IN' | 'en-IN'>('ta-IN');
  const appStateRef = useRef<AppState>('IDLE');
  const agentStateRef = useRef<AgentState>(emptyState());
  const speechStartedAtRef = useRef<number>(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Backend-mode audio refs (VAD loop)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recorderNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingBuffersRef = useRef<Float32Array[]>([]);
  const isRecordingRef = useRef(false);
  const lastSpeakTime = useRef<number>(Date.now());
  const isUserSpeaking = useRef(false);

  const stt = useSpeechRecognition(selectedLanguage);

useEffect(() => { selectedLanguageRef.current = selectedLanguage; }, [selectedLanguage]);
useEffect(() => { appStateRef.current = appState; }, [appState]);

// Job alerts: on load, notify about jobs posted today matching the saved profile.
useEffect(() => {
  const profile = getProfile();
  if (!profile) return;
  if (typeof Notification === 'undefined') return;
  const notify = () => {
    const today = new Date().toISOString().slice(0, 10);
    const matches = JOBS.filter(
      (j) =>
        j.posted_date === today &&
        (!profile.category || j.category === profile.category) &&
        (!profile.district || j.district === profile.district) &&
        (!profile.salaryMin || j.salary_max >= profile.salaryMin) &&
        !profile.excludeShifts.includes(j.shift),
    ).slice(0, 5);
    if (matches.length > 0) {
      new Notification('ZeroBarrier — new jobs for you', {
        body: `${matches.length} new ${profile.category ?? ''} job${matches.length > 1 ? 's' : ''}${profile.district ? ` in ${profile.district}` : ''} today.`,
      });
    }
  };
  if (Notification.permission === 'granted') {
    notify();
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then((p) => { if (p === 'granted') notify(); });
  }
}, []);

  const lang: 'ta' | 'en' = selectedLanguage === 'ta-IN' ? 'ta' : 'en';
  const languageLabel = selectedLanguage === 'ta-IN' ? 'தமிழ்' : 'English';

  // ---------- shared helpers ----------

  const detectSpeechLangFromText = (text: string): 'ta-IN' | 'en-IN' => {
    return /[\u0B80-\u0BFF]/.test(text) ? 'ta-IN' : 'en-IN';
  };

  const cancelSpeaking = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const findBestVoice = (voiceLang: 'ta-IN' | 'en-IN') => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const exact = voices.find((v) => v.lang.toLowerCase() === voiceLang.toLowerCase());
    if (exact) return exact;
    const prefix = voiceLang.slice(0, 2).toLowerCase();
    return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ?? null;
  };

  const speakWithBrowser = (text: string) => {
    setAppState('SPEAKING');
    speechStartedAtRef.current = Date.now();
    const utterance = new SpeechSynthesisUtterance(text);
    const utteranceLang = detectSpeechLangFromText(text);
    utterance.lang = utteranceLang;
    const voice = findBestVoice(utteranceLang);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onend = () => setAppState('IDLE');
    utterance.onerror = () => setAppState('IDLE');
    window.speechSynthesis.speak(utterance);
  };

  const playBeep = (freq: number, duration: number) => {
    if (!audioContextRef.current) return;
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.start();
    osc.stop(audioContextRef.current.currentTime + duration);
  };

  // ---------- LOCAL ENGINE (rule-based, on-device) ----------

  const processLocalInput = useCallback((transcript: string) => {
    setAppState('THINKING');
    setCurrentEmotion('NEUTRAL');
    try {
      const reply = handleUserInput(transcript, agentStateRef.current, lang);
      agentStateRef.current = reply.state;
      setResults(reply.results ?? []);
      setAiResponse(reply.text);
      setManualInput('');
      speakWithBrowser(reply.text);
    } catch {
      setAppState('IDLE');
      toast({ title: lang === 'ta' ? 'பிழை ஏற்பட்டது' : 'Something went wrong', variant: 'destructive' });
    }
  }, [lang]);

  const toggleMic = () => {
    if (!stt.supported) {
      toast({
        title: lang === 'ta' ? 'குரல் அங்கீகாரம் இல்லை' : 'Voice recognition unavailable',
        description: lang === 'ta' ? 'Chrome/Edge பயன்படுத்தவும் அல்லது டைப் செய்யவும்.' : 'Use Chrome/Edge or type below.',
        variant: 'destructive',
      });
      return;
    }
    if (stt.listening) {
      stt.stop();
      return;
    }
    playBeepSafe(880, 0.15);
    const started = stt.start((transcript) => {
      setAppState('THINKING');
      processLocalInput(transcript);
    });
    if (started) setAppState('LISTENING');
  };

  const playBeepSafe = (freq: number, dur: number) => {
    try {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      playBeep(freq, dur);
    } catch { /* noop */ }
  };

  // ---------- BACKEND ENGINE (optional whisper/piper stack) ----------

  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return output;
  };

  const mergeFloat32Buffers = (buffers: Float32Array[]) => {
    const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
      result.set(buffer, offset);
      offset += buffer.length;
    }
    return result;
  };

  const writeString = (view: DataView, offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  const encodeWav = (buffers: Float32Array[], sampleRate: number) => {
    const merged = mergeFloat32Buffers(buffers);
    const pcm16 = floatTo16BitPCM(merged);
    const buffer = new ArrayBuffer(44 + pcm16.length * 2);
    const view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcm16.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, pcm16.length * 2, true);
    let offset = 44;
    for (let i = 0; i < pcm16.length; i++, offset += 2) view.setInt16(offset, pcm16[i], true);
    return new Blob([view], { type: 'audio/wav' });
  };

  const silenceThreshold = 15;
  const silenceDuration = 1500;

  const monitorAudio = useCallback(() => {
    if (!analyserRef.current || !streamRef.current) return;
    if (!engineModeGuard()) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
    setVolume(average);

    if (appStateRef.current === 'IDLE' || appStateRef.current === 'LISTENING') {
      if (average > silenceThreshold) {
        if (!isUserSpeaking.current) {
          isUserSpeaking.current = true;
          if (appStateRef.current === 'IDLE') startRecording();
        }
        lastSpeakTime.current = Date.now();
      } else if (isUserSpeaking.current && Date.now() - lastSpeakTime.current > silenceDuration) {
        isUserSpeaking.current = false;
        stopRecording();
      }
    }
    requestAnimationFrame(monitorAudio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const engineModeGuard = () => streamRef.current !== null;

  const startRecording = () => {
    if (!streamRef.current || !audioContextRef.current || !sourceNodeRef.current) return;
    cancelSpeaking();
    setAppState('LISTENING');
    playBeep(880, 0.2);
    recordingBuffersRef.current = [];
    isRecordingRef.current = true;
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (event) => {
      if (!isRecordingRef.current) return;
      recordingBuffersRef.current.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };
    sourceNodeRef.current.connect(processor);
    processor.connect(audioContextRef.current.destination);
    recorderNodeRef.current = processor;
  };

  const stopRecording = () => {
    if (!audioContextRef.current || !recorderNodeRef.current) return;
    isRecordingRef.current = false;
    const processor = recorderNodeRef.current;
    sourceNodeRef.current?.disconnect(processor);
    processor.disconnect();
    recorderNodeRef.current = null;
    playBeep(440, 0.2);
    const wavBlob = encodeWav(recordingBuffersRef.current, audioContextRef.current.sampleRate);
    recordingBuffersRef.current = [];
    void handleUpload(wavBlob);
  };

  const applyBackendReply = (data: { text?: string; emotion?: string; audio?: string }) => {
    if (!data.text) { setAppState('IDLE'); return; }
    setCurrentEmotion((data.emotion as Emotion) ?? 'NEUTRAL');
    setResults([]);
    setAiResponse(data.text);
    setManualInput('');
    if (data.audio) {
      try {
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
        setAppState('SPEAKING');
        speechStartedAtRef.current = Date.now();
        const audio = new Audio(url);
        audioPlayerRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); setAppState('IDLE'); };
        audio.onerror = () => { URL.revokeObjectURL(url); speakWithBrowser(data.text!); };
        void audio.play().catch(() => { URL.revokeObjectURL(url); speakWithBrowser(data.text!); });
        return;
      } catch { /* fall through to browser TTS */ }
    }
    speakWithBrowser(data.text);
  };

  const handleUpload = async (audioBlob: Blob) => {
    setAppState('THINKING');
    const formData = new FormData();
    formData.append('audio', audioBlob, 'record.wav');
    formData.append('userId', 'user_2');
    formData.append('lang', selectedLanguageRef.current);
    try {
      const response = await fetch(`${API_BASE_URL}/voice`, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.status === 'no_input' || !data.text) { setAppState('IDLE'); return; }
      applyBackendReply(data);
    } catch {
      setEngineMode('local');
      setAppState('IDLE');
      toast({ title: lang === 'ta' ? 'பேக்கெண்ட் இல்லை — ஆன்-டிவைஸ் மோட்' : 'Backend offline — switched to on-device mode' });
    }
  };

  const submitText = async (text: string) => {
    if (!text.trim()) return;
    setAppState('THINKING');
    if (engineMode === 'local') {
      processLocalInput(text.trim());
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/voice/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_2', text, lang: selectedLanguageRef.current }),
      });
      const data = await response.json();
      if (data.status === 'no_input' || !data.text) { setAppState('IDLE'); return; }
      applyBackendReply(data);
    } catch {
      setEngineMode('local');
      processLocalInput(text.trim());
    }
  };

  // ---------- STARTUP ----------

  const probeBackend = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE_URL}/jobs`, { signal: controller.signal });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleStartApp = async () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = ctx;

      const backendUp = await probeBackend();
      setEngineMode(backendUp ? 'backend' : 'local');

      const greeting = welcome(backendUp ? (selectedLanguageRef.current === 'ta-IN' ? 'ta' : 'en') : lang);
      setAiResponse(greeting);
      setHasStarted(true);

      if (backendUp) {
        try {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          const source = ctx.createMediaStreamSource(streamRef.current);
          source.connect(analyser);
          sourceNodeRef.current = source;
          analyserRef.current = analyser;
          await fetch(`${API_BASE_URL}/voice/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'user_2' }),
          });
          monitorAudio();
        } catch {
          setEngineMode('local');
        }
      }

      speakWithBrowser(greeting);
    } catch {
      toast({ title: lang === 'ta' ? 'மைக்கை அனுமதிக்கவும்' : 'Microphone permission required', variant: 'destructive' });
    }
  };

  const resetDialogue = () => {
    agentStateRef.current = emptyState();
    setResults([]);
    const greeting = welcome(lang);
    setAiResponse(greeting);
    speakWithBrowser(greeting);
  };

  const getPhaseStyles = () => {
    switch (appState) {
      case 'LISTENING': return { glow: 'bg-cyan-500 shadow-[0_0_100px_rgba(6,182,212,0.6)]', label: 'Listening...' };
      case 'THINKING': return { glow: 'bg-purple-500 shadow-[0_0_100px_rgba(168,85,247,0.6)]', label: 'Thinking...' };
      case 'SPEAKING': return { glow: 'bg-yellow-500 shadow-[0_0_100px_rgba(234,179,8,0.6)]', label: 'Speaking...' };
      default: return { glow: 'bg-blue-600 shadow-none', label: 'Ready' };
    }
  };

  if (!hasStarted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black animate-pulse-slow" />
        <div className="relative z-10 space-y-12">
          <div className="flex h-64 w-64 items-center justify-center rounded-full border-4 border-blue-500/30 bg-blue-600/10 shadow-2xl animate-float">
            <Power className="h-32 w-32 text-blue-500" />
          </div>
          <div className="space-y-4">
            <h1 className="bg-gradient-to-b from-white to-slate-500 bg-clip-text text-6xl font-black tracking-widest text-transparent">ZERO BARRIER</h1>
            <p className="text-sm font-bold uppercase italic tracking-[0.4em] text-blue-400">Voice-first jobs · Tamil &amp; English</p>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-500">
              {DATASET_META.count} demo job listings · on-device rule-based voice assistant · no account needed.
              Demo dataset — not real employer listings.
            </p>
          </div>
          <button
            onClick={handleStartApp}
            className="rounded-full bg-white px-24 py-10 text-2xl font-black uppercase tracking-widest text-black shadow-2xl shadow-white/20 transition-all hover:scale-105 active:scale-95"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  const styles = getPhaseStyles();

  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center overflow-y-auto bg-slate-950 p-6 text-white transition-colors duration-1000 ${a11y.largeText ? 'text-[17px]' : ''} ${a11y.highContrast ? 'contrast-125' : ''}`}>
      <div className={`fixed inset-0 opacity-10 transition-all duration-1000 ${styles.glow}`} />

      {/* Header status */}
      <div className="absolute left-4 top-4 flex items-center space-x-3 opacity-40 sm:left-10 sm:top-10">
        <Activity className="h-5 w-5 text-blue-400" />
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase">Core Status</span>
          <span className="text-xs font-bold text-green-400">{engineMode === 'backend' ? 'VAD_ACTIVE' : 'MIC_READY'}</span>
        </div>
      </div>
      <div className="absolute right-4 top-4 flex items-center space-x-3 opacity-60 sm:right-10 sm:top-10">
        <button
          onClick={() => setSelectedLanguage((prev) => (prev === 'ta-IN' ? 'en-IN' : 'ta-IN'))}
          className="rounded-full border border-slate-600 px-3 py-1 text-xs font-bold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
        >
          {languageLabel}
        </button>
        <button
          onClick={() => {
            const next = { ...a11y, largeText: !a11y.largeText };
            setA11yState(next);
            saveA11y(next);
          }}
          title="Large text"
          className={`rounded-full border p-1.5 ${a11y.largeText ? 'border-amber-400 text-amber-300' : 'border-slate-600 text-slate-200 hover:border-cyan-400 hover:text-cyan-300'}`}
        >
          <Type className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            const next = { ...a11y, highContrast: !a11y.highContrast };
            setA11yState(next);
            saveA11y(next);
          }}
          title="High contrast"
          className={`rounded-full border p-1.5 ${a11y.highContrast ? 'border-amber-400 text-amber-300' : 'border-slate-600 text-slate-200 hover:border-cyan-400 hover:text-cyan-300'}`}
        >
          <Contrast className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setTab('profile')}
          title="Profile"
          className="rounded-full border border-slate-600 p-1.5 text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
        >
          <Bell className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={resetDialogue}
          title={lang === 'ta' ? 'மீண்டும் தொடங்கு' : 'Start over'}
          className="rounded-full border border-slate-600 p-1.5 text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase">Processing</span>
          {/* Honest engine label: rule-based on-device NLU unless optional backend is running */}
          <span className="text-xs font-bold text-white">{engineMode === 'backend' ? 'LOCAL_BACKEND_BRAIN' : 'RULE_BASED_NLU'}</span>
        </div>
        <Zap className={`h-5 w-5 ${engineMode === 'backend' ? 'text-yellow-400' : 'text-emerald-400'}`} />
      </div>

      {/* Avatar */}
      <div className="relative flex flex-col items-center justify-center space-y-8 sm:space-y-14">
        <div className="relative group">
          <div className={`absolute -inset-24 rounded-full opacity-60 blur-[100px] transition-all duration-1000 ${styles.glow}`} />
          <button
            onClick={toggleMic}
            aria-label={stt.listening ? 'Stop listening' : 'Start listening'}
            className={`flex h-56 w-56 flex-col items-center justify-center rounded-full border-8 border-transparent bg-white backdrop-blur transition-all duration-500 focus:outline-none sm:h-72 sm:w-72 ${appState === 'SPEAKING' ? 'scale-110 ring-8 ring-white/10' : ''} ${stt.listening ? 'ring-8 ring-cyan-400/50' : ''}`}
          >
            {stt.listening ? (
              <MicOff className="mb-2 h-10 w-10 animate-pulse text-cyan-600" />
            ) : (
              <Mic className="mb-2 h-10 w-10 text-blue-700" />
            )}
            <svg viewBox="0 0 100 100" className="h-32 w-32 transition-transform duration-300 sm:h-44 sm:w-44">
              <path d={currentEmotion === 'CONCERNED' ? 'M 25 35 Q 35 30 45 35' : 'M 25 35 L 45 35'} stroke="#1a1a1a" strokeWidth="4" fill="none" className="transition-all duration-700" />
              <path d={currentEmotion === 'CONCERNED' ? 'M 55 35 Q 65 30 75 35' : 'M 55 35 L 75 35'} stroke="#1a1a1a" strokeWidth="4" fill="none" className="transition-all duration-700" />
              <circle cx="35" cy="50" r="5" fill="#1a1a1a" />
              <circle cx="65" cy="50" r="5" fill="#1a1a1a" />
              <path
                d={
                  appState === 'SPEAKING'
                    ? `M 35 75 Q 50 ${75 + Math.min(volume / 2.5, 18)} 65 75`
                    : currentEmotion === 'HAPPY'
                      ? 'M 35 75 Q 50 85 65 75'
                      : 'M 35 80 L 65 80'
                }
                stroke="#1a1a1a"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-100"
              />
            </svg>
            <span className={`text-[10px] font-black uppercase tracking-[0.5em] transition-colors ${appState === 'IDLE' ? 'text-slate-300' : 'text-blue-600'}`}>{styles.label}</span>
          </button>
        </div>

        {/* Conversation bubble */}
        <div className="group relative max-w-md transform rounded-[50px] border border-white/5 bg-slate-900 p-8 text-center shadow-3xl transition duration-700 hover:-translate-y-1 sm:p-10">
          <div className={`absolute left-0 top-0 h-1.5 w-full transition-all duration-700 ${styles.glow}`} />
          <p className="text-xl font-black leading-tight text-slate-100 sm:text-3xl">{aiResponse}</p>
        </div>

        {/* Tab bar */}
        <div className="flex w-full max-w-md gap-1 rounded-full border border-white/10 bg-slate-900/80 p-1">
          {([
            { key: 'search', label: lang === 'ta' ? 'தேடு' : 'Search', icon: SearchIcon },
            { key: 'browse', label: lang === 'ta' ? 'பார்' : 'Browse', icon: LayoutGrid },
            { key: 'saved', label: lang === 'ta' ? 'சேமிப்பு' : 'Saved', icon: Briefcase },
            { key: 'profile', label: lang === 'ta' ? 'சுயவிவரம்' : 'Profile', icon: Bell },
          ] as Array<{ key: Tab; label: string; icon: typeof SearchIcon }>).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-full py-2 text-[11px] font-bold transition ${tab === key ? 'bg-cyan-500 text-black' : 'text-slate-300 hover:text-white'}`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Panels */}
        {tab === 'search' && (
          <>
            {/* Results */}
            <JobResultsPanel results={results} lang={lang} />

            {/* Text input fallback */}
            <form
              onSubmit={(e) => { e.preventDefault(); void submitText(manualInput); }}
              className="flex w-full max-w-md gap-2"
            >
              <input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={lang === 'ta' ? 'அல்லது இங்கே டைப் செய்யவும்...' : 'Or type here instead...'}
                className="w-full rounded-full border border-white/10 bg-slate-900 px-5 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <button type="submit" className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-black hover:bg-cyan-400">
                {lang === 'ta' ? 'அனுப்பு' : 'Send'}
              </button>
            </form>
          </>
        )}
        {tab === 'browse' && <div className="w-full max-w-4xl"><BrowseJobs lang={lang} /></div>}
        {tab === 'saved' && <div className="w-full max-w-4xl"><SavedPanel lang={lang} /></div>}
        {tab === 'profile' && (
          <div className="w-full max-w-xl">
            <ProfileWizard
              lang={lang}
              onSaved={() => {
                const p = getProfile();
                if (p && Notification.permission === 'default') Notification.requestPermission();
              }}
            />
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-[9px] font-bold uppercase tracking-[1.5em] text-slate-700">Zero Barrier · On-device voice AI · DEMO DATA</p>
    </div>
  );
}

