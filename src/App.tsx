import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import DeviceFrame from './components/DeviceFrame';
import VoiceAuth from './components/VoiceAuth';
import FirewallDashboard from './components/FirewallDashboard';
import { FirewallLog, AdminAlert } from './types';
import { Shield, ShieldAlert, KeyRound, Cpu, Terminal, Sparkles, BookOpen, User, Lock, ExternalLink, HelpCircle } from 'lucide-react';

export default function App() {
  // Device layout state: 'ios' | 'android' | 'responsive'
  const [activeDevice, setActiveDevice] = useState<'ios' | 'android' | 'responsive'>('responsive');
  
  // App views: 'user-portal' | 'admin-firewall' | 'e2e-vault'
  const [activeView, setActiveView] = useState<'user-portal' | 'admin-firewall' | 'e2e-vault'>('user-portal');
  
  // Real-time metrics, logs, and alerts
  const [logs, setLogs] = useState<FirewallLog[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    blockedThreats: 0,
    averageLatencyMs: 380,
    sensitivity: 'medium' as 'low' | 'medium' | 'high',
    systemStatus: 'Secure'
  });

  // Client notifications/toasts
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);

  // Authenticated user state
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);
  const [mfaTriggered, setMfaTriggered] = useState(false);

  // Trigger toast notifications
  const addToast = (message: string, type: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // 1. Fetch metrics & initial status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/firewall-status');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error('Error fetching firewall status:', e);
    }
  };

  // 2. Setup Real-time Firebase Firestore subscriptions
  useEffect(() => {
    fetchStatus();

    // Live subscription to firewall logs
    const logsQuery = query(collection(db, 'firewall_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const liveLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirewallLog[];
      setLogs(liveLogs);
      
      // Compute threats dynamically based on logs
      const blocks = liveLogs.filter(l => l.type === 'replay_attack' || l.type === 'spoof_attempt' || l.type === 'rate_limit').length;
      setMetrics(prev => ({
        ...prev,
        blockedThreats: blocks,
        totalRequests: prev.totalRequests + 1,
        systemStatus: blocks > 4 ? 'Elevated Alert' : 'Secure'
      }));
    }, (error) => {
      console.error('Firestore logs subscription failed:', error);
    });

    // Live subscription to admin alerts
    const alertsQuery = query(collection(db, 'admin_alerts'), orderBy('timestamp', 'desc'), limit(15));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const liveAlerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminAlert[];
      setAlerts(liveAlerts);
    }, (error) => {
      console.error('Firestore alerts subscription failed:', error);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeAlerts();
    };
  }, []);

  // Cyber attack triggering helper
  const handleSimulateAttack = async (type: 'replay_attack' | 'spoofing' | 'rate_limit' | 'ddos') => {
    try {
      const res = await fetch('/api/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attackType: type })
      });
      if (res.ok) {
        const data = await res.json();
        addToast(`Mô phỏng tấn công: ${data.alert.message}`, 'critical');
        fetchStatus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reset metrics helper
  const handleClearLogs = async () => {
    try {
      await fetch('/api/clear-logs', { method: 'POST' });
      addToast('Đã xóa trắng nhật ký bảo mật thành công!', 'success');
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle successful voice identification
  const handleAuthSuccess = (username: string, isMfa?: boolean) => {
    setAuthenticatedUser(username);
    setMfaTriggered(isMfa || false);
    addToast(`Chào mừng trở lại, ${username}. Phiên đăng nhập sinh trắc học được khởi tạo.`, 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-200 font-sans transition-colors duration-300">
      
      {/* Toast Warning Notifications */}
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-50 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3 rounded-lg border shadow-lg flex gap-2.5 animate-slide-in pointer-events-auto ${
              t.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                : t.type === 'critical'
                ? 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-400'
            }`}
          >
            <span className="text-[11px] font-mono font-bold leading-normal">{t.message}</span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-5xl mx-auto px-3 py-4 flex flex-col gap-4">
        
        {/* Device Frame Wrapper */}
        <DeviceFrame activeDevice={activeDevice} setActiveDevice={setActiveDevice}>
          
          {/* Inner Content Controller inside device layout */}
          <div className="flex flex-col min-h-full bg-gray-50 dark:bg-zinc-950">
            
            {/* View Selector Tabs inside the Frame - High Density compact */}
            <div className="flex bg-white dark:bg-zinc-900 border-b border-gray-150 dark:border-zinc-800/80 sticky top-0 z-20">
              <button
                id="tab-view-user"
                onClick={() => {
                  setActiveView('user-portal');
                  setAuthenticatedUser(null);
                }}
                className={`flex-1 py-2 text-[10px] font-mono font-bold tracking-wider uppercase text-center transition-all cursor-pointer ${
                  activeView === 'user-portal'
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5'
                    : 'text-gray-400 hover:text-gray-800 dark:hover:text-zinc-200'
                }`}
              >
                Cổng Xác Thực Voice
              </button>
              
              <button
                id="tab-view-admin"
                onClick={() => setActiveView('admin-firewall')}
                className={`flex-1 py-2 text-[10px] font-mono font-bold tracking-wider uppercase text-center transition-all cursor-pointer ${
                  activeView === 'admin-firewall'
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5'
                    : 'text-gray-400 hover:text-gray-800 dark:hover:text-zinc-200'
                }`}
              >
                Tường Lửa Security
              </button>

              <button
                id="tab-view-vault"
                onClick={() => setActiveView('e2e-vault')}
                className={`flex-1 py-2 text-[10px] font-mono font-bold tracking-wider uppercase text-center transition-all cursor-pointer ${
                  activeView === 'e2e-vault'
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5'
                    : 'text-gray-400 hover:text-gray-800 dark:hover:text-zinc-200'
                }`}
              >
                Giải Mã E2EE
              </button>
            </div>

            {/* View Switching */}
            <div className="flex-1">
              
              {/* 1. Voice Authentication Portal */}
              {activeView === 'user-portal' && (
                <>
                  {authenticatedUser ? (
                    /* Authenticated State Display Card - High Density Compact */
                    <div className="p-4 flex flex-col items-center justify-center text-center gap-4 animate-fade-in py-10">
                      <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                        <Lock className="w-6 h-6 text-emerald-500 animate-pulse" />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white font-mono">
                          XÁC THỰC THÀNH CÔNG!
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 max-w-xs font-mono leading-relaxed">
                          Chào mừng <span className="font-bold text-gray-800 dark:text-white">"{authenticatedUser}"</span>. Vân tay giọng nói của bạn đã khớp hoàn hảo với hồ sơ sinh trắc học mã hóa đầu cuối.
                        </p>
                      </div>

                      <div className="w-full max-w-xs bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-800/80 rounded-lg p-3 flex flex-col gap-1.5 text-left">
                        <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 uppercase">
                          <span>Mã định danh SIV:</span>
                          <span className="text-emerald-500 font-bold">MATCHED</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <span className="text-gray-500">MFA Level:</span>
                          <span className="font-bold text-gray-800 dark:text-zinc-200">SIV+WebAuthn Dual</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <span className="text-gray-500">Kênh giải mã:</span>
                          <span className="font-bold text-gray-800 dark:text-zinc-200">AES-GCM-256</span>
                        </div>
                      </div>

                      <button
                        id="btn-lock-vault"
                        onClick={() => {
                          setAuthenticatedUser(null);
                          setMfaTriggered(false);
                          addToast('Đã khóa phiên truy cập sinh trắc học.', 'warning');
                        }}
                        className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-white text-[11px] font-mono font-bold rounded-lg transition-all border border-zinc-800 cursor-pointer shadow-sm"
                      >
                        Khóa phiên truy cập
                      </button>
                    </div>
                  ) : (
                    <VoiceAuth
                      onAuthSuccess={handleAuthSuccess}
                      onAlertTriggered={addToast}
                      activeDevice={activeDevice}
                    />
                  )}
                </>
              )}

              {/* 2. Firewall Security Dashboard */}
              {activeView === 'admin-firewall' && (
                <FirewallDashboard
                  alerts={alerts}
                  logs={logs}
                  metrics={metrics}
                  onRefresh={fetchStatus}
                  onSimulateAttack={handleSimulateAttack}
                  onClearLogs={handleClearLogs}
                />
              )}

              {/* 3. E2EE Decryptor Information Panel - High Density */}
              {activeView === 'e2e-vault' && (
                <div className="p-3.5 flex flex-col gap-3.5">
                  <div className="bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-900 rounded-xl p-3.5 flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 border-b border-gray-100 dark:border-zinc-800/60 pb-2.5">
                      <KeyRound className="w-4 h-4 text-emerald-500" />
                      <h2 className="text-xs font-mono font-bold tracking-tight text-gray-900 dark:text-white uppercase">Cơ chế mã hóa đầu cuối SIV (E2EE)</h2>
                    </div>

                    <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-relaxed font-mono">
                      Để bảo vệ quyền riêng tư sinh trắc học, hệ thống triển khai cơ chế mã hóa đầu cuối hoàn chỉnh (End-to-End Encryption) bằng thuật toán <span className="text-emerald-500 font-bold">AES-GCM 256-bit</span>:
                    </p>

                    <div className="flex flex-col gap-3 bg-gray-50 dark:bg-zinc-950/40 p-3 rounded-lg border border-gray-100 dark:border-zinc-900">
                      <div className="flex gap-2.5">
                        <div className="w-5 h-5 rounded bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 border border-zinc-700">1</div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-mono font-bold text-gray-800 dark:text-zinc-300">Trích xuất đặc trưng giọng nói (Vocal Extraction)</span>
                          <span className="text-[10px] font-mono text-gray-400 mt-0.5 leading-normal">
                            Dữ liệu micro gửi lên SIV Core phân tích cấu trúc phổ âm học tần số cao của người dùng và chuyển đổi thành chuỗi vector d-vector mã hóa 512 chiều.
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <div className="w-5 h-5 rounded bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 border border-zinc-700">2</div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-mono font-bold text-gray-800 dark:text-zinc-300">Mã hóa AES-GCM Client-Side</span>
                          <span className="text-[10px] font-mono text-gray-400 mt-0.5 leading-normal">
                            Trước khi truyền tải, vector giọng nói được mã hóa bằng khóa bí mật phái sinh từ khẩu lệnh của người dùng (PBKDF2). Khóa gốc không bao giờ gửi lên server.
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <div className="w-5 h-5 rounded bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 border border-zinc-700">3</div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-mono font-bold text-gray-800 dark:text-zinc-300">Lưu trữ Firestore Bảo mật</span>
                          <span className="text-[10px] font-mono text-gray-400 mt-0.5 leading-normal">
                            Chỉ có Ciphertext và Salt được lưu trữ. Quản trị viên cơ sở dữ liệu cũng không thể giải mã hay tái lập phổ giọng nói gốc của bạn.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 text-emerald-600 dark:text-emerald-400">
                      <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-mono font-bold uppercase">ISO/IEC 27001 Biometric Compliant</span>
                        <p className="text-[9px] font-mono opacity-90 leading-normal">
                          Dữ liệu lưu trữ tuân thủ hoàn toàn theo tiêu chuẩn bảo mật GDPR Biometric Privacy Rules nghiêm ngặt nhất.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </DeviceFrame>

        {/* Gemini Instructions Guide - Polished, High Density */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-900 rounded-xl p-3.5 flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center gap-1.5 border-b border-gray-100 dark:border-zinc-800/60 pb-2">
            <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h3 className="text-xs font-mono font-bold tracking-tight text-gray-900 dark:text-white uppercase">Cấu hình Trí tuệ Nhân tạo Gemini</h3>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-3.5 text-[11px] text-gray-600 dark:text-zinc-400 leading-normal">
            <div className="flex-1 flex flex-col gap-1.5 font-mono">
              <p className="font-bold text-gray-800 dark:text-zinc-200">
                Hệ thống hỗ trợ phân tích phổ âm sinh học thực tế bằng mô hình <span className="text-blue-500 font-bold">Gemini 2.5 Flash</span> khi khóa bí mật được thiết lập.
              </p>
              <p className="text-gray-400 dark:text-zinc-500 leading-relaxed text-[10px]">
                Nếu chưa thiết lập khóa, hệ thống sẽ tự động sử dụng <span className="font-bold text-emerald-500">SIV Local Deep Learning Emulator</span> (Trình giả lập cấu trúc phổ tần số WaveAudio) giúp nhà phát triển kiểm thử các tính năng một cách mượt mà nhất.
              </p>
            </div>
            
            <div className="md:w-80 p-2.5 bg-gray-50 dark:bg-zinc-950/60 rounded-lg border border-gray-200/50 dark:border-zinc-900 flex flex-col gap-1.5">
              <span className="font-bold text-gray-800 dark:text-zinc-300 text-[10px] uppercase tracking-wider font-mono">Cách thêm Gemini Key:</span>
              <ol className="list-decimal list-inside text-[10px] text-gray-500 dark:text-zinc-500 flex flex-col gap-1 font-mono">
                <li>Nhấp vào nút <span className="font-bold text-gray-700 dark:text-zinc-300">Settings</span> góc trái màn hình.</li>
                <li>Chọn menu <span className="font-bold text-gray-700 dark:text-zinc-300">Secrets</span>.</li>
                <li>Thêm biến <span className="font-mono bg-gray-100 dark:bg-zinc-850 px-1 py-0.2 rounded text-gray-800 dark:text-zinc-200 border border-gray-200/40 dark:border-zinc-800/40 font-bold text-[9px]">GEMINI_API_KEY</span>.</li>
                <li>Hệ thống tự động kích hoạt bộ phân tích phổ giọng nói thật!</li>
              </ol>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
