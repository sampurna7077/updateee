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
const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  companyId: z.string().min(1, "Company is required"),
  location: z.string().min(1, "Location is required"),
  country: z.string().min(1, "Country is required"),
  remoteType: z.enum(["remote", "onsite", "hybrid"]),
  jobType: z.enum(["full-time", "part-time", "contract", "temporary", "internship"]),
  category: z.string().min(1, "Category is required"),
  industry: z.string().min(1, "Industry is required"),
  experienceLevel: z.enum(["entry", "mid", "senior", "executive"]),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  currency: z.string().default("USD"),
  salaryPeriod: z.enum(["hour", "day", "week", "month", "year"]).default("year"),
  visaSupport: z.boolean().default(false)
});

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional()
});
import { z } from "zod";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Search,
  Briefcase
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Job {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logo?: string;
  };
  location: string;
  country: string;
  remoteType: string;
  jobType: string;
  category: string;
  industry: string;
  experienceLevel: string;
  vacancies?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  visaSupport: boolean;
  description: string;
  status: string;
  featured: boolean;
  postedAt: string;
}

interface Company {
  id: string;
  name: string;
  logo?: string;
  industry?: string;
  location?: string;
}

const jobFormSchema = jobSchema;

const companyFormSchema = companySchema;

export default function JobManager() {
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobsData } = useQuery({
    queryKey: ["/api/admin/jobs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/jobs");
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies"],
    queryFn: async () => {
      const response = await fetch("/api/admin/companies");
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    },
  });

  const jobs: Job[] = jobsData?.jobs || [];

  const jobForm = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      companyId: "",
      location: "",
      country: "",
      city: "",
      remoteType: "onsite",
      jobType: "full-time",
      category: "technology",
      industry: "Technology",
      experienceLevel: "mid",
      vacancies: 1,
      salaryMin: undefined,
      salaryMax: undefined,
      currency: "USD",
      salaryPeriod: "year",
      visaSupport: false,
      description: "",
      requirements: "",
      benefits: "",
      applyUrl: "",
      applyEmail: "",
      tags: "",
      status: "published",
      featured: false,
    },
  });

  const companyForm = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      logo: "",
      website: "",
      description: "",
      industry: "",
      size: "",
      location: "",
      country: "",
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobFormSchema>) => {
      const jobData = {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags.split(',').map(tag => tag.trim())) : null,
        vacancies: Number(data.vacancies) || 1,
      };
      return await apiRequest("POST", "/api/admin/jobs", jobData);
    },
    onSuccess: () => {
      toast({ title: "Job Created", description: "Job has been created successfully." });
      jobForm.reset();
      setShowJobForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create job.", variant: "destructive" });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobFormSchema>) => {
      if (!editingJob) throw new Error("No job selected for editing");
      const jobData = {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags.split(',').map(tag => tag.trim())) : null,
        vacancies: Number(data.vacancies) || 1,
      };
      return await apiRequest("PUT", `/api/admin/jobs/${editingJob.id}`, jobData);
    },
    onSuccess: () => {
      toast({ title: "Job Updated", description: "Job has been updated successfully." });
      jobForm.reset();
      setEditingJob(null);
      setShowJobForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update job.", variant: "destructive" });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest("DELETE", `/api/admin/jobs/${jobId}`);
    },
    onSuccess: () => {
      toast({ title: "Job Deleted", description: "Job has been deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete job.", variant: "destructive" });
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companyFormSchema>) => {
      return await apiRequest("POST", "/api/admin/companies", data);
    },
    onSuccess: () => {
      toast({ title: "Company Created", description: "Company has been created successfully." });
      companyForm.reset();
      setShowCompanyForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create company.", variant: "destructive" });
    },
  });

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    jobForm.reset({
      title: job.title,
      companyId: job.company.id,
      location: job.location,
      country: job.country,
      remoteType: job.remoteType,
      jobType: job.jobType,
      category: job.category,
      industry: job.industry,
      experienceLevel: job.experienceLevel,
      vacancies: Number(job.vacancies) || 1,
      salaryMin: job.salaryMin || undefined,
      salaryMax: job.salaryMax || undefined,
      currency: job.currency,
      salaryPeriod: job.salaryPeriod || "year",
      visaSupport: job.visaSupport,
      description: job.description,
      status: job.status,
      featured: job.featured,
    });
    setShowJobForm(true);
  };

  const handleDeleteJob = (jobId: string) => {
    if (confirm("Are you sure you want to delete this job?")) {
      deleteJobMutation.mutate(jobId);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onJobSubmit = (data: z.infer<typeof jobFormSchema>) => {
    if (editingJob) {
      updateJobMutation.mutate(data);
    } else {
      createJobMutation.mutate(data);
    }
  };

  const onCompanySubmit = (data: z.infer<typeof companyFormSchema>) => {
    createCompanyMutation.mutate(data);
  };

  if (showJobForm) {
    return (
      <Card data-testid="job-form">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{editingJob ? "Edit Job" : "Create New Job"}</span>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowJobForm(false);
                setEditingJob(null);
                jobForm.reset();
              }}
              data-testid="button-cancel-job-form"
            >
              Cancel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...jobForm}>
            <form onSubmit={jobForm.handleSubmit(onJobSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={jobForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Senior Software Engineer" {...field} data-testid="input-job-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jobForm.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-company">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <FormField
                  control={jobForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. New York, NY" {...field} data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jobForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-country">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                          <SelectItem value="Albania">Albania</SelectItem>
                          <SelectItem value="Algeria">Algeria</SelectItem>
                          <SelectItem value="Andorra">Andorra</SelectItem>
                          <SelectItem value="Angola">Angola</SelectItem>
                          <SelectItem value="Antigua and Barbuda">Antigua and Barbuda</SelectItem>
                          <SelectItem value="Argentina">Argentina</SelectItem>
                          <SelectItem value="Armenia">Armenia</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="Austria">Austria</SelectItem>
                          <SelectItem value="Azerbaijan">Azerbaijan</SelectItem>
                          <SelectItem value="Bahamas">Bahamas</SelectItem>
                          <SelectItem value="Bahrain">Bahrain</SelectItem>
                          <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                          <SelectItem value="Barbados">Barbados</SelectItem>
                          <SelectItem value="Belarus">Belarus</SelectItem>
                          <SelectItem value="Belgium">Belgium</SelectItem>
                          <SelectItem value="Belize">Belize</SelectItem>
                          <SelectItem value="Benin">Benin</SelectItem>
                          <SelectItem value="Bhutan">Bhutan</SelectItem>
                          <SelectItem value="Bolivia">Bolivia</SelectItem>
                          <SelectItem value="Bosnia and Herzegovina">Bosnia and Herzegovina</SelectItem>
                          <SelectItem value="Botswana">Botswana</SelectItem>
                          <SelectItem value="Brazil">Brazil</SelectItem>
                          <SelectItem value="Brunei">Brunei</SelectItem>
                          <SelectItem value="Bulgaria">Bulgaria</SelectItem>
                          <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                          <SelectItem value="Burundi">Burundi</SelectItem>
                          <SelectItem value="Cambodia">Cambodia</SelectItem>
                          <SelectItem value="Cameroon">Cameroon</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="Cape Verde">Cape Verde</SelectItem>
                          <SelectItem value="Central African Republic">Central African Republic</SelectItem>
                          <SelectItem value="Chad">Chad</SelectItem>
                          <SelectItem value="Chile">Chile</SelectItem>
                          <SelectItem value="China">China</SelectItem>
                          <SelectItem value="Colombia">Colombia</SelectItem>
                          <SelectItem value="Comoros">Comoros</SelectItem>
                          <SelectItem value="Congo">Congo</SelectItem>
                          <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                          <SelectItem value="Croatia">Croatia</SelectItem>
                          <SelectItem value="Cuba">Cuba</SelectItem>
                          <SelectItem value="Cyprus">Cyprus</SelectItem>
                          <SelectItem value="Czech Republic">Czech Republic</SelectItem>
                          <SelectItem value="Democratic Republic of the Congo">Democratic Republic of the Congo</SelectItem>
                          <SelectItem value="Denmark">Denmark</SelectItem>
                          <SelectItem value="Djibouti">Djibouti</SelectItem>
                          <SelectItem value="Dominica">Dominica</SelectItem>
                          <SelectItem value="Dominican Republic">Dominican Republic</SelectItem>
                          <SelectItem value="East Timor">East Timor</SelectItem>
                          <SelectItem value="Ecuador">Ecuador</SelectItem>
                          <SelectItem value="Egypt">Egypt</SelectItem>
                          <SelectItem value="El Salvador">El Salvador</SelectItem>
                          <SelectItem value="Equatorial Guinea">Equatorial Guinea</SelectItem>
                          <SelectItem value="Eritrea">Eritrea</SelectItem>
                          <SelectItem value="Estonia">Estonia</SelectItem>
                          <SelectItem value="Eswatini">Eswatini</SelectItem>
                          <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                          <SelectItem value="Fiji">Fiji</SelectItem>
                          <SelectItem value="Finland">Finland</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="Gabon">Gabon</SelectItem>
                          <SelectItem value="Gambia">Gambia</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="Ghana">Ghana</SelectItem>
                          <SelectItem value="Greece">Greece</SelectItem>
                          <SelectItem value="Grenada">Grenada</SelectItem>
                          <SelectItem value="Guatemala">Guatemala</SelectItem>
                          <SelectItem value="Guinea">Guinea</SelectItem>
                          <SelectItem value="Guinea-Bissau">Guinea-Bissau</SelectItem>
                          <SelectItem value="Guyana">Guyana</SelectItem>
                          <SelectItem value="Haiti">Haiti</SelectItem>
                          <SelectItem value="Honduras">Honduras</SelectItem>
                          <SelectItem value="Hungary">Hungary</SelectItem>
                          <SelectItem value="Iceland">Iceland</SelectItem>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="Indonesia">Indonesia</SelectItem>
                          <SelectItem value="Iran">Iran</SelectItem>
                          <SelectItem value="Iraq">Iraq</SelectItem>
                          <SelectItem value="Ireland">Ireland</SelectItem>
                          <SelectItem value="Israel">Israel</SelectItem>
                          <SelectItem value="Italy">Italy</SelectItem>
                          <SelectItem value="Ivory Coast">Ivory Coast</SelectItem>
                          <SelectItem value="Jamaica">Jamaica</SelectItem>
                          <SelectItem value="Japan">Japan</SelectItem>
                          <SelectItem value="Jordan">Jordan</SelectItem>
                          <SelectItem value="Kazakhstan">Kazakhstan</SelectItem>
                          <SelectItem value="Kenya">Kenya</SelectItem>
                          <SelectItem value="Kiribati">Kiribati</SelectItem>
                          <SelectItem value="Kuwait">Kuwait</SelectItem>
                          <SelectItem value="Kyrgyzstan">Kyrgyzstan</SelectItem>
                          <SelectItem value="Laos">Laos</SelectItem>
                          <SelectItem value="Latvia">Latvia</SelectItem>
                          <SelectItem value="Lebanon">Lebanon</SelectItem>
                          <SelectItem value="Lesotho">Lesotho</SelectItem>
                          <SelectItem value="Liberia">Liberia</SelectItem>
                          <SelectItem value="Libya">Libya</SelectItem>
                          <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                          <SelectItem value="Lithuania">Lithuania</SelectItem>
                          <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                          <SelectItem value="Madagascar">Madagascar</SelectItem>
                          <SelectItem value="Malawi">Malawi</SelectItem>
                          <SelectItem value="Malaysia">Malaysia</SelectItem>
                          <SelectItem value="Maldives">Maldives</SelectItem>
                          <SelectItem value="Mali">Mali</SelectItem>
                          <SelectItem value="Malta">Malta</SelectItem>
                          <SelectItem value="Marshall Islands">Marshall Islands</SelectItem>
                          <SelectItem value="Mauritania">Mauritania</SelectItem>
                          <SelectItem value="Mauritius">Mauritius</SelectItem>
                          <SelectItem value="Mexico">Mexico</SelectItem>
                          <SelectItem value="Micronesia">Micronesia</SelectItem>
                          <SelectItem value="Moldova">Moldova</SelectItem>
                          <SelectItem value="Monaco">Monaco</SelectItem>
                          <SelectItem value="Mongolia">Mongolia</SelectItem>
                          <SelectItem value="Montenegro">Montenegro</SelectItem>
                          <SelectItem value="Morocco">Morocco</SelectItem>
                          <SelectItem value="Mozambique">Mozambique</SelectItem>
                          <SelectItem value="Myanmar">Myanmar</SelectItem>
                          <SelectItem value="Namibia">Namibia</SelectItem>
                          <SelectItem value="Nauru">Nauru</SelectItem>
                          <SelectItem value="Nepal">Nepal</SelectItem>
                          <SelectItem value="Netherlands">Netherlands</SelectItem>
                          <SelectItem value="New Zealand">New Zealand</SelectItem>
                          <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                          <SelectItem value="Niger">Niger</SelectItem>
                          <SelectItem value="Nigeria">Nigeria</SelectItem>
                          <SelectItem value="North Korea">North Korea</SelectItem>
                          <SelectItem value="North Macedonia">North Macedonia</SelectItem>
                          <SelectItem value="Norway">Norway</SelectItem>
                          <SelectItem value="Oman">Oman</SelectItem>
                          <SelectItem value="Pakistan">Pakistan</SelectItem>
                          <SelectItem value="Palau">Palau</SelectItem>
                          <SelectItem value="Palestine">Palestine</SelectItem>
                          <SelectItem value="Panama">Panama</SelectItem>
                          <SelectItem value="Papua New Guinea">Papua New Guinea</SelectItem>
                          <SelectItem value="Paraguay">Paraguay</SelectItem>
                          <SelectItem value="Peru">Peru</SelectItem>
                          <SelectItem value="Philippines">Philippines</SelectItem>
                          <SelectItem value="Poland">Poland</SelectItem>
                          <SelectItem value="Portugal">Portugal</SelectItem>
                          <SelectItem value="Qatar">Qatar</SelectItem>
                          <SelectItem value="Romania">Romania</SelectItem>
                          <SelectItem value="Russia">Russia</SelectItem>
                          <SelectItem value="Rwanda">Rwanda</SelectItem>
                          <SelectItem value="Saint Kitts and Nevis">Saint Kitts and Nevis</SelectItem>
                          <SelectItem value="Saint Lucia">Saint Lucia</SelectItem>
                          <SelectItem value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</SelectItem>
                          <SelectItem value="Samoa">Samoa</SelectItem>
                          <SelectItem value="San Marino">San Marino</SelectItem>
                          <SelectItem value="Sao Tome and Principe">Sao Tome and Principe</SelectItem>
                          <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                          <SelectItem value="Senegal">Senegal</SelectItem>
                          <SelectItem value="Serbia">Serbia</SelectItem>
                          <SelectItem value="Seychelles">Seychelles</SelectItem>
                          <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                          <SelectItem value="Singapore">Singapore</SelectItem>
                          <SelectItem value="Slovakia">Slovakia</SelectItem>
                          <SelectItem value="Slovenia">Slovenia</SelectItem>
                          <SelectItem value="Solomon Islands">Solomon Islands</SelectItem>
                          <SelectItem value="Somalia">Somalia</SelectItem>
                          <SelectItem value="South Africa">South Africa</SelectItem>
                          <SelectItem value="South Korea">South Korea</SelectItem>
                          <SelectItem value="South Sudan">South Sudan</SelectItem>
                          <SelectItem value="Spain">Spain</SelectItem>
                          <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                          <SelectItem value="Sudan">Sudan</SelectItem>
                          <SelectItem value="Suriname">Suriname</SelectItem>
                          <SelectItem value="Sweden">Sweden</SelectItem>
                          <SelectItem value="Switzerland">Switzerland</SelectItem>
                          <SelectItem value="Syria">Syria</SelectItem>
                          <SelectItem value="Taiwan">Taiwan</SelectItem>
                          <SelectItem value="Tajikistan">Tajikistan</SelectItem>
                          <SelectItem value="Tanzania">Tanzania</SelectItem>
                          <SelectItem value="Thailand">Thailand</SelectItem>
                          <SelectItem value="Togo">Togo</SelectItem>
                          <SelectItem value="Tonga">Tonga</SelectItem>
                          <SelectItem value="Trinidad and Tobago">Trinidad and Tobago</SelectItem>
                          <SelectItem value="Tunisia">Tunisia</SelectItem>
                          <SelectItem value="Turkey">Turkey</SelectItem>
                          <SelectItem value="Turkmenistan">Turkmenistan</SelectItem>
                          <SelectItem value="Tuvalu">Tuvalu</SelectItem>
                          <SelectItem value="Uganda">Uganda</SelectItem>
                          <SelectItem value="Ukraine">Ukraine</SelectItem>
                          <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Uruguay">Uruguay</SelectItem>
                          <SelectItem value="Uzbekistan">Uzbekistan</SelectItem>
                          <SelectItem value="Vanuatu">Vanuatu</SelectItem>
                          <SelectItem value="Vatican City">Vatican City</SelectItem>
                          <SelectItem value="Venezuela">Venezuela</SelectItem>
                          <SelectItem value="Vietnam">Vietnam</SelectItem>
                          <SelectItem value="Yemen">Yemen</SelectItem>
                          <SelectItem value="Zambia">Zambia</SelectItem>
                          <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jobForm.control}
                  name="remoteType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remote Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-remote-type">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="onsite">On-site</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <FormField
                  control={jobForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-category">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jobForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-industry">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                          <SelectItem value="Consulting">Consulting</SelectItem>
                          <SelectItem value="Research">Research</SelectItem>
                          <SelectItem value="Construction">Construction</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Transportation">Transportation</SelectItem>
                          <SelectItem value="Hospitality">Hospitality</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Agriculture">Agriculture</SelectItem>
                          <SelectItem value="Energy">Energy</SelectItem>
                          <SelectItem value="Media">Media</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jobForm.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-experience">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                          <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                          <SelectItem value="senior">Senior Level (5+ years)</SelectItem>
                          <SelectItem value="executive">Executive Level</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jobForm.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-job-type">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="temporary">Temporary</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={jobForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the job role, responsibilities, and requirements..."
                        className="min-h-[120px]"
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-3 gap-6">
                <FormField
                  control={jobForm.control}
                  name="vacancies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Openings *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1" 
                          {...field} 
                          value={field.value || ""} 
                          onChange={(e) => field.onChange(Number(e.target.value) || 1)}
                          min="1"
                          data-testid="input-vacancies" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jobForm.control}
                  name="salaryMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Salary</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50000" 
                          {...field} 
                          value={field.value || ""} 
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          data-testid="input-salary-min" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jobForm.control}
                  name="salaryMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Salary</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="80000" 
                          {...field} 
                          value={field.value || ""} 
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          data-testid="input-salary-max" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jobForm.control}
                  name="salaryPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Period</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-salary-period">
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hour">Per Hour</SelectItem>
                          <SelectItem value="day">Per Day</SelectItem>
                          <SelectItem value="week">Per Week</SelectItem>
                          <SelectItem value="month">Per Month</SelectItem>
                          <SelectItem value="year">Per Year</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center space-x-6">
                <FormField
                  control={jobForm.control}
                  name="visaSupport"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-visa-support"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Visa Support Available</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={jobForm.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-featured"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Featured Job</FormLabel>
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
                    setShowJobForm(false);
                    setEditingJob(null);
                    jobForm.reset();
                  }}
                  data-testid="button-cancel-job"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createJobMutation.isPending || updateJobMutation.isPending}
                  data-testid="button-save-job"
                >
                  {editingJob ? "Update Job" : "Create Job"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  if (showCompanyForm) {
    return (
      <Card data-testid="company-form">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Add New Company</span>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCompanyForm(false);
                companyForm.reset();
              }}
              data-testid="button-cancel-company-form"
            >
              Cancel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...companyForm}>
            <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-6">
              <FormField
                control={companyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. TechCorp Inc." {...field} data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowCompanyForm(false);
                    companyForm.reset();
                  }}
                  data-testid="button-cancel-company"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCompanyMutation.isPending}
                  data-testid="button-save-company"
                >
                  Create Company
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="job-manager">
      {/* Mobile-Optimized Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-blue-200">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-slate-800 mb-1 md:mb-2">Job Management</h2>
            <p className="text-slate-600 text-sm md:text-lg mb-3">Create, edit and manage all job postings across different countries</p>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <Badge className="bg-blue-100 text-blue-800 px-2 py-1 text-xs md:text-sm">
                {jobs.length} Total Jobs
              </Badge>
              <Badge className="bg-green-100 text-green-800 px-2 py-1 text-xs md:text-sm">
                {jobs.filter(job => job.status === 'published').length} Published
              </Badge>
              <Badge className="bg-amber-100 text-amber-800 px-2 py-1 text-xs md:text-sm">
                {jobs.filter(job => job.featured).length} Featured
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowCompanyForm(true)}
              className="h-10 md:h-12 px-4 md:px-6 border-2 hover:bg-gray-50 text-sm md:text-base"
              data-testid="button-add-company"
            >
              <Building2 className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Add Company
            </Button>
            <Button 
              onClick={() => setShowJobForm(true)}
              className="h-10 md:h-12 px-4 md:px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm md:text-base"
              data-testid="button-add-job"
            >
              <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Create Job
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Search */}
      <div className="relative" data-testid="job-search">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          placeholder="Search jobs by title, company, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 md:h-auto text-sm md:text-base"
          data-testid="input-search-jobs"
        />
      </div>

      {/* Jobs List */}
      <div className="space-y-4" data-testid="jobs-list">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No Jobs Found</h3>
              <p className="text-slate-500 mb-4">Get started by creating your first job posting.</p>
              <Button onClick={() => setShowJobForm(true)} data-testid="button-create-first-job">
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow" data-testid={`job-item-${job.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        {job.company.logo ? (
                          <img src={job.company.logo} alt={job.company.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <Building2 className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800" data-testid={`job-title-${job.id}`}>{job.title}</h3>
                        <p className="text-slate-600">{job.company.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant={job.status === 'published' ? 'default' : 'secondary'} data-testid={`job-status-${job.id}`}>
                        {job.status}
                      </Badge>
                      {job.featured && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Featured
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <MapPin className="mr-1 h-3 w-3" />
                        {job.location}
                      </Badge>
                      <Badge variant="outline">
                        <Users className="mr-1 h-3 w-3" />
                        {job.vacancies} {job.vacancies === 1 ? 'opening' : 'openings'}
                      </Badge>
                      <Badge variant="outline">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDistanceToNow(new Date((job as any).posted_at || job.postedAt), { addSuffix: true })}
                      </Badge>
                      {job.salaryMin && job.salaryMax && (
                        <Badge variant="outline">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {job.currency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditJob(job)}
                      data-testid={`button-edit-job-${job.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-job-${job.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
