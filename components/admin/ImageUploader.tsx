"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, Star, Loader2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadedImage } from "@/app/admin/actions";

interface Props {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: "uploading" | "error";
  error?: string;
}

export default function ImageUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [draggingOver, setDraggingOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;

      const fileArray = Array.from(files);
      const newUploads: UploadingFile[] = fileArray.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        progress: "uploading",
      }));
      setUploading((prev) => [...prev, ...newUploads]);

      // Fixed-size array indexed by i — each slot filled as its upload completes.
      // Avoids the stale-closure overwrite when multiple uploads run in parallel.
      const results: (UploadedImage | null)[] = new Array(fileArray.length).fill(null);

      await Promise.all(
        fileArray.map(async (file, i) => {
          const uploadId = newUploads[i].id;
          try {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch("/api/admin/upload", { method: "POST", body: form });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error ?? "Upload failed");

            results[i] = { url: data.url, publicId: data.publicId, isPrimary: false };

            // Merge existing images with all completed slots so far
            const completed = results.filter(Boolean) as UploadedImage[];
            const merged = [...value, ...completed];
            // Ensure first image is primary when there were no prior images
            if (value.length === 0 && merged.length > 0) {
              merged[0] = { ...merged[0], isPrimary: true };
            }
            onChange(merged);

            setUploading((prev) => prev.filter((u) => u.id !== uploadId));
          } catch (err: any) {
            setUploading((prev) =>
              prev.map((u) =>
                u.id === uploadId ? { ...u, progress: "error", error: err.message } : u
              )
            );
          }
        })
      );
    },
    [value, onChange]
  );

  const removeImage = async (index: number) => {
    const img = value[index];
    const next = value.filter((_, i) => i !== index);
    // Ensure there's always a primary image
    if (img.isPrimary && next.length > 0) next[0] = { ...next[0], isPrimary: true };
    onChange(next);

    // Delete from Cloudinary in background
    fetch("/api/admin/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: img.publicId }),
    }).catch(console.error);
  };

  const setPrimary = (index: number) => {
    onChange(value.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const moveImage = (from: number, to: number) => {
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDraggingOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "w-full border-2 border-dashed rounded py-8 flex flex-col items-center gap-2 transition-colors",
          draggingOver
            ? "border-forest bg-forest/5"
            : "border-stone hover:border-forest/40 hover:bg-forest/[0.02]"
        )}
      >
        <Upload size={20} className="text-muted" strokeWidth={1.5} />
        <p className="text-sm text-muted">
          Drop images here or <span className="text-forest underline underline-offset-2">browse</span>
        </p>
        <p className="text-xs text-muted/60">JPG, PNG, WEBP · max 10 MB each</p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Preview grid */}
      {(value.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((img, i) => (
            <div
              key={img.publicId}
              className="relative group aspect-square bg-stone-light rounded overflow-hidden"
            >
              <img
                src={img.url}
                alt={`Product image ${i + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Primary badge */}
              {img.isPrimary && (
                <span className="absolute top-1 left-1 bg-ink text-citrine text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-sm font-medium">
                  Primary
                </span>
              )}

              {/* Hover controls */}
              <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    title="Set as primary"
                    className="p-1.5 bg-cream/95 rounded hover:bg-cream transition-colors"
                  >
                    <Star size={12} className="text-ink" />
                  </button>
                )}
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, i - 1)}
                    title="Move left"
                    className="p-1.5 bg-cream/95 rounded hover:bg-cream transition-colors text-xs font-medium text-ink"
                  >
                    ←
                  </button>
                )}
                {i < value.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, i + 1)}
                    title="Move right"
                    className="p-1.5 bg-cream/95 rounded hover:bg-cream transition-colors text-xs font-medium text-ink"
                  >
                    →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  title="Remove"
                  className="p-1.5 bg-cream/95 rounded hover:bg-danger/90 hover:text-cream transition-colors"
                >
                  <X size={12} className="text-ink group-hover:text-inherit" />
                </button>
              </div>
            </div>
          ))}

          {/* Uploading placeholders */}
          {uploading.map((u) => (
            <div
              key={u.id}
              className="aspect-square bg-stone-light rounded flex flex-col items-center justify-center gap-1.5 px-2"
            >
              {u.progress === "uploading" ? (
                <Loader2 size={18} className="text-muted animate-spin" />
              ) : (
                <X size={18} className="text-danger" />
              )}
              <p className="text-[10px] text-muted text-center truncate w-full">
                {u.progress === "error" ? u.error : u.name}
              </p>
              {u.progress === "error" && (
                <button
                  type="button"
                  onClick={() => setUploading((prev) => prev.filter((x) => x.id !== u.id))}
                  className="text-[10px] text-danger underline"
                >
                  Dismiss
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
