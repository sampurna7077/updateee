import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { AdvertisementUploader } from "./advertisement-uploader";

export function AdvertisementManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    filePath: "" as string | null,
    fileType: "image" as "image" | "gif",
    position: "left" as "left" | "right",
    priority: 0,
    isActive: true,
    startDate: "" as string | null,
    endDate: "" as string | null,
  });

  const { data: advertisementData, isLoading } = useQuery({
    queryKey: ["/api/admin/advertisements"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/advertisements");
      return response.json();
    },
  });

  // Extract data from the new response format
  const advertisements = advertisementData?.advertisements || [];
  const counts = advertisementData?.counts || { left: { active: 0, max: 3 }, right: { active: 0, max: 3 } };
  const totalActive = advertisementData?.totalActive || 0;
  const maxTotal = advertisementData?.maxTotal || 6;

  const createAdMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/advertisements", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      setShowCreateDialog(false);
      setFormData({
        title: "",
        description: "",
        link: "",
        filePath: "" as string | null,
        fileType: "image" as "image" | "gif",
        position: "left",
        priority: 0,
        isActive: true,
        startDate: "" as string | null,
        endDate: "" as string | null,
      });
      toast({ title: "Advertisement created successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create advertisement",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const updateAdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PUT", `/api/admin/advertisements/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      setEditingAd(null);
      toast({ title: "Advertisement updated successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update advertisement",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/advertisements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      toast({ title: "Advertisement deleted successfully!" });
    },
    onError: () => {
      toast({
        title: "Failed to delete advertisement",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    const submitData = {
      ...formData,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    };
    createAdMutation.mutate(submitData);
  };

  const handleUpdate = () => {
    if (editingAd) {
      const submitData = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };
      updateAdMutation.mutate({ id: editingAd.id, data: submitData });
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      link: ad.link || "",
      filePath: ad.filePath || null,
      fileType: (ad.fileType as "image" | "gif") || "image",
      position: ad.position as "left" | "right",
      priority: ad.priority || 0,
      isActive: ad.isActive ?? true,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : null,
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : null,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this advertisement?")) {
      deleteAdMutation.mutate(id);
    }
  };

  const formatDate = (dateValue: string | Date | null) => {
    if (!dateValue) return "No limit";
    return new Date(dateValue).toLocaleDateString();
  };

  // Check if the selected position is at capacity
  const isPositionAtLimit = (position: string) => {
    if (position === 'left') return counts.left.active >= counts.left.max;
    if (position === 'right') return counts.right.active >= counts.right.max;
    return false;
  };

  // Check if we can create a new ad for the selected position
  const canCreateForPosition = () => {
    if (!formData.isActive) return true; // Inactive ads don't count towards limit
    return !isPositionAtLimit(formData.position);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Advertisement Management
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Manage sidebar advertisements for better user engagement
          </p>
          
          {/* Ad Limits Display */}
          <div className="mt-2 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400">Left Position:</span>
              <Badge variant={counts.left.active >= counts.left.max ? "destructive" : "secondary"}>
                {counts.left.active}/{counts.left.max}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400">Right Position:</span>
              <Badge variant={counts.right.active >= counts.right.max ? "destructive" : "secondary"}>
                {counts.right.active}/{counts.right.max}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400">Total Active:</span>
              <Badge variant={totalActive >= maxTotal ? "destructive" : "secondary"}>
                {totalActive}/{maxTotal}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-coral-600 hover:bg-coral-700"
          data-testid="button-create-advertisement"
          disabled={totalActive >= maxTotal}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Advertisement
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-300">
            Loading advertisements...
          </div>
        ) : advertisements && Array.isArray(advertisements) && advertisements.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(advertisements) && advertisements.map((ad: Advertisement) => (
                <TableRow key={ad.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {ad.filePath && (
                        <img
                          src={ad.filePath}
                          alt={ad.title}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {ad.title}
                        </div>
                        {ad.filePath && (
                          <div className="text-xs text-slate-500 flex items-center">
                            {ad.fileType === 'gif' ? '🎬 GIF File' : '🖼️ Image File'}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ad.link ? (
                      <a 
                        href={ad.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline max-w-[150px] block truncate"
                        title={ad.link}
                      >
                        {ad.link}
                      </a>
                    ) : (
                      <span className="text-slate-400 text-sm">No link</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ad.position === 'left' ? 'default' : 'secondary'}>
                      {ad.position}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ad.isActive ? 'default' : 'destructive'}>
                      {ad.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{ad.priority}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Start: {ad.startDate ? formatDate(ad.startDate) : "No limit"}</div>
                      <div>End: {ad.endDate ? formatDate(ad.endDate) : "No limit"}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div><Eye className="w-3 h-3 inline mr-1" />{ad.impressionCount || 0}</div>
                      <div>👆 {ad.clickCount || 0}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(ad)}
                        data-testid={`button-edit-${ad.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ad.id)}
                        data-testid={`button-delete-${ad.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center text-slate-600 dark:text-slate-300">
            No advertisements found. Create your first advertisement to get started!
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog || !!editingAd} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingAd(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAd ? "Edit Advertisement" : "Create New Advertisement"}
            </DialogTitle>
            <DialogDescription>
              Configure your advertisement details and targeting options.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Advertisement title"
                data-testid="input-ad-title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Advertisement description"
                rows={3}
                data-testid="textarea-ad-description"
              />
            </div>

            <div>
              <Label htmlFor="link">Link URL</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com (where to redirect when ad is clicked)"
                data-testid="input-ad-link"
              />
            </div>

            <div>
              <Label>Advertisement File</Label>
              <AdvertisementUploader
                onUploadSuccess={(filePath, fileType) => {
                  setFormData({ ...formData, filePath, fileType });
                  toast({ title: "File uploaded successfully!" });
                }}
                currentFile={formData.filePath}
              />
              <p className="text-xs text-slate-500 mt-1">
                Upload an image or GIF file. Recommended sizes: 300x250 or 300x600 pixels.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value: "left" | "right") => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger data-testid="select-ad-position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left Sidebar</SelectItem>
                    <SelectItem value="right">Right Sidebar</SelectItem>
                  </SelectContent>
                </Select>
                {/* Position limit warning */}
                {formData.isActive && isPositionAtLimit(formData.position) && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ {formData.position} position is at maximum capacity ({formData.position === 'left' ? counts.left.active : counts.right.active}/3)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  data-testid="input-ad-priority"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ""}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value || null })}
                  data-testid="input-ad-start-date"
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ""}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                  data-testid="input-ad-end-date"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300"
                data-testid="checkbox-ad-active"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingAd(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingAd ? handleUpdate : handleCreate}
              disabled={
                createAdMutation.isPending || 
                updateAdMutation.isPending || 
                (!editingAd && !canCreateForPosition())
              }
              className="bg-coral-600 hover:bg-coral-700"
              data-testid="button-save-advertisement"
            >
              {editingAd ? "Update" : "Create"} Advertisement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}