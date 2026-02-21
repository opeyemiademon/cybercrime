"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Video, Mic, RotateCcw, X, StopCircle, Play, Pause, Upload } from 'lucide-react';

interface MediaCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  captureType: 'photo' | 'video' | 'audio';
  title?: string;
}

const MediaCaptureModal: React.FC<MediaCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  captureType,
  title
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getTitle = () => {
    if (title) return title;
    switch (captureType) {
      case 'photo': return 'Capture Photo Evidence';
      case 'video': return 'Record Video Evidence';
      case 'audio': return 'Record Audio Evidence';
      default: return 'Capture Evidence';
    }
  };

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initializeMedia = useCallback(
    async (mode: 'user' | 'environment' = facingMode) => {
      if (typeof window === 'undefined') return;

      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        setError('Media capture requires a secure (https) connection or localhost.');
        setIsInitializing(false);
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Media access is not supported on this browser.');
        setIsInitializing(false);
        return;
      }

      setIsInitializing(true);
      setError(null);

      let constraints: MediaStreamConstraints;

      if (captureType === 'audio') {
        constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          },
          video: false
        };
      } else {
        // Photo or Video
        constraints = {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: captureType === 'video'
        };
      }

      stopStream();

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current && captureType !== 'audio') {
          videoRef.current.srcObject = mediaStream;
          await new Promise(resolve => setTimeout(resolve, 100));
          await videoRef.current.play();
        }

        setStream(mediaStream);
        setFacingMode(mode);
      } catch (err: any) {
        setError(`Unable to access ${captureType === 'audio' ? 'microphone' : 'camera'}. Please grant permission.`);
      } finally {
        setIsInitializing(false);
      }
    },
    [captureType, facingMode, stopStream]
  );

  useEffect(() => {
    if (isOpen) {
      initializeMedia();
    } else {
      stopStream();
      stopTimer();
      setCapturedImage(null);
      setRecordedVideo(null);
      setRecordedAudio(null);
      setError(null);
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
    }

    return () => {
      stopStream();
      stopTimer();
    };
  }, [isOpen, initializeMedia]);

  // Photo capture
  const handlePhotoCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    video.pause();
  };

  // Video/Audio recording
  const handleStartRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    
    const mimeType = captureType === 'video' 
      ? 'video/webm;codecs=vp9' 
      : 'audio/webm;codecs=opus';

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: captureType === 'video' ? 'video/webm' : 'audio/webm' 
        });
        const url = URL.createObjectURL(blob);
        
        if (captureType === 'video') {
          setRecordedVideo(url);
        } else {
          setRecordedAudio(url);
        }
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      startTimer();
    } catch (err) {
      setError('Failed to start recording. Please try again.');
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        startTimer();
      } else {
        mediaRecorderRef.current.pause();
        stopTimer();
      }
      setIsPaused(!isPaused);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
      
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setRecordedVideo(null);
    setRecordedAudio(null);
    setRecordingTime(0);
    
    if (videoRef.current && captureType !== 'audio') {
      videoRef.current.play().catch(() => initializeMedia(facingMode));
    } else {
      initializeMedia(facingMode);
    }
  };

  const toggleCamera = () => {
    const mode = facingMode === 'environment' ? 'user' : 'environment';
    initializeMedia(mode);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes: { [key: string]: string[] } = {
      photo: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg']
    };

    const isValid = validTypes[captureType].some(type => file.type.startsWith(type.split('/')[0]));
    
    if (!isValid) {
      setError(`Please select a valid ${captureType} file.`);
      return;
    }

    // Validate file size - max 100MB
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File exceeds 100MB limit.`);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (captureType === 'photo') {
          setCapturedImage(dataUrl);
        } else if (captureType === 'video') {
          setRecordedVideo(dataUrl);
        } else {
          setRecordedAudio(dataUrl);
        }
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process file');
    }
  };

  const handleUploadFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = async () => {
    const mediaUrl = capturedImage || recordedVideo || recordedAudio;
    if (!mediaUrl) return;

    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      
      let fileName: string;
      let fileType: string;
      
      if (captureType === 'photo') {
        fileName = `photo_evidence_${Date.now()}.jpg`;
        fileType = 'image/jpeg';
      } else if (captureType === 'video') {
        fileName = `video_evidence_${Date.now()}.webm`;
        fileType = 'video/webm';
      } else {
        fileName = `audio_evidence_${Date.now()}.webm`;
        fileType = 'audio/webm';
      }
      
      const file = new File([blob], fileName, { type: fileType });
      
      onCapture(file);
      onClose();
    } catch (err) {
      setError('Failed to process the media. Please try again.');
    }
  };

  if (!isOpen) return null;

  const hasCapture = capturedImage || recordedVideo || recordedAudio;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
      <div className='relative mx-auto flex h-full max-h-[90vh] w-full max-w-5xl flex-col gap-6 overflow-y-auto rounded-3xl bg-white dark:bg-gray-800 px-4 py-6 shadow-2xl md:px-8'>
        <button
          onClick={onClose}
          className='absolute right-4 top-4 z-10 rounded-full bg-gray-100 dark:bg-gray-700 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
        >
          <X className='w-5 h-5 text-gray-600 dark:text-gray-300' />
        </button>

        <header className='relative space-y-3 text-center'>
          <h1 className='text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl'>{getTitle()}</h1>
          <p className='text-sm leading-relaxed text-slate-600 dark:text-gray-400'>
            {captureType === 'photo' && 'Use your camera to capture photo evidence or upload an image.'}
            {captureType === 'video' && 'Record video evidence or upload a video file.'}
            {captureType === 'audio' && 'Record audio evidence or upload an audio file.'}
          </p>
        </header>

        <section className='relative'>
          <div className='rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-lg'>
            <div className='relative overflow-hidden rounded-xl bg-slate-900'>
              <div className='relative aspect-[4/3] w-full'>
                {captureType === 'audio' ? (
                  <div className='absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 text-white'>
                    <Mic className='w-24 h-24 mb-4' />
                    {isRecording && (
                      <div className='flex items-center gap-2'>
                        <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse' />
                        <span className='text-2xl font-mono'>{formatTime(recordingTime)}</span>
                      </div>
                    )}
                    {recordedAudio && (
                      <audio src={recordedAudio} controls className='mt-4 w-full max-w-md' />
                    )}
                  </div>
                ) : (
                  <>
                    {!hasCapture ? (
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className='h-full w-full object-cover'
                      />
                    ) : capturedImage ? (
                      <img
                        src={capturedImage}
                        alt='Captured evidence'
                        className='h-full w-full object-contain'
                      />
                    ) : recordedVideo ? (
                      <video
                        src={recordedVideo}
                        controls
                        className='h-full w-full object-contain'
                      />
                    ) : null}
                  </>
                )}
                
                {isInitializing && (
                  <div className='absolute inset-0 flex items-center justify-center bg-slate-900/70 text-white'>
                    <div className='flex flex-col items-center gap-2 text-sm font-medium'>
                      <span className='animate-pulse'>Initializing {captureType === 'audio' ? 'microphone' : 'camera'}...</span>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className='absolute inset-0 flex items-center justify-center bg-slate-900/70 px-6 text-center text-sm font-medium text-white'>
                    {error}
                  </div>
                )}

                {isRecording && captureType === 'video' && (
                  <div className='absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full'>
                    <div className='w-2 h-2 bg-white rounded-full animate-pulse' />
                    <span className='font-mono text-sm'>{formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className='hidden' />
            </div>

            <div className='mt-4 flex flex-wrap items-center gap-3'>
              {!hasCapture ? (
                <>
                  {captureType === 'photo' && (
                    <>
                      <button
                        onClick={handlePhotoCapture}
                        disabled={isInitializing || !!error || !stream}
                        className='flex items-center gap-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 text-sm shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                      >
                        <Camera className='w-4 h-4' /> Capture Photo
                      </button>
                      <button
                        onClick={toggleCamera}
                        type='button'
                        disabled={isInitializing || !!error || !stream}
                        className='flex items-center gap-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                      >
                        <RotateCcw className='w-4 h-4' /> Switch Camera
                      </button>
                    </>
                  )}
                  
                  {(captureType === 'video' || captureType === 'audio') && (
                    <>
                      {!isRecording ? (
                        <button
                          onClick={handleStartRecording}
                          disabled={isInitializing || !!error || !stream}
                          className='flex items-center gap-2 rounded-lg bg-red-600 text-white px-5 py-2.5 text-sm shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                        >
                          {captureType === 'video' ? <Video className='w-4 h-4' /> : <Mic className='w-4 h-4' />}
                          Start Recording
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handlePauseRecording}
                            className='flex items-center gap-2 rounded-lg bg-yellow-600 text-white px-5 py-2.5 text-sm shadow-lg hover:bg-yellow-700 transition-all'
                          >
                            {isPaused ? <Play className='w-4 h-4' /> : <Pause className='w-4 h-4' />}
                            {isPaused ? 'Resume' : 'Pause'}
                          </button>
                          <button
                            onClick={handleStopRecording}
                            className='flex items-center gap-2 rounded-lg bg-gray-700 text-white px-5 py-2.5 text-sm shadow-lg hover:bg-gray-800 transition-all'
                          >
                            <StopCircle className='w-4 h-4' /> Stop
                          </button>
                        </>
                      )}
                      {captureType === 'video' && !isRecording && (
                        <button
                          onClick={toggleCamera}
                          type='button'
                          disabled={isInitializing || !!error || !stream}
                          className='flex items-center gap-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                        >
                          <RotateCcw className='w-4 h-4' /> Switch Camera
                        </button>
                      )}
                    </>
                  )}
                  
                  <button
                    onClick={handleUploadFileClick}
                    type='button'
                    className='flex items-center gap-2 rounded-lg border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 px-5 py-2.5 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all'
                  >
                    <Upload className='w-4 h-4' /> Upload File
                  </button>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept={
                      captureType === 'photo' ? 'image/*' :
                      captureType === 'video' ? 'video/*' : 'audio/*'
                    }
                    onChange={handleFileSelect}
                    className='hidden'
                  />
                </>
              ) : (
                <>
                  <button
                    onClick={handleRetake}
                    type='button'
                    className='flex items-center gap-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-5 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all'
                  >
                    <RotateCcw className='w-4 h-4' /> Retake
                  </button>
                  <button
                    onClick={handleConfirm}
                    type='button'
                    className='flex items-center gap-2 rounded-lg bg-green-600 dark:bg-green-500 text-white px-5 py-2.5 text-sm shadow-lg hover:bg-green-700 dark:hover:bg-green-600 transition-all'
                  >
                    {captureType === 'photo' ? <Camera className='w-4 h-4' /> : 
                     captureType === 'video' ? <Video className='w-4 h-4' /> : 
                     <Mic className='w-4 h-4' />}
                    Use {captureType === 'photo' ? 'Photo' : captureType === 'video' ? 'Video' : 'Audio'}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MediaCaptureModal;
