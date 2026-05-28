'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadSimpleIcon, FileIcon, XIcon } from '@phosphor-icons/react';

interface FileUploadFieldProps {
  label: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  required?: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
  error?: string;
}

export function FileUploadField({
  label,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxSizeMB = 10,
  multiple = false,
  required = false,
  files,
  onFilesChange,
  error,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setFileError(`File must be smaller than ${maxSizeMB}MB`);
        return false;
      }
      setFileError(null);
      return true;
    },
    [maxSizeMB],
  );

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      const validFiles = Array.from(newFiles).filter(validateFile);
      if (multiple) {
        onFilesChange([...files, ...validFiles]);
      } else {
        onFilesChange(validFiles.slice(0, 1));
      }
    },
    [files, multiple, onFilesChange, validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange],
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-input hover:border-primary/50 hover:bg-muted/30'
        } ${error || fileError ? 'border-destructive' : ''}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <UploadSimpleIcon size={24} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">Upload file</span> or drag here
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          aria-label={label}
        />
      </div>

      {(error || fileError) && (
        <p role="alert" className="text-sm text-destructive">
          {error || fileError}
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
            >
              <FileIcon size={16} className="text-muted-foreground shrink-0" />
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="shrink-0 rounded p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${file.name}`}
              >
                <XIcon size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
