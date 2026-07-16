// import React, { useRef, useState } from 'react';
// import { Camera, X, Loader2, AlertCircle } from 'lucide-react';
// import { compressImage } from '../utils/cloudinaryUpload';

// const MAX_RAW_BYTES = 15 * 1024 * 1024; // reject absurdly large files before even trying to process them

// /**
//  * Captures a passport photo, compresses it client-side, and hands the
//  * resulting Blob (plus a local preview URL) up to the parent via
//  * onPhotoReady. This component does NOT upload anywhere — FormManager
//  * decides when/whether to push it to Cloudinary (immediately if
//  * online, or hold it for the offline queue), since that decision
//  * depends on connectivity state this component doesn't know about.
//  */
// export default function PassportPhotoUpload({ onPhotoReady, disabled = false }) {
//   const inputRef = useRef(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState('');

//   const handleFileSelect = async (e) => {
//     const file = e.target.files?.[0];
//     e.target.value = ''; // allow re-selecting the same file after a retake
//     if (!file) return;

//     setError('');

//     if (!file.type.startsWith('image/')) {
//       setError('Please choose an image file (JPG or PNG).');
//       return;
//     }
//     if (file.size > MAX_RAW_BYTES) {
//       setError('That photo is too large. Please choose a smaller file.');
//       return;
//     }

//     setProcessing(true);
//     try {
//       const blob = await compressImage(file, { maxDimension: 800, quality: 0.8 });
//       if (previewUrl) URL.revokeObjectURL(previewUrl);
//       const newPreviewUrl = URL.createObjectURL(blob);
//       setPreviewUrl(newPreviewUrl);
//       onPhotoReady(blob, newPreviewUrl);
//     } catch (err) {
//       setError(err.message || 'Could not process that photo. Please try another.');
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleRemove = () => {
//     if (previewUrl) URL.revokeObjectURL(previewUrl);
//     setPreviewUrl(null);
//     setError('');
//     onPhotoReady(null, null);
//   };

//   return (
//     <div>
//       <label className="block text-[11px] font-semibold uppercase tracking-wide text-puc-ink/70 mb-1">
//         Passport Photograph *
//       </label>

//       <input
//         ref={inputRef}
//         type="file"
//         accept="image/*"
//         onChange={handleFileSelect}
//         disabled={disabled || processing}
//         className="hidden"
//       />

//       {previewUrl ? (
//         <div className="flex items-center gap-4">
//           <img
//             src={previewUrl}
//             alt="Passport photograph preview"
//             className="h-28 w-24 object-cover rounded-md border border-puc-paper-line"
//           />
//           <div className="space-y-2">
//             <p className="text-xs text-puc-ink/70">Photo ready.</p>
//             <button
//               type="button"
//               onClick={handleRemove}
//               disabled={disabled || processing}
//               className="flex items-center gap-1.5 text-xs font-semibold text-puc-error hover:underline disabled:opacity-50"
//             >
//               <X className="h-3.5 w-3.5" /> Remove and retake
//             </button>
//           </div>
//         </div>
//       ) : (
//         <button
//           type="button"
//           onClick={() => inputRef.current?.click()}
//           disabled={disabled || processing}
//           className="flex flex-col items-center justify-center gap-2 h-28 w-24 rounded-md border-2 border-dashed border-puc-paper-line text-puc-ink/50 hover:border-puc-green hover:text-puc-green transition-colors disabled:opacity-50"
//         >
//           {processing ? (
//             <Loader2 className="h-5 w-5 animate-spin" />
//           ) : (
//             <Camera className="h-5 w-5" />
//           )}
//           <span className="text-[10px] font-semibold uppercase tracking-wide px-1 text-center">
//             {processing ? 'Processing…' : 'Add Photo'}
//           </span>
//         </button>
//       )}

//       {error && (
//         <p className="flex items-center gap-1.5 text-xs font-medium text-puc-error mt-2">
//           <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
//         </p>
//       )}

//       <p className="text-[11px] text-puc-ink/50 mt-1.5">
//         A clear, front-facing photo against a plain background, similar to a passport photo.
//       </p>
//     </div>
//   );
// }




















import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Loader2, AlertCircle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { compressImage } from '../utils/cloudinaryUpload';

const MAX_RAW_BYTES = 15 * 1024 * 1024; // reject absurdly large files before even trying to process them

// ---------------------------------------------------------------------------
// Photo quality assumptions — no official spec was provided for these, so
// these are reasonable passport-photo defaults. Tighten/loosen if INEC or
// your party's guidelines specify exact numbers.
// ---------------------------------------------------------------------------
const MIN_WIDTH = 400;
const MIN_HEIGHT = 500;
const MIN_ASPECT_RATIO = 1.15; // height / width — rejects landscape or near-square selfie crops
const MAX_ASPECT_RATIO = 1.6;  // rejects very tall/narrow crops

const MIN_FACE_HEIGHT_RATIO = 0.15; // face bounding box must be at least this fraction of image height
const MAX_FACE_HEIGHT_RATIO = 0.75; // ...and no more than this (rejects extreme close-ups)
const MAX_CENTER_OFFSET_RATIO = 0.2; // face center must be within this fraction of image width from center

// Models must be self-hosted here (not loaded from a CDN) so face detection
// still works when the app is used offline — see setup note above.
const MODEL_URL = '/models';

// Module-scoped (not component state) so the model loads once per page
// load, not once per remount. FormManager remounts this component via a
// `key` bump after every successful submission — without this being
// outside the component, every single submission would re-fetch the model.
let modelLoadPromise = null;
function ensureModelsLoaded() {
  if (!modelLoadPromise) {
    modelLoadPromise = faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  }
  return modelLoadPromise;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image file.'));
    };
    img.src = url;
  });
}

