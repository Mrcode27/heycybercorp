"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";
import Icon from "../Icon";

interface UploadTicket {
  endpoint: string;
  videoId: string;
  libraryId: string;
  expirationTime: number;
  signature: string;
  embedUrl: string;
}

interface TicketResponse {
  upload?: UploadTicket;
  error?: string;
}

export default function BunnyVideoUploader({ title, onUploaded }: {
  title: string;
  onUploaded: (embedUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<tus.Upload | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    setError("");
    setProgress(0);
    try {
      const response = await fetch("/api/bunny/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || file.name.replace(/\.[^.]+$/, "") }),
      });
      const payload = (await response.json()) as TicketResponse;
      if (!response.ok || !payload.upload) {
        throw new Error(payload.error || "Unable to prepare the Bunny Stream upload.");
      }

      const ticket = payload.upload;
      const upload = new tus.Upload(file, {
        endpoint: ticket.endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
        headers: {
          AuthorizationSignature: ticket.signature,
          AuthorizationExpire: String(ticket.expirationTime),
          VideoId: ticket.videoId,
          LibraryId: ticket.libraryId,
        },
        metadata: {
          filetype: file.type || "application/octet-stream",
          title: title.trim() || file.name,
        },
        removeFingerprintOnSuccess: true,
        onError(uploadError) {
          setError(uploadError.message || "Bunny Stream upload failed.");
          setProgress(null);
          uploadRef.current = null;
        },
        onProgress(bytesUploaded, bytesTotal) {
          setProgress(bytesTotal ? Math.round((bytesUploaded / bytesTotal) * 100) : 0);
        },
        onSuccess() {
          onUploaded(ticket.embedUrl);
          setProgress(null);
          uploadRef.current = null;
          if (inputRef.current) inputRef.current.value = "";
        },
      });
      uploadRef.current = upload;
      const previous = await upload.findPreviousUploads();
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Bunny Stream upload failed.");
      setProgress(null);
      uploadRef.current = null;
    }
  }

  function cancel() {
    uploadRef.current?.abort(true).catch(() => undefined);
    uploadRef.current = null;
    setProgress(null);
  }

  return (
    <div className="mt-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary/40 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
          <Icon name="cloud_upload" className="text-lg" />
          {progress === null ? "Televerser vers Bunny" : "Televersement en cours"}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={progress !== null}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
        </label>
        {progress !== null && (
          <>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-variant" aria-label={`Upload ${progress}%`}>
              <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-code-sm text-xs tabular-nums text-on-surface-variant">{progress}%</span>
            <button type="button" onClick={cancel} className="text-xs text-error hover:underline">Annuler</button>
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-on-surface-variant">
        Envoi direct et reprenable vers Bunny Stream. L&apos;URL du lecteur sera remplie automatiquement.
      </p>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
