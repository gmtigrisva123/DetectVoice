import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Activity, Globe, Flame, RefreshCw, Trash2, Sliders, BellRing, CheckCircle, Zap } from 'lucide-react';
import { FirewallLog, AdminAlert } from '../types';

interface FirewallDashboardProps {
  alerts: AdminAlert[];
  logs: FirewallLog[];
  metrics: {
    totalRequests: number;
    blockedThreats: number;
    averageLatencyMs: number;
    sensitivity: 'low' | 'medium' | 'high';
    systemStatus: string;
  };
  onRefresh: () => void;
  onSimulateAttack: (type: 'replay_attack' | 'spoofing' | 'rate_limit' | 'ddos') => void;
  onClearLogs: () => void;
}

export default function FirewallDashboard({
  alerts,
  logs,
  metrics,
  onRefresh,
  onSimulateAttack,
  onClearLogs
}: FirewallDashboardProps) {
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>(metrics.sensitivity);
  const [activeTab, setActiveTab] = useState<'logs' | 'alerts' | 'threat-map'>('logs');
  const [isUpdatingSensitivity, setIsUpdatingSensitivity] = useState(false);

  useEffect(() => {
    setSensitivity(metrics.sensitivity);
  }, [metrics.sensitivity]);

  const handleSensitivityChange = async (val: 'low' | 'medium' | 'high') => {
    setSensitivity(val);
    setIsUpdatingSensitivity(true);
    try {
      await fetch('/api/firewall-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensitivity: val })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingSensitivity(false);
    }
  };

  return (
    <div className="p-3.5 flex flex-col gap-3.5">
      {/* Firewall Status Headline Banner - Compact, High Density */}
      <div className="bg-zinc-950 text-white rounded-xl p-3.5 border border-zinc-800/80 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 z-10 relative">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${
              metrics.blockedThreats > 5 
                ? 'bg-red-500/15 text-red-400 border border-red-500/20' 
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            }`}>
              {metrics.blockedThreats > 5 ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[8px] font-mono tracking-wider text-blue-400 font-bold uppercase">INTELLIGENT BIOMETRIC INTEGRITY FIREWALL</span>
              <h2 className="text-sm font-bold tracking-tight mt-0.5 font-display text-zinc-100">Bảng Giám Sát Tường Lửa Bảo Mật</h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                Theo dõi và ngăn chặn các hành vi tấn công phát lại & deepfake sinh trắc học thời gian thực
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 self-end md:self-auto">
            <button
              id="btn-refresh-firewall"
              onClick={onRefresh}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all border border-zinc-800 cursor-pointer"
              title="Refresh security metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded border ${
              metrics.blockedThreats > 5
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              SYS_STATUS: {metrics.systemStatus ? metrics.systemStatus.toUpperCase() : 'SECURE'}
            </span>
          </div>
        </div>

        {/* Dynamic Metric Grid - High Density Monospace */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3.5 pt-3 border-t border-zinc-900">
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">Tổng số yêu cầu</span>
            <span className="text-base font-mono font-bold text-zinc-100 mt-0.5">{metrics.totalRequests}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">Chặn hiểm họa</span>
            <span className="text-base font-mono font-bold text-red-500 mt-0.5">{metrics.blockedThreats}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">Độ trễ SIV Core</span>
            <span className="text-base font-mono font-bold text-emerald-500 mt-0.5">&lt; 420ms</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">Deep Learning Engine</span>
            <span className="text-base font-mono font-bold text-zinc-300 mt-0.5 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> WebAudio
            </span>
          </div>
        </div>
      </div>

      {/* Cyber-Attack Injector & Sensitivity Controllers - Multi-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Sensitivity slider - High Density */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-900 rounded-xl p-3 md:col-span-5 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 border-b border-gray-100 dark:border-zinc-800/60 pb-2">
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <h3 className="text-[10px] font-mono font-bold uppercase text-gray-500 dark:text-zinc-400 tracking-wider">SIV Guard Sensitivity</h3>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[11px] font-mono text-gray-600 dark:text-zinc-400">
              <span>Độ nhạy thuật toán:</span>
              <span className="text-blue-500 font-bold uppercase">{sensitivity}</span>
            </div>
            
            <div className="flex bg-gray-50 dark:bg-zinc-955 p-0.5 rounded-lg border border-gray-200/50 dark:border-zinc-800/80 gap-0.5">
              {(['low', 'medium', 'high'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSensitivityChange(s)}
                  disabled={isUpdatingSensitivity}
                  className={`flex-1 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                    sensitivity === s
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {s === 'low' ? 'Tối giản' : s === 'medium' ? 'Vừa' : 'Khắt khe'}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-0.5 leading-normal italic font-mono">
              * Chế độ "Khắt khe" tự động cô lập IP sau 3 lần xác thực giọng nói thất bại liên tiếp.
            </p>
          </div>
        </div>

        {/* Security attack generator - High Density */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-900 rounded-xl p-3 md:col-span-7 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800/60 pb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <h3 className="text-[10px] font-mono font-bold uppercase text-gray-500 dark:text-zinc-400 tracking-wider">IPS Threat Simulator</h3>
            </div>
            <button
              id="btn-clear-threats"
              onClick={onClearLogs}
              className="text-[9px] font-mono text-gray-400 hover:text-red-500 flex items-center gap-0.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Xóa logs
            </button>
          </div>

          {/* Simulator button grids - Compact & structured */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              id="btn-simulate-replay"
              onClick={() => onSimulateAttack('replay_attack')}
              className="py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-950/40 dark:hover:bg-zinc-950 border border-gray-200/60 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              💥 Biometric Replay
            </button>
            <button
              id="btn-simulate-spoof"
              onClick={() => onSimulateAttack('spoofing')}
              className="py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-950/40 dark:hover:bg-zinc-950 border border-gray-200/60 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              🤖 Clone Deepfake
            </button>
            <button
              id="btn-simulate-rate"
              onClick={() => onSimulateAttack('rate_limit')}
              className="py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-950/40 dark:hover:bg-zinc-950 border border-gray-200/60 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              🛡️ Brute RateLimit
            </button>
            <button
              id="btn-simulate-ddos"
              onClick={() => onSimulateAttack('ddos')}
              className="py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-950/40 dark:hover:bg-zinc-950 border border-gray-200/60 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              🔥 DDoS Wave Attack
            </button>
          </div>
        </div>
      </div>

      {/* Main logs & alerting navigation - High Density Layout */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/60 dark:border-zinc-900 rounded-xl overflow-hidden flex flex-col">
        {/* Navigation Tabs - Compact layout */}
        <div className="flex bg-gray-50 dark:bg-zinc-950 border-b border-gray-200/40 dark:border-zinc-800/65 px-2">
          <button
            id="tab-firewall-logs"
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-3 text-[11px] font-mono font-bold transition-all relative cursor-pointer ${
              activeTab === 'logs'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            Sự kiện bảo mật ({logs.length})
          </button>
          <button
            id="tab-firewall-alerts"
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-3 text-[11px] font-mono font-bold transition-all relative cursor-pointer ${
              activeTab === 'alerts'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            Cảnh báo ({alerts.length})
            {alerts.length > 0 && (
              <span className="ml-1 bg-red-500 text-white font-mono font-bold text-[8px] px-1.5 py-0.2 rounded-full">
                {alerts.length}
              </span>
            )}
          </button>
          <button
            id="tab-firewall-map"
            onClick={() => setActiveTab('threat-map')}
            className={`py-2 px-3 text-[11px] font-mono font-bold transition-all relative cursor-pointer ${
              activeTab === 'threat-map'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            Trực quan IP Bản đồ
          </button>
        </div>

        <div className="p-3 overflow-y-auto max-h-[300px] min-h-[180px]">
          {/* Logs Tab Content */}
          {activeTab === 'logs' && (
            <div className="flex flex-col gap-2">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 dark:text-zinc-500">
                  <Activity className="w-6 h-6 opacity-30 mb-1.5 text-blue-500" />
                  <span className="text-[11px] font-mono">Hệ thống an toàn tuyệt đối. Chưa phát hiện logs bất thường.</span>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-1 p-2 bg-gray-50/50 dark:bg-zinc-950/30 rounded-lg border border-gray-100/60 dark:border-zinc-850 hover:bg-gray-50 dark:hover:bg-zinc-950 transition-all"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          log.type === 'auth_success' || log.type === 'access_allowed'
                            ? 'bg-emerald-500'
                            : log.type === 'auth_failed'
                            ? 'bg-amber-500'
                            : 'bg-red-500 animate-pulse'
                        }`}></span>
                        <span className="text-[11px] font-mono font-bold text-gray-800 dark:text-zinc-200 capitalize">
                          {log.type.replace('_', ' ')}
                        </span>
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold uppercase ${
                          log.riskLevel === 'low'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : log.riskLevel === 'medium'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          Risk: {log.riskLevel}
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 dark:text-zinc-300 leading-normal font-mono font-medium">
                      {log.details}
                    </p>

                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-gray-400 dark:text-zinc-500 font-mono mt-0.5">
                      <span>IP: {log.ip}</span>
                      <span>Loc: {log.location}</span>
                      {log.mitigated && (
                        <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                          ✓ IPS Protected
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Alerts Tab Content - High Density */}
          {activeTab === 'alerts' && (
            <div className="flex flex-col gap-2">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 dark:text-zinc-500">
                  <BellRing className="w-6 h-6 opacity-30 mb-1.5 text-blue-500" />
                  <span className="text-[11px] font-mono">Không phát hiện cảnh báo khẩn cấp nào từ tường lửa</span>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-2 rounded-lg border flex gap-2 ${
                      alert.severity === 'critical'
                        ? 'bg-red-500/5 border-red-500/15 text-red-700 dark:text-red-400'
                        : 'bg-amber-500/5 border-amber-500/15 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    <div className="p-1.5 bg-white dark:bg-zinc-900 rounded border border-current flex items-center justify-center shrink-0 self-start">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                          THREAT: {alert.severity ? alert.severity.toUpperCase() : 'ALERT'}
                        </span>
                        <span className="text-[9px] opacity-75 font-mono">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] leading-normal font-mono font-medium">
                        {alert.message}
                      </p>
                      <div className="mt-1 flex justify-between items-center">
                        <span className="text-[8px] font-mono opacity-80">Type: {alert.type}</span>
                        <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-mono font-bold flex items-center gap-0.5">
                          ✓ IPS MITIGATED
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Threat Map Tab Content - High Density */}
          {activeTab === 'threat-map' && (
            <div className="flex flex-col gap-3 py-1">
              <div className="relative bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col items-center justify-center min-h-[130px] overflow-hidden">
                <Globe className="w-12 h-12 text-blue-500/20 animate-spin-slow" />
                <span className="text-[11px] font-mono font-bold text-zinc-300 mt-2">Geographic Security Map</span>
                <span className="text-[9px] text-zinc-500 mt-0.5 max-w-xs text-center font-mono">
                  Đang giám sát luồng IP đăng nhập sinh trắc học thời gian thực
                </span>
                
                {/* Simulated active traffic nodes */}
                <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping duration-1000"></div>
                <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping duration-700"></div>
              </div>

              {/* Geographic logs table - High Density */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-mono font-bold uppercase tracking-wider">Phân tích xâm nhập gần đây</span>
                <div className="divide-y divide-gray-150 dark:divide-zinc-800/50">
                  <div className="flex justify-between py-1 text-[9px] text-gray-400 font-mono">
                    <span>IP / Vị trí</span>
                    <span>Trạng thái tường lửa</span>
                  </div>
                  {logs.slice(0, 3).map((log, i) => (
                    <div key={i} className="flex justify-between py-1 text-[10px] font-mono">
                      <span className="text-gray-700 dark:text-zinc-300 font-bold">{log.ip} ({log.location})</span>
                      <span className={log.type.includes('fail') || log.type.includes('attack') ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>
                        {log.type.includes('fail') || log.type.includes('attack') ? 'BLOCKED' : 'ALLOW'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
