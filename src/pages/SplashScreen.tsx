import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      const lang = localStorage.getItem('zb-language');
      const role = localStorage.getItem('zb-role');
      if (lang && role) {
        navigate(role === 'worker' ? '/worker' : '/employer');
      } else if (lang) {
        navigate('/role');
      } else {
        navigate('/language');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-6">
      <div className={`flex flex-col items-center gap-6 transition-all duration-700 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-primary-foreground/20 text-6xl shadow-lg">
          🤝
        </div>
        <h1 className="text-3xl font-bold text-primary-foreground">Zero Barrier AI</h1>
        <p className="text-lg text-primary-foreground/80">Jobs for Everyone</p>
        <div className="mt-8 h-1 w-16 animate-pulse rounded-full bg-primary-foreground/40" />
      </div>
    </div>
  );
};

export default SplashScreen;
