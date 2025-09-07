import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import ScrollProgress from "@/components/scroll-progress";
import Footer from "@/components/footer";
import LoadingVideo from "@/components/loading-video";
import { useFirstVisit } from "@/hooks/use-first-visit";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Download, 
  ExternalLink, 
  ArrowRight,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  TrendingUp
} from "lucide-react";

interface Resource {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  type: string;
  category?: string;
  country?: string;
  tags?: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  isFeatured?: boolean;
}

export default function Resources() {
  const { shouldShowLoading: firstVisitLoading } = useFirstVisit('resources', 2500);
  
  const [activeSection, setActiveSection] = useState("guides");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Resources & Guides - Udaan Agencies | Country Guides & Career Tips";
  }, []);

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources", activeSection],
    queryFn: async () => {
      const params = activeSection !== "all" ? `?type=${activeSection}` : "";
      const response = await fetch(`/api/resources${params}`);
      if (!response.ok) throw new Error('Failed to fetch resources');
      return response.json();
    },
  });

  const { data: faqs = [], isLoading: faqsLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources", "faq"],
    queryFn: async () => {
      const response = await fetch("/api/resources?type=faq");
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      return response.json();
    },
  });

  const sections = [
    { id: "guides", label: "Country Guides", icon: Globe },
    { id: "blog", label: "Blog & News", icon: FileText },
    { id: "downloads", label: "Downloads", icon: Download },
    { id: "faq", label: "FAQ", icon: HelpCircle },
  ];

  const displayFaqs = faqs;

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const renderGuides = () => {
    const guideResources = resources.filter(resource => resource.type === 'guide' || resource.type === 'guides');
    const featuredGuide = guideResources.find(guide => guide.isFeatured);
    
    return (
      <div data-testid="country-guides">
        <h2 className="font-display text-2xl font-bold text-slate-800 mb-8">Popular Destination Guides</h2>
        
        {/* Featured Guide */}
        {featuredGuide && (
          <Card className="bg-gradient-to-br from-primary-50 to-coral-50 mb-12" data-testid="featured-report">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="font-display text-2xl font-bold text-slate-800 mb-4">{featuredGuide.title}</h3>
                  <p className="text-slate-600 mb-6">{featuredGuide.excerpt || featuredGuide.content.substring(0, 200) + '...'}</p>
                  <Button 
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300"
                    data-testid="button-download-report"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Read Guide
                  </Button>
                </div>
                <div className="flex items-center justify-center">
                  {featuredGuide.featuredImage ? (
                    <img 
                      src={featuredGuide.featuredImage} 
                      alt={featuredGuide.title}
                      className="w-64 h-48 object-cover rounded-xl shadow-lg"
                    />
                  ) : (
                    <div className="w-64 h-48 bg-white rounded-xl shadow-lg flex items-center justify-center">
                      <TrendingUp className="h-16 w-16 text-primary-600" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Country Guides Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guideResources.filter(guide => !guide.isFeatured).map((guide) => (
            <Card key={guide.id} className="shadow-lg card-hover" data-testid={`guide-${guide.slug}`}>
              {guide.featuredImage ? (
                <img 
                  src={guide.featuredImage} 
                  alt={guide.title}
                  className="h-48 w-full object-cover rounded-t-2xl"
                />
              ) : (
                <div className="h-48 bg-slate-200 rounded-t-2xl flex items-center justify-center">
                  <Globe className="h-16 w-16 text-slate-400" />
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="font-display text-xl font-bold text-slate-800 mb-3">{guide.title}</h3>
                <p className="text-slate-600 mb-4">{guide.excerpt || guide.content.substring(0, 150) + '...'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {guide.tags && guide.tags.split(',').slice(0, 2).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                    {guide.country && (
                      <Badge variant="secondary" className="text-xs">
                        {guide.country}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-primary-600 hover:text-primary-700 font-medium p-0"
                    data-testid={`button-view-guide-${guide.slug}`}
                  >
                    Read Guide <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {guideResources.length === 0 && (
          <div className="text-center py-12">
            <Globe className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No guides available yet. Check back soon!</p>
          </div>
        )}
      </div>
    );
  };

  const renderBlog = () => {
    const blogResources = resources.filter(resource => resource.type === 'blog');
    
    return (
      <div data-testid="blog-section">
        <h2 className="font-display text-2xl font-bold text-slate-800 mb-8">Latest Blog Posts</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {blogResources.map((post) => (
            <Card key={post.id} className="shadow-lg card-hover" data-testid={`blog-post-${post.slug}`}>
              {post.featuredImage ? (
                <img 
                  src={post.featuredImage} 
                  alt={post.title}
                  className="h-48 w-full object-cover rounded-t-2xl"
                />
              ) : (
                <div className="h-48 bg-slate-200 rounded-t-2xl flex items-center justify-center">
                  <FileText className="h-16 w-16 text-slate-400" />
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex items-center text-sm text-slate-500 mb-3">
                  {post.category && <span>{post.category}</span>}
                  {post.category && <span className="mx-2">•</span>}
                  <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-slate-800 mb-3">{post.title}</h3>
                <p className="text-slate-600 mb-4">{post.excerpt || post.content.substring(0, 150) + '...'}</p>
                <Button 
                  variant="ghost" 
                  className="text-primary-600 hover:text-primary-700 font-medium p-0"
                  data-testid={`button-read-article-${post.slug}`}
                >
                  Read More <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {blogResources.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No blog posts available yet. Check back soon!</p>
          </div>
        )}
      </div>
    );
  };

  const renderDownloads = () => {
    const downloadResources = resources.filter(resource => resource.type === 'download');
    
    return (
      <div data-testid="downloads-section">
        <h2 className="font-display text-2xl font-bold text-slate-800 mb-8">Downloads & Templates</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {downloadResources.map((download) => (
            <Card key={download.id} className="shadow-lg hover:shadow-xl transition-all duration-300" data-testid={`download-${download.slug}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Download className="h-6 w-6 text-primary-600" />
                  </div>
                  {download.category && <Badge variant="secondary" className="text-xs">{download.category}</Badge>}
                </div>
                <h3 className="font-display text-lg font-bold text-slate-800 mb-2">{download.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{download.excerpt || download.content.substring(0, 100) + '...'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {new Date(download.publishedAt || download.createdAt).toLocaleDateString()}
                  </span>
                  <Button 
                    size="sm"
                    className="bg-primary-600 hover:bg-primary-700"
                    data-testid={`button-download-${download.slug}`}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {downloadResources.length === 0 && (
          <div className="text-center py-12">
            <Download className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No downloads available yet. Check back soon!</p>
          </div>
        )}
      </div>
    );
  };

  const renderFaq = () => (
    <div data-testid="faq-section">
      <h2 className="font-display text-2xl font-bold text-slate-800 mb-8 text-center">Frequently Asked Questions</h2>
      
      {faqsLoading ? (
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-lg overflow-hidden">
              <div className="px-6 py-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {displayFaqs.map((faq) => (
            <Card key={faq.id} className="shadow-lg overflow-hidden" data-testid={`faq-${faq.id}`}>
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                data-testid={`faq-question-${faq.id}`}
              >
                <span className="font-medium text-slate-800">{faq.title}</span>
                {expandedFaq === faq.id ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {expandedFaq === faq.id && (
                <div className="px-6 pb-4 text-slate-600" data-testid={`faq-answer-${faq.id}`}>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: faq.content }}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "guides":
        return renderGuides();
      case "blog":
        return renderBlog();
      case "downloads":
        return renderDownloads();
      case "faq":
        return renderFaq();
      default:
        return renderGuides();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="app-like-header">
        <Navigation />
      </div>
      <ScrollProgress />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white px-6 py-8 mt-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">Resources & Guides</h1>
          <p className="text-blue-100 text-lg font-medium">Everything you need to know about studying and working abroad</p>
        </div>
      </div>

      {/* Mobile Section Navigation */}
      <div className="md:hidden bg-white border-b border-gray-100 sticky top-[64px] z-40">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "outline"}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all text-sm ${
                    activeSection === section.id
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  data-testid={`mobile-section-button-${section.id}`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {section.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="md:hidden pb-24">
        <div className="px-4 sm:px-6 pt-6">
          <div className="min-h-[400px]" data-testid="mobile-active-section-content">
            {(isLoading || firstVisitLoading) ? (
              <div className="text-center py-16">
                <LoadingVideo width={120} height={120} />
                <p className="mt-6 text-slate-600 text-lg">Loading resources...</p>
              </div>
            ) : (
              renderActiveSection()
            )}
          </div>
        </div>
      </div>
      
      {/* Desktop Content */}
      <div className="hidden md:block pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12" data-testid="resources-header">
            <h1 className="font-display text-4xl font-bold text-slate-800 mb-4">Resources & Guides</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">Everything you need to know about studying and working abroad</p>
          </div>

          {/* Quick Navigation */}
          <div className="grid md:grid-cols-4 gap-4 mb-12" data-testid="section-navigation">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "outline"}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                    activeSection === section.id
                      ? "bg-primary-600 hover:bg-primary-700 text-white"
                      : "border-2 border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                  data-testid={`section-button-${section.id}`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {section.label}
                </Button>
              );
            })}
          </div>

          {/* Active Section Content */}
          <div className="min-h-[600px]" data-testid="active-section-content">
            {(isLoading || firstVisitLoading) ? (
              <div className="text-center py-16">
                <LoadingVideo width={120} height={120} />
                <p className="mt-6 text-slate-600 text-lg">Loading resources...</p>
              </div>
            ) : (
              renderActiveSection()
            )}
          </div>
        </div>
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
