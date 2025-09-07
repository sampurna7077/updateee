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
      
      {/* Modern Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" 
               data-testid="hero-content">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-50">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        
        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium">
              🚀 Your Global Career Journey Starts Here
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Career Opportunities
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                Locally & Globally
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Connect with opportunities in Nepal and internationally. Expert guidance for local placements and global career journeys with visa support.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
              <Link href="/jobs?local=true">
                <button className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <span className="flex items-center gap-2">
                    🇳🇵 Local Jobs Nepal
                  </span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
              </Link>
              
              <button 
                onClick={scrollToJobs}
                className="group relative px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  🌍 Search Global Jobs
                </span>
              </button>
              
              <button 
                onClick={bookConsultation}
                className="group relative px-6 py-3 border border-white/30 text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                💬 Free Consultation
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 mt-12 text-gray-400">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span className="text-sm">Trusted by 2.5K+ professionals</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span className="text-sm">45+ Countries</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span className="text-sm">800+ Partner Companies</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center animate-float opacity-20">
          <Plane className="w-8 h-8 text-white" />
        </div>
        <div className="absolute top-40 right-32 w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center animate-float opacity-20" style={{animationDelay: '1s'}}>
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <div className="absolute bottom-32 left-32 w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center animate-float opacity-20" style={{animationDelay: '2s'}}>
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className="absolute bottom-40 right-20 w-18 h-18 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center animate-float opacity-20" style={{animationDelay: '1.5s'}}>
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
      </section>

      {/* Modern Stats Section */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands Worldwide
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join the professionals who've transformed their careers with our expert guidance
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" data-testid="stat-placements">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {stats?.successfulPlacements ? `${stats.successfulPlacements.toLocaleString()}+` : '2.5K+'}
              </div>
              <div className="text-gray-600 font-medium">Success Stories</div>
            </div>
            
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" data-testid="stat-countries">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {stats?.partnerCountries ? `${stats.partnerCountries}+` : '45+'}
              </div>
              <div className="text-gray-600 font-medium">Countries</div>
            </div>
            
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" data-testid="stat-companies">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {stats?.partnerCompanies ? `${stats.partnerCompanies.toLocaleString()}+` : '800+'}
              </div>
              <div className="text-gray-600 font-medium">Companies</div>
            </div>
            
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" data-testid="stat-satisfaction">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {stats?.clientSatisfaction ? `${stats.clientSatisfaction}%` : '98%'}
              </div>
              <div className="text-gray-600 font-medium">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden" data-testid="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
              ✨ Simple Process
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              How It <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to transform your career journey with our proven process and expert guidance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="group relative" data-testid="step-consult">
              {/* Connection Line - hidden on mobile */}
              <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-purple-200 to-transparent -translate-x-6 z-0"></div>
              
              <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group-hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Consult</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Book a free consultation with our expert advisors to understand your goals and create a personalized roadmap for your career journey.
                </p>
              </div>
            </div>
            
            <div className="group relative" data-testid="step-apply">
              {/* Connection Line - hidden on mobile */}
              <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-transparent -translate-x-6 z-0"></div>
              
              <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group-hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Plane className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Apply</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Apply to curated opportunities with our comprehensive guidance, document preparation, and application support throughout the process.
                </p>
              </div>
            </div>
            
            <div className="group relative" data-testid="step-land">
              <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group-hover:scale-105">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Land</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Secure your dream position with our continued support for visa processing, relocation assistance, and settlement guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
      </section>

      {/* Modern Featured Jobs Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative" data-testid="featured-jobs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-6">
              ⭐ Featured Opportunities
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Handpicked <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Opportunities</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Carefully selected jobs from top global companies offering the best career opportunities
            </p>
            <button 
              onClick={scrollToJobs}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              data-testid="button-view-all-jobs"
            >
              View All Jobs <TrendingUp className="w-5 h-5 ml-2" />
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

      {/* Modern Success Stories Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden" data-testid="success-stories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-6">
              🎉 Success Stories
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Real People, <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Real Success</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how we've helped transform careers and lives across the globe with our proven expertise and personalized guidance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.length > 0 ? (
              testimonials.slice(0, 3).map((testimonial, index) => (
                <div 
                  key={testimonial.id} 
                  className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 ${index === 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : index === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}></div>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">({testimonial.rating}/5)</span>
                  </div>

                  {/* Review */}
                  <blockquote className="text-gray-700 mb-6 italic leading-relaxed">
                    "{testimonial.review}"
                  </blockquote>

                  {/* Author Info */}
                  <div className="border-t pt-6">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${index === 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : index === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}>
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                        <p className="text-sm text-gray-600">{testimonial.position}</p>
                        <p className="text-sm text-gray-500">{testimonial.company}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        testimonial.serviceType === 'visa' ? 'bg-blue-100 text-blue-800' : 
                        testimonial.serviceType === 'placements' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {testimonial.serviceType === 'visa' ? '🛂 Visa Support' :
                         testimonial.serviceType === 'placements' ? '🎯 Job Placement' :
                         testimonial.serviceType}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Success Stories Coming Soon</h3>
                <p className="text-gray-600 max-w-md mx-auto">We're gathering testimonials from our successful clients around the world.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
