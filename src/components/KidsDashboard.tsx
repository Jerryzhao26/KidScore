/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  CheckCircle, 
  Gift, 
  Trophy, 
  History, 
  Sparkles, 
  Gamepad, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Tv, 
  Bookmark, 
  Star, 
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
  X
} from 'lucide-react';
import { Child, Task, Penalty, Reward, Transaction } from '../types';
import { audio } from '../utils/audio';
import { triggerCoinShower } from './CoinShower';

// Dynamic icon helper to handle user inputs safely
export function TaskRewardIcon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  if (name && (name.startsWith('http://') || name.startsWith('https://') || name.startsWith('data:image/'))) {
    return (
      <img 
        src={name} 
        alt="icon" 
        className={`${className} object-cover rounded-xl shrink-0`} 
        referrerPolicy="no-referrer"
      />
    );
  }
  switch (name ? name.toLowerCase() : '') {
    case 'tv': return <Tv className={className} />;
    case 'book':
    case 'bookopen': return <Bookmark className={className} />;
    case 'game':
    case 'gamepad': return <Gamepad className={className} />;
    case 'coin':
    case 'coins': return <Coins className={className} />;
    case 'star': return <Star className={className} />;
    case 'dollarsign':
    case 'money': return <DollarSign className={className} />;
    case 'clock': return <Clock className={className} />;
    case 'alert':
    case 'trash': return <AlertCircle className={className} />;
    default: return <Sparkles className={className} />;
  }
}

interface KidsDashboardProps {
  children: Child[];
  tasks: Task[];
  penalties?: Penalty[];
  rewards: Reward[];
  transactions: Transaction[];
  activeChildId: string | null;
  onSelectChild: (id: string) => void;
  onCompleteTask: (childId: string, taskId: string, event: React.MouseEvent) => void;
  onRedeemReward: (childId: string, rewardId: string) => boolean; // returns success
  onApplyPenalty?: (childId: string, penaltyId: string, customMemo?: string) => void;
}

