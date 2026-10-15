'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, AlertCircle, Check, ShieldCheck, FlipHorizontal } from 'lucide-react';

interface SelfieCaptureProps {
  onCapture: (dataUrl: string) => void;
  photoUrl: string | null;
  onRetake: () => void;
}

export default function SelfieCapture({ onCapture, photoUrl, onRetake }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFlashing, setIsFlashing] = useState(false);

  // Start live webcam
  const startCamera = async () => {
    setIsLoadingCamera(true);
    setCameraError(null);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera langsung.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      console.warn('Camera access issue:', err);
      const message =
        err instanceof Error ? err.message : 'Kamera tidak dapat diakses atau izin ditolak.';
      setCameraError(
        `${message} Pastikan izin kamera telah diizinkan pada peramban ponsel/laptop Anda untuk mengambil foto selfie langsung.`
      );
    } finally {
      setIsLoadingCamera(false);
    }
  };

  useEffect(() => {
    if (!photoUrl) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, photoUrl]);

  // Capture snapshot from video canvas with flash effect
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger visual shutter flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front camera for natural selfie experience
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // Stop camera stream to free resources
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    onCapture(dataUrl);
  };

  // If photo already captured, show high-end preview
  if (photoUrl) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-square max-w-[340px] sm:max-w-sm mx-auto rounded-3xl overflow-hidden border-2 border-[#146B50] shadow-2xl bg-black group">
          <img
            src={photoUrl}
            alt="Selfie Absensi"
            className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
          />
          {/* Subtle gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

          {/* Status Badge */}
          <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg border border-emerald-400/30">
            <Check className="w-3.5 h-3.5 text-[#D6A84F]" />
            <span>Foto Tervalidasi</span>
          </div>

          <div className="absolute bottom-3 left-4 right-4 text-center">
            <span className="text-[11px] text-emerald-200/90 font-medium tracking-wide bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
              Wajah Terdeteksi Jelas
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onRetake}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4 text-[#146B50]" />
            <span>Ambil Ulang Foto</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Live Video Camera Viewfinder with Biometric Scanner Aesthetics */}
      <div className="relative aspect-square max-w-[340px] sm:max-w-sm mx-auto rounded-3xl overflow-hidden border-2 border-stone-200 dark:border-stone-800 bg-[#06120E] shadow-2xl flex items-center justify-center">
        {/* Shutter Flash Animation */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />
        )}

        {isLoadingCamera && (
          <div className="text-emerald-400 text-center p-6 space-y-3 z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 mx-auto flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-[#D6A84F]" />
            </div>
            <p className="text-xs font-semibold tracking-wide text-emerald-300">Menyiapkan sensor kamera...</p>
          </div>
        )}

        {cameraError ? (
          <div className="p-6 text-center text-white z-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/30 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>
            <p className="text-sm font-bold">Kamera Belum Terhubung</p>
            <p className="text-xs text-stone-300 leading-relaxed max-w-xs mx-auto">{cameraError}</p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 bg-gradient-to-r from-[#146B50] to-[#0B3D2E] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Coba Hubungkan Ulang
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Viewfinder HUD Corner Brackets */}
            <div className="absolute inset-4 pointer-events-none z-10">
              {/* Top Left */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#D6A84F] rounded-tl-lg" />
              {/* Top Right */}
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#D6A84F] rounded-tr-lg" />
              {/* Bottom Left */}
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#D6A84F] rounded-bl-lg" />
              {/* Bottom Right */}
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#D6A84F] rounded-br-lg" />
            </div>

            {/* Face Alignment Oval with Subtle Pulse */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
              <div className="relative w-48 h-64 border-2 border-dashed border-[#D6A84F]/70 rounded-[50%] flex items-center justify-center shadow-[0_0_30px_rgba(214,168,79,0.15)]">
                {/* Horizontal guide line */}
                <div className="absolute inset-x-4 top-1/2 h-px bg-[#D6A84F]/30" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D6A84F] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#D6A84F]/30">
                  Arahkan Wajah
                </span>
              </div>
            </div>

            {/* Live Camera Status Badge */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-emerald-300 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-white/10 z-20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>KAMERA AKTIF</span>
            </div>

            {/* Flip Camera Switch Button */}
            <button
              type="button"
              onClick={() =>
                setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
              }
              className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-[#D6A84F] hover:bg-black/80 transition border border-white/10 z-20 cursor-pointer active:scale-90"
              title="Ganti kamera depan / belakang"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Capture Action Button - High End Shutter Button */}
      {!cameraError && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={takeSnapshot}
            className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-[#146B50] via-[#1E8A68] to-[#D6A84F] p-1 shadow-xl shadow-emerald-950/25 transition active:scale-90 cursor-pointer"
          >
            {/* Outer animated ring */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-[#D6A84F] opacity-40 blur-xs group-hover:opacity-75 transition" />
            <div className="relative w-full h-full rounded-full bg-white dark:bg-stone-900 flex items-center justify-center border-2 border-transparent group-hover:border-[#D6A84F]/40 transition">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#146B50] to-[#0B3D2E] flex items-center justify-center text-white shadow-inner">
                <Camera className="w-6 h-6 text-[#D6A84F]" />
              </div>
            </div>
          </button>
          <div className="text-center">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
              Ketuk untuk Ambil Foto Selfie
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              Tatap kamera langsung dengan pencahayaan memadai
            </span>
          </div>
        </div>
      )}

      {/* Security notice: Live selfie only */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-600 dark:text-stone-400 bg-stone-100/80 dark:bg-[#142820]/60 px-4 py-2 rounded-2xl border border-stone-200/80 dark:border-[#1C3A2E] max-w-sm mx-auto text-center shadow-xs">
        <ShieldCheck className="w-4 h-4 text-[#0D7B5F] dark:text-[#10B981] shrink-0" />
        <span>Wajib kamera langsung (Selfie Real-Time). Unggah file dari galeri dinonaktifkan.</span>
      </div>
    </div>
  );
}
