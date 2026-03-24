"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  onUpload: (url: string) => void;
  onRemove: (url: string) => void;
  existingPhotos?: string[];
}

export default function PhotoUpload({ onUpload, onRemove, existingPhotos = [] }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const MAX_SIZE_MB = 10;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      // ── Validate file type ───────────────────────────────────────────────
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Only JPEG, PNG, WebP, and HEIC images are allowed.',
          variant: 'destructive',
        });
        return;
      }

      // ── Validate file size ───────────────────────────────────────────────
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: `Photos must be under ${MAX_SIZE_MB} MB.`,
          variant: 'destructive',
        });
        return;
      }

      // ── Scope file to a per-session folder to avoid collisions ───────────
      const fileExt = file.name.split('.').pop() || 'jpg';
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('job-photos')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      toast({
        title: 'Photo Uploaded',
        description: 'Site image has been attached to the job.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset the input so the same file can be re-selected if needed
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {existingPhotos.map((url, index) => (
          <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
            <img src={url} alt={`Site photo ${index + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => onRemove(url)}
              className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <label className={`w-24 h-24 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all cursor-pointer ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
          {uploading ? (
            <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
          ) : (
            <>
              <Camera className="w-6 h-6 text-slate-400" />
              <span className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Add Photo</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