/**
 * Runs quality, framing, and face-count/position checks on the raw file
 * before it's ever compressed or handed to the parent. Throws with a
 * user-facing message on the first failed check.
 */
async function validatePhoto(file) {
  const { img, url, width, height } = await loadImage(file);
  try {
    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      throw new Error(`Photo is too small — use an image at least ${MIN_WIDTH}×${MIN_HEIGHT}px.`);
    }

    const ratio = height / width;
    if (ratio < MIN_ASPECT_RATIO || ratio > MAX_ASPECT_RATIO) {
      throw new Error('Use an upright, passport-style photo — not a landscape or heavily cropped square image.');
    }

    await ensureModelsLoaded();
    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());

    if (detections.length === 0) {
      throw new Error('No face detected. Make sure your face is clearly visible and well-lit.');
    }
    if (detections.length > 1) {
      throw new Error('More than one face detected. Please submit a photo of yourself alone.');
    }

    const { box } = detections[0];
    const faceHeightRatio = box.height / height;
    if (faceHeightRatio < MIN_FACE_HEIGHT_RATIO) {
      throw new Error('Your face is too small in the frame — move closer to the camera and retake.');
    }
    if (faceHeightRatio > MAX_FACE_HEIGHT_RATIO) {
      throw new Error('Your face is too close to the camera — move back slightly and retake.');
    }

    const faceCenterX = box.x + box.width / 2;
    const offsetRatio = Math.abs(faceCenterX - width / 2) / width;
    if (offsetRatio > MAX_CENTER_OFFSET_RATIO) {
      throw new Error('Center your face in the frame and retake the photo.');
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Captures a passport photo, validates it (quality, framing, single
 * centered face), compresses it client-side, and hands the resulting Blob
 * up to the parent via onPhotoReady. This component does NOT upload
 * anywhere — FormManager decides when/whether to push it to Cloudinary,
 * since that depends on connectivity state this component doesn't know
 * about.
 */
export default function PassportPhotoUpload({ onPhotoReady, disabled = false }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'compressing'
  const [error, setError] = useState('');

  // Tracks the latest previewUrl so the unmount-only cleanup effect below
  // can revoke whatever's current without re-running on every change (which
  // would fight with the explicit revokes already done in
  // handleFileSelect/handleRemove). This is what was leaking before: when
  // FormManager remounts this component via `key` after a submit, the old
  // instance unmounts with no cleanup, so its blob URL never got released.
  const previewUrlRef = useRef(null);
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const processing = status !== 'idle';

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

    setStatus('checking');
    try {
      await validatePhoto(file);

      setStatus('compressing');
      const blob = await compressImage(file, { maxDimension: 800, quality: 0.8 });

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const newPreviewUrl = URL.createObjectURL(blob);
      setPreviewUrl(newPreviewUrl);
      onPhotoReady(blob, newPreviewUrl);
    } catch (err) {
      setError(err.message || 'Could not process that photo. Please try another.');
    } finally {
      setStatus('idle');
    }
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError('');
    onPhotoReady(null, null);
  };

  const statusLabel = status === 'checking' ? 'Checking photo…' : status === 'compressing' ? 'Compressing…' : 'Add Photo';

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
            {statusLabel}
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