export default function KidsDashboard({
  children,
  tasks,
  penalties = [],
  rewards,
  transactions,
  activeChildId,
  onSelectChild,
  onCompleteTask,
  onRedeemReward,
  onApplyPenalty,
}: KidsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'shop' | 'penalties' | 'leaderboard'>('tasks');
  const [insufficientFunds, setInsufficientFunds] = useState<{ rewardId: string; needed: number } | null>(null);
  const [justCompletedTaskId, setJustCompletedTaskId] = useState<string | null>(null);
  const [selectedPenaltyForDeduction, setSelectedPenaltyForDeduction] = useState<Penalty | null>(null);
  const [modalChildId, setModalChildId] = useState<string>('');
  const [modalMemo, setModalMemo] = useState<string>('');

  const activeChild = children.find(c => c.id === activeChildId) || null;

  // Sorting children for leaderboard (highest coin count first)
  const sortedChildren = [...children].sort((a, b) => b.coins - a.coins);

  // Filter transactions for active child or overall
  const activeTransactions = transactions
    .filter(t => !activeChildId || t.childId === activeChildId)
    .slice(0, 15); // Show latest 15 transactions

  const handleTaskClick = (childId: string, task: Task, e: React.MouseEvent) => {
    // 1. Trigger micro state in button
    setJustCompletedTaskId(task.id);
    setTimeout(() => setJustCompletedTaskId(null), 800);

    // 2. Play Audio Cascade
    audio.playCoinCascade(Math.min(3, Math.ceil(task.coins / 3)));

    // 3. Fire absolute canvas particles from click coordinate
    triggerCoinShower(task.coins * 3, e.clientX, e.clientY);

    // 4. Update parent state
    onCompleteTask(childId, task.id, e);
  };

  const handleRedeemClick = (childId: string, reward: Reward) => {
    if (!activeChild) return;

    if (activeChild.coins < reward.coins) {
      // Plays error buzzer
      audio.playError();
      setInsufficientFunds({
        rewardId: reward.id,
        needed: reward.coins - activeChild.coins
      });
      return;
    }

    // Attempt purchase
    const success = onRedeemReward(childId, reward.id);
    if (success) {
      // Play purchase chimes
      audio.playSpend();
      // Small sparkle sprinkle
      triggerCoinShower(5, window.innerWidth / 2, window.innerHeight / 2);
    }
  };

  // Helper translated styles for categories
  const getTaskCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'chore': return { bg: 'bg-emerald-50 text-emerald-600 border border-emerald-200', text: '家务劳动 🧹' };
      case 'study': return { bg: 'bg-blue-50 text-blue-600 border border-blue-200', text: '自主学习 📖' };
      case 'hygiene': return { bg: 'bg-indigo-50 text-indigo-600 border border-indigo-200', text: '个人卫生 🧼' };
      case 'behavior': return { bg: 'bg-amber-50 text-amber-600 border border-amber-200', text: '习惯品德 🌟' };
      default: return { bg: 'bg-slate-50 text-slate-600 border border-slate-200', text: '其他项目 ✨' };
    }
  };

  const getRewardCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'activity': return '好玩活动';
      case 'treat': return '美味零食';
      case 'toy': return '心仪玩具';
      case 'allowance': return '零花福利';
      default: return '其他奖励';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8" id="kids-dashboard-section">
      {/* 👤 Kids Profile Selector Bar - Styled as a wide glass Bento Block */}
      <div className="bento-card p-6 border-slate-200/50 bg-white/70">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2 font-display uppercase">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              小朋友特权人物舱 / Profile Selector
            </h3>
            <p className="text-[11px] text-slate-400 font-medium font-sans">挑选属于你自己的卡通化身，开启习惯大冒险吧</p>
          </div>
          {activeChild && (
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-[10px] bg-amber-50/70 border border-amber-300 text-amber-800 px-3 py-1.5 rounded-full font-bold animate-pulse flex items-center gap-1 font-mono">
                ⚡ 活跃角色: {activeChild.name}
              </div>
              <button
                onClick={() => {
                  onSelectChild('');
                  audio.playUnlock();
                }}
                className="text-[10px] bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-350 text-rose-700 font-extrabold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
              >
                🚪 注销角色 (退出当前)
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {children.map((child) => {
            const isActive = child.id === activeChildId;
            return (
              <motion.button
                key={child.id}
                id={`child-btn-${child.id}`}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelectChild(child.id);
                  audio.playUnlock();
                  triggerCoinShower(4);
                }}
                className={`relative flex flex-col items-center justify-between p-4 rounded-[1.25rem] transition-all duration-300 cursor-pointer text-center ${
                  isActive 
                    ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/50 border-2 border-amber-400 ring-4 ring-amber-100 shadow-[0_12px_24px_rgba(251,191,36,0.12)]' 
                    : 'bg-white/60 hover:bg-white border border-slate-200/70 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Active crown overlay */}
                {isActive && (
                  <motion.div 
                    layoutId="activeCrown"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 p-1 rounded-full shadow-md border-2 border-white"
                    style={{ zIndex: 10 }}
                  >
                    <Trophy className="w-3.5 h-3.5 text-slate-955 font-bold" />
                  </motion.div>
                )}
                
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2 filter drop-shadow-sm transition-transform duration-300 hover:rotate-12">{child.avatar}</span>
                  <span className={`font-extrabold text-sm tracking-tight font-display ${isActive ? 'text-amber-900' : 'text-slate-800'}`}>
                    {child.name}
                  </span>
                </div>

                <div className={`mt-2.5 flex items-center gap-1 px-3 py-1 rounded-full border transition-colors ${
                  isActive 
                    ? 'bg-amber-450/15 border-amber-300 text-amber-700 font-extrabold font-mono' 
                    : 'bg-slate-50 border-slate-100 text-slate-550 font-bold font-mono'
                }`}>
                  <Coins className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="text-xs font-mono">{child.coins} <b className="font-sans text-[11px] font-bold">金币</b></span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {activeChild ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* ================= LEFT / CENTER COLUMN (TASKS & REWARDS) ================= */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            
            {/* 🪙 Coins Balance Card with a Premium Futuristic Reflective Design */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-amber-950 rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-[0_20px_50px_rgba(30,27,75,0.4)] border border-slate-805">
              
              {/* Backglow glow spheres */}
              <div className="absolute right-0 top-0 bg-amber-500/10 w-80 h-80 rounded-full filter blur-[80px] -mr-16 -mt-16 pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 bg-indigo-500/10 w-80 h-80 rounded-full filter blur-[100px] -ml-20 -mb-20 pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:250px_250px] opacity-20 animate-pulse pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                <div className="space-y-2">
                  <span className="text-[10px] sm:text-xs font-extrabold tracking-widest text-amber-450 uppercase bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full inline-block font-mono">
                    👦 小朋友专属金库 Space Card
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight flex items-center gap-2.5">
                    <span>{activeChild.avatar}</span> {activeChild.name}，你好！
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md pt-0.5 font-semibold">
                    今天也要乖乖自律、自主劳动、快乐学习，积累更多帅气金币换取礼特权零用钱奖励哟～ 🪐
                  </p>
                </div>
 
                {/* Big Golden Coin Circle (Interactive) */}
                <motion.div 
                  initial={{ rotateY: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/5 hover:bg-white/10 backdrop-blur-md px-6 py-5 rounded-2xl flex items-center gap-4 border border-white/10 shadow-[inner_0_1px_3px_rgba(255,255,255,0.1)] cursor-pointer self-stretch sm:self-auto justify-center transition-all duration-300 hover:border-amber-400/40"
                  onClick={() => {
                    audio.playCoin();
                    triggerCoinShower(4);
                  }}
                  title="点击爆出金币彩蛋！"
                >
                  <Coins className="w-11 h-11 text-amber-305 drop-shadow-[0_4px_10px_rgba(251,191,36,0.35)] filter shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
                  <div className="text-left font-mono">
                    <span className="text-amber-200 text-[10px] block font-black uppercase tracking-wider font-display">我的小金库余额</span>
                    <span className="text-4xl font-black font-mono leading-none tracking-tight text-white bg-clip-text">
                      {activeChild.coins}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Statistics Row formatted as Bento Grid subsets */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800 text-center sm:text-left">
                <div className="bg-slate-900/40 rounded-xl p-3.5 border border-slate-850 flex flex-col justify-center">
                  <span className="text-slate-400 text-[10px] flex items-center justify-center sm:justify-start gap-1 font-extrabold uppercase">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                    自创星球累计获得
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-400 mt-1">{activeChild.totalEarned} <b className="font-sans text-xs">金币</b></span>
                </div>
                <div className="bg-slate-900/40 rounded-xl p-3.5 border border-slate-850 flex flex-col justify-center">
                  <span className="text-slate-400 text-[10px] flex items-center justify-center sm:justify-start gap-1 font-extrabold uppercase">
                    <Gift className="w-3.5 h-3.5 text-orange-400 font-bold" />
                    商店兑换已消费
                  </span>
                  <span className="text-lg font-black font-mono text-orange-400 mt-1">{activeChild.totalSpent} <b className="font-sans text-xs">金币</b></span>
                </div>
              </div>
            </div>

            {/* 🗄️ Bento Grid Navigation Tab Selector Card */}
            <div className="bg-slate-200/55 backdrop-blur-md p-1.5 rounded-2xl gap-1.5 flex flex-col sm:flex-row shadow-sm border border-slate-200/30">
              <button
                id="tab-tasks-btn"
                onClick={() => {
                  setActiveTab('tasks');
                  audio.playCoin();
                }}
                className={`flex-1 py-3 text-xs md:text-sm font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'bg-white text-slate-800 shadow-sm font-black scale-[1.01]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-505" />
                获取等额金币（日常任务）
              </button>
              <button
                id="tab-shop-btn"
                onClick={() => {
                  setActiveTab('shop');
                  audio.playUnlock();
                }}
                className={`flex-1 py-3 text-xs md:text-sm font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'shop'
                    ? 'bg-white text-slate-800 shadow-sm font-black scale-[1.01]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <Gift className="w-4 h-4 text-indigo-600" />
                金色商店兑换（奖品上新）
              </button>
              <button
                id="tab-penalties-btn"
                onClick={() => {
                  setActiveTab('penalties');
                  audio.playError();
                }}
                className={`flex-1 py-3 text-xs md:text-sm font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'penalties'
                    ? 'bg-white text-rose-700 shadow-sm font-black scale-[1.01]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                行为契约警示（扣分规则）
              </button>
              <button
                id="tab-leaderboard-btn"
                onClick={() => {
                  setActiveTab('leaderboard');
                  audio.playUnlock();
                }}
                className={`flex-1 py-3 text-xs md:text-sm font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'leaderboard'
                    ? 'bg-white text-slate-800 shadow-sm font-black scale-[1.01]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-500 hover:animate-bounce" />
                好孩子光荣榜 👑
              </button>
            </div>

            {/* 🗳️ Tabs Content Panel */}
            <AnimatePresence mode="wait">
              {activeTab === 'tasks' && (
                <motion.div
                  key="tasks-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center px-1">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base font-display">完成日常，领取闪亮金币 🌟</h3>
                      <p className="text-xs text-slate-400 font-medium">做完日常家务和习惯培养，点击“我做完啦”，闪亮金币就会掉落到你的金库里！</p>
                    </div>
                  </div>

                  {tasks.length === 0 ? (
                    <div className="bento-card p-10 text-center text-slate-400 bg-white/50">
                      <CheckCircle className="w-12 h-12 mx-auto text-slate-350 mb-3 animate-pulse" />
                      <p className="text-sm font-extrabold text-slate-705">目前还没有配置任务类型</p>
                      <p className="text-xs text-slate-400 mt-1">请找家长在右上角“家长后台”添加一些家务或学习习惯积分任务吧！</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tasks.map((task) => {
                        const style = getTaskCategoryBadge(task.category);
                        const isCompleting = justCompletedTaskId === task.id;
                        return (
                          <motion.div
                            key={task.id}
                            layoutId={`task-card-${task.id}`}
                            className="bg-white/80 backdrop-blur-md rounded-[1.5rem] border border-slate-200/50 hover:border-amber-450/40 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_30px_rgba(251,191,36,0.06)] transition-all duration-300 flex flex-col justify-between"
                          >
                            <div className="space-y-4">
                              <div className="flex justify-between items-center gap-3">
                                <span className={`text-[10px] md:text-xs px-3 py-1 rounded-full font-extrabold tracking-wide uppercase ${style.bg}`}>
                                  {style.text}
                                </span>
                                
                                <div className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-450 text-slate-900 px-3.5 py-1.5 rounded-2xl text-xs md:text-sm font-black shadow-sm shrink-0 font-mono">
                                  <Coins className="w-4 h-4 text-slate-950 animate-bounce" style={{ animationDuration: '3s' }} />
                                  +{task.coins}
                                </div>
                              </div>

                              <div className="flex gap-4">
                                <div className="bg-amber-100/50 text-amber-500 p-3 rounded-2xl self-start shrink-0">
                                  <TaskRewardIcon name={task.icon} className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-extrabold text-slate-800 text-sm md:text-base font-display">{task.title}</h4>
                                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">{task.description}</p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100/60 flex items-center justify-end">
                              <motion.button
                                whileHover={{ scale: 1.025 }}
                                whileTap={{ scale: 0.975 }}
                                onClick={(e) => handleTaskClick(activeChild.id, task, e)}
                                disabled={isCompleting}
                                className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-350 cursor-pointer ${
                                  isCompleting
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-100/70 hover:border-emerald-250/80'
                                }`}
                              >
                                {isCompleting ? (
                                  <>
                                    <Sparkles className="w-4 h-4 animate-bounce" />
                                    金币落袋啦！ 🎉
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 font-bold" />
                                    我做完啦 （结算金币）
                                  </>
                                )}
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'shop' && (
                <motion.div
                  key="shop-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center px-1">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base font-display">金色商店兑换特权礼包 🍦</h3>
                      <p className="text-xs text-slate-400 font-medium">积累足够的金币，可以直接找到爸爸妈妈兑换奖励奖励和体验福利哦！</p>
                    </div>
                  </div>

                  {/* Insufficient Funds Warning Alert */}
                  {insufficientFunds && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-rose-50 border border-rose-250/50 rounded-2xl p-4 flex gap-3 text-rose-850 relative shadow-sm"
                    >
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-extrabold text-sm font-display text-rose-900">呀！小金库硬币不够哟</h4>
                        <p className="text-xs text-rose-700 mt-1 font-semibold">
                          兑换这个大奖还需要积累 <b className="text-sm font-black mx-1 inline-block text-rose-900 font-mono">{insufficientFunds.needed}</b> 个硬币。
                        </p>
                        <p className="text-[11px] text-rose-500 mt-0.5 font-bold">加油大玩家！去把今天的日常自律任务做完，积攒能量！💪</p>
                      </div>
                      <button 
                        onClick={() => setInsufficientFunds(null)}
                        className="absolute top-3 right-3 text-rose-400 hover:text-rose-800 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-rose-100"
                      >
                        ✕
                      </button>
                    </motion.div>
                  )}

                  {rewards.length === 0 ? (
                    <div className="bento-card p-10 text-center text-slate-400 bg-white/50">
                      <Gift className="w-12 h-12 mx-auto text-slate-350 mb-3 animate-pulse" />
                      <p className="text-sm font-extrabold text-slate-705">金色大奖商店目前空空如也</p>
                      <p className="text-xs text-slate-400 mt-1">快请家长在后台配置看电影电视、零花提现、儿童美味礼包选项！</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rewards.map((reward) => {
                        const label = getRewardCategoryLabel(reward.category);
                        const hasEnough = activeChild.coins >= reward.coins;
                        return (
                          <div
                            key={reward.id}
                            className={`bg-white/80 backdrop-blur-md rounded-[1.5rem] p-5 border transition-all duration-300 flex flex-col justify-between ${
                              hasEnough 
                                ? 'border-indigo-200/60 hover:border-indigo-400/50 hover:shadow-[0_12px_30px_rgba(99,102,241,0.06)] shadow-inner bg-indigo-50/5' 
                                : 'border-slate-200/50 opacity-80 shadow-none'
                            }`}
                          >
                            <div className="space-y-4">
                              <div className="flex justify-between items-center gap-2">
                                <span className={`text-[10px] px-2.5 py-1 font-extrabold rounded-md bg-slate-100/80 text-slate-600 border border-slate-200/30`}>
                                  {label}
                                </span>
                                
                                <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs md:text-sm font-black shadow-sm font-mono shrink-0 ${
                                  hasEnough 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-indigo-50 text-indigo-700 font-extrabold'
                                }`}>
                                  <Coins className="w-4 h-4 text-white" />
                                  {reward.coins}
                                </div>
                              </div>

                              <div className="flex gap-4">
                                <div className="bg-indigo-50 text-indigo-605 p-3 rounded-2xl self-start shrink-0">
                                  <TaskRewardIcon name={reward.icon} className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-extrabold text-slate-800 text-sm md:text-base font-display">{reward.title}</h4>
                                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">{reward.description}</p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100/60 flex items-center justify-end">
                              <motion.button
                                whileHover={{ scale: 1.025 }}
                                whileTap={{ scale: 0.975 }}
                                onClick={() => handleRedeemClick(activeChild.id, reward)}
                                className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-350 cursor-pointer ${
                                  hasEnough
                                    ? 'bg-indigo-650 hover:bg-indigo-700 text-white hover:shadow-indigo-100/30 shadow-indigo-100/10'
                                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200/70'
                                }`}
                              >
                                <Gift className="w-4 h-4 font-bold" />
                                立即积分兑换
                              </motion.button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'penalties' && (
                <motion.div
                  key="penalties-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center px-1">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base font-display flex items-center gap-2 text-rose-800">
                        <ShieldAlert className="w-5 h-5 text-rose-500" />
                        家庭自律契约与减分扣分规则 🚨
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">了解行为规范，避免不小心违规被扣除金币，做知错能改、守约自律的棒孩子！</p>
                    </div>
                  </div>

                  {penalties.length === 0 ? (
                    <div className="bento-card p-10 text-center text-slate-400 bg-white/50">
                      <ShieldAlert className="w-12 h-12 mx-auto text-slate-350 mb-3 animate-pulse" />
                      <p className="text-sm font-extrabold text-slate-705">目前家庭尚未配置任何减分扣分规则</p>
                      <p className="text-xs text-slate-400 mt-1">真棒！保持良好的自主学习和文明礼貌习惯，继续积累闪亮金币吧！</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {penalties.map((penalty) => (
                        <div
                          key={penalty.id}
                          className="bg-rose-50/30 border border-rose-200/60 rounded-[1.5rem] p-5 backdrop-blur-md shadow-xs flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[10px] px-2.5 py-1 font-extrabold rounded-md bg-rose-100 text-rose-700 border border-rose-200/50">
                                行为防线警示 ⚠️
                              </span>
                              
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl text-xs md:text-sm font-black bg-rose-600 text-white font-mono shadow-xs">
                                -{penalty.coins} 金币
                              </div>
                            </div>

                            <div className="flex gap-4 items-center">
                              <div className="bg-rose-100 text-rose-600 p-3 rounded-2xl shrink-0">
                                <TaskRewardIcon name={penalty.icon} className="w-6 h-6" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-slate-800 text-sm md:text-base font-display">{penalty.title}</h4>
                                <p className="text-slate-500 text-xs leading-relaxed font-semibold">{penalty.description}</p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-rose-200/50 mt-4 flex justify-between items-center gap-2">
                            <span className="text-[11px] text-rose-600/80 font-bold">违规处分项目</span>
                            <button
                              onClick={() => {
                                setSelectedPenaltyForDeduction(penalty);
                                setModalChildId(activeChildId || (children.length > 0 ? children[0].id : ''));
                                setModalMemo('');
                                audio.playUnlock();
                              }}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              执行违规扣分
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'leaderboard' && (
                <motion.div
                  key="leaderboard-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2 font-display">
                    <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
                    家庭好孩子光荣富豪榜 👑
                  </h3>

                  <div className="bento-card p-6 border-slate-200/50 bg-white/70 space-y-3">
                    {sortedChildren.map((item, index) => {
                      // Golden, Silver, Bronze badges for top 3
                      const isTop1 = index === 0;
                      const isTop2 = index === 1;
                      const isTop3 = index === 2;

                      let medal = '🏅';
                      let medalBg = 'bg-stone-50 border border-stone-200 text-stone-550';
                      if (isTop1) {
                        medal = '👑 冠军';
                        medalBg = 'bg-yellow-50 text-yellow-705 border border-yellow-250 font-extrabold shadow-[0_2px_8px_rgba(251,191,36,0.1)]';
                      } else if (isTop2) {
                        medal = '🥈 亚军';
                        medalBg = 'bg-slate-100 text-slate-705 border border-slate-250 font-extrabold';
                      } else if (isTop3) {
                        medal = '🥉 季军';
                        medalBg = 'bg-orange-50 text-orange-850 border border-orange-205 font-bold';
                      }

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                            item.id === activeChildId 
                              ? 'bg-amber-50/70 border-2 border-amber-300 ring-2 ring-amber-100 shadow-md' 
                              : 'bg-white/60 hover:bg-white border border-slate-105'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Medal order rank */}
                            <span className={`text-[10px] md:text-xs px-2.5 py-1.5 rounded-xl font-mono font-bold ${medalBg}`}>
                              {medal}
                            </span>

                            <span className="text-3xl filter drop-shadow-sm transition-transform duration-300 hover:scale-110">{item.avatar}</span>
                            
                            <div>
                              <h4 className="font-extrabold text-slate-800 font-display text-sm md:text-base">{item.name}</h4>
                              <p className="text-[11px] text-slate-400 font-semibold">累计自主自律获取过 <b className="text-amber-600 font-mono font-bold mx-0.5">{item.totalEarned}</b> 金币</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-white/90 rounded-2xl px-4 py-2 border border-slate-200/50 shadow-sm font-mono font-black text-amber-600 hover:text-amber-700 transition-colors">
                            <Coins className="w-4 h-4 text-amber-500" />
                            {item.coins}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* ================= RIGHT SIDEBAR (HISTORY FEED FOR SELECTED CHILD) ================= */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white/85 backdrop-blur-md rounded-[2rem] border border-slate-200/60 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2 font-display text-sm md:text-base">
                    <History className="w-4.5 h-4.5 text-indigo-500" />
                    金币账户历史明细
                  </h3>
                  <span className="text-[10px] font-extrabold bg-indigo-50 border border-indigo-150/40 px-3 py-1 rounded-full text-indigo-700 font-mono">
                    {activeChild.name}
                  </span>
                </div>

                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  {activeTransactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Clock className="w-10 h-10 mx-auto text-slate-200 mb-3 animate-pulse" />
                      <p className="text-xs font-semibold text-slate-500 leading-normal">目前还没有产生任何金币流水噢，<br />快去完成你的日常任务攒币吧！✨</p>
                    </div>
                  ) : (
                    activeTransactions.map((tx) => {
                      const isEarn = tx.type === 'earn';
                      const isSpend = tx.type === 'spend';
                      const isDeduct = tx.type === 'deduct';
                      const isAdjust = tx.type === 'parent_adjust';

                      let badgeColor = 'bg-stone-50 border-stone-200';
                      let amountPrefix = '';
                      let labelColor = 'text-slate-600';

                      if (isEarn) {
                        badgeColor = 'bg-emerald-50 text-emerald-707 border-emerald-250';
                        amountPrefix = '+';
                        labelColor = 'text-emerald-707';
                      } else if (isSpend) {
                        badgeColor = 'bg-indigo-50 text-indigo-707 border-indigo-200';
                        amountPrefix = '-';
                        labelColor = 'text-indigo-707';
                      } else if (isDeduct) {
                        badgeColor = 'bg-rose-50 text-rose-700 border-rose-250 font-bold';
                        amountPrefix = '-';
                        labelColor = 'text-rose-700 font-extrabold';
                      } else if (isAdjust) {
                        badgeColor = 'bg-indigo-50 text-indigo-707 border-indigo-200';
                        amountPrefix = tx.amount >= 0 ? '+' : '';
                        labelColor = tx.amount >= 0 ? 'text-indigo-707' : 'text-rose-707';
                      }

                      // Short dates formats: e.g. "05/30 14:23"
                      const dateObj = new Date(tx.timestamp);
                      const displayDate = isNaN(dateObj.getTime())
                        ? '刚不久'
                        : `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

                      return (
                        <div key={tx.id} className="text-xs flex justify-between gap-3 items-start border-b border-dashed border-slate-100 pb-3 hover:bg-slate-50/40 p-1 rounded-md transition-colors">
                          <div className="space-y-1">
                            <p className="text-slate-700 font-extrabold leading-normal text-[11px] md:text-xs">
                              {tx.description}
                            </p>
                            <span className="text-[10px] text-slate-400 block font-mono font-semibold">
                              {displayDate}
                            </span>
                          </div>
                          
                          <span className={`font-mono font-extrabold px-2.5 py-0.5 rounded-lg shrink-0 border ${badgeColor} ${labelColor}`}>
                            {amountPrefix}{tx.amount}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Decorative encouragement banner */}
              <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/30 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="text-3xl shrink-0 animate-bounce" style={{ animationDuration: '4s' }}>🌱</div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-800 font-display">培养自我管理，大玩家加油</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    爸爸妈妈每天会悉心审核数据，用汗水换取的奖励更香甜！
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      ) : (
        <div className="bento-card p-12 text-center text-slate-500 max-w-xl mx-auto bg-white/80">
          <div className="text-5xl mb-4 animate-bounce">👋</div>
          <h3 className="text-lg font-black text-slate-800 font-display">
            家庭金币积分管理太空舱！
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6 font-semibold leading-relaxed">
            请在上方选择你的专属卡通萌化身角色 Profile，进入属于你的金库太空台、百宝商店和光荣榜吧！
          </p>
          
          {children.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                onSelectChild(children[0].id);
                audio.playUnlock();
              }}
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-300/35 transition-all cursor-pointer border border-amber-450/20"
            >
              一键降临大玩家：{children[0].name}
            </motion.button>
          )}
        </div>
      )}

      {/* Execute Behavior Contract Deduction Modal */}
      <AnimatePresence>
        {selectedPenaltyForDeduction && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-100 overflow-hidden"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2 font-display">
                  <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                  执行行为契约扣分 🚨
                </h3>
                <button
                  onClick={() => setSelectedPenaltyForDeduction(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-rose-50/80 border border-rose-200/60 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="bg-rose-100 text-rose-600 p-3 rounded-2xl shrink-0 border border-rose-200">
                  <TaskRewardIcon name={selectedPenaltyForDeduction.icon} className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-800 text-sm truncate">{selectedPenaltyForDeduction.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{selectedPenaltyForDeduction.description}</p>
                </div>
                <div className="text-rose-600 font-black text-sm bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-2xs font-mono shrink-0">
                  -{selectedPenaltyForDeduction.coins} 金币
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 mb-1.5 font-extrabold">1. 选择违规处分对象：</label>
                  <select
                    value={modalChildId}
                    onChange={(e) => setModalChildId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-bold outline-none focus:border-rose-500 transition-all"
                  >
                    <option value="">-- 请选择受处分的小朋友 --</option>
                    {children.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.avatar} {c.name} (当前余额: {c.coins} 金币)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5 font-extrabold">2. 补充说明违规事实（可选）：</label>
                  <input
                    type="text"
                    value={modalMemo}
                    onChange={(e) => setModalMemo(e.target.value)}
                    placeholder="例：玩游戏超时20分钟 / 拿零食未归位"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 outline-none focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPenaltyForDeduction(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={!modalChildId}
                  onClick={() => {
                    if (onApplyPenalty && modalChildId && selectedPenaltyForDeduction) {
                      onApplyPenalty(modalChildId, selectedPenaltyForDeduction.id, modalMemo.trim());
                    }
                    setSelectedPenaltyForDeduction(null);
                  }}
                  className={`px-5 py-2.5 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                    !modalChildId
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95 shadow-rose-200'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  确认扣除 -{selectedPenaltyForDeduction.coins} 金币
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
