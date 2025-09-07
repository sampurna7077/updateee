import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
import { z } from "zod";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Star,
  MessageSquare,
  Search,
  Filter,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Testimonial {
  id: string;
  name: string;
  email: string;
  position?: string;
  company?: string;
  photo?: string;
  rating: number;
  review: string;
  serviceType: string;
  isVerified: boolean;
  isVisible: boolean;
  videoUrl?: string;
  createdAt: string;
}

const testimonialFormSchema = testimonialSchema.extend({
  rating: z.number().min(1).max(5),
  isVerified: z.boolean().default(false),
});

export default function TestimonialManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
    queryFn: async () => {
      const response = await fetch("/api/admin/testimonials");
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      return response.json();
    },
  });

  type TestimonialFormData = z.infer<typeof testimonialFormSchema>;

  const form = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      name: "",
      email: "",
      position: "",
      company: "",
      photo: "",
      rating: 5,
      review: "",
      serviceType: "placements",
      isVerified: false,
      isVisible: true,
      videoUrl: "",
    },
  });

  const createTestimonialMutation = useMutation({
    mutationFn: async (data: TestimonialFormData) => {
      return await apiRequest("POST", "/api/testimonials", data);
    },
    onSuccess: () => {
      toast({ title: "Testimonial Created", description: "Testimonial has been created successfully." });
      form.reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create testimonial.", variant: "destructive" });
    },
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: async (data: z.infer<typeof testimonialFormSchema>) => {
      if (!editingTestimonial) throw new Error("No testimonial selected for editing");
      return await apiRequest("PUT", `/api/admin/testimonials/${editingTestimonial.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Testimonial Updated", description: "Testimonial has been updated successfully." });
      form.reset();
      setEditingTestimonial(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update testimonial.", variant: "destructive" });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: string; isVisible: boolean }) => {
      return await apiRequest("PUT", `/api/admin/testimonials/${id}`, { isVisible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update testimonial visibility.", variant: "destructive" });
    },
  });

  const toggleVerificationMutation = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      return await apiRequest("PUT", `/api/admin/testimonials/${id}`, { isVerified });
    },
    onSuccess: () => {
      toast({ 
        title: "Testimonial Updated", 
        description: "Testimonial verification status has been updated." 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update testimonial verification.", variant: "destructive" });
    },
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (testimonialId: string) => {
      return await apiRequest("DELETE", `/api/admin/testimonials/${testimonialId}`);
    },
    onSuccess: () => {
      toast({ title: "Testimonial Deleted", description: "Testimonial has been deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete testimonial.", variant: "destructive" });
    },
  });

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    form.reset({
      name: testimonial.name,
      email: testimonial.email,
      position: testimonial.position || "",
      company: testimonial.company || "",
      photo: testimonial.photo || "",
      rating: testimonial.rating,
      review: testimonial.review,
      serviceType: testimonial.serviceType,
      isVerified: testimonial.isVerified,
      isVisible: testimonial.isVisible,
      videoUrl: testimonial.videoUrl || "",
    });
    setShowForm(true);
  };

  const handleDeleteTestimonial = (testimonialId: string) => {
    if (confirm("Are you sure you want to delete this testimonial?")) {
      deleteTestimonialMutation.mutate(testimonialId);
    }
  };

  const handleToggleVisibility = (id: string, currentVisibility: boolean) => {
    toggleVisibilityMutation.mutate({ id, isVisible: !currentVisibility });
  };

  const handleToggleVerification = (id: string, currentVerification: boolean) => {
    toggleVerificationMutation.mutate({ id, isVerified: !currentVerification });
  };

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = 
      testimonial.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testimonial.review.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (testimonial.company && testimonial.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "verified" && testimonial.isVerified) ||
      (statusFilter === "unverified" && !testimonial.isVerified) ||
      (statusFilter === "visible" && testimonial.isVisible) ||
      (statusFilter === "hidden" && !testimonial.isVisible);
    
    const matchesService = 
      serviceFilter === "all" || testimonial.serviceType === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  const onSubmit = (data: z.infer<typeof testimonialFormSchema>) => {
    if (editingTestimonial) {
      updateTestimonialMutation.mutate(data);
    } else {
      createTestimonialMutation.mutate(data);
    }
  };

  if (showForm) {
    return (
      <Card data-testid="testimonial-form">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{editingTestimonial ? "Edit Testimonial" : "Create New Testimonial"}</span>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowForm(false);
                setEditingTestimonial(null);
                form.reset();
              }}
              data-testid="button-cancel-testimonial-form"
            >
              Cancel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Client name" {...field} data-testid="input-testimonial-name" />
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
                        <Input type="email" placeholder="client@example.com" {...field} data-testid="input-testimonial-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Job title" {...field} value={field.value || ""} data-testid="input-testimonial-position" />
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
                        <Input placeholder="Company name" {...field} value={field.value || ""} data-testid="input-testimonial-company" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-testimonial-service">
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
              </div>

              <FormField
                control={form.control}
                name="review"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Client testimonial content..."
                        className="min-h-[120px]"
                        {...field}
                        data-testid="textarea-testimonial-review"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/photo.jpg" {...field} value={field.value || ""} data-testid="input-testimonial-photo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/watch?v=..." {...field} value={field.value || ""} data-testid="input-testimonial-video" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center space-x-6">
                <FormField
                  control={form.control}
                  name="isVerified"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-verified"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Verified Testimonial</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isVisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-visible"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Visible on Website</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTestimonial(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-testimonial"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTestimonialMutation.isPending || updateTestimonialMutation.isPending}
                  data-testid="button-save-testimonial"
                >
                  {editingTestimonial ? "Update Testimonial" : "Create Testimonial"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="testimonial-manager">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Testimonial Management</h2>
          <p className="text-slate-600">Manage client testimonials and reviews</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          data-testid="button-add-testimonial"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Testimonial
        </Button>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-4 gap-4" data-testid="testimonial-filters">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search testimonials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-testimonials"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="select-status-filter">
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
            <SelectItem value="visible">Visible</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setServiceFilter} data-testid="select-service-filter">
          <SelectTrigger>
            <SelectValue placeholder="Filter by service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="placements">Job Placement</SelectItem>
            <SelectItem value="visa">Visa Counseling</SelectItem>
            <SelectItem value="education">Study Abroad</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center text-sm text-slate-600">
          <Filter className="mr-2 h-4 w-4" />
          {filteredTestimonials.length} of {testimonials.length} testimonials
        </div>
      </div>

      {/* Testimonials List */}
      <div className="space-y-4" data-testid="testimonials-list">
        {filteredTestimonials.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No Testimonials Found</h3>
              <p className="text-slate-500 mb-4">
                {searchQuery || statusFilter !== "all" || serviceFilter !== "all" 
                  ? "Try adjusting your filters to see more testimonials."
                  : "Get started by adding your first testimonial."
                }
              </p>
              {!searchQuery && statusFilter === "all" && serviceFilter === "all" && (
                <Button onClick={() => setShowForm(true)} data-testid="button-create-first-testimonial">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Testimonial
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover:shadow-lg transition-shadow" data-testid={`testimonial-item-${testimonial.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                        {testimonial.photo ? (
                          <img 
                            src={testimonial.photo} 
                            alt={testimonial.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800" data-testid={`testimonial-name-${testimonial.id}`}>
                          {testimonial.name}
                        </h3>
                        <p className="text-slate-600">
                          {testimonial.position}
                          {testimonial.company && ` at ${testimonial.company}`}
                        </p>
                        <p className="text-sm text-slate-500">{testimonial.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex mr-3">
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
                      <span className="text-sm text-slate-600">({testimonial.rating}/5)</span>
                    </div>
                    
                    <p className="text-slate-600 mb-4 line-clamp-3" data-testid={`testimonial-review-${testimonial.id}`}>
                      {testimonial.review}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge 
                        variant={testimonial.isVerified ? "default" : "secondary"}
                        className={testimonial.isVerified ? "bg-green-100 text-green-800" : ""}
                        data-testid={`testimonial-verified-${testimonial.id}`}
                      >
                        {testimonial.isVerified ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Verified
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Unverified
                          </>
                        )}
                      </Badge>
                      
                      <Badge 
                        variant={testimonial.isVisible ? "default" : "secondary"}
                        className={testimonial.isVisible ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}
                        data-testid={`testimonial-visibility-${testimonial.id}`}
                      >
                        {testimonial.isVisible ? (
                          <>
                            <Eye className="mr-1 h-3 w-3" />
                            Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="mr-1 h-3 w-3" />
                            Hidden
                          </>
                        )}
                      </Badge>
                      
                      <Badge variant="outline">
                        {testimonial.serviceType === "placements" && "Job Placement"}
                        {testimonial.serviceType === "visa" && "Visa Counseling"}
                        {testimonial.serviceType === "education" && "Study Abroad"}
                      </Badge>
                      
                      <Badge variant="outline" className="text-xs">
                        {(() => {
                          try {
                            return testimonial.createdAt && testimonial.createdAt !== 'null'
                              ? formatDistanceToNow(new Date(testimonial.createdAt), { addSuffix: true })
                              : 'Recently';
                          } catch (error) {
                            return 'Recently';
                          }
                        })()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleVerification(testimonial.id, testimonial.isVerified)}
                        className={testimonial.isVerified ? "text-green-600" : "text-amber-600"}
                        data-testid={`button-toggle-verification-${testimonial.id}`}
                      >
                        {testimonial.isVerified ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleVisibility(testimonial.id, testimonial.isVisible)}
                        className={testimonial.isVisible ? "text-blue-600" : "text-slate-600"}
                        data-testid={`button-toggle-visibility-${testimonial.id}`}
                      >
                        {testimonial.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditTestimonial(testimonial)}
                        data-testid={`button-edit-testimonial-${testimonial.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteTestimonial(testimonial.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-testimonial-${testimonial.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
