import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Heart, MapPin, Clock, Building2, ExternalLink, Award, DollarSign, Users, Briefcase, Eye, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import JobApplicationForm from "@/components/forms/job-application-form";

interface Job {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
  };
  location: string;
  country: string;
  remote_type: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  tags?: string;
  posted_at: string;
  visa_support: boolean;
  category?: string;
  experience_level?: string;
  description?: string;
}

interface JobCardProps {
  job: Job;
  showFullDetails?: boolean;
}

export default function JobCard({ job, showFullDetails = false }: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to get saved jobs and check if current job is saved
  const { data: savedJobs } = useQuery<any[]>({
    queryKey: ["/api/saved-jobs"],
    enabled: isAuthenticated,
  });

  // Update isSaved state when savedJobs data changes
  React.useEffect(() => {
    if (savedJobs && isAuthenticated) {
      const isJobSaved = savedJobs.some(savedJob => savedJob.id === job.id);
      setIsSaved(isJobSaved);
    } else {
      setIsSaved(false);
    }
  }, [savedJobs, job.id, isAuthenticated]);

  const saveJobMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiRequest("DELETE", `/api/saved-jobs/${job.id}`);
      } else {
        await apiRequest("POST", "/api/saved-jobs", { jobId: job.id });
      }
    },
    onSuccess: () => {
      setIsSaved(!isSaved);
      queryClient.invalidateQueries({ queryKey: ["/api/saved-jobs"] });
      toast({
        title: isSaved ? "Job unsaved" : "Job saved",
        description: isSaved ? "Job removed from saved list" : "Job added to your saved list",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveJob = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to save jobs",
        variant: "destructive",
      });
      return;
    }
    saveJobMutation.mutate();
  };

  const handleApplyJob = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  const handleViewDetails = () => {
    // TODO: Navigate to job details page
    console.log("View job details:", job.id);
  };

  const formatSalary = () => {
    const salaryMin = (job as any).salary_min || (job as any).salaryMin;
    const salaryMax = (job as any).salary_max || (job as any).salaryMax;
    const salaryPeriod = (job as any).salary_period || (job as any).salaryPeriod || 'year';
    if (!salaryMin && !salaryMax) return null;
    
    const formatAmount = (amount: number) => {
      // Check if job is in Nepal, then use NPR formatting
      if (job.country?.toLowerCase() === 'nepal') {
        return `NPR ${new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)}`;
      }
      
      // For other countries, use USD formatting
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const getPeriodText = () => {
      switch(salaryPeriod) {
        case 'hour': return 'per hour';
        case 'day': return 'per day';
        case 'week': return 'per week';
        case 'month': return 'per month';
        case 'year': return 'per year';
        default: return 'per year';
      }
    };

    const salaryText = (() => {
      if (salaryMin && salaryMax) {
        return `${formatAmount(salaryMin)} - ${formatAmount(salaryMax)}`;
      } else if (salaryMin) {
        return `${formatAmount(salaryMin)}+`;
      } else if (salaryMax) {
        return `Up to ${formatAmount(salaryMax)}`;
      }
      return '';
    })();

    return { salaryText, periodText: getPeriodText() };
  };

  const getRemoteTypeBadge = () => {
    const variants: Record<string, string> = {
      remote: "bg-green-100 text-green-800",
      onsite: "bg-blue-100 text-blue-800", 
      hybrid: "bg-purple-100 text-purple-800",
    };
    
    return variants[job.remote_type] || "bg-slate-100 text-slate-800";
  };

  const parseTags = () => {
    if (!job.tags) return [];
    try {
      return JSON.parse(job.tags);
    } catch {
      return job.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }
  };

  const tags = parseTags();
  const timeAgo = formatDistanceToNow(new Date(job.posted_at), { addSuffix: true });

  if (showFullDetails) {
    return (
      <Card 
        className="shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer card-hover flex flex-col"
        onClick={handleViewDetails}
        data-testid={`job-card-${job.id}`}
      >
        <CardContent className="p-5 sm:p-6 lg:p-6 flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                  <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    {job.company.logo ? (
                      <img 
                        src={job.company.logo} 
                        alt={`${job.company.name} logo`} 
                        className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain rounded-xl"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base md:text-lg lg:text-xl font-bold text-slate-800 mb-2 md:mb-3 leading-tight" data-testid="job-title">
                      {job.title}
                    </h3>
                    <p className="text-slate-600 text-sm md:text-base font-medium truncate mb-2" data-testid="company-name">{job.company.name}</p>
                    <div className="flex items-center text-xs md:text-sm text-slate-500 mt-1 md:mt-2 flex-wrap gap-1">
                      <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate" data-testid="job-location">{job.location}</span>
                      <span className="mx-2 flex-shrink-0">•</span>
                      <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="flex-shrink-0" data-testid="posted-time">{timeAgo}</span>
                      {job.vacancies && job.vacancies > 1 && (
                        <>
                          <span className="mx-2 flex-shrink-0">•</span>
                          <span className="flex-shrink-0" data-testid="job-vacancies">{job.vacancies} openings</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveJob}
                  className={`md:hidden transition-colors flex-shrink-0 p-2 ${isSaved ? "text-red-500 hover:text-red-600" : "text-slate-400 hover:text-red-500"}`}
                  data-testid="button-save-job"
                >
                  <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-3 mb-4 md:mb-6 lg:mb-0">
                <Badge className={`px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-medium rounded-full ${getRemoteTypeBadge()}`} data-testid="badge-remote-type">
                  {(job.remote_type || job.remoteType) ? 
                    ((job.remote_type || job.remoteType) === 'onsite' ? 'On-Site' : 
                     (job.remote_type || job.remoteType).charAt(0).toUpperCase() + (job.remote_type || job.remoteType).slice(1)) : 'Remote'}
                </Badge>
                {(job.visa_support || job.visaSupport) && (
                  <Badge className="bg-coral-100 text-coral-800 px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-medium rounded-full" data-testid="badge-visa-support">
                    Visa Support
                  </Badge>
                )}
                {(job.experience_level || job.experienceLevel) && (
                  <Badge className="bg-amber-100 text-amber-800 px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-medium rounded-full md:inline-flex hidden" data-testid="badge-experience">
                    {(job.experience_level || job.experienceLevel).charAt(0).toUpperCase() + (job.experience_level || job.experienceLevel).slice(1)} Level
                  </Badge>
                )}
                {(job.featured) && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-medium rounded-full" data-testid="badge-featured">
                    ⭐ Featured
                  </Badge>
                )}
                {tags.length > 0 && (
                  <div className="hidden lg:flex lg:flex-wrap lg:gap-2" data-testid="job-tags">
                    {tags.slice(0, 3).map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Simplified mobile display - removed description and tags for cleaner look */}
            </div>

            <div className="mt-4 md:mt-0 flex flex-col md:flex-row md:items-center md:justify-end gap-4 md:gap-4 md:min-w-max">
              <div className="md:text-right md:mr-4">
                {formatSalary() && (
                  <div className="font-bold text-lg md:text-xl lg:text-lg text-slate-800 md:whitespace-nowrap mb-2 md:mb-0" data-testid="job-salary">
                    {formatSalary().salaryText}
                    <span className="text-sm text-slate-500 ml-1 block md:inline">{formatSalary().periodText}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3 md:flex-row flex-shrink-0">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleSaveJob}
                  className={`hidden md:inline-flex transition-colors p-2 md:p-3 ${isSaved ? "text-red-500 hover:text-red-600" : "text-slate-400 hover:text-red-500"}`}
                  data-testid="button-save-detailed"
                >
                  <Heart className={`h-4 w-4 md:h-5 md:w-5 ${isSaved ? "fill-current" : ""}`} />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="whitespace-nowrap px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base"
                      data-testid="button-details"
                    >
                      <Eye className="mr-1 md:mr-2 h-4 w-4" />
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between">
                        <span className="text-xl font-bold">{job.title}</span>
                        {job.featured && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            ⭐ Featured
                          </Badge>
                        )}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Company Info */}
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                          {job.company.logo ? (
                            <img 
                              src={job.company.logo} 
                              alt={`${job.company.name} logo`} 
                              className="w-12 h-12 object-contain rounded-lg"
                            />
                          ) : (
                            <Building2 className="h-8 w-8 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">{job.company.name}</h3>
                          <div className="flex items-center text-slate-500 text-sm">
                            <MapPin className="mr-1 h-4 w-4" />
                            <span>{job.location}, {job.country}</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Job Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3">
                          <Briefcase className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500">Remote Type</p>
                            <p className="font-medium">
                              {(job.remote_type || job.remoteType) === 'onsite' ? 'On-Site' : 
                               (job.remote_type || job.remoteType)?.charAt(0).toUpperCase() + (job.remote_type || job.remoteType)?.slice(1)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500">Job Type</p>
                            <p className="font-medium">{job.jobType?.replace('-', ' ')?.replace(/\b\w/g, l => l.toUpperCase())}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500">Experience</p>
                            <p className="font-medium">
                              {(job.experience_level || job.experienceLevel)?.charAt(0).toUpperCase() + (job.experience_level || job.experienceLevel)?.slice(1)} Level
                            </p>
                          </div>
                        </div>

                        {(job.salaryMin || job.salaryMax) && (
                          <div className="flex items-center space-x-3">
                            <DollarSign className="h-5 w-5 text-slate-400" />
                            <div>
                              <p className="text-sm text-slate-500">Salary</p>
                              <p className="font-medium">
                                {formatSalary()?.salaryText} {formatSalary()?.periodText}
                              </p>
                            </div>
                          </div>
                        )}

                        {job.vacancies && (
                          <div className="flex items-center space-x-3">
                            <Users className="h-5 w-5 text-slate-400" />
                            <div>
                              <p className="text-sm text-slate-500">Openings</p>
                              <p className="font-medium">{job.vacancies} position{job.vacancies > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500">Posted</p>
                            <p className="font-medium">{timeAgo}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Job Description */}
                      {job.description && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3">Job Description</h4>
                          <div className="prose max-w-none text-slate-700">
                            <p className="whitespace-pre-wrap">{job.description}</p>
                          </div>
                        </div>
                      )}

                      {/* Requirements */}
                      {job.requirements && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3">Requirements</h4>
                          <div className="prose max-w-none text-slate-700">
                            <p className="whitespace-pre-wrap">{job.requirements}</p>
                          </div>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`${getRemoteTypeBadge()}`}>
                          {(job.remote_type || job.remoteType) === 'onsite' ? 'On-Site' : 
                           (job.remote_type || job.remoteType)?.charAt(0).toUpperCase() + (job.remote_type || job.remoteType)?.slice(1)}
                        </Badge>
                        {(job.visa_support || job.visaSupport) && (
                          <Badge className="bg-coral-100 text-coral-800">Visa Support</Badge>
                        )}
                        {(job.experience_level || job.experienceLevel) && (
                          <Badge className="bg-amber-100 text-amber-800">
                            {(job.experience_level || job.experienceLevel)?.charAt(0).toUpperCase() + (job.experience_level || job.experienceLevel)?.slice(1)} Level
                          </Badge>
                        )}
                        {job.category && (
                          <Badge variant="secondary">{job.category}</Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                        <Button
                          onClick={handleSaveJob}
                          variant="outline"
                          className={`flex-1 ${isSaved ? "text-coral-500 border-coral-500" : ""}`}
                        >
                          <Heart className={`mr-2 h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                          {isSaved ? "Saved" : "Save Job"}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                              <Briefcase className="mr-2 h-4 w-4" />
                              Apply Now
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Apply for {job.title}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-semibold text-gray-800">{job.title}</h4>
                                <p className="text-gray-600">{job.company.name}</p>
                                <p className="text-sm text-gray-500">{job.location}, {job.country}</p>
                              </div>
                              <JobApplicationForm 
                                jobId={job.id}
                                onSuccess={() => {
                                  toast({
                                    title: "Application Submitted",
                                    description: "Your application has been sent successfully!",
                                  });
                                }}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        {job.applyUrl && (
                          <Button asChild variant="outline" className="flex-1">
                            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              External Apply
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      onClick={handleApplyJob}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-colors whitespace-nowrap px-8 py-3 rounded-2xl font-medium text-base lg:text-sm lg:px-6 lg:py-2 lg:rounded-xl"
                      data-testid="button-apply"
                    >
                      Apply Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Apply for {job.title}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">{job.title}</h4>
                        <p className="text-gray-600">{job.company.name}</p>
                        <p className="text-sm text-gray-500">{job.location}, {job.country}</p>
                      </div>
                      <JobApplicationForm 
                        jobId={job.id}
                        onSuccess={() => {
                          setIsDialogOpen(false);
                          toast({
                            title: "Application Submitted",
                            description: "Your application has been sent successfully!",
                          });
                        }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simplified card for featured jobs
  return (
    <Card 
      className="shadow-lg card-hover cursor-pointer"
      onClick={handleViewDetails}
      data-testid={`featured-job-card-${job.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge className={`px-3 py-1 text-sm ${getRemoteTypeBadge()}`} data-testid="badge-type">
            {job.remote_type ? job.remote_type.charAt(0).toUpperCase() + job.remote_type.slice(1) : 'Remote'}
          </Badge>
          <span className="text-slate-500 text-sm" data-testid="time-ago">{timeAgo}</span>
        </div>
        
        <h3 className="font-display text-xl font-bold text-slate-800 mb-2" data-testid="featured-job-title">
          {job.title}
        </h3>
        <p className="text-slate-600 mb-3" data-testid="featured-company">{job.company.name}</p>
        
        <div className="flex items-center text-sm text-slate-500 mb-4">
          <MapPin className="mr-2 h-3 w-3" />
          <span data-testid="featured-location">{job.location}</span>
          {formatSalary() && (
            <>
              <span className="mx-2">•</span>
              <span data-testid="featured-salary">{formatSalary().salaryText} {formatSalary().periodText}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {tags.slice(0, 2).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveJob}
            className={`transition-colors ${isSaved ? "text-red-500 hover:text-red-600" : "text-slate-400 hover:text-red-500"}`}
            data-testid="button-save-featured"
          >
            <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
