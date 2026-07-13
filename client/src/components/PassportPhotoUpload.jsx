import React, { useRef, useState } from 'react';
import { Camera, X, Loader2, AlertCircle } from 'lucide-react';
import { compressImage } from '../utils/cloudinaryUpload';

const MAX_RAW_BYTES = 15 * 1024 * 1024; // reject absurdly large files before even trying to process them

/**
 * Captures a passport photo, compresses it client-side, and hands the
 * resulting Blob (plus a local preview URL) up to the parent via
 * onPhotoReady. This component does NOT upload anywhere — FormManager
 * decides when/whether to push it to Cloudinary (immediately if
 * online, or hold it for the offline queue), since that decision
 * depends on connectivity state this component doesn't know about.
 */
export default function PassportPhotoUpload({ onPhotoReady, disabled = false }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file after a retake
    if (!file) return;

    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG or PNG).');
      return;
    }
    if (file.size > MAX_RAW_BYTES) {
      setError('That photo is too large. Please choose a smaller file.');
      return;
    }

    setProcessing(true);
    try {
      const blob = await compressImage(file, { maxDimension: 800, quality: 0.8 });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const newPreviewUrl = URL.createObjectURL(blob);
      setPreviewUrl(newPreviewUrl);
      onPhotoReady(blob, newPreviewUrl);
    } catch (err) {
      setError(err.message || 'Could not process that photo. Please try another.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError('');
    onPhotoReady(null, null);
  };

  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-puc-ink/70 mb-1">
        Passport Photograph *
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || processing}
        className="hidden"
      />

      {previewUrl ? (
        <div className="flex items-center gap-4">
          <img
            src={previewUrl}
            alt="Passport photograph preview"
            className="h-28 w-24 object-cover rounded-md border border-puc-paper-line"
          />
          <div className="space-y-2">
            <p className="text-xs text-puc-ink/70">Photo ready.</p>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || processing}
              className="flex items-center gap-1.5 text-xs font-semibold text-puc-error hover:underline disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Remove and retake
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || processing}
          className="flex flex-col items-center justify-center gap-2 h-28 w-24 rounded-md border-2 border-dashed border-puc-paper-line text-puc-ink/50 hover:border-puc-green hover:text-puc-green transition-colors disabled:opacity-50"
        >
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wide px-1 text-center">
            {processing ? 'Processing…' : 'Add Photo'}
          </span>
        </button>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-puc-error mt-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}

      <p className="text-[11px] text-puc-ink/50 mt-1.5">
        A clear, front-facing photo against a plain background, similar to a passport photo.
      </p>
    </div>
  );
}