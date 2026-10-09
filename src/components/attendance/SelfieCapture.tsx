'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, AlertCircle, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { SAMPLE_SELFIES } from '@/lib/constants';

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
        `${message} Anda dapat menggunakan kamera simulasi/sampel foto santri untuk pengujian.`
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

  // Capture snapshot from video canvas
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

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

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Stop camera stream to free resources
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    onCapture(dataUrl);
  };

  // Fallback simulator: Pick high-quality sample selfie
  const pickSampleSelfie = (sampleUrl: string) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    onCapture(sampleUrl);
  };

  // If photo already captured, show preview
  if (photoUrl) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden border-4 border-emerald-600 shadow-xl bg-black">
          <img
            src={photoUrl}
            alt="Selfie Absensi"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 bg-emerald-600/90 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md">
            <Check className="w-3.5 h-3.5" />
            Foto Terambil
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onRetake}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Ambil Ulang Foto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Video Camera Viewfinder */}
      <div className="relative aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden border-2 border-stone-300 bg-stone-900 shadow-xl flex items-center justify-center">
        {isLoadingCamera && (
          <div className="text-emerald-400 text-center p-4">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#D6A84F]" />
            <p className="text-xs">Menyiapkan kamera...</p>
          </div>
        )}

        {cameraError ? (
          <div className="p-6 text-center text-white">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-bold mb-1">Akses Kamera Terkendala</p>
            <p className="text-xs text-stone-300 mb-4">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
            >
              Coba Hubungkan Lagi
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

            {/* Face Alignment Guideline Oval */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-56 h-72 border-2 border-dashed border-[#D6A84F] rounded-[50%] opacity-85 shadow-[0_0_20px_rgba(214,168,79,0.3)] flex items-center justify-center">
                <span className="text-[11px] text-white/90 bg-black/60 px-2 py-0.5 rounded-full font-medium tracking-wide">
                  Posisikan Wajah di Sini
                </span>
              </div>
            </div>

            {/* Camera Overlay Status */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Camera
            </div>

            {/* Flip Camera Button */}
            <button
              type="button"
              onClick={() =>
                setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
              }
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              title="Ganti kamera depan / belakang"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Capture Action Button */}
      {!cameraError && (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={takeSnapshot}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#146B50] to-[#0B3D2E] text-white hover:from-[#198262] hover:to-[#0e4b39] text-sm font-bold shadow-lg shadow-emerald-950/20 active:scale-95 transition cursor-pointer border border-[#D6A84F]/40"
          >
            <Camera className="w-5 h-5 text-[#D6A84F]" />
            Ambil Foto Selfie
          </button>
          <p className="text-[11px] text-stone-500 text-center">
            Foto diambil langsung untuk validasi kehadiran
          </p>
        </div>
      )}

      {/* Simulator Sample Selfies (Very helpful for desktop testing or if webcam unavailable) */}
      <div className="bg-stone-100 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D6A84F]" />
            Simulasi Foto Santri (Untuk Pengujian)
          </span>
          <span className="text-[10px] text-stone-500">Pilih salah satu</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SAMPLE_SELFIES.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pickSampleSelfie(url)}
              className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-[#146B50] focus:border-[#146B50] transition group cursor-pointer"
            >
              <img
                src={url}
                alt={`Sampel ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-white opacity-80" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
