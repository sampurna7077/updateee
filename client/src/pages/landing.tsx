import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import ScrollProgress from "@/components/scroll-progress";
import Footer from "@/components/footer";
import LoadingVideo from "@/components/loading-video";
import { useFirstVisit } from "@/hooks/use-first-visit";
import HeroAnimations from "@/components/hero-animations";
import JobCard from "@/components/job-card";
import TestimonialCard from "@/components/testimonial-card";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Globe, Plane, Briefcase, Users, Building2, Award, TrendingUp } from "lucide-react";

interface FeaturedJob {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
  };
  location: string;
  country: string;
  remoteType: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  tags?: string;
  postedAt: string;
  visaSupport: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  position?: string;
  company?: string;
  photo?: string;
  rating: number;
  review: string;
  serviceType: string;
  createdAt: string;
}

interface Stats {
  successfulPlacements: number;
  partnerCountries: number;
  partnerCompanies: number;
  clientSatisfaction: number;
}

export default function Landing() {
  const { shouldShowLoading: firstVisitLoading } = useFirstVisit('landing', 2500);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  const { data: featuredJobs = [], isLoading: jobsLoading } = useQuery<FeaturedJob[]>({
    queryKey: ["/api/jobs/featured"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (v5 syntax)
  });

  useEffect(() => {
    document.title = "Udaan Agencies - Global Career Opportunities | Abroad Consultancy";
    
    // Enhanced Scroll Animation Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe scroll animation elements
    const scrollElements = document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale');
    scrollElements.forEach(el => observer.observe(el));


    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToJobs = () => {
    window.location.href = '/jobs';
  };

  const bookConsultation = () => {
    window.location.href = '/forms';
  };

  if (firstVisitLoading) {
    return <LoadingVideo fullScreen={true} width={150} height={150} />;
  }

  return (
    <div className="mobile-app-container">
      <Navigation />
      <ScrollProgress />
      
      {/* Mobile Hero Section */}
      <section className="pt-6 pb-12 md:min-h-screen md:flex md:items-center relative overflow-hidden" 
               style={{background: 'linear-gradient(135deg, #e0f2fe 0%, #cffafe 50%, #f0f9ff 100%)'}} 
               data-testid="hero-content">
        <div className="mobile-content md:container relative z-10">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-12 items-center">
            {/* Mobile-First Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-display mb-4 font-bold animate-fade-in-up" 
                  style={{color: 'var(--gray-800)', lineHeight: '1.2'}}>
                Global Career<br />Opportunities<br />
                <span className="bg-gradient-rainbow bg-clip-text text-transparent">globally</span>.
              </h1>
              <p className="text-lg md:text-xl mb-6 md:mb-8 animate-fade-in-up animate-delay-100 mx-auto lg:mx-0" 
                 style={{color: 'var(--gray-600)', maxWidth: '500px'}}>
                Udaan Agencies simplifies your international career journey, with expert guidance to access global opportunities and visa support.
              </p>
              
              {/* Primary Action */}
              <div className="mb-4 animate-fade-in-up animate-delay-200 flex justify-center lg:justify-start">
                <button
                  onClick={scrollToJobs}
                  className="btn btn-lg hover-lift-large"
                  data-testid="button-search-jobs"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    color: 'white',
                    padding: '18px 40px',
                    borderRadius: '16px',
                    fontWeight: '600',
                    fontSize: '18px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  }}
                >
                  🌍 Search Global Jobs
                </button>
              </div>

              {/* Secondary Actions - Side by Side */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-8 animate-fade-in-up animate-delay-300 justify-center lg:justify-start">
                <Link href="/jobs?local=true">
                  <button
                    className="btn btn-md hover-lift-large group relative overflow-hidden"
                    data-testid="button-local-jobs-nepal"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #047857)',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '14px',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                      border: 'none'
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      🇳🇵 Local Jobs Nepal
                    </span>
                  </button>
                </Link>
                <button
                  onClick={bookConsultation}
                  className="btn btn-md hover-lift-large"
                  data-testid="button-book-consultation"
                  style={{
                    background: 'transparent',
                    color: 'var(--primary)',
                    border: '2px solid var(--primary)',
                    padding: '10px 24px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  💬 Free Consultation
                </button>
              </div>
              
              <p className="text-sm animate-fade-in-up animate-delay-300 text-center lg:text-left" 
                 style={{color: 'var(--gray-500)'}}>
                Free consultation for 30 minutes. No commitment required.
              </p>
            </div>

            {/* Right Visual */}
            <div className="relative lg:pl-8 animate-fade-in-right animate-delay-400">
              <div className="relative w-full max-w-lg mx-auto" style={{height: '500px'}}>
                {/* Central Globe */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full flex items-center justify-center animate-float"
                     style={{background: 'linear-gradient(135deg, var(--primary), var(--accent))'}}>
                  <Globe className="w-24 h-24 text-white" />
                </div>

                {/* Floating Elements */}
                {/* Airplane */}
                <div className="absolute top-16 right-8 w-16 h-16 rounded-2xl flex items-center justify-center animate-float hover-rotate"
                     style={{background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-yellow))', animationDelay: '0.5s'}}>
                  <Plane className="w-8 h-8 text-white" />
                </div>

                {/* Briefcase */}
                <div className="absolute top-32 left-4 w-14 h-14 rounded-xl flex items-center justify-center animate-float hover-rotate"
                     style={{background: 'linear-gradient(135deg, var(--secondary), var(--accent-teal))', animationDelay: '1s'}}>
                  <Briefcase className="w-7 h-7 text-white" />
                </div>

                {/* Users */}
                <div className="absolute bottom-24 right-12 w-12 h-12 rounded-lg flex items-center justify-center animate-float hover-rotate"
                     style={{background: 'linear-gradient(135deg, var(--accent-pink), var(--primary))', animationDelay: '1.5s'}}>
                  <Users className="w-6 h-6 text-white" />
                </div>

                {/* Award */}
                <div className="absolute bottom-16 left-8 w-14 h-14 rounded-xl flex items-center justify-center animate-float hover-rotate"
                     style={{background: 'linear-gradient(135deg, var(--accent-yellow), var(--accent-orange))', animationDelay: '2s'}}>
                  <Award className="w-7 h-7 text-white" />
                </div>

                {/* TrendingUp */}
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-lg flex items-center justify-center animate-float hover-rotate"
                     style={{background: 'linear-gradient(135deg, var(--accent-teal), var(--secondary))', animationDelay: '2.5s'}}>
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>

                {/* Building2 */}
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-lg flex items-center justify-center animate-float hover-rotate"
                     style={{background: 'linear-gradient(135deg, var(--accent), var(--primary))', animationDelay: '3s'}}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full opacity-20 animate-pulse"
             style={{background: 'linear-gradient(135deg, var(--primary), var(--accent))'}}></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 rounded-full opacity-20 animate-pulse"
             style={{background: 'linear-gradient(135deg, var(--secondary), var(--accent-teal))', animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 right-8 w-16 h-16 rounded-full opacity-20 animate-pulse"
             style={{background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-yellow))', animationDelay: '2s'}}></div>
      </section>

      {/* Mobile-Optimized Stats Section */}
      <section className="py-8 md:py-16 bg-white">
        <div className="mobile-content md:container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 scroll-animate-scale">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 touch-target" data-testid="stat-placements">
              <div className="text-2xl md:text-4xl font-bold mb-2" style={{color: 'var(--primary)'}}>
                {stats?.successfulPlacements ? `${stats.successfulPlacements.toLocaleString()}+` : '2.5K+'}
              </div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">Success Stories</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 touch-target" data-testid="stat-countries">
              <div className="text-2xl md:text-4xl font-bold mb-2" style={{color: 'var(--accent)'}}>
                {stats?.partnerCountries ? `${stats.partnerCountries}+` : '45+'}
              </div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">Countries</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 touch-target" data-testid="stat-companies">
              <div className="text-2xl md:text-4xl font-bold mb-2" style={{color: 'var(--secondary)'}}>
                {stats?.partnerCompanies ? `${stats.partnerCompanies.toLocaleString()}+` : '800+'}
              </div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">Companies</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-pink-50 to-red-50 touch-target" data-testid="stat-satisfaction">
              <div className="text-2xl md:text-4xl font-bold mb-2" style={{color: 'var(--accent-orange)'}}>
                {stats?.clientSatisfaction ? `${stats.clientSatisfaction}%` : '98%'}
              </div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-gradient-soft section-feather curved-divider-top curved-divider-bottom scroll-animate" data-testid="how-it-works">
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-h1 mb-6 scroll-animate-left bg-gradient-rainbow bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-large text-body max-w-2xl mx-auto scroll-animate-right">
              Three simple steps to launch your international career with our proven process
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-item scroll-animate animate-delay-100" data-testid="step-consult">
              <div className="feature-icon hover-rotate animate-float" style={{background: 'linear-gradient(135deg, var(--primary), var(--accent))'}}>
                <Users className="w-7 h-7" style={{color: 'white'}} />
              </div>
              <h3 className="feature-title" style={{color: 'var(--primary)'}}>1. Consult</h3>
              <p className="feature-description">Book a free consultation with our expert advisors to understand your goals and create a personalized roadmap for your international career journey.</p>
            </div>
            
            <div className="feature-item scroll-animate animate-delay-300" data-testid="step-apply">
              <div className="feature-icon hover-rotate animate-float" style={{background: 'linear-gradient(135deg, var(--secondary), var(--accent-teal))', animationDelay: '1s'}}>
                <Plane className="w-7 h-7" style={{color: 'white'}} />
              </div>
              <h3 className="feature-title" style={{color: 'var(--secondary)'}}>2. Apply</h3>
              <p className="feature-description">Apply to curated job opportunities and study programs with our comprehensive guidance, document preparation, and application support throughout the process.</p>
            </div>
            
            <div className="feature-item scroll-animate animate-delay-500" data-testid="step-land">
              <div className="feature-icon hover-rotate animate-float" style={{background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-yellow))', animationDelay: '2s'}}>
                <Award className="w-7 h-7" style={{color: 'white'}} />
              </div>
              <h3 className="feature-title" style={{color: 'var(--accent-orange)'}}>3. Land</h3>
              <p className="feature-description">Secure your dream job or study placement with our continued support for visa processing, relocation assistance, and settlement guidance in your new country.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Preview */}
      <section className="section scroll-animate" data-testid="featured-jobs">
        <div className="container">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-12">
            <div className="mb-6 md:mb-0">
              <h2 className="text-h1 mb-4 scroll-animate-left">Featured Opportunities</h2>
              <p className="text-large text-body scroll-animate-left animate-delay-200">Handpicked jobs from top global companies worldwide</p>
            </div>
            <button 
              onClick={scrollToJobs}
              className="btn btn-primary btn-md scroll-animate-right hover-lift-large hover-glow"
              data-testid="button-view-all-jobs"
            >
              View All Jobs <TrendingUp className="w-4 h-4 animate-pulse" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.length > 0 ? (
              featuredJobs.slice(0, 6).map(job => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Briefcase className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No Featured Jobs Available</h3>
                <p className="text-slate-500">Check back soon for new opportunities or browse all jobs.</p>
                <Button 
                  onClick={scrollToJobs}
                  variant="outline" 
                  className="mt-4"
                  data-testid="button-browse-all-jobs"
                >
                  Browse All Jobs
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="section bg-gradient-soft section-feather curved-divider-top scroll-animate" data-testid="success-stories">
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-h1 mb-6 scroll-animate-scale bg-gradient-rainbow bg-clip-text text-transparent">Success Stories</h2>
            <p className="text-large text-body max-w-2xl mx-auto scroll-animate-scale animate-delay-200">Real people, real success. See how we've helped transform careers and lives across the globe with our proven expertise.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.length > 0 ? (
              testimonials.slice(0, 3).map((testimonial, index) => (
                <div 
                  key={testimonial.id} 
                  className={`card card-hover scroll-animate hover-lift-large animate-delay-${300 + index * 100}`}
                  style={{borderTop: `4px solid ${index === 0 ? 'var(--primary)' : index === 1 ? 'var(--secondary)' : 'var(--accent-orange)'}`}}
                >
                  <div className="card-body">
                    <TestimonialCard testimonial={testimonial} />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 scroll-animate-scale animate-delay-400">
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center animate-float hover-rotate" style={{background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: 'var(--radius-xl)'}}>
                  <Users className="w-8 h-8 animate-pulse" style={{color: 'white'}} />
                </div>
                <h3 className="text-h3 mb-4" style={{color: 'var(--primary)'}}>Success Stories Coming Soon</h3>
                <p className="text-body">We're gathering testimonials from our successful clients around the world.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
