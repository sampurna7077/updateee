import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Eye, 
  Filter,
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  ExternalLink,
  Download
} from "lucide-react";
import LoadingVideo from "@/components/loading-video";
import { formatDistanceToNow } from "date-fns";

interface FormSubmission {
  id: string;
  formType: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  status: string;
  notes?: string;
  assignedTo?: string;
  submittedAt: string;
  data: any;
}

export default function SubmissionManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formTypeFilter, setFormTypeFilter] = useState("all");
  const [localFilter, setLocalFilter] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: submissions = [], isLoading } = useQuery<FormSubmission[]>({
    queryKey: ["/api/admin/submissions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/submissions");
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return response.json();
    },
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return await apiRequest("PUT", `/api/admin/submissions/${id}`, { status, notes });
    },
    onSuccess: (updatedSubmission) => {
      toast({
        title: "Submission Updated",
        description: "Submission status has been updated successfully.",
      });
      
      // Update the selectedSubmission immediately for real-time UI update
      if (selectedSubmission) {
        setSelectedSubmission({
          ...selectedSubmission,
          status: newStatus,
          notes: notes.trim() || selectedSubmission.notes
        });
      }
      
      // Invalidate cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update submission status.",
        variant: "destructive",
      });
    },
  });

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    const matchesFormType = formTypeFilter === "all" || submission.formType === formTypeFilter;
    
    // Check if submission is from Nepal for local filter
    const matchesLocal = !localFilter || 
      submission.data?.country?.toLowerCase() === "nepal" ||
      submission.data?.location?.toLowerCase().includes("nepal") ||
      submission.data?.address?.toLowerCase().includes("nepal");
    
    return matchesSearch && matchesStatus && matchesFormType && matchesLocal;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "reviewed":
        return <Badge className="bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" />Reviewed</Badge>;
      case "contacted":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Contacted</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFormTypeBadge = (formType: string) => {
    const typeInfo = {
      consultation: { color: "bg-primary-100 text-primary-800", label: "Free Consultation" },
      "job-application": { color: "bg-coral-100 text-coral-800", label: "Job Application" },
      "study-abroad": { color: "bg-green-100 text-green-800", label: "Study Abroad" },
      "visa-counseling": { color: "bg-purple-100 text-purple-800", label: "Visa Counseling" },
      "document-review": { color: "bg-amber-100 text-amber-800", label: "Document Review" },
      contact: { color: "bg-blue-100 text-blue-800", label: "General Inquiry" }
    };
    
    const info = typeInfo[formType as keyof typeof typeInfo] || { 
      color: 'bg-gray-100 text-gray-800', 
      label: formType ? formType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown' 
    };
    
    return (
      <Badge className={`${info.color} font-medium px-3 py-1`}>
        {info.label}
      </Badge>
    );
  };

  const handleViewDetails = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setNotes(submission.notes || "");
    setNewStatus(submission.status);
    setShowDetails(true);
  };

  const handleUpdateSubmission = () => {
    if (selectedSubmission) {
      updateSubmissionMutation.mutate({
        id: selectedSubmission.id,
        status: newStatus,
        notes: notes.trim() || undefined,
      });
    }
  };

  const renderSubmissionData = (data: any) => {
    if (!data || typeof data !== 'object') {
      return <p className="text-sm text-slate-500 italic">No additional details available</p>;
    }

    const formatFieldName = (key: string) => {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => {
          // Skip resume-related and citizen card fields since they're shown separately
          if (key === 'agreeToTerms' || 
              key === 'resume' || 
              key === 'resumeFileName' || 
              key === 'resumeFileType' ||
              key === 'citizenCardFront' ||
              key === 'citizenCardBack' ||
              key === 'citizenCardFrontFileName' ||
              key === 'citizenCardBackFileName' ||
              key === 'citizenCardFrontFileType' ||
              key === 'citizenCardBackFileType') {
            return null;
          }

          // Handle boolean values
          if (typeof value === 'boolean') {
            return (
              <div key={key} className="border-b border-slate-100 pb-3">
                <Label className="text-sm font-medium text-slate-700">
                  {formatFieldName(key)}
                </Label>
                <div className="mt-1">
                  <Badge className={value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {value ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            );
          }

          // Handle arrays
          if (Array.isArray(value)) {
            return (
              <div key={key} className="border-b border-slate-100 pb-3">
                <Label className="text-sm font-medium text-slate-700">
                  {formatFieldName(key)}
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {value.map((item: any, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                      {String(item)}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          }

          // Handle null or undefined
          if (value === null || value === undefined || value === '') {
            return null;
          }

          // Handle objects (nested data)
          if (typeof value === 'object') {
            return (
              <div key={key} className="border-b border-slate-100 pb-3">
                <Label className="text-sm font-medium text-slate-700">
                  {formatFieldName(key)}
                </Label>
                <div className="mt-2 pl-4 border-l-2 border-slate-200">
                  {renderSubmissionData(value)}
                </div>
              </div>
            );
          }

          // Handle regular strings and numbers
          return (
            <div key={key} className="border-b border-slate-100 pb-3">
              <Label className="text-sm font-medium text-slate-700">
                {formatFieldName(key)}
              </Label>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{String(value)}</p>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingVideo width={60} height={60} />
      </div>
    );
  }

  if (showDetails && selectedSubmission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Submission Details</h3>
            <p className="text-sm text-slate-600">
              Submitted {(() => {
                const dateStr = selectedSubmission.submittedAt;
                if (!dateStr) return 'Date not available';
                try {
                  const date = new Date(dateStr);
                  if (isNaN(date.getTime())) return 'Invalid date';
                  return formatDistanceToNow(date, { addSuffix: true });
                } catch (error) {
                  return 'Date formatting error';
                }
              })()}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDetails(false)}
            data-testid="button-back-to-list"
          >
            Back to List
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                {getFormTypeBadge(selectedSubmission.formType)}
                {getStatusBadge(selectedSubmission.status)}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">
                    {selectedSubmission.firstName} {selectedSubmission.lastName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{selectedSubmission.email}</span>
                </div>
                {selectedSubmission.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">{selectedSubmission.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">
                    {(() => {
                      const dateStr = selectedSubmission.submittedAt;
                      if (!dateStr) return 'Date not available';
                      try {
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) return 'Invalid date';
                        return date.toLocaleString();
                      } catch (error) {
                        return 'Date formatting error';
                      }
                    })()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="w-5 h-5 mr-2" />
                Update Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes or comments..."
                  rows={4}
                />
              </div>

              <Button
                onClick={handleUpdateSubmission}
                disabled={updateSubmissionMutation.isPending}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                data-testid="button-update-submission"
              >
                {updateSubmissionMutation.isPending ? "Updating..." : "Update Submission"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MessageSquare className="w-5 h-5 mr-2" />
              Submission Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSubmission.formType === 'job-application' && selectedSubmission.data?.resumeFileName && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800 mb-1">Resume</h4>
                    <p className="text-sm text-slate-600">{selectedSubmission.data.resumeFileName}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(`/api/resumes/${selectedSubmission.id}`, '_blank');
                    }}
                    className="flex items-center space-x-2"
                    data-testid="button-view-resume"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Resume</span>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Citizen Card View Buttons */}
            {selectedSubmission.formType === 'job-application' && (
              selectedSubmission.data?.citizenCardFrontFileName || selectedSubmission.data?.citizenCardBackFileName
            ) && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-slate-800 mb-3">Citizen Card Documents</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedSubmission.data?.citizenCardFrontFileName && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open(`/api/citizen-cards/${selectedSubmission.id}/front`, '_blank');
                      }}
                      className="flex items-center space-x-2"
                      data-testid="button-view-citizen-card-front"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Front Side</span>
                    </Button>
                  )}
                  
                  {selectedSubmission.data?.citizenCardBackFileName && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open(`/api/citizen-cards/${selectedSubmission.id}/back`, '_blank');
                      }}
                      className="flex items-center space-x-2"
                      data-testid="button-view-citizen-card-back"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Back Side</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {renderSubmissionData(selectedSubmission.data)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-green-200 mb-4 md:mb-6">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-xl md:text-3xl font-bold text-slate-800 mb-1 md:mb-2">Service Submissions</h3>
            <p className="text-slate-600 text-sm md:text-lg mb-3">
              Manage and review all service applications and inquiries from clients
            </p>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <Badge className="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs md:text-sm">
                {submissions.filter(s => s.status === 'pending').length} Pending
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 px-2 py-1 text-xs md:text-sm">
                {submissions.filter(s => s.status === 'reviewed').length} Reviewed
              </Badge>
              <Badge className="bg-green-100 text-green-800 px-2 py-1 text-xs md:text-sm">
                {submissions.filter(s => s.status === 'contacted').length} Contacted
              </Badge>
              <Badge className="bg-gray-100 text-gray-800 px-2 py-1 text-xs md:text-sm">
                {submissions.length} Total
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Mobile-optimized search and filters */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search submissions by email, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 md:h-auto text-sm md:text-base"
            data-testid="input-search-submissions"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 md:h-auto text-sm md:text-base">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={formTypeFilter} onValueChange={setFormTypeFilter}>
            <SelectTrigger className="h-10 md:h-auto text-sm md:text-base">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="consultation">Free Consultation</SelectItem>
              <SelectItem value="job-application">Job Application</SelectItem>
              <SelectItem value="study-abroad">Study Abroad</SelectItem>
              <SelectItem value="visa-counseling">Visa Counseling</SelectItem>
              <SelectItem value="document-review">Document Review</SelectItem>
              <SelectItem value="contact">General Inquiry</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 min-w-fit">
            <input 
              type="checkbox" 
              id="admin-local-filter" 
              checked={localFilter}
              onChange={(e) => setLocalFilter(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="admin-local-filter" className="text-sm font-medium text-blue-900 cursor-pointer whitespace-nowrap">
              Local (Nepal)
            </label>
          </div>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No Submissions Found</h3>
            <p className="text-slate-500">
              {searchQuery || statusFilter !== "all" || formTypeFilter !== "all" || localFilter
                ? "Try adjusting your filters to see more submissions."
                : "Form submissions will appear here when users submit forms."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getFormTypeBadge(submission.formType)}
                      {getStatusBadge(submission.status)}
                      <span className="text-sm text-slate-500">
                        {(() => {
                          const dateStr = submission.submittedAt;
                          if (!dateStr) return 'Date not available';
                          try {
                            const date = new Date(dateStr);
                            if (isNaN(date.getTime())) return 'Invalid date';
                            return formatDistanceToNow(date, { addSuffix: true });
                          } catch (error) {
                            return 'Date formatting error';
                          }
                        })()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-800">
                          {submission.firstName} {submission.lastName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{submission.email}</span>
                      </div>
                      {submission.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{submission.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {submission.notes && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                          <p className="text-sm text-slate-600">{submission.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {submission.formType === 'job-application' && submission.data?.resumeFileName && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `/api/resumes/${submission.id}`;
                          link.download = submission.data.resumeFileName || 'resume.pdf';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        data-testid={`button-download-resume-${submission.id}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        CV
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(submission)}
                      data-testid={`button-view-submission-${submission.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}