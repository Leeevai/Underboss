import { useState } from "react";
import { MapPin, Clock, DollarSign, Upload, X, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

const CATEGORIES = [
  "Gardening",
  "Cleaning",
  "Moving",
  "Pets",
  "Painting",
  "Repairs",
  "Delivery",
  "Other",
];

export function PostPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    duration: "",
    payment: "",
    category: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (file.type.startsWith("video/")) {
      return <Video className="h-4 w-4" />;
    }
    return <Upload className="h-4 w-4" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Post job:", formData, "Files:", uploadedFiles);
    // Here the job posting would be handled
    alert("Job posted successfully!");
    setFormData({
      title: "",
      description: "",
      location: "",
      duration: "",
      payment: "",
      category: "",
    });
    setUploadedFiles([]);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Post a job</h1>
        <p className="text-muted-foreground">
          Post a temporary job and find help quickly
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job title</Label>
              <Input
                id="title"
                placeholder="E.g: Mow the lawn"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the job you need in detail..."
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                </Label>
                <Input
                  id="location"
                  placeholder="E.g: Downtown Madrid"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Estimated duration
                  </div>
                </Label>
                <Input
                  id="duration"
                  placeholder="E.g: 2-3 hours"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment
                  </div>
                </Label>
                <Input
                  id="payment"
                  placeholder="E.g: €30"
                  value={formData.payment}
                  onChange={(e) =>
                    setFormData({ ...formData, payment: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="files">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Images & Videos
                </div>
              </Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload or drag and drop
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("files")?.click()}
                >
                  Choose files
                </Button>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                        {file.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Video className="h-8 w-8 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground text-center px-2">
                              {file.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Post job
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormData({
                    title: "",
                    description: "",
                    location: "",
                    duration: "",
                    payment: "",
                    category: "",
                  })
                }
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}