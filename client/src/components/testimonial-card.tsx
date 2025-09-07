import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Testimonial {
  id: string;
  name: string;
  position?: string;
  company?: string;
  photo?: string;
  rating: number;
  review: string;
  service_type?: string;
  serviceType?: string;
  created_at: string;
  is_verified?: boolean;
  is_visible?: boolean;
  isVerified?: boolean;
  isVisible?: boolean;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const getServiceTypeBadge = () => {
    const variants: Record<string, string> = {
      placements: "bg-blue-100 text-blue-800",
      visa: "bg-green-100 text-green-800",
      education: "bg-purple-100 text-purple-800",
    };
    
    return variants[testimonial.service_type] || "bg-slate-100 text-slate-800";
  };

  const getServiceTypeLabel = () => {
    const labels: Record<string, string> = {
      placements: "Job Placement",
      visa: "Visa Counseling",
      education: "Study Abroad",
    };
    
    const serviceType = testimonial.service_type || testimonial.serviceType;
    return labels[serviceType] || serviceType;
  };

  const timeAgo = (() => {
    try {
      return testimonial.created_at && testimonial.created_at !== 'null'
        ? formatDistanceToNow(new Date(testimonial.created_at), { addSuffix: true })
        : 'Recently';
    } catch (error) {
      return 'Recently';
    }
  })();

  return (
    <Card 
      className="shadow-lg hover:shadow-xl transition-all duration-300 h-full"
      data-testid={`testimonial-card-${testimonial.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mr-4">
            {testimonial.photo ? (
              <img 
                src={testimonial.photo} 
                alt={testimonial.name}
                className="w-12 h-12 rounded-full object-cover"
                data-testid="testimonial-photo"
              />
            ) : (
              <User className="h-6 w-6 text-slate-400" data-testid="testimonial-placeholder" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800" data-testid="testimonial-name">
                {testimonial.name}
              </h3>
              {(testimonial.is_verified || testimonial.isVerified) && (
                <Badge 
                  className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 text-xs flex items-center gap-1 rounded-md"
                  data-testid="verified-badge"
                >
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            {testimonial.position && (
              <p className="text-sm text-slate-600" data-testid="testimonial-position">
                {testimonial.position}
                {testimonial.company && ` at ${testimonial.company}`}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex mb-3" data-testid="testimonial-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= testimonial.rating 
                  ? "fill-current text-yellow-400" 
                  : "text-slate-300"
              }`}
            />
          ))}
        </div>
        
        <p className="text-slate-600 mb-4 leading-relaxed" data-testid="testimonial-review">
          {testimonial.review}
        </p>
        
        <div className="flex justify-between items-center text-sm">
          <div className="flex gap-2 flex-wrap">
            {(testimonial.service_type || testimonial.serviceType) && (
              <Badge 
                className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 text-xs rounded-md"
                data-testid="testimonial-service-type"
              >
                {getServiceTypeLabel()}
              </Badge>
            )}
          </div>
          <span className="text-slate-500" data-testid="testimonial-time">
            {timeAgo}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
