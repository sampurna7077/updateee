import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import ScrollProgress from "@/components/scroll-progress";
import Footer from "@/components/footer";
import TestimonialCard from "@/components/testimonial-card";
import LoadingVideo from "@/components/loading-video";
import { useFirstVisit } from "@/hooks/use-first-visit";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
const testimonialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  position: z.string().optional(),
  company: z.string().optional(),
  photo: z.string().optional(),
  rating: z.number().min(1).max(5),
  review: z.string().min(10, "Review must be at least 10 characters"),
  serviceType: z.enum(["placements", "visa", "education"]),
  videoUrl: z.string().optional()
});
import { apiRequest } from "@/lib/queryClient";
import { Star, MessageSquare, Play, Users } from "lucide-react";
import { z } from "zod";

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

const testimonialFormSchema = testimonialSchema.extend({
  rating: z.number().min(1).max(5),
  position: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
});

export default function Feedbacks() {
  const { shouldShowLoading: firstVisitLoading } = useFirstVisit('feedbacks', 2500);
  
  const [activeFilter, setActiveFilter] = useState("all");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Customer Reviews - Udaan Agencies | Global Consultancy Feedback";
  }, []);

  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials", activeFilter],
    queryFn: async () => {
      const params = activeFilter !== "all" ? `?serviceType=${activeFilter}` : "";
      const response = await fetch(`/api/testimonials${params}`);
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      return response.json();
    },
  });

  // Find CEO message testimonial with video
  const ceoMessage = testimonials.find((testimonial: any) => 
    testimonial.videoUrl && (testimonial.videoUrl.includes('youtube.com') || testimonial.videoUrl.includes('youtu.be'))
  );

  // Extract YouTube video ID
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const form = useForm<z.infer<typeof testimonialFormSchema>>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      name: "",
      email: "",
      position: "",
      company: "",
      rating: 5,
      review: "",
      serviceType: "placements",
    },
  });

  const submitTestimonialMutation = useMutation({
    mutationFn: async (data: z.infer<typeof testimonialFormSchema>) => {
      return await apiRequest("POST", "/api/testimonials", data);
    },
    onSuccess: () => {
      toast({
        title: "Thank You!",
        description: "Your testimonial has been submitted and will be reviewed before publishing.",
      });
      form.reset();
      setIsSubmitDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your testimonial. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof testimonialFormSchema>) => {
    submitTestimonialMutation.mutate(data);
  };

  const filterButtons = [
    { value: "all", label: "All Reviews" },
    { value: "placements", label: "Job Placements" },
    { value: "visa", label: "Visa Counseling" },
    { value: "education", label: "Study Abroad" },
  ];

  // Calculate average rating
  const averageRating = testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : "0.0";

  return (
    <div className="mobile-app-container bg-slate-50">
      <Navigation />
      <ScrollProgress />
      
      <div className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12" data-testid="testimonials-header">
            <h1 className="font-display text-4xl font-bold text-slate-800 mb-4">Client Testimonials</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">Hear from our successful clients who achieved their international career goals with our guidance</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center mb-8" data-testid="testimonial-filters">
            <div className="bg-white rounded-2xl p-2 shadow-lg">
              {filterButtons.map(button => (
                <Button
                  key={button.value}
                  variant="ghost"
                  onClick={() => setActiveFilter(button.value)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeFilter === button.value
                      ? "bg-primary-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  data-testid={`filter-${button.value}`}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Overall Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12" data-testid="testimonial-stats">
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2" data-testid="average-rating">{averageRating}</div>
                <div className="text-slate-600 mb-2">Average Rating</div>
                <div className="flex justify-center">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${parseFloat(averageRating) >= star ? "fill-current" : ""}`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-coral-500 mb-2" data-testid="total-reviews">{testimonials.length}</div>
                <div className="text-slate-600">Total Reviews</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">98%</div>
                <div className="text-slate-600">Success Rate</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-amber-500 mb-2">95%</div>
                <div className="text-slate-600">Would Recommend</div>
              </CardContent>
            </Card>
          </div>

          {/* CEO Message Section */}
          <Card className="shadow-lg mb-12" data-testid="ceo-message">
            <CardContent className="p-8">
              <h2 className="font-display text-2xl font-bold text-slate-800 mb-6 text-center">CEO Message</h2>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  {ceoMessage && ceoMessage.videoUrl ? (
                    <div className="relative rounded-2xl overflow-hidden shadow-lg h-64">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(ceoMessage.videoUrl)}`}
                        title="CEO Message Video"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        data-testid="ceo-video-iframe"
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden shadow-lg bg-slate-200 h-64 flex items-center justify-center">
                      <div className="text-center">
                        <Play className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500">CEO Video Message</p>
                        <p className="text-xs text-slate-400 mt-2">Upload video in admin panel</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                      <Users className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-slate-800">
                        {ceoMessage ? `Message from ${ceoMessage.name}` : 'Message from Leadership'}
                      </h3>
                      <p className="text-slate-600">
                        {ceoMessage?.position || 'Guiding Your Global Journey'}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-600 text-lg italic mb-4">
                    {ceoMessage?.review || '"Welcome to Udaan Agencies. Our mission is to bridge the gap between talent and global opportunities, providing comprehensive support for your international career and education goals."'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonials Grid */}
          <div className="mb-12" data-testid="testimonials-grid">
            {(isLoading || firstVisitLoading) ? (
              <div className="text-center py-16">
                <LoadingVideo width={120} height={120} />
                <p className="mt-6 text-slate-600 text-lg">Loading testimonials...</p>
              </div>
            ) : testimonials.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map(testimonial => (
                  <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No Testimonials Yet</h3>
                <p className="text-slate-500 mb-4">Be the first to share your success story with Udaan Agencies.</p>
              </div>
            )}
          </div>

          {/* Submit Review Section */}
          <Card className="bg-gradient-to-br from-primary-50 to-coral-50 shadow-lg" data-testid="submit-review-section">
            <CardContent className="p-8 text-center">
              <h2 className="font-display text-2xl font-bold text-slate-800 mb-4">Share Your Success Story</h2>
              <p className="text-slate-600 mb-6">Help others by sharing your experience with Udaan Agencies</p>
              
              <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-2xl font-medium transition-all duration-300 hover:shadow-lg"
                    data-testid="button-submit-review"
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Submit Your Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="submit-review-dialog">
                  <DialogHeader>
                    <DialogTitle>Share Your Experience</DialogTitle>
                    <DialogDescription>
                      Tell us about your experience with Udaan Agencies' services. Your feedback helps us improve and helps others make informed decisions.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} data-testid="input-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="your.email@example.com" {...field} data-testid="input-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position</FormLabel>
                              <FormControl>
                                <Input placeholder="Your job title" {...field} value={field.value || ""} data-testid="input-position" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company</FormLabel>
                              <FormControl>
                                <Input placeholder="Company name" {...field} value={field.value || ""} data-testid="input-company" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="serviceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Used *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-service-type">
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select service" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="placements">Job Placement</SelectItem>
                                <SelectItem value="visa">Visa Counseling</SelectItem>
                                <SelectItem value="education">Study Abroad</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rating *</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2" data-testid="rating-input">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => field.onChange(star)}
                                    className={`text-2xl ${
                                      star <= field.value ? "text-yellow-400" : "text-slate-300"
                                    } hover:text-yellow-400 transition-colors`}
                                    data-testid={`star-${star}`}
                                  >
                                    ★
                                  </button>
                                ))}
                                <span className="text-sm text-slate-600 ml-2">({field.value}/5)</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="review"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Review *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your experience with Udaan Agencies..."
                                className="min-h-[100px] resize-none"
                                {...field}
                                data-testid="textarea-review"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsSubmitDialogOpen(false)}
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={submitTestimonialMutation.isPending}
                          className="bg-primary-600 hover:bg-primary-700"
                          data-testid="button-submit"
                        >
                          {submitTestimonialMutation.isPending ? "Submitting..." : "Submit Review"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
