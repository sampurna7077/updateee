import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { CalendarDays, Clock } from "lucide-react";

const consultationFormSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s\-']+$/, "First name can only contain letters, spaces, hyphens, and apostrophes")
    .trim(),
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s\-']+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes")
    .trim(),
  email: z.string()
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .toLowerCase()
    .trim(),
  phone: z.string()
    .min(7, "Phone number must be at least 7 digits")
    .max(20, "Phone number must be less than 20 characters")
    .regex(/^[\+]?[\d\s\-\(\)]+$/, "Please enter a valid phone number")
    .trim(),
  currentCountry: z.string()
    .max(100, "Country name must be less than 100 characters")
    .optional(),
  interestedDestination: z.string()
    .max(100, "Destination must be less than 100 characters")
    .optional(),
  servicesInterested: z.array(z.string().max(50)).min(1, "Please select at least one service"),
  additionalInfo: z.string()
    .max(1000, "Additional information must be less than 1000 characters")
    .optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

export default function ConsultationForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof consultationFormSchema>>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      currentCountry: "",
      interestedDestination: "",
      servicesInterested: [],
      additionalInfo: "",
      preferredDate: "",
      preferredTime: "",
      agreeToTerms: false,
    },
  });

  const submitFormMutation = useMutation({
    mutationFn: async (data: z.infer<typeof consultationFormSchema>) => {
      return await apiRequest("POST", "/api/forms/consultation", {
        formType: "consultation",
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        data: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Consultation Booked!",
        description: "We'll contact you within 24 hours to confirm your consultation time.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "There was an error booking your consultation. Please try again.";
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof consultationFormSchema>) => {
    submitFormMutation.mutate(data);
  };

  const handleServiceToggle = (service: string, checked: boolean) => {
    const currentServices = form.getValues("servicesInterested");
    if (checked) {
      form.setValue("servicesInterested", [...currentServices, service]);
    } else {
      form.setValue("servicesInterested", currentServices.filter(s => s !== service));
    }
  };

  const services = [
    { id: "job-placement", label: "Job Placement" },
    { id: "study-abroad", label: "Study Abroad" },
    { id: "visa-assistance", label: "Visa Assistance" },
  ];

  return (
    <Form {...form} data-testid="consultation-form">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your first name" 
                    {...field} 
                    data-testid="input-first-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your last name" 
                    {...field} 
                    data-testid="input-last-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="your.email@example.com" 
                    {...field} 
                    data-testid="input-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input 
                    type="tel" 
                    placeholder="+1 (555) 123-4567" 
                    {...field} 
                    data-testid="input-phone"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="currentCountry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Country</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-current-country">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="nepal">Nepal</SelectItem>
                    <SelectItem value="india">India</SelectItem>
                    <SelectItem value="bangladesh">Bangladesh</SelectItem>
                    <SelectItem value="pakistan">Pakistan</SelectItem>
                    <SelectItem value="sri-lanka">Sri Lanka</SelectItem>
                    <SelectItem value="afghanistan">Afghanistan</SelectItem>
                    <SelectItem value="bhutan">Bhutan</SelectItem>
                    <SelectItem value="maldives">Maldives</SelectItem>
                    <SelectItem value="myanmar">Myanmar</SelectItem>
                    <SelectItem value="china">China</SelectItem>
                    <SelectItem value="thailand">Thailand</SelectItem>
                    <SelectItem value="vietnam">Vietnam</SelectItem>
                    <SelectItem value="philippines">Philippines</SelectItem>
                    <SelectItem value="indonesia">Indonesia</SelectItem>
                    <SelectItem value="malaysia">Malaysia</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="interestedDestination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interested Destination</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-destination">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="usa">United States</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="australia">Australia</SelectItem>
                    <SelectItem value="germany">Germany</SelectItem>
                    <SelectItem value="netherlands">Netherlands</SelectItem>
                    <SelectItem value="singapore">Singapore</SelectItem>
                    <SelectItem value="new-zealand">New Zealand</SelectItem>
                    <SelectItem value="norway">Norway</SelectItem>
                    <SelectItem value="sweden">Sweden</SelectItem>
                    <SelectItem value="denmark">Denmark</SelectItem>
                    <SelectItem value="finland">Finland</SelectItem>
                    <SelectItem value="switzerland">Switzerland</SelectItem>
                    <SelectItem value="austria">Austria</SelectItem>
                    <SelectItem value="france">France</SelectItem>
                    <SelectItem value="ireland">Ireland</SelectItem>
                    <SelectItem value="belgium">Belgium</SelectItem>
                    <SelectItem value="italy">Italy</SelectItem>
                    <SelectItem value="spain">Spain</SelectItem>
                    <SelectItem value="portugal">Portugal</SelectItem>
                    <SelectItem value="japan">Japan</SelectItem>
                    <SelectItem value="south-korea">South Korea</SelectItem>
                    <SelectItem value="uae">United Arab Emirates</SelectItem>
                    <SelectItem value="qatar">Qatar</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="servicesInterested"
          render={() => (
            <FormItem>
              <FormLabel>Service Interested In *</FormLabel>
              <div className="grid md:grid-cols-3 gap-3" data-testid="services-checkboxes">
                {services.map((service) => (
                  <FormItem key={service.id} className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={form.watch("servicesInterested").includes(service.id)}
                        onCheckedChange={(checked) => handleServiceToggle(service.id, checked as boolean)}
                        data-testid={`checkbox-${service.id}`}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      {service.label}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Information</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your background, goals, and any specific questions you have..."
                  className="min-h-[100px] resize-none"
                  {...field}
                  data-testid="textarea-additional-info"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Label className="block text-sm font-medium text-slate-700 mb-2">Preferred Consultation Time</Label>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="preferredDate"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="date" 
                        {...field} 
                        className="pl-10"
                        min={new Date().toISOString().split('T')[0]}
                        data-testid="input-preferred-date"
                      />
                      <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredTime"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-preferred-time">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                      <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="agreeToTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-terms"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm cursor-pointer">
                  I agree to the{" "}
                  <a href="https://udaanagencies.com.np/terms/" className="text-primary-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="https://udaanagencies.com.np/terms/" className="text-primary-600 hover:underline">
                    Privacy Policy
                  </a>
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-center">
          <Button 
            type="submit" 
            disabled={submitFormMutation.isPending}
            className="bg-gradient-to-r from-primary-600 to-coral-500 hover:from-primary-700 hover:to-coral-600 text-white px-12 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            data-testid="button-submit-consultation"
          >
            <CalendarDays className="mr-2 h-5 w-5" />
            {submitFormMutation.isPending ? "Booking..." : "Book Free Consultation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
