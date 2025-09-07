import { useEffect } from "react";
import { useState } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import LoadingVideo from "@/components/loading-video";
import { useFirstVisit } from "@/hooks/use-first-visit";
import JobManager from "@/components/admin/job-manager";
import TestimonialManager from "@/components/admin/testimonial-manager";
import SubmissionManager from "@/components/admin/submission-manager";
import ResourceManager from "@/components/admin/resource-manager";
import { AdvertisementManager } from "@/components/admin/advertisement-manager";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Briefcase, 
  MessageSquare, 
  FileText, 
  BarChart3,
  TrendingUp,
  Star,
  Settings,
  Shield,
  Book,
  Megaphone
} from "lucide-react";

export default function Admin() {
  const { shouldShowLoading: firstVisitLoading } = useFirstVisit('admin', 3000);
  
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect to login if not authenticated or not admin/editor
  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'admin' && user.role !== 'editor'))) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  }, [user, isLoading, toast]);

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!(user && (user.role === 'admin' || user.role === 'editor')),
    queryFn: async () => {
      // Since we don't have a stats endpoint, we'll fetch basic counts
      const [jobsRes, submissionsRes, testimonialsRes] = await Promise.all([
        fetch("/api/admin/jobs"),
        fetch("/api/admin/submissions"),
        fetch("/api/admin/testimonials"),
      ]);

      const [jobs, submissions, testimonials] = await Promise.all([
        jobsRes.ok ? jobsRes.json() : { jobs: [], total: 0 },
        submissionsRes.ok ? submissionsRes.json() : [],
        testimonialsRes.ok ? testimonialsRes.json() : [],
      ]);

      return {
        totalJobs: jobs.total || jobs.jobs?.length || 0,
        totalSubmissions: submissions.length || 0,
        totalTestimonials: testimonials.length || 0,
        activeJobs: jobs.jobs?.filter((job: any) => job.status === 'published').length || 0,
      };
    },
  });

  if (isLoading || firstVisitLoading) {
    return (
      <LoadingVideo fullScreen={true} width={150} height={150} />
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <Shield className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              You don't have permission to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Jobs",
      value: dashboardStats?.totalJobs || 0,
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Jobs", 
      value: dashboardStats?.activeJobs || 0,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Form Submissions",
      value: dashboardStats?.totalSubmissions || 0,
      icon: FileText,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Testimonials",
      value: dashboardStats?.totalTestimonials || 0,
      icon: Star,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile-Optimized Header */}
          <div className="mb-6 md:mb-8" data-testid="admin-header">
            <h1 className="font-display text-2xl md:text-4xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
            <p className="text-base md:text-xl text-slate-600">
              Welcome back, {user.firstName || user.email?.split('@')[0]}. Manage your platform content and settings.
            </p>
          </div>

          {/* Mobile-Optimized Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8" data-testid="admin-stats">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-3 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-medium text-slate-600 truncate">{stat.title}</p>
                        <p className="text-lg md:text-3xl font-bold text-slate-800 truncate" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          {stat.value.toLocaleString()}
                        </p>
                      </div>
                      <div className={`p-2 md:p-3 rounded-xl ${stat.bgColor} self-center md:self-auto`}>
                        <Icon className={`h-4 w-4 md:h-6 md:w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Mobile-Optimized Admin Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6" data-testid="admin-tabs">
            {/* Mobile Tabs - Horizontal Scroll */}
            <div className="md:hidden">
              <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-2">
                {[
                  { value: "overview", icon: BarChart3, label: "Overview" },
                  { value: "jobs", icon: Briefcase, label: "Jobs" },
                  { value: "testimonials", icon: MessageSquare, label: "Reviews" },
                  { value: "resources", icon: Book, label: "Resources" },
                  { value: "advertisements", icon: Megaphone, label: "Ads" },
                  { value: "submissions", icon: FileText, label: "Forms" }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.value
                          ? 'bg-blue-100 text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      data-testid={`tab-${tab.value}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Tabs */}
            <TabsList className="hidden md:grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center space-x-2" data-testid="tab-overview">
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center space-x-2" data-testid="tab-jobs">
                <Briefcase className="h-4 w-4" />
                <span>Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="flex items-center space-x-2" data-testid="tab-testimonials">
                <MessageSquare className="h-4 w-4" />
                <span>Testimonials</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center space-x-2" data-testid="tab-resources">
                <Book className="h-4 w-4" />
                <span>Resources</span>
              </TabsTrigger>
              <TabsTrigger value="advertisements" className="flex items-center space-x-2" data-testid="tab-advertisements">
                <Megaphone className="h-4 w-4" />
                <span>Ads</span>
              </TabsTrigger>
              <TabsTrigger value="submissions" className="flex items-center space-x-2" data-testid="tab-submissions">
                <FileText className="h-4 w-4" />
                <span>Submissions</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 md:space-y-6" data-testid="overview-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                      <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <p className="text-xs md:text-sm text-slate-600">New job posted: "Senior Developer"</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <p className="text-xs md:text-sm text-slate-600">Form submission received</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <p className="text-xs md:text-sm text-slate-600">New testimonial approved</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                      <Settings className="h-4 w-4 md:h-5 md:w-5" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 md:space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-10 md:h-auto text-sm"
                      onClick={() => setActiveTab("jobs")}
                      data-testid="quick-action-add-job"
                    >
                      <Briefcase className="mr-2 h-4 w-4" />
                      Add New Job
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-10 md:h-auto text-sm"
                      onClick={() => setActiveTab("testimonials")}
                      data-testid="quick-action-review-testimonials"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Review Testimonials
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-10 md:h-auto text-sm"
                      onClick={() => setActiveTab("submissions")}
                      data-testid="quick-action-view-submissions"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Submissions
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="jobs" data-testid="jobs-content">
              <JobManager />
            </TabsContent>

            <TabsContent value="testimonials" data-testid="testimonials-content">
              <TestimonialManager />
            </TabsContent>

            <TabsContent value="resources" data-testid="resources-content">
              <ResourceManager />
            </TabsContent>

            <TabsContent value="advertisements" data-testid="advertisements-content">
              <AdvertisementManager />
            </TabsContent>

            <TabsContent value="submissions" data-testid="submissions-content">
              <SubmissionManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
}
