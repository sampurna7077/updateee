import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const [timeLeft, setTimeLeft] = useState(10);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setLocation("/");
          return 0;
        }
        return prev - 1;
      });
      
      setProgress((prev) => {
        const newProgress = prev - 10; // 100 / 10 seconds = 10% per second
        return newProgress < 0 ? 0 : newProgress;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setLocation]);

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Windows 11 style background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.1),transparent_50%)]"></div>
      
      <div className="max-w-2xl mx-auto text-center z-10">
        {/* Logo Section */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-white/90 dark:bg-white/95 rounded-3xl mb-6 shadow-2xl backdrop-blur-xl border border-white/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <img 
              src="https://sampurna.easycare.edu.np/lgo.png" 
              alt="Udaan Agencies Logo"
              className="w-20 h-20 object-contain relative z-10"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 font-system">
            Udaan Agencies
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Abroad Consultancy & Global Job Finder
          </p>
        </div>

        {/* Main 404 Content */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/30 shadow-2xl rounded-3xl overflow-hidden">
          {/* Glassmorphism top accent */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <CardContent className="p-10">
            {/* 404 Animation */}
            <div className="mb-8">
              <div className="text-9xl font-black text-transparent bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text animate-pulse relative">
                404
                <div className="absolute inset-0 text-9xl font-black text-blue-500/10 blur-3xl animate-pulse">404</div>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-6 font-system">
                Page Not Found
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-3 font-medium">
                Oops! The page you're looking for doesn't exist or has been moved.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Don't worry, we'll help you find your way back home.
              </p>
            </div>

            {/* Countdown Section */}
            <div className="mb-10">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-slate-100/50 dark:bg-slate-700/50 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/20 dark:border-slate-600/30 shadow-lg">
                  <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-sm font-semibold">
                      Redirecting to homepage in
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums min-w-[2ch] text-center">
                      {timeLeft}
                    </span>
                    <span className="text-sm font-semibold">seconds</span>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full max-w-lg mx-auto">
                <div className="bg-slate-200/50 dark:bg-slate-700/50 backdrop-blur-xl rounded-full h-3 border border-white/20 dark:border-slate-600/30 shadow-inner overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-linear shadow-lg relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                    data-testid="countdown-progress"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Button
                onClick={handleGoHome}
                className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-2xl border border-blue-400/20 backdrop-blur-xl relative overflow-hidden"
                data-testid="button-home"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <Home className="w-5 h-5 mr-3 relative z-10" />
                <span className="relative z-10">Go to Homepage</span>
              </Button>
              
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="border-slate-300/50 dark:border-slate-600/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 backdrop-blur-xl border-2 hover:border-slate-400/50 dark:hover:border-slate-500/50 shadow-lg"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5 mr-3" />
                Go Back
              </Button>
            </div>

            {/* Help Links */}
            <div className="pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
                Need help? Try these popular pages:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { path: "/jobs", label: "Browse Jobs", testId: "link-jobs" },
                  { path: "/feedbacks", label: "Testimonials", testId: "link-feedbacks" },
                  { path: "/forms", label: "Get Started", testId: "link-forms" },
                  { path: "/resources", label: "Resources", testId: "link-resources" }
                ].map((link) => (
                  <button
                    key={link.path}
                    onClick={() => setLocation(link.path)}
                    className="bg-slate-100/70 dark:bg-slate-700/70 backdrop-blur-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-600/70 px-4 py-2 rounded-xl font-medium transition-all duration-200 border border-slate-200/50 dark:border-slate-600/50 hover:shadow-lg hover:-translate-y-0.5"
                    data-testid={link.testId}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Windows 11 style floating elements */}
      <div className="absolute top-16 left-8 w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl opacity-20 animate-float-1 shadow-lg backdrop-blur-sm"></div>
      <div className="absolute top-32 right-16 w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-3xl opacity-15 animate-float-2 shadow-xl backdrop-blur-sm"></div>
      <div className="absolute bottom-24 left-12 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl opacity-25 animate-float-3 shadow-lg backdrop-blur-sm"></div>
      <div className="absolute bottom-40 right-8 w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full opacity-10 animate-float-4 shadow-2xl backdrop-blur-sm"></div>
      
      {/* Subtle geometric patterns */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-40 h-40 border border-blue-300/30 rounded-3xl backdrop-blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-32 h-32 border border-indigo-300/30 rounded-2xl backdrop-blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-purple-300/30 rounded-full backdrop-blur-3xl"></div>
      </div>
    </div>
  );
}
