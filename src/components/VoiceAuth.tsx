import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, KeyRound, ShieldCheck, ShieldAlert, Cpu, Lock, Unlock, RefreshCw, Activity, ArrowRight, Fingerprint, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { VoiceProfile, VoiceVerificationResult } from '../types';

interface VoiceAuthProps {
  onAuthSuccess: (username: string, isBiometricTriggered?: boolean) => void;
  onAlertTriggered: (message: string, type: string) => void;
  activeDevice: 'ios' | 'android' | 'responsive';
}

export default function VoiceAuth({ onAuthSuccess, onAlertTriggered, activeDevice }: VoiceAuthProps) {
  const [authMode, setAuthMode] = useState<'verify' | 'register'>('verify');
  const [username, setUsername] = useState('');
  const [passphrase, setPassphrase] = useState('mã khóa sinh trắc học của tôi là duy nhất');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VoiceVerificationResult | null>(null);
  const [enrolledProfile, setEnrolledProfile] = useState<any | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<string[]>([]);
  const [showPassphrase, setShowPassphrase] = useState(false);
  
  // Real audio recording variables
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordDuration, setRecordDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio Analyser
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [waveData, setWaveData] = useState<number[]>(Array(40).fill(10));
  const animationFrameRef = useRef<number | null>(null);

  // Simulated Spoof state
  const [simulatedSpoof, setSimulatedSpoof] = useState(false);

  // Biometric Multi-Factor login simulation
  const [biometricStep, setBiometricStep] = useState<'idle' | 'scanning' | 'passed' | 'failed'>('idle');

  // Load existing profiles from server
  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/firewall-status');
      if (res.ok) {
        const data = await res.json();
        const logs = data.recentLogs || [];
        // Pull registered speaker names from firewall logs or active registered list
        const registered = logs
          .filter((l: any) => l.type === 'access_allowed' && l.details.includes('Enrollment successful'))
          .map((l: any) => {
            const match = l.details.match(/"([^"]+)"/);
            return match ? match[1] : null;
          })
          .filter((name: string | null): name is string => name !== null);
        
        // Let's add a few default enrollments if database is fresh
        const unique = Array.from(new Set([...registered, 'Admin_Core', 'Security_Lead']));
        setRegisteredUsers(unique);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfiles();
    const interval = setInterval(fetchProfiles, 5000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio Visualizer Loops
  useEffect(() => {
    if (isRecording) {
      // Draw real microphone amplitude waves
      const drawWave = () => {
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Map to 40 wave bars
          const sampled: number[] = [];
          const step = Math.floor(bufferLength / 40);
          for (let i = 0; i < 40; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
              sum += dataArray[i * step + j] || 0;
            }
            const avg = sum / step;
            // Height bounded
            sampled.push(Math.max(5, (avg / 255) * 80 + Math.random() * 8));
          }
          setWaveData(sampled);
        }
        animationFrameRef.current = requestAnimationFrame(drawWave);
      };
      drawWave();
    } else {
      // Idle ambient breathing wave pulse
      let angle = 0;
      const drawAmbient = () => {
        angle += 0.08;
        const ambient = Array(40).fill(0).map((_, i) => {
          const sine = Math.sin(angle + i * 0.15);
          return Math.max(4, (sine + 1.2) * 12 + Math.random() * 3);
        });
        setWaveData(ambient);
        animationFrameRef.current = requestAnimationFrame(drawAmbient);
      };
      drawAmbient();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording]);

  // Handle Voice Recording start
  const startRecording = async () => {
    setVerificationResult(null);
    setAudioBlob(null);
    audioChunksRef.current = [];
    setRecordDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Hook up Web Audio Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // Duration counter
      timerRef.current = setInterval(() => {
        setRecordDuration(prev => {
          if (prev >= 6) {
            stopRecording();
            return 6;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Error opening mic:', err);
      onAlertTriggered('Không thể truy cập Microphone thiết bị. Vui lòng cấp quyền.', 'warning');
    }
  };

  // Handle Voice Recording stop
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Convert Blob to Base64 String safely
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip the data:audio/webm;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Submit biometric voice profiles
  const handleVoiceProcess = async () => {
    if (!username.trim()) {
      onAlertTriggered('Vui lòng nhập tên người dùng để định danh', 'warning');
      return;
    }

    if (!audioBlob) {
      onAlertTriggered('Vui lòng ghi âm lại giọng nói của bạn', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);

      if (authMode === 'register') {
        // Enrolling new voice profile
        const res = await fetch('/api/register-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            passphrase: passphrase.trim(),
            audioBase64: base64Audio
          })
        });

        if (res.ok) {
          const data = await res.json();
          setEnrolledProfile(data);
          onAlertTriggered(`Sinh trắc giọng nói người dùng "${username}" đã đăng ký mã hóa thành công!`, 'success');
          setAuthMode('verify');
          setAudioBlob(null);
        } else {
          const err = await res.json();
          onAlertTriggered(`Đăng ký thất bại: ${err.error}`, 'critical');
        }
      } else {
        // Verifying voice profile
        const res = await fetch('/api/verify-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            passphraseInput: passphrase.trim(),
            audioBase64: base64Audio,
            simulatedSpoof: simulatedSpoof
          })
        });

        const data = await res.json();
        setVerificationResult(data);

        if (data.verified && !data.spoofDetected && !data.firewallStatus?.blocked) {
          onAlertTriggered(`Xác minh thành công! Nhận diện đúng: ${username}`, 'success');
          // Trigger MFA biometric scan step to completely unlock access
          setBiometricStep('scanning');
        } else if (data.firewallStatus?.blocked) {
          onAlertTriggered(`Tường lửa chặn truy cập: ${data.firewallStatus.reason}`, 'critical');
        } else if (data.spoofDetected) {
          onAlertTriggered(`Cảnh báo giả mạo! Hệ thống phát hiện Replay/AI deepfake.`, 'critical');
        } else {
          onAlertTriggered(`Xác thực thất bại! Đặc trưng giọng nói không khớp.`, 'warning');
        }
      }
    } catch (e: any) {
      onAlertTriggered(`Lỗi kết nối SIV Core: ${e.message}`, 'critical');
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulated WebAuthn MFA Touch/Face ID
  const handleBiometricMFA = () => {
    setBiometricStep('scanning');
    setTimeout(() => {
      setBiometricStep('passed');
      setTimeout(() => {
        onAuthSuccess(username, true);
        setBiometricStep('idle');
        setVerificationResult(null);
      }, 1500);
    }, 2000);
  };

  return (
    <div className={`p-3.5 flex flex-col gap-3.5 ${activeDevice === 'responsive' ? 'max-w-xl mx-auto w-full py-6' : ''}`}>
      {/* Mode Selectors - High Density Compact */}
      <div className="flex bg-gray-100 dark:bg-zinc-900/60 p-0.5 rounded-lg border border-gray-200/40 dark:border-zinc-800/40">
        <button
          id="tab-auth-verify"
          onClick={() => {
            setAuthMode('verify');
            setVerificationResult(null);
            setAudioBlob(null);
          }}
          className={`flex-1 py-1.5 text-[11px] font-mono font-bold rounded transition-all cursor-pointer ${
            authMode === 'verify'
              ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-zinc-200'
          }`}
        >
          Xác minh người thực
        </button>
        <button
          id="tab-auth-register"
          onClick={() => {
            setAuthMode('register');
            setVerificationResult(null);
            setAudioBlob(null);
          }}
          className={`flex-1 py-1.5 text-[11px] font-mono font-bold rounded transition-all cursor-pointer ${
            authMode === 'register'
              ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-zinc-200'
          }`}
        >
          Đăng ký giọng nói mới
        </button>
      </div>

      {/* Voice Core Card - High Density, sleek borders, compact padding */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/60 dark:border-zinc-900 p-3.5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-500 animate-spin-slow" />
            <span className="text-[9px] font-mono font-bold tracking-wider text-gray-400 dark:text-zinc-500 uppercase">
              {authMode === 'register' ? 'SIV PROFILE ENROLLMENT' : 'SIV VOCAL ANALYSIS GATE'}
            </span>
          </div>
          {enrolledProfile && (
            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> E2EE ACTIVE
            </span>
          )}
        </div>

        {/* Form Fields - High Density compact padding & text sizes */}
        <div className="flex flex-col gap-3">
          {/* Speaker ID */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Tên / Định danh người nói (Speaker ID)
            </label>
            <div className="relative">
              <input
                id="input-speaker-id"
                type="text"
                placeholder="Ví dụ: Admin_Core, Security_Lead..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-950/40 text-gray-950 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono transition-all"
              />
              {registeredUsers.length > 0 && authMode === 'verify' && (
                <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                  <span className="text-[9px] font-mono text-gray-400 dark:text-zinc-500">Gợi ý:</span>
                  {registeredUsers.slice(0, 4).map((user) => (
                    <button
                      key={user}
                      onClick={() => setUsername(user)}
                      className="text-[9px] font-mono bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-1.5 py-0.2 rounded transition-all cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-zinc-700"
                    >
                      {user}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Secure Biometric Passphrase */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                Mã khẩu lệnh bảo mật (Passphrase)
              </label>
              <button
                id="btn-toggle-phrase"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="text-[9px] font-mono text-gray-400 dark:text-zinc-500 hover:text-emerald-500 flex items-center gap-0.5 transition-all cursor-pointer"
              >
                {showPassphrase ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPassphrase ? 'Ẩn khẩu lệnh' : 'Hiện khẩu lệnh'}
              </button>
            </div>
            <div className="relative">
              <input
                id="input-passphrase"
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-950/40 text-gray-950 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>
            <p className="text-[9px] text-gray-400 dark:text-zinc-500 italic font-mono">
              * Khẩu lệnh bắt buộc phát âm đúng từng từ để so khớp cấu trúc ngữ âm.
            </p>
          </div>
        </div>

        {/* Live Waveform Visualizer Display - Compact & Sharp */}
        <div className="bg-zinc-950 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden border border-zinc-800/80 min-h-[110px]">
          <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
            <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-[8px] font-mono text-zinc-400 tracking-wider">
              {isRecording ? `REC: 00:0${recordDuration}s` : 'SPECTRAL STANDBY'}
            </span>
          </div>

          {/* Wave visual bars */}
          <div className="w-full flex items-end justify-center gap-[2px] h-14 px-1 mt-2">
            {waveData.map((height, i) => (
              <div
                key={i}
                style={{ height: `${Math.max(3, height * 0.7)}px` }}
                className={`w-[3px] rounded-full transition-all duration-75 ${
                  isRecording 
                    ? 'bg-red-500' 
                    : 'bg-emerald-500/80 shadow-[0_0_4px_rgba(16,185,129,0.2)]'
                }`}
              ></div>
            ))}
          </div>

          {/* Mic Trigger Button - Compact size */}
          <button
            id="btn-voice-recorder"
            onClick={isRecording ? stopRecording : startRecording}
            className={`mt-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 hover:text-emerald-400 hover:border-emerald-500/20'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Audio Recording Status Indicator - Compact */}
        {audioBlob && !isRecording && (
          <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60 p-2 rounded-lg border border-gray-200/50 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-mono font-bold text-gray-700 dark:text-zinc-400">Audio Captured</span>
            </div>
            <button
              id="btn-submit-audio"
              onClick={handleVoiceProcess}
              disabled={isProcessing}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 text-white text-[10px] font-mono font-bold rounded transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            >
              {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
              {authMode === 'register' ? 'Đăng ký' : 'Xác thực'}
            </button>
          </div>
        )}

        {/* Interactive Spoof Trigger - Compact */}
        {authMode === 'verify' && (
          <div className="flex items-center justify-between border-t border-gray-200/40 dark:border-zinc-800/60 pt-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-mono font-bold text-gray-700 dark:text-zinc-300">Replay Attack Simulator</span>
              <span className="text-[9px] font-mono text-gray-400 dark:text-zinc-500">Mô phỏng phát lại tệp ghi âm giọng nói</span>
            </div>
            <button
              id="btn-toggle-spoof"
              onClick={() => {
                setSimulatedSpoof(!simulatedSpoof);
                if (!simulatedSpoof) {
                  onAlertTriggered('Simulator: Đã nạp mẫu âm thanh replay nhân bản của kẻ tấn công!', 'warning');
                }
              }}
              className={`px-2 py-1 text-[9px] font-mono font-bold rounded transition-all border cursor-pointer ${
                simulatedSpoof
                  ? 'bg-red-500/10 border-red-500/30 text-red-500'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/60 border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              {simulatedSpoof ? 'TẤN CÔNG NẠP' : 'TẮT TẤN CÔNG'}
            </button>
          </div>
        )}
      </div>

      {/* Deep Learning Acoustic Results Verification Panel - Compact, Structured Grid */}
      {verificationResult && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-900 rounded-xl p-3 flex flex-col gap-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-200/40 dark:border-zinc-800/60 pb-2">
            <h3 className="text-[9px] font-mono font-bold uppercase text-gray-400 dark:text-zinc-500 tracking-wider">Acoustic Analysis Findings</h3>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
              verificationResult.verified && !verificationResult.spoofDetected
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                : 'bg-red-500/10 border border-red-500/20 text-red-500'
            }`}>
              {verificationResult.verified && !verificationResult.spoofDetected ? (
                <>
                  <ShieldCheck className="w-3 h-3" /> APPROVED
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3" /> REJECTED
                </>
              )}
            </span>
          </div>

          {/* Audio Biometric Indicators - High Density Monospace */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50/50 dark:bg-zinc-950/40 p-2 rounded-lg border border-gray-100 dark:border-zinc-800/60">
              <span className="text-[8px] text-gray-400 dark:text-zinc-500 font-mono uppercase">Tần số chính (Pitch)</span>
              <p className="text-[11px] font-mono font-bold text-gray-800 dark:text-zinc-300 mt-0.5">{verificationResult.features.pitch || 'N/A'}</p>
            </div>
            <div className="bg-gray-50/50 dark:bg-zinc-950/40 p-2 rounded-lg border border-gray-100 dark:border-zinc-800/60">
              <span className="text-[8px] text-gray-400 dark:text-zinc-500 font-mono uppercase">Tốc độ khẩu âm</span>
              <p className="text-[11px] font-mono font-bold text-gray-800 dark:text-zinc-300 mt-0.5">{verificationResult.features.speechRate || 'N/A'}</p>
            </div>
            <div className="bg-gray-50/50 dark:bg-zinc-950/40 p-2 rounded-lg border border-gray-100 dark:border-zinc-800/60">
              <span className="text-[8px] text-gray-400 dark:text-zinc-500 font-mono uppercase">Màu sắc âm (Tone)</span>
              <p className="text-[11px] font-mono font-bold text-gray-800 dark:text-zinc-300 mt-0.5 truncate">{verificationResult.features.tone || 'N/A'}</p>
            </div>
            <div className="bg-gray-50/50 dark:bg-zinc-950/40 p-2 rounded-lg border border-gray-100 dark:border-zinc-800/60">
              <span className="text-[8px] text-gray-400 dark:text-zinc-500 font-mono uppercase">Mức độ trùng khớp</span>
              <p className={`text-[11px] font-mono font-bold mt-0.5 ${
                verificationResult.confidence >= 80 ? 'text-emerald-500' : 'text-red-400'
              }`}>{verificationResult.confidence}% Similarity</p>
            </div>
          </div>

          {/* Spoof/Attack Log Alerts */}
          {verificationResult.spoofDetected && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex gap-2 text-red-500">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-mono font-bold">Cảnh báo: Phát hiện Replay / Deepfake</span>
                <p className="text-[9px] font-mono text-red-400/80 leading-normal">{verificationResult.spoofReason}</p>
              </div>
            </div>
          )}

          {/* MFA Biometric Scan Option */}
          {verificationResult.verified && !verificationResult.spoofDetected && (
            <div className="mt-1 border-t border-gray-200/40 dark:border-zinc-800/60 pt-3 flex flex-col gap-2">
              <div className="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 text-emerald-600 dark:text-emerald-400">
                <div className="flex gap-1.5">
                  <Fingerprint className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-mono font-bold">Xác thực sinh trắc học đa nhân tố (MFA)</span>
                    <span className="text-[9px] font-mono opacity-85">Hoàn tất kiểm tra bảo mật bằng TouchID / FaceID</span>
                  </div>
                </div>
              </div>
              
              <button
                id="btn-trigger-mfa"
                onClick={handleBiometricMFA}
                disabled={biometricStep === 'scanning'}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-white text-[11px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border border-zinc-800 shadow-sm cursor-pointer"
              >
                {biometricStep === 'scanning' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    Đang quét sinh trắc học...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                    Kích hoạt TouchID / FaceID để đăng nhập
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dynamic MFA scanner modal mockup in-device */}
      {biometricStep === 'scanning' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-50 text-white p-6 animate-fade-in">
          <div className="relative w-28 h-28 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping duration-1000"></div>
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-emerald-400/60 animate-spin-slow"></div>
            <Fingerprint className="w-14 h-14 text-emerald-400 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-white mb-1">MFA Biometric Check</h3>
          <p className="text-[11px] text-zinc-400 text-center max-w-xs mb-4">
            Đang quét vân tay/khuôn mặt bằng hệ thống bảo mật cục bộ iOS/Android...
          </p>
          <div className="w-36 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-progress"></div>
          </div>
        </div>
      )}
    </div>
  );
}
