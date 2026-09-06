"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A file input that previews the picked image(s) locally. Deliberately does
 * NOT upload anything itself — it just needs to be inside a <form> so the
 * browser's native FormData (multipart/form-data submit) includes the
 * selected File(s) under `name`; the server route does the actual upload.
 */
export function ImageUploadField({
  name,
  multiple = false,
  label = "Photo",
  existingImageUrl,
  required,
  className,
}: {
  name: string;
  multiple?: boolean;
  label?: string;
  existingImageUrl?: string | null;
  required?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>(existingImageUrl ? [existingImageUrl] : []);
  const [hasNewFiles, setHasNewFiles] = useState(false);

  function handleChange() {
    const files = inputRef.current?.files;
    if (!files || files.length === 0) return;
    setPreviews(Array.from(files).map((file) => URL.createObjectURL(file)));
    setHasNewFiles(true);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setPreviews(existingImageUrl ? [existingImageUrl] : []);
    setHasNewFiles(false);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium leading-none">{label}</span>

      <div className="flex flex-wrap gap-2">
        {previews.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element -- small local/remote preview thumbnail, not worth next/image config here
          <img
            key={`${src}-${index}`}
            src={src}
            alt=""
            className="size-20 rounded-lg border border-border object-cover"
          />
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted"
        >
          <ImagePlus className="size-5" />
          <span className="text-[10px]">{multiple ? "Add photos" : "Upload"}</span>
        </button>

        {hasNewFiles && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear selection"
            className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="size-5" />
            <span className="text-[10px]">Clear</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        multiple={multiple}
        required={required && previews.length === 0}
        onChange={handleChange}
        className="sr-only"
      />
    </div>
  );
}
