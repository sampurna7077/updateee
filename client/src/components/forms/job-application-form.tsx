import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { Send, Upload, FileText } from "lucide-react";

const jobApplicationFormSchema = z.object({
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
  coverLetter: z.string()
    .min(50, "Please provide a meaningful cover letter (minimum 50 characters)")
    .max(2000, "Cover letter must be less than 2000 characters")
    .trim(),
  citizenCardFrontFile: z.any().optional(),
  citizenCardBackFile: z.any().optional(),
});

interface JobApplicationFormProps {
  jobId?: string;
  onSuccess?: () => void;
}

export default function JobApplicationForm({ jobId, onSuccess }: JobApplicationFormProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [citizenCardFrontFile, setCitizenCardFrontFile] = useState<File | null>(null);
  const [citizenCardBackFile, setCitizenCardBackFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof jobApplicationFormSchema>>({
    resolver: zodResolver(jobApplicationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      coverLetter: "",
    },
  });

  const submitFormMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobApplicationFormSchema>) => {
      // Use provided jobId or fallback to featured job
      const applicationJobId = jobId || '34b96aaf-4398-4555-a6a4-80066e414dac';
      
      // Convert citizen card files to base64 if present
      let citizenCardFrontData = null;
      let citizenCardBackData = null;
      
      if (citizenCardFrontFile) {
        citizenCardFrontData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(citizenCardFrontFile);
        });
      }
      
      if (citizenCardBackFile) {
        citizenCardBackData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(citizenCardBackFile);
        });
      }
      
      // Submit directly to job application endpoint
      return await apiRequest("POST", `/api/jobs/${applicationJobId}/apply`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        coverLetter: data.coverLetter,
        citizenCardFront: citizenCardFrontData,
        citizenCardBack: citizenCardBackData,
        citizenCardFrontFileName: citizenCardFrontFile?.name || '',
        citizenCardBackFileName: citizenCardBackFile?.name || '',
        citizenCardFrontFileType: citizenCardFrontFile?.type || '',
        citizenCardBackFileType: citizenCardBackFile?.type || '',
      });
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Your application has been received. We'll review it and get back to you soon.",
      });
      form.reset();
      setCitizenCardFrontFile(null);
      setCitizenCardBackFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof jobApplicationFormSchema>) => {
    submitFormMutation.mutate(data);
  };

  const handleCitizenCardUpload = (event: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - only images
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPG or PNG image.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (side === 'front') {
        setCitizenCardFrontFile(file);
      } else {
        setCitizenCardBackFile(file);
      }
    }
  };

  return (
    <Form {...form} data-testid="job-application-form">
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
          {/* Citizen Card Front Upload */}
          <div>
            <Label htmlFor="citizen-card-front-upload" className="block text-sm font-medium text-slate-700 mb-2">
              Citizen Card (Front) *
            </Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="citizen-card-front-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                data-testid="citizen-card-front-upload-area"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {citizenCardFrontFile ? (
                    <>
                      <FileText className="w-8 h-8 mb-2 text-green-500" />
                      <p className="text-sm text-slate-600 font-medium">{citizenCardFrontFile.name}</p>
                      <p className="text-xs text-slate-500">Click to change image</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-slate-400" />
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Upload front side</span>
                      </p>
                      <p className="text-xs text-slate-500">JPG or PNG (MAX. 5MB)</p>
                    </>
                  )}
                </div>
                <input
                  id="citizen-card-front-upload"
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleCitizenCardUpload(e, 'front')}
                  data-testid="input-citizen-card-front"
                />
              </label>
            </div>
          </div>

          {/* Citizen Card Back Upload */}
          <div>
            <Label htmlFor="citizen-card-back-upload" className="block text-sm font-medium text-slate-700 mb-2">
              Citizen Card (Back) *
            </Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="citizen-card-back-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                data-testid="citizen-card-back-upload-area"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {citizenCardBackFile ? (
                    <>
                      <FileText className="w-8 h-8 mb-2 text-green-500" />
                      <p className="text-sm text-slate-600 font-medium">{citizenCardBackFile.name}</p>
                      <p className="text-xs text-slate-500">Click to change image</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-slate-400" />
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Upload back side</span>
                      </p>
                      <p className="text-xs text-slate-500">JPG or PNG (MAX. 5MB)</p>
                    </>
                  )}
                </div>
                <input
                  id="citizen-card-back-upload"
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleCitizenCardUpload(e, 'back')}
                  data-testid="input-citizen-card-back"
                />
              </label>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="coverLetter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Letter *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us why you're interested in working internationally and what makes you a great candidate..."
                  className="min-h-[150px] resize-none"
                  {...field}
                  data-testid="textarea-cover-letter"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-slate-50 p-4 rounded-xl" data-testid="application-note">
          <p className="text-sm text-slate-600 mb-2">
            <strong>Note:</strong> This is a general application form. Our team will review your profile and match you with relevant opportunities.
          </p>
          <p className="text-sm text-slate-600">
            For specific job applications, please browse our <a href="/jobs" className="text-primary-600 hover:underline">job listings</a> and apply directly.
          </p>
        </div>

        <div className="flex justify-center">
          <Button 
            type="submit" 
            disabled={submitFormMutation.isPending}
            className="bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white px-12 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            data-testid="button-submit-application"
          >
            <Send className="mr-2 h-5 w-5" />
            {submitFormMutation.isPending ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
