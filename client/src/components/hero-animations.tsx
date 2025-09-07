import { useEffect, useState } from "react";
import { Plane, Globe, Briefcase } from "lucide-react";

export default function HeroAnimations() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" data-testid="hero-animations">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 animate-float" style={{ animationDelay: '0s' }}>
        <Plane className="h-10 w-10 text-primary-300 transform rotate-45" data-testid="animated-plane" />
      </div>
      <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '-2s' }}>
        <Globe className="h-8 w-8 text-coral-300" data-testid="animated-globe" />
      </div>
      <div className="absolute bottom-32 left-1/4 animate-float" style={{ animationDelay: '-4s' }}>
        <Briefcase className="h-6 w-6 text-primary-400" data-testid="animated-briefcase" />
      </div>
      
      {/* Additional floating elements for more dynamic feel */}
      <div className="absolute top-1/3 right-1/4 animate-float" style={{ animationDelay: '-1s' }}>
        <div className="w-3 h-3 bg-coral-400 rounded-full opacity-60" data-testid="floating-dot-1" />
      </div>
      <div className="absolute bottom-1/3 left-1/3 animate-float" style={{ animationDelay: '-3s' }}>
        <div className="w-2 h-2 bg-primary-400 rounded-full opacity-40" data-testid="floating-dot-2" />
      </div>
      <div className="absolute top-1/2 left-10 animate-float" style={{ animationDelay: '-5s' }}>
        <div className="w-4 h-4 bg-green-400 rounded-full opacity-50" data-testid="floating-dot-3" />
      </div>
    </div>
  );
}
