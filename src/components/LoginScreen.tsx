import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins, LogIn, Sparkles, ShieldCheck, LockKeyhole } from 'lucide-react';
import { audio } from '../utils/audio';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = username.trim();
    if (!trimmed) {
      setError('请输入专属登录码');
      audio.playError();
      return;
    }

    setIsLoading(true);

    // Simulate a brief premium loading animation for UX polish
    setTimeout(() => {
      if (trimmed === 'Jerry') {
        audio.playUnlock();
        onLoginSuccess('Jerry');
      } else {
        setError('⚠️ 登录码验证失败，请重新输入或联系家庭管理员！');
        audio.playError();
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" id="login-screen-outer-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-slate-200/80 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden"
      >
        {/* Banner with Icons */}
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-8 text-center relative overflow-hidden">
          {/* Subtle Background Shapes */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-slate-900/10 rounded-full blur-xl translate-x-6 translate-y-6"></div>

          <div className="relative inline-flex items-center justify-center bg-slate-950 p-4 rounded-3xl text-amber-300 shadow-xl mb-4">
            <Coins className="w-8 h-8 animate-spin-slow" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
            家庭金币积分星球 🪐
          </h2>
          <p className="text-xs text-slate-900/80 font-bold mt-1.5">
            让习惯变得更有趣，习惯成长的闪亮旅程！
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 bg-white/40 backdrop-blur-xs">
          <div className="space-y-2 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              安全登录验证
            </span>
            <p className="text-xs text-slate-450 font-medium">
              请输入专属管理验证码进入金币星球
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-700">🔒 登录码</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450">
                <LockKeyhole className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="请输入登录码"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                disabled={isLoading}
                className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/50 rounded-2xl pl-10 pr-4 py-3 text-slate-800 text-sm font-bold placeholder-slate-400 transition-all outline-none"
                id="username-login-input"
              />
            </div>
            <div className="text-[10px] text-slate-400 font-bold leading-relaxed flex items-center gap-1.5 bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100/40 mt-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>温馨提示：请输入管理员提前为您配置和下发的专属登录安全代码。</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg hover:shadow-slate-900/10 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在接入积分星球...
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>立即安全登入</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
