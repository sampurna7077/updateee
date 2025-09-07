import { useEffect } from "react";
import Navigation from "@/components/navigation";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import ScrollProgress from "@/components/scroll-progress";
import Footer from "@/components/footer";
import LoadingVideo from "@/components/loading-video";
import { useFirstVisit } from "@/hooks/use-first-visit";
import { useAuth } from "@/hooks/useAuth";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Globe, 
  Briefcase, 
  MessageSquare, 
  FileText, 
  BookOpen, 
  TrendingUp,
  Users,
  Building2,
  Award
} from "lucide-react";

export default function Home() {
  const { shouldShowLoading: firstVisitLoading } = useFirstVisit('home', 2500);
  const { user } = useAuth();

  const { data: recentApplications = [] } = useQuery<any[]>({
    queryKey: ["/api/jobs/applications", user?.id],
    enabled: !!user?.id,
  });

  const { data: savedJobs = [] } = useQuery<any[]>({
    queryKey: ["/api/saved-jobs"],
    enabled: !!user?.id,
  });

  if (firstVisitLoading) {
    return <LoadingVideo fullScreen={true} width={150} height={150} />;
  }
  
  return (
    <div className="mobile-app-container bg-slate-50">
      <Navigation />
      <ScrollProgress />
      
      <div className="pt-4 md:pt-16">
        {/* Mobile Welcome Hero */}
        <section className="mobile-content md:max-w-7xl md:mx-auto py-6 md:py-16" data-testid="welcome-hero">
          <div className="text-center">
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-slate-800 mb-4 md:mb-6">
              Welcome back!
            </h1>
            <p className="text-base md:text-xl text-slate-600 mb-6 md:mb-8 leading-relaxed">
              Continue your international career journey
            </p>
            <Link href="/jobs">
              <Button 
                className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 touch-target"
                data-testid="button-explore-opportunities"
              >
                <Globe className="mr-2 h-5 w-5" />
                Explore Jobs
              </Button>
            </Link>
          </div>
        </section>

        {/* Mobile Quick Actions */}
        <section className="py-6 md:py-12" data-testid="quick-actions">
          <div className="mobile-content md:max-w-7xl md:mx-auto">
            <h2 className="text-xl md:text-3xl font-bold text-slate-800 mb-6 md:mb-8 text-center">Quick Actions</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <Link href="/jobs">
                <Card className="card-hover cursor-pointer group" data-testid="card-search-jobs">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-slate-800 mb-2">Search Jobs</h3>
                    <p className="text-slate-600">Find your next international opportunity</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/forms">
                <Card className="card-hover cursor-pointer group" data-testid="card-book-consultation">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-coral-400 to-coral-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-slate-800 mb-2">Book Consultation</h3>
                    <p className="text-slate-600">Get expert guidance for your career</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/feedbacks">
                <Card className="card-hover cursor-pointer group" data-testid="card-read-testimonials">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-slate-800 mb-2">Success Stories</h3>
                    <p className="text-slate-600">Read testimonials from successful clients</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/resources">
                <Card className="card-hover cursor-pointer group" data-testid="card-explore-resources">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-slate-800 mb-2">Resources</h3>
                    <p className="text-slate-600">Access guides and country information</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        {recentApplications && recentApplications.length > 0 && (
          <section className="py-12 bg-white" data-testid="recent-activity">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-display text-3xl font-bold text-slate-800 mb-8">Your Recent Activity</h2>
              
              <div className="space-y-4">
                {recentApplications.slice(0, 5).map((application: any) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow" data-testid={`application-${application.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Briefcase className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{application.job?.title}</h3>
                            <p className="text-slate-600">{application.job?.company?.name}</p>
                            <p className="text-sm text-slate-500">Applied on {new Date(application.appliedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Saved Jobs Section */}
        {savedJobs && savedJobs.length > 0 && (
          <section className="py-12 bg-slate-50" data-testid="saved-jobs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-display text-3xl font-bold text-slate-800 mb-8">Your Saved Jobs</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedJobs.slice(0, 6).map((job: any) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow" data-testid={`saved-job-${job.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-slate-600" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-slate-800 mb-2">{job.title}</h3>
                      <p className="text-slate-600 mb-2">{job.company?.name}</p>
                      <p className="text-sm text-slate-500 mb-4">{job.location}, {job.country}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary-600">
                          {job.country?.toLowerCase() === 'nepal' ? 'NPR' : '$'} {job.salaryMin || 'Competitive'}
                        </span>
                        <Link href={`/jobs`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {savedJobs.length > 6 && (
                <div className="text-center mt-8">
                  <Link href="/jobs">
                    <Button variant="outline">View All Saved Jobs</Button>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Admin Access (if user is admin) */}
        {(user?.role === 'admin' || user?.role === 'editor') && (
          <section className="py-12" data-testid="admin-access">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="bg-gradient-to-r from-primary-600 to-coral-500 text-white">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-bold mb-2">Admin Dashboard</h3>
                      <p className="opacity-90">Manage jobs, testimonials, and form submissions</p>
                    </div>
                    <Link href="/admin">
                      <Button 
                        variant="secondary" 
                        className="bg-white text-primary-600 hover:bg-gray-50"
                        data-testid="button-admin-dashboard"
                      >
                        <Award className="mr-2 h-4 w-4" />
                        Access Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
