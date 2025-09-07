import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import ScrollProgress from "@/components/scroll-progress";
import Footer from "@/components/footer";
import LoadingVideo from "@/components/loading-video";
import { useFirstVisit } from "@/hooks/use-first-visit";
import ConsultationForm from "@/components/forms/consultation-form";
import JobApplicationForm from "@/components/forms/job-application-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  Mail,
  Plane,
  HelpCircle
} from "lucide-react";

type FormType = 'consultation' | 'job-application' | 'study-abroad' | 'visa-counseling' | 'document-review' | 'contact';

export default function Forms() {
  const { shouldShowLoading: firstVisitLoading } = useFirstVisit('forms', 2500);
  
  const [selectedService, setSelectedService] = useState<FormType | null>(null);

  useEffect(() => {
    document.title = "Services & Forms - Udaan Agencies | Global Career Services";
  }, []);

  const services = [
    {
      id: 'consultation' as FormType,
      title: 'Free Consultation',
      description: 'Get expert advice on your career goals, study options, and visa requirements with our experienced consultants.',
      icon: Calendar,
      color: 'from-primary-500 to-primary-600',
      buttonColor: 'bg-primary-600 hover:bg-primary-700',
    },
    {
      id: 'job-application' as FormType,
      title: 'Job Application',
      description: 'Apply for international job opportunities with our guided application process and interview preparation.',
      icon: Briefcase,
      color: 'from-coral-400 to-coral-500',
      buttonColor: 'bg-coral-500 hover:bg-coral-600',
    },
    {
      id: 'study-abroad' as FormType,
      title: 'Study Abroad',
      description: 'Complete guidance for university applications, scholarship opportunities, and student visa processing.',
      icon: GraduationCap,
      color: 'from-green-400 to-green-500',
      buttonColor: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'visa-counseling' as FormType,
      title: 'Visa Counseling',
      description: 'Expert visa guidance, document preparation, and application support for various visa categories.',
      icon: Plane,
      color: 'from-purple-400 to-purple-500',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 'document-review' as FormType,
      title: 'Document Review',
      description: 'Professional review and feedback on your CV, cover letters, and application documents.',
      icon: FileText,
      color: 'from-amber-400 to-amber-500',
      buttonColor: 'bg-amber-500 hover:bg-amber-600',
    },
    {
      id: 'contact' as FormType,
      title: 'General Inquiry',
      description: 'Have questions about our services? Contact us for any general inquiries or specific requests.',
      icon: Mail,
      color: 'from-blue-400 to-blue-500',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
    },
  ];

  const selectedServiceData = services.find(service => service.id === selectedService);

  const renderActiveForm = () => {
    if (!selectedService) return null;
    
    switch (selectedService) {
      case 'consultation':
        return <ConsultationForm />;
      case 'job-application':
        return <JobApplicationForm />;
      case 'study-abroad':
        return <ConsultationForm />; // Placeholder for now
      case 'visa-counseling':
        return <ConsultationForm />; // Placeholder for now
      case 'document-review':
        return <ConsultationForm />; // Placeholder for now
      case 'contact':
        return <ConsultationForm />; // Placeholder for now
      default:
        return null;
    }
  };

  if (firstVisitLoading) {
    return <LoadingVideo fullScreen={true} width={150} height={150} />;
  }
  
  return (
    <div className="mobile-app-container bg-slate-50">
      <Navigation />
      <ScrollProgress />
      
      <div className="pt-16 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8" data-testid="forms-header">
            <h1 className="font-display text-4xl font-bold text-slate-800 mb-4">Our Services</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">Select a service below to get started with your application</p>
          </div>

          {/* Service Selector Dropdown */}
          <div className="mb-8" data-testid="service-selector">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Choose Your Service</h2>
              <p className="text-slate-600">Select from our comprehensive range of services</p>
            </div>
            
            <Select 
              value={selectedService || ""} 
              onValueChange={(value) => setSelectedService(value as FormType)}
            >
              <SelectTrigger className="w-full max-w-md mx-auto h-14 text-lg border-2 border-gray-300 rounded-xl" data-testid="select-service">
                <SelectValue placeholder="Select a service..." />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => {
                  const Icon = service.icon;
                  return (
                    <SelectItem key={service.id} value={service.id} className="py-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-slate-600" />
                        <span className="font-medium">{service.title}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Service Description */}
          {selectedServiceData && (
            <div className="mb-8 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500" data-testid="service-description">
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${selectedServiceData.color} rounded-xl flex items-center justify-center`}>
                      <selectedServiceData.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{selectedServiceData.title}</h3>
                  </div>
                  <p className="text-slate-700 text-lg leading-relaxed max-w-2xl mx-auto">
                    {selectedServiceData.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Form Section */}
          <div className={`transition-all duration-500 ${!selectedService ? 'blur-sm pointer-events-none opacity-60' : ''}`} data-testid="form-section">
            {!selectedService ? (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HelpCircle className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Select a Service</h3>
                  <p className="text-slate-600 text-lg">
                    Please choose a service from the dropdown above to view and fill out the application form.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      {selectedServiceData?.title} Form
                    </h3>
                    <p className="text-slate-600">
                      Please fill out all required fields below to submit your application.
                    </p>
                  </div>
                  {renderActiveForm()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}