import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Plus, FileText, Globe, Download, HelpCircle, Eye, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ResourceFileUploader } from "./resource-file-uploader";

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  type: z.enum(["guide", "blog", "faq", "download"]),
  category: z.string().optional(),
  country: z.string().optional(),
  tags: z.string().optional(),
  featuredImage: z.string().optional(),
  // New fields for FAQ
  faqItems: z.array(z.object({
    question: z.string().min(1, "Question is required"),
    answer: z.string().min(1, "Answer is required")
  })).optional(),
  // New fields for file downloads
  downloadFile: z.string().optional(),
  downloadFileName: z.string().optional(),
  downloadFileSize: z.number().optional(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
}).refine((data) => {
  // Content is required for guide and blog types
  if ((data.type === 'guide' || data.type === 'blog') && !data.content?.trim()) {
    return false;
  }
  // FAQ items are required for FAQ type
  if (data.type === 'faq' && (!data.faqItems || data.faqItems.length === 0)) {
    return false;
  }
  // Download file is required for download type
  if (data.type === 'download' && !data.downloadFile?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Content, FAQ items, or download file is required based on the type selected",
  path: ["content"]
});

interface Resource {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  type: string;
  category?: string;
  country?: string;
  tags?: string;
  featuredImage?: string;
  faqItems?: Array<{ question: string; answer: string }>;
  downloadFile?: string;
  downloadFileName?: string;
  downloadFileSize?: number;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  authorUser?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export default function ResourceManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [selectedType, setSelectedType] = useState<string>("guide");
  const [faqItems, setFaqItems] = useState<Array<{ question: string; answer: string }>>([{ question: "", answer: "" }]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/admin/resources", filterType],
    queryFn: async () => {
      const params = filterType !== "all" ? `?type=${filterType}` : "";
      const response = await apiRequest("GET", `/api/admin/resources${params}`);
      return response.json();
    },
  });

  const form = useForm<z.infer<typeof resourceSchema>>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      type: "guide",
      category: "",
      country: "",
      tags: "",
      featuredImage: "",
      faqItems: [{ question: "", answer: "" }],
      downloadFile: "",
      downloadFileName: "",
      downloadFileSize: 0,
      isPublished: false,
      isFeatured: false,
    },
  });

  // Auto-generate slug from title
  const watchedTitle = form.watch("title");
  const watchedType = form.watch("type");
  
  useEffect(() => {
    if (watchedTitle && !editingResource) {
      const slug = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      form.setValue("slug", slug);
    }
  }, [watchedTitle, editingResource, form]);

  const getResourceTypeHelp = (type: string) => {
    switch (type) {
      case 'guide':
        return "Comprehensive guides about countries, visa processes, or immigration topics.";
      case 'blog':
        return "News articles, tips, and insights about abroad opportunities.";
      case 'faq':
        return "Frequently asked questions with detailed answers.";
      case 'download':
        return "Downloadable resources like PDFs, checklists, or templates.";
      default:
        return "";
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resourceSchema>) => {
      const response = await apiRequest("POST", "/api/admin/resources", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Resource created",
        description: "The resource has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create resource",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<z.infer<typeof resourceSchema>> }) => {
      const response = await apiRequest("PUT", `/api/admin/resources/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      setIsDialogOpen(false);
      setEditingResource(null);
      form.reset();
      toast({
        title: "Resource updated",
        description: "The resource has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update resource",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      toast({
        title: "Resource deleted",
        description: "The resource has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  // FAQ management functions
  const addFaqItem = () => {
    setFaqItems([...faqItems, { question: "", answer: "" }]);
  };

  const removeFaqItem = (index: number) => {
    const newItems = faqItems.filter((_, i) => i !== index);
    setFaqItems(newItems);
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const newItems = [...faqItems];
    newItems[index][field] = value;
    setFaqItems(newItems);
  };

  const onSubmit = (data: z.infer<typeof resourceSchema>) => {
    // Generate slug from title if not provided
    if (!data.slug) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // For FAQ type, use faqItems instead of content and clear unnecessary fields
    if (data.type === 'faq') {
      data.faqItems = faqItems.filter(item => item.question.trim() && item.answer.trim());
      data.content = ""; // Clear content for FAQ
      data.excerpt = ""; // Clear excerpt for FAQ
      data.category = ""; // Clear category for FAQ
      data.tags = ""; // Clear tags for FAQ
      data.featuredImage = ""; // Clear featured image for FAQ
    }

    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    form.reset({
      title: resource.title,
      slug: resource.slug,
      excerpt: resource.excerpt || "",
      content: resource.content || "",
      type: resource.type as any,
      category: resource.category || "",
      country: resource.country || "",
      tags: resource.tags || "",
      featuredImage: resource.featuredImage || "",
      faqItems: resource.faqItems || [{ question: "", answer: "" }],
      downloadFile: resource.downloadFile || "",
      downloadFileName: resource.downloadFileName || "",
      downloadFileSize: resource.downloadFileSize || 0,
      isPublished: resource.isPublished,
      isFeatured: resource.isFeatured,
    });
    // Update local FAQ state for editing
    if (resource.faqItems && resource.faqItems.length > 0) {
      setFaqItems(resource.faqItems);
    } else {
      setFaqItems([{ question: "", answer: "" }]);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateNew = () => {
    setEditingResource(null);
    form.reset({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      type: "guide",
      category: "",
      country: "",
      tags: "",
      featuredImage: "",
      faqItems: [{ question: "", answer: "" }],
      downloadFile: "",
      downloadFileName: "",
      downloadFileSize: 0,
      isPublished: false,
      isFeatured: false,
    });
    setSelectedType("guide");
    setFaqItems([{ question: "", answer: "" }]);
    setIsDialogOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "guide": return <Globe className="h-4 w-4" />;
      case "blog": return <FileText className="h-4 w-4" />;
      case "faq": return <HelpCircle className="h-4 w-4" />;
      case "download": return <Download className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "guide": return "bg-blue-100 text-blue-800";
      case "blog": return "bg-green-100 text-green-800";
      case "faq": return "bg-yellow-100 text-yellow-800";
      case "download": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div data-testid="resource-manager">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Resource Management</h2>
          <p className="text-slate-600">Manage blog posts, guides, FAQs, and downloads</p>
        </div>
        <Button onClick={handleCreateNew} data-testid="create-resource-btn">
          <Plus className="h-4 w-4 mr-2" />
          Create Resource
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="guide">Guides</SelectItem>
            <SelectItem value="blog">Blog Posts</SelectItem>
            <SelectItem value="faq">FAQs</SelectItem>
            <SelectItem value="download">Downloads</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resources List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : resources.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No resources found. Create your first resource!</p>
            </CardContent>
          </Card>
        ) : (
          resources.map((resource) => (
            <Card key={resource.id} data-testid={`resource-item-${resource.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(resource.type)}
                      <Badge className={getTypeBadgeColor(resource.type)}>
                        {resource.type.toUpperCase()}
                      </Badge>
                      {resource.isPublished ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Eye className="h-3 w-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      {resource.isFeatured && (
                        <Badge className="bg-orange-100 text-orange-800">Featured</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{resource.title}</h3>
                    {resource.excerpt && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{resource.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>/{resource.slug}</span>
                      {resource.category && <span>Category: {resource.category}</span>}
                      {resource.country && <span>Country: {resource.country}</span>}
                      <span>Created {formatDistanceToNow(new Date(resource.createdAt))} ago</span>
                      {resource.authorUser && (
                        <span>by {resource.authorUser.firstName} {resource.authorUser.lastName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(resource)}
                      data-testid={`edit-resource-${resource.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(resource.id)}
                      data-testid={`delete-resource-${resource.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? "Edit Resource" : "Create New Resource"}
            </DialogTitle>
            <DialogDescription>
              {editingResource 
                ? "Make changes to the resource. Click save when you're done."
                : "Create a new resource for your platform. Fill in the details below."
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter resource title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="auto-generated-from-title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedType(value);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="guide">📋 Country Guide</SelectItem>
                          <SelectItem value="blog">📝 Blog Post</SelectItem>
                          <SelectItem value="faq">❓ FAQ</SelectItem>
                          <SelectItem value="download">📥 Download</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getResourceTypeHelp(watchedType)}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watchedType === 'guide' && (
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="United States">🇺🇸 United States</SelectItem>
                            <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                            <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                            <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                            <SelectItem value="Germany">🇩🇪 Germany</SelectItem>
                            <SelectItem value="France">🇫🇷 France</SelectItem>
                            <SelectItem value="Netherlands">🇳🇱 Netherlands</SelectItem>
                            <SelectItem value="Sweden">🇸🇪 Sweden</SelectItem>
                            <SelectItem value="Norway">🇳🇴 Norway</SelectItem>
                            <SelectItem value="Denmark">🇩🇰 Denmark</SelectItem>
                            <SelectItem value="New Zealand">🇳🇿 New Zealand</SelectItem>
                            <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {watchedType !== 'faq' && (
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {watchedType === 'guide' && (
                              <>
                                <SelectItem value="visa-guide">Visa & Immigration</SelectItem>
                                <SelectItem value="job-guide">Job Market</SelectItem>
                                <SelectItem value="education-guide">Education</SelectItem>
                                <SelectItem value="living-guide">Cost of Living</SelectItem>
                                <SelectItem value="culture-guide">Culture & Society</SelectItem>
                              </>
                            )}
                            {watchedType === 'blog' && (
                              <>
                                <SelectItem value="news">News & Updates</SelectItem>
                                <SelectItem value="career-tips">Career Tips</SelectItem>
                                <SelectItem value="success-stories">Success Stories</SelectItem>
                                <SelectItem value="industry-insights">Industry Insights</SelectItem>
                              </>
                            )}
                            {watchedType === 'download' && (
                              <>
                                <SelectItem value="checklists">Checklists</SelectItem>
                                <SelectItem value="templates">Templates</SelectItem>
                                <SelectItem value="guides">PDF Guides</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {watchedType !== 'faq' && (
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the resource..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* FAQ Items Section - Only for FAQ type */}
              {watchedType === 'faq' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>FAQ Items *</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addFaqItem}
                      data-testid="add-faq-item"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add FAQ Item
                    </Button>
                  </div>
                  {faqItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">FAQ Item #{index + 1}</span>
                        {faqItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFaqItem(index)}
                            data-testid={`remove-faq-item-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <FormLabel>Question *</FormLabel>
                          <Input
                            placeholder="Enter the question..."
                            value={item.question}
                            onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                            data-testid={`faq-question-${index}`}
                          />
                        </div>
                        <div>
                          <FormLabel>Answer *</FormLabel>
                          <Textarea
                            placeholder="Enter the answer..."
                            value={item.answer}
                            onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
                            className="resize-none"
                            rows={3}
                            data-testid={`faq-answer-${index}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Download File Section - Only for download type */}
              {watchedType === 'download' && (
                <div className="space-y-4">
                  <FormLabel>Download File *</FormLabel>
                  <ResourceFileUploader
                    onUploadSuccess={(filePath, fileName, fileSize, type) => {
                      form.setValue('downloadFile', filePath);
                      form.setValue('downloadFileName', fileName);
                      form.setValue('downloadFileSize', fileSize);
                    }}
                    currentFile={form.watch('downloadFile')}
                    uploadType="file"
                  />
                  {form.watch('downloadFileName') && (
                    <div className="text-sm text-muted-foreground">
                      Current file: {form.watch('downloadFileName')} 
                      ({Math.round((form.watch('downloadFileSize') || 0) / 1024)} KB)
                    </div>
                  )}
                </div>
              )}

              {/* Regular Content Field - For guide and blog types */}
              {(watchedType === 'guide' || watchedType === 'blog') && (
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the full content (HTML and Markdown supported)..."
                          className="resize-none min-h-[250px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedType !== 'faq' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input placeholder="career, visa, immigration (comma-separated)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Featured Image</FormLabel>
                    <ResourceFileUploader
                      onUploadSuccess={(filePath, fileName, fileSize, type) => {
                        form.setValue('featuredImage', filePath);
                      }}
                      currentFile={form.watch('featuredImage')}
                      uploadType="image"
                    />
                    {form.watch('featuredImage') && (
                      <div className="text-sm text-muted-foreground">
                        Current image: {form.watch('featuredImage')?.split('/').pop()}
                      </div>
                    )}
                  </FormItem>
                </div>
              )}

              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Publish immediately</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Featured resource</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="submit-resource-btn"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingResource ? "Update Resource" : "Create Resource")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}