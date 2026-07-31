import { useEffect, useState } from 'react';
import Logo from './Logo';

interface SplashScreenProps {
  onFinish: () => void;
}

const SPLASH_DURATION_MS = 2200;
const FADE_DURATION_MS = 250;

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const dismiss = () => setIsLeaving(true);
    const timer = setTimeout(dismiss, SPLASH_DURATION_MS);
    window.addEventListener('keydown', dismiss);
    window.addEventListener('click', dismiss);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('click', dismiss);
    };
  }, []);

  useEffect(() => {
    if (!isLeaving) {
      return;
    }
    const timer = setTimeout(onFinish, FADE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isLeaving, onFinish]);

  return (
    <div className={'splash-screen' + (isLeaving ? ' is-leaving' : '')}>
      <div className="splash-content">
        <Logo size={64} />
        <p className="splash-tagline">Documents that reference each other.</p>
      </div>
    </div>
  );
}
