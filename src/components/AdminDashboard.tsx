'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  KeyRound,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Database,
  Camera,
  LogOut,
  Sparkles,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  X,
  FileCode,
  LayoutGrid,
} from 'lucide-react';
import { AdminTemplateManager } from './AdminTemplateManager';
import { PictureTemplate } from '../types/photobooth';

interface AccessCode {
  id: string;
  code: string;
  note: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface PhotoSession {
  id: string;
  access_code: string | null;
  image_data: string;
  title: string;
  subtitle: string;
  layout: string;
  filter: string;
  created_at: string;
}

interface Stats {
  totalCodes: number;
  activeCodes: number;
  totalSessions: number;
  totalRedemptions: number;
}

interface AdminDashboardProps {
  admin: { id: string; username: string; email: string };
  token: string;
  onLogout: () => void;
  onLaunchBooth: (template?: PictureTemplate) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  token,
  onLogout,
  onLaunchBooth,
}) => {
  const [activeTab, setActiveTab] = useState<'codes' | 'templates' | 'sessions'>('codes');
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [recentSessions, setRecentSessions] = useState<PhotoSession[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCodes: 0,
    activeCodes: 0,
    totalSessions: 0,
    totalRedemptions: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Generate Modal States
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [newCodeText, setNewCodeText] = useState('');
  const [newCodeNote, setNewCodeNote] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState<number>(1);
  const [newCodeCount, setNewCodeCount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PostgreSQL Schema Modal
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Load Dashboard Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [codesRes, statsRes] = await Promise.all([
        fetch('/api/admin/codes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (codesRes.status === 401 || codesRes.status === 403 || statsRes.status === 401 || statsRes.status === 403) {
        onLogout();
        return;
      }

      if (codesRes.ok) {
        const codesData = await codesRes.json();
        setCodes(codesData.codes || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || stats);
        setRecentSessions(statsData.recentSessions || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Copy code to clipboard
  const handleCopyCode = async (codeItem: AccessCode) => {
    try {
      await navigator.clipboard.writeText(codeItem.code);
      setCopiedCodeId(codeItem.id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch {
      // ignore
    }
  };

  // Toggle active/inactive
  const handleToggleCode = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/codes/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCodes((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_active: data.is_active } : c))
        );
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete code
  const handleDeleteCode = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this access code?')) return;
    try {
      const res = await fetch(`/api/admin/codes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCodes((prev) => prev.filter((c) => c.id !== id));
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick 1-Click Instant Auto-Generate
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleInstantAutoGenerate = async () => {
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          note: 'Quick Auto-Generated Pass',
          maxUses: 1,
          count: 1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const generatedCode = data.codes[0]?.code;
        if (generatedCode) {
          try {
            await navigator.clipboard.writeText(generatedCode);
          } catch {
            // ignore
          }
          triggerToast(`Generated & Copied Code: ${generatedCode}`);
        }
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateRandom5Chars = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };
  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newCodeText.trim() || undefined,
          note: newCodeNote.trim(),
          maxUses: newCodeMaxUses,
          count: newCodeCount,
        }),
      });

      if (res.ok) {
        setIsGenerateOpen(false);
        setNewCodeText('');
        setNewCodeNote('');
        setNewCodeMaxUses(1);
        setNewCodeCount(1);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCodes = codes.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.note && c.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm shadow-2xl shadow-emerald-500/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 p-0.5 shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-pink-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">SnapBox Admin Control</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Live Backend Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Logged in as <strong className="text-pink-300">{admin.username}</strong> ({admin.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSchemaModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>PostgreSQL Schema</span>
          </button>

          <button
            onClick={() => onLaunchBooth()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20 hover:scale-[1.02] transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Launch Photobooth</span>
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 text-slate-400 border border-slate-700 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Access Codes</span>
            <KeyRound className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats.totalCodes}</div>
          <p className="text-[11px] text-slate-500">All passes issued</p>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Codes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{stats.activeCodes}</div>
          <p className="text-[11px] text-slate-500">Ready to unlock booth</p>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Code Redemptions</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{stats.totalRedemptions}</div>
          <p className="text-[11px] text-slate-500">Times booth was entered</p>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Photo Strips</span>
            <ImageIcon className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-sky-400">{stats.totalSessions}</div>
          <p className="text-[11px] text-slate-500">Completed photostrips</p>
        </div>
      </div>

      {/* Admin Section Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('codes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'codes'
              ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Access Codes</span>
          <span className="px-1.5 py-0.5 rounded-full bg-black/25 text-[10px] font-bold">
            {stats.totalCodes}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-pink-300" />
          <span>Picture & Occasion Templates</span>
          <span className="px-2 py-0.5 rounded-full bg-pink-400/20 text-pink-300 text-[10px] font-extrabold border border-pink-400/30">
            12 Months Active
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-sky-400" />
          <span>Photo Strips</span>
          <span className="px-1.5 py-0.5 rounded-full bg-black/25 text-[10px] font-bold">
            {stats.totalSessions}
          </span>
        </button>
      </div>

      {/* Tab Content: Picture Templates Manager */}
      {activeTab === 'templates' && (
        <AdminTemplateManager
          token={token}
          onLaunchBoothWithTemplate={onLaunchBooth}
        />
      )}

      {/* Access Codes Section */}
      {activeTab === 'codes' && (
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 space-y-5 animate-fadeIn">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-pink-400" />
              <span>Photobooth Access Codes</span>
            </h2>
            <p className="text-xs text-slate-400">
              Codes customers type to unlock the photobooth screen.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code or note..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Refresh Codes"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* 1-Click Instant Auto-Generate Button */}
            <button
              onClick={handleInstantAutoGenerate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:scale-105 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-pink-500/25 whitespace-nowrap transition-all"
              title="Instantly generate a 5-digit code and copy to clipboard"
            >
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span>⚡ Auto-Generate Code</span>
            </button>

            {/* Custom / Batch Modal Button */}
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs whitespace-nowrap transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Custom / Batch</span>
            </button>
          </div>
        </div>

        {/* Access Codes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Access Code</th>
                <th className="py-3 px-4">Note / Customer</th>
                <th className="py-3 px-4">Usage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No access codes found. Click "Generate New Code" to create one!
                  </td>
                </tr>
              ) : (
                filteredCodes.map((codeItem) => {
                  const isMaxed = codeItem.max_uses > 0 && codeItem.current_uses >= codeItem.max_uses;
                  const isCopied = copiedCodeId === codeItem.id;

                  return (
                    <tr key={codeItem.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white text-sm flex items-center gap-2">
                        <span>{codeItem.code}</span>
                        <button
                          onClick={() => handleCopyCode(codeItem)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Copy Code"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {codeItem.note || <span className="text-slate-600">—</span>}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200">
                          {codeItem.current_uses} / {codeItem.max_uses > 0 ? codeItem.max_uses : '∞'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {codeItem.current_uses >= 1 ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-[10px]">
                            Used / Redeemed
                          </span>
                        ) : codeItem.is_active ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                            Active (Single-Use)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                            Deactivated
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(codeItem.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleCode(codeItem.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            codeItem.is_active
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-rose-400'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          }`}
                          title={codeItem.is_active ? 'Deactivate code' : 'Activate code'}
                        >
                          {codeItem.is_active ? (
                            <ToggleRight className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-slate-500" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteCode(codeItem.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                          title="Delete Code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
      )}

      {/* Recent Photo Strips Section */}
      {(activeTab === 'sessions' || (activeTab === 'codes' && recentSessions.length > 0)) && (
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-sky-400" />
              <span>Recent Photo Strips</span>
            </h2>
            <span className="text-xs text-slate-400">
              {recentSessions.length} Recent Strips Captured
            </span>
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No photo strips saved yet. Take some photos in the booth!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-pink-500 transition-colors"
                >
                  <img
                    src={session.image_data}
                    alt={session.title}
                    className="w-full aspect-[1/2] object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-bold text-white truncate">{session.title}</p>
                    <p className="text-[9px] text-pink-300 font-mono">
                      Code: {session.access_code || 'Direct'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generate Access Code Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-pink-400" />
                <h3 className="text-lg font-bold text-white">Generate Access Code</h3>
              </div>
              <button
                onClick={() => setIsGenerateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  5-Digit Code (Type custom or click Auto-Generate)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCodeText}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 5);
                      setNewCodeText(clean);
                    }}
                    placeholder="e.g. 8K2M9"
                    maxLength={5}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm uppercase tracking-wider focus:outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewCodeText(generateRandom5Chars())}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition-all whitespace-nowrap"
                    title="Generate a random 5-digit code now"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Codes consist strictly of 5 numbers and uppercase letters.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer / Event Note
                </label>
                <input
                  type="text"
                  value={newCodeNote}
                  onChange={(e) => setNewCodeNote(e.target.value)}
                  placeholder="e.g. Emma's 21st Birthday, Table 4"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Usage Policy
                  </label>
                  <div className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-pink-300 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                    <span className="truncate">1-Time Single Use</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Batch Count
                  </label>
                  <select
                    value={newCodeCount}
                    onChange={(e) => setNewCodeCount(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-pink-500"
                  >
                    <option value={1}>1 Code</option>
                    <option value={3}>3 Codes</option>
                    <option value={5}>5 Codes</option>
                    <option value={10}>10 Codes</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-sm shadow-lg shadow-pink-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {isSubmitting ? 'Generating...' : `Generate ${newCodeCount} Code(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PostgreSQL Schema Modal */}
      {isSchemaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">PostgreSQL (psql) Schema Documentation</h3>
              </div>
              <button
                onClick={() => setIsSchemaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              The full PostgreSQL migration file is located at <code className="text-cyan-300">database/schema.sql</code>.
              To connect your real PostgreSQL server, set <code className="text-pink-300">DATABASE_URL</code> in <code className="text-pink-300">.env</code>.
            </p>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 scrollbar-thin">
              <pre>{`-- PostgreSQL (psql) Schema
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    note VARCHAR(255),
    max_uses INTEGER NOT NULL DEFAULT 1,
    current_uses INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE photo_sessions (
    id VARCHAR(64) PRIMARY KEY,
    access_code_id UUID REFERENCES access_codes(id) ON DELETE SET NULL,
    access_code VARCHAR(20),
    image_data TEXT NOT NULL,
    title VARCHAR(100),
    subtitle VARCHAR(100),
    layout VARCHAR(30),
    filter VARCHAR(30),
    frame_color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`}</pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsSchemaModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
