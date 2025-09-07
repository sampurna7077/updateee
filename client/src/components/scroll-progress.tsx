import { useState, useEffect } from "react";

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(scrollPercent, 100));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="scroll-progress-container">
      <div 
        className="scroll-progress-bar" 
        style={{ width: `${scrollProgress}%` }}
      >
        <div className="scroll-logo">
          <img 
            src="https://sampurna.easycare.edu.np/lgo.png" 
            alt="Uddan Logo"
            style={{
              transform: `scale(${0.8 + scrollProgress * 0.001})`
            }}
          />
        </div>
      </div>
    </div>
  );
}