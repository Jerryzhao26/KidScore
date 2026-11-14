/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ListTodo, 
  ShoppingBag, 
  FileText, 
  Plus, 
  Trash2, 
  Sparkles, 
  Coins, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  PlusCircle, 
  MinusCircle, 
  AlertCircle,
  RotateCcw,
  Sliders,
  Check,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { Child, Task, Penalty, Reward, Transaction } from '../types';
import { audio } from '../utils/audio';
import { triggerCoinShower } from './CoinShower';
import { TaskRewardIcon } from './KidsDashboard';

interface ParentConsoleProps {
  children: Child[];
  tasks: Task[];
  penalties: Penalty[];
  rewards: Reward[];
  transactions: Transaction[];
  onAddChild: (name: string, avatar: string) => void;
  onDeleteChild: (id: string) => void;
  onUpdateChildCoins: (id: string, amount: number, memo: string) => void;
  onAwardTask: (childId: string, taskId: string) => void;
  
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onDeleteTask: (id: string) => void;
  
  onAddPenalty: (penalty: Omit<Penalty, 'id'>) => void;
  onDeletePenalty: (id: string) => void;
  onApplyPenalty: (childId: string, penaltyId: string, memo?: string) => void;

  onAddReward: (reward: Omit<Reward, 'id'>) => void;
  onDeleteReward: (id: string) => void;
  onMoveReward: (id: string, direction: 'up' | 'down') => void;
  
  onClearTransactions: () => void;
}

export default function ParentConsole({
  children,
  tasks,
  penalties,
  rewards,
  transactions,
  onAddChild,
  onDeleteChild,
  onUpdateChildCoins,
  onAwardTask,
  onAddTask,
  onDeleteTask,
  onAddPenalty,
  onDeletePenalty,
  onApplyPenalty,
  onAddReward,
  onDeleteReward,
  onMoveReward,
  onClearTransactions,
}: ParentConsoleProps) {
  // Parent Verification Gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [mathProblem, setMathProblem] = useState<{ num1: number; num2: number; answer: number }>({ num1: 0, num2: 0, answer: 0 });
  const [parentCodeInput, setParentCodeInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Audio Toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(audio.isSoundEnabled());

  // Active sub-section
  const [activeSubTab, setActiveSubTab] = useState<'kids' | 'tasks' | 'penalties' | 'rewards' | 'transactions'>('kids');

  // New Child Form States
  const [newChildName, setNewChildName] = useState<string>('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🦊');

  // Manual Coin Adjustment Form States
  const [adjustTargetChildId, setAdjustTargetChildId] = useState<string>('');
  const [adjustAmount, setAdjustAmount] = useState<number>(5);
  const [adjustMemo, setAdjustMemo] = useState<string>('');
  const [coinAdjustSuccess, setCoinAdjustSuccess] = useState<string | null>(null);
  const [awardTargetChildId, setAwardTargetChildId] = useState('');
  const [awardTaskId, setAwardTaskId] = useState('');

  // New Task Form States
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDesc, setTaskDesc] = useState<string>('');
  const [taskCoins, setTaskCoins] = useState<number>(5);
  const [taskCategory, setTaskCategory] = useState<'chore' | 'study' | 'hygiene' | 'behavior' | 'other'>('chore');
  const [taskIcon, setTaskIcon] = useState<string>('star');

  // New Penalty Form States
  const [penaltyTitle, setPenaltyTitle] = useState<string>('');
  const [penaltyDesc, setPenaltyDesc] = useState<string>('');
  const [penaltyCoins, setPenaltyCoins] = useState<number>(3);
  const [penaltyCategory, setPenaltyCategory] = useState<'behavior' | 'study' | 'chore' | 'other'>('behavior');
  const [penaltyIcon, setPenaltyIcon] = useState<string>('alert');

  // Quick Execute Penalty States
  const [execChildId, setExecChildId] = useState<string>('');
  const [execPenaltyId, setExecPenaltyId] = useState<string>('');
  const [execMemo, setExecMemo] = useState<string>('');

  // New Reward Form States
  const [rewardTitle, setRewardTitle] = useState<string>('');
  const [rewardDesc, setRewardDesc] = useState<string>('');
  const [rewardCoins, setRewardCoins] = useState<number>(15);
  const [rewardCategory, setRewardCategory] = useState<'activity' | 'treat' | 'toy' | 'allowance' | 'other'>('activity');
  const [rewardIcon, setRewardIcon] = useState<string>('gift');
  const [iconType, setIconType] = useState<'preset' | 'custom_image'>('preset');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');

  // Custom interactive confirmation Modal state for sandboxed iframe compatibility
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
  } | null>(null);

  // Generate math prompt upon mounting
  const generateMathProblem = () => {
    const list = [
      { n1: 7, n2: 8, r: 56 },
      { n1: 6, n2: 9, r: 54 },
      { n1: 8, n2: 9, r: 72 },
      { n1: 5, n2: 9, r: 45 },
      { n1: 7, n2: 6, r: 42 },
      { n1: 8, n2: 4, r: 32 }
    ];
    const picked = list[Math.floor(Math.random() * list.length)];
    setMathProblem({ num1: picked.n1, num2: picked.n2, answer: picked.r });
    setParentCodeInput('');
    setAuthError('');
  };

  useEffect(() => {
    if (!isAuthenticated) {
      generateMathProblem();
    }
  }, [isAuthenticated]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const ans = parseInt(parentCodeInput, 10);
    if (ans === mathProblem.answer || parentCodeInput === '8888') {
      setIsAuthenticated(true);
      audio.playUnlock();
      triggerCoinShower(10);
    } else {
      audio.playError();
      setAuthError('验证算式错误，请重试！(提示：如果是紧急调试，可输入8888通关)');
      setParentCodeInput('');
    }
  };

  // Sound switch toggle
  const toggleSoundConfig = () => {
    const nextVal = !soundEnabled;
    audio.toggleSound(nextVal);
    setSoundEnabled(nextVal);
    if (nextVal) {
      audio.playCoin();
    }
  };

  // Add child submission handler
  const handleAddChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;
    onAddChild(newChildName.trim(), selectedEmoji);
    setNewChildName('');
    audio.playUnlock();
    setCoinAdjustSuccess('添加新卡通角色成功！');
    setTimeout(() => setCoinAdjustSuccess(null), 3000);
  };

  // Manual coin adjust submit
  const handleCoinAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetChildId) {
      setAuthError('请先选择一个孩子账号');
      return;
    }
    onUpdateChildCoins(adjustTargetChildId, adjustAmount, adjustMemo.trim() || '家长根据日常表现手动微调');
    
    // Success feedback
    audio.playTriumph();
    triggerCoinShower(Math.abs(adjustAmount) * 2);
    setCoinAdjustSuccess('金币额度调整成功！');
    setAdjustMemo('');
    setTimeout(() => setCoinAdjustSuccess(null), 3000);
  };

  const handleAwardTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardTargetChildId || !awardTaskId) return;
    const child = children.find(item => item.id === awardTargetChildId);
    const task = tasks.find(item => item.id === awardTaskId);
    onAwardTask(awardTargetChildId, awardTaskId);
    setCoinAdjustSuccess(`已按“${task?.title || '预设任务'}”为 ${child?.name || '小朋友'} 直接加分。`);
    setTimeout(() => setCoinAdjustSuccess(null), 3000);
  };

  // New task submission
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDesc.trim()) return;
    onAddTask({
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      coins: taskCoins,
      category: taskCategory,
      icon: taskIcon,
    });
    setTaskTitle('');
    setTaskDesc('');
    audio.playUnlock();
  };

  // New penalty submission
  const handleAddPenaltySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!penaltyTitle.trim() || !penaltyDesc.trim()) return;
    onAddPenalty({
      title: penaltyTitle.trim(),
      description: penaltyDesc.trim(),
      coins: penaltyCoins,
      category: penaltyCategory,
      icon: penaltyIcon,
    });
    setPenaltyTitle('');
    setPenaltyDesc('');
    audio.playUnlock();
    setCoinAdjustSuccess('已成功创建减分扣分规则！');
    setTimeout(() => setCoinAdjustSuccess(null), 3000);
  };

  // Execute penalty submission
  const handleApplyPenaltySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!execChildId || !execPenaltyId) return;
    onApplyPenalty(execChildId, execPenaltyId, execMemo.trim());
    setExecMemo('');
    setCoinAdjustSuccess('已成功登记小朋友的违规扣分！');
    setTimeout(() => setCoinAdjustSuccess(null), 3000);
  };

  // New reward submission
  const handleAddRewardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle.trim() || !rewardDesc.trim()) return;
    onAddReward({
      title: rewardTitle.trim(),
      description: rewardDesc.trim(),
      coins: rewardCoins,
      category: rewardCategory,
      icon: rewardIcon,
    });
    setRewardTitle('');
    setRewardDesc('');
    setRewardIcon('gift');
    setIconType('preset');
    setCustomImageUrl('');
    audio.playUnlock();
  };

  // Kids avatar list for selection
  const CHILDREN_EMOJIS = ['🦊', '🐱', '🐼', '🐯', '🐨', '🦁', '🦖', '🦄', '🐰', '🐷'];

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 p-8 shadow-xl text-center" id="parent-gate">
        <div className="bg-amber-100 text-amber-600 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Lock className="w-8 h-8" />
        </div>
        
        <h2 className="text-xl font-extrabold text-slate-800">🧸 锁定的家长控制台</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
          为了确保金币发放公平公正，进入后台需要先通过快速心算问答（防调皮的小朋友自行修改金币）。
        </p>

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
            <span className="text-xs text-slate-400 font-bold tracking-wider block uppercase mb-1">
              请回答心算题目：
            </span>
            <span className="text-3xl font-black text-slate-800 tracking-wider">
              {mathProblem.num1} × {mathProblem.num2} = ?
            </span>
          </div>

          <div className="space-y-1">
            <input
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder="请输入乘法结果"
              value={parentCodeInput}
              onChange={(e) => setParentCodeInput(e.target.value)}
              className="w-full text-center text-lg font-bold py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:border-amber-400"
              required
              autoFocus
            />
            {authError && (
              <p className="text-red-500 text-[11px] leading-tight flex items-center gap-1 mt-1 justify-center">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                {authError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            解锁家长后台控制面板
          </button>
        </form>

        <div className="mt-6 text-[10px] text-slate-400">
          小贴士：家长可全权在此管理获取金币任务及兑换奖励项目
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="parent-console-panel">
      
      {/* 🚀 Top System Control & Navigation Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-white p-1 rounded-full text-[10px] font-black animate-pulse">
                LIVE
              </span>
              <h2 className="text-xl font-bold flex items-center gap-1.5">
                <Sliders className="w-5 h-5 text-amber-400" /> Parent Console 家长设置后台
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              在此添加或编辑日常家务、自主学习等加金币项目，以及兑换的零花钱、好玩经历。
            </p>
          </div>

          {/* Action buttons (Global mute and close admin) */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSoundConfig}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                soundEnabled 
                  ? 'bg-amber-400/10 border-amber-400/30 text-amber-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4" /> Sound FX On (音效已开)
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" /> Quiet Mode (静音模式)
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                audio.playError();
              }}
              className="bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer"
            >
              🔒 锁定并退出后台
            </button>
          </div>
        </div>

        {/* Console Nav Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-slate-800">
          <button
            onClick={() => { setActiveSubTab('kids'); audio.playUnlock(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'kids' ? 'bg-amber-400 text-slate-950 font-black' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            小朋友账号
          </button>

          <button
            onClick={() => { setActiveSubTab('tasks'); audio.playUnlock(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'tasks' ? 'bg-amber-400 text-slate-950 font-black' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            日常获取金币任务列表 ({tasks.length})
          </button>

          <button
            onClick={() => { setActiveSubTab('rewards'); audio.playUnlock(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'rewards' ? 'bg-amber-400 text-slate-950 font-black' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            金色大奖商店项目 ({rewards.length})
          </button>

          <button
            onClick={() => { setActiveSubTab('penalties'); audio.playUnlock(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'penalties' ? 'bg-rose-500 text-white font-black shadow-md' : 'hover:bg-slate-800 text-rose-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            减分扣分规则项目 ({penalties.length})
          </button>

          <button
            onClick={() => { setActiveSubTab('transactions'); audio.playUnlock(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'transactions' ? 'bg-amber-400 text-slate-950 font-black' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            全局账单流水 ({transactions.length})
          </button>
        </div>
      </div>

      {coinAdjustSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl flex items-center gap-2 text-sm font-bold"
        >
          <Check className="w-4 h-4 text-emerald-600 bg-emerald-200 rounded-full p-0.5" />
          {coinAdjustSuccess}
        </motion.div>
      )}

      {/* 🔮 Active Sub-Tab Layout Content */}
      <AnimatePresence mode="wait">
        
        {/* SUBTAB 1: MANAGING THE KIDS AND MANUAL COIN ADJUSTMENTS */}
        {activeSubTab === 'kids' && (
          <motion.div
            key="subtab-kids"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left: Kids list configurator */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
              <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3">
                👨‍👩‍👧‍👦 已激活的小朋友角色列表
              </h3>

              {children.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm">尚未创建任何玩角色账户</p>
                  <p className="text-xs text-slate-400 mt-1">请在右侧表单中输入名字并创建您的第一个孩子 profile 吧！</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {children.map((child) => (
                    <div 
                      key={child.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-4xl filter drop-shadow-sm">{child.avatar}</span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                            {child.name}
                            <span className="text-[10px] bg-slate-200/60 font-semibold text-slate-500 px-2 py-0.5 rounded-full font-mono">
                              ID: {child.id.substring(0, 5)}
                            </span>
                          </h4>
                          <div className="flex gap-4 mt-0.5 text-xs text-slate-500 font-mono">
                            <span>金库: <b className="text-amber-600 font-bold">{child.coins}金币</b></span>
                            <span>•</span>
                            <span>累计获取: {child.totalEarned}</span>
                            <span>•</span>
                            <span>累计花费: {child.totalSpent}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: '确认注销角色账号吗？',
                            message: `确定要注销并永久清除 "${child.name}" 的所有数据吗？此操作不可逆，该角色积累的全部金币及流水都会一并抹除！`,
                            confirmText: '确定注销',
                            cancelText: '我再想想',
                            type: 'danger',
                            onConfirm: () => {
                              onDeleteChild(child.id);
                              audio.playError();
                            }
                          });
                        }}
                        className="text-slate-400 hover:text-red-500 py-1.5 px-3 rounded-xl border border-slate-200 hover:border-red-100 hover:bg-red-50/50 transition-all text-xs flex items-center gap-1 shrink-0 self-end sm:self-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 注销账号
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Form: Direct Manual Coins Adjustment & Add Child */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Box A: Direct Coin Adjust Tool */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  手动微调金币点数 (惩罚或临时奖励)
                </h3>

                <form onSubmit={handleCoinAdjustSubmit} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="text-slate-500 mb-1.5 block">1. 选择发放/扣除的小朋友：</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700 outline-none"
                      value={adjustTargetChildId}
                      onChange={(e) => setAdjustTargetChildId(e.target.value)}
                      required
                    >
                      <option value="">-- 请选择小朋友 --</option>
                      {children.map(c => (
                        <option key={c.id} value={c.id}>{c.avatar} {c.name} (当前余额: {c.coins}金币)</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 mb-1.5 block">2. 微调分值 (正负均可)：</label>
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => setAdjustAmount(prev => prev - 1)}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          className="w-full text-center font-bold font-mono outline-none text-slate-800"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setAdjustAmount(prev => prev + 1)}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 mb-1.5 block">快捷设置：</label>
                      <div className="flex gap-1.5 pt-0.5 justify-around flex-wrap">
                        <button
                          type="button"
                          onClick={() => setAdjustAmount(5)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg cursor-pointer"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustAmount(15)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg cursor-pointer"
                        >
                          +15
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustAmount(-5)}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-lg cursor-pointer"
                        >
                          -5
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 mb-1.5 block">3. 调整理由/日志说明 (会展示给小朋友)：</label>
                    <input
                      type="text"
                      placeholder="例：今天非常懂礼貌，或者帮忙打扫了额外区域"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none placeholder-slate-400"
                      value={adjustMemo}
                      onChange={(e) => setAdjustMemo(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-bold text-center text-sm shadow-sm cursor-pointer border transition-all flex items-center justify-center gap-1.5 text-white bg-slate-800 hover:bg-slate-900 border-slate-800"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    确定执行金币增减调整
                  </button>
                </form>
              </div>

              {/* Box B: Create Child Profile Form */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  注册新小朋友账号
                </h3>

                <form onSubmit={handleAddChildSubmit} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="text-slate-500 mb-1.5 block">1. 小朋友姓名：</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none"
                      placeholder="例如：小美、小小明"
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 mb-1.5 block">2. 选择专属卡通萌宠 (点击更换)：</label>
                    <div className="flex flex-wrap gap-2 justify-start">
                      {CHILDREN_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => { setSelectedEmoji(emoji); audio.playCoin(); }}
                          className={`text-2xl p-2 rounded-xl transition-all border outline-none cursor-pointer ${
                            selectedEmoji === emoji 
                              ? 'bg-amber-100 border-amber-300 scale-110 shadow-sm' 
                              : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-center text-sm shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    确定创建本卡通角色
                  </button>
                </form>
              </div>

            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: MANAGING TASKS (获得金币的项目随时增减与设定) */}
        {activeSubTab === 'tasks' && (
          <motion.div
            key="subtab-tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-12 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-amber-50 p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                <div className="lg:w-1/3">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" /> 按预设任务直接奖励
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">家长确认孩子已完成任务后可直接加分，并自动写入交易流水，无需再次审核。</p>
                </div>
                <form onSubmit={handleAwardTaskSubmit} className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto] gap-3 text-xs">
                  <select
                    value={awardTargetChildId}
                    onChange={(event) => setAwardTargetChildId(event.target.value)}
                    className="bg-white border border-emerald-200 rounded-xl p-3 font-bold text-slate-700 outline-none"
                    required
                  >
                    <option value="">选择小朋友</option>
                    {children.map(child => <option key={child.id} value={child.id}>{child.avatar} {child.name}</option>)}
                  </select>
                  <select
                    value={awardTaskId}
                    onChange={(event) => setAwardTaskId(event.target.value)}
                    className="bg-white border border-emerald-200 rounded-xl p-3 font-bold text-slate-700 outline-none"
                    required
                  >
                    <option value="">选择已完成的任务</option>
                    {tasks.map(task => <option key={task.id} value={task.id}>{task.title}（+{task.coins}）</option>)}
                  </select>
                  <button
                    type="submit"
                    disabled={!awardTargetChildId || !awardTaskId}
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    立即奖励
                  </button>
                </form>
              </div>
            </div>
            {/* Left side list of Tasks */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3">
                📋 目前配置的日常金币任务
              </h3>

              {tasks.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  目前空空如也，请在右侧侧边栏中添加日常给金币的家务或表现。
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      className="flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl gap-4 hover:border-slate-200 transition-all"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="bg-amber-50 text-amber-600 p-2 rounded-xl shrink-0 w-11 h-11 flex items-center justify-center overflow-hidden border border-amber-100">
                          <TaskRewardIcon name={task.icon} className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            {task.title}
                            <span className="text-[10px] font-black bg-amber-400 text-slate-900 px-2 rounded-full font-mono">
                              +{task.coins}金币
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-md">{task.description}</p>
                          <span className="inline-block mt-1 text-[10px] font-semibold uppercase bg-slate-200/60 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                            类别: {task.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onDeleteTask(task.id);
                          audio.playError();
                        }}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-xl border border-slate-200 hover:border-red-100 hover:bg-rose-50 transition-all shrink-0 cursor-pointer"
                        title="删除该任务设定"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right side form to create custom Task */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-1">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
                新增金币任务设定
              </h3>

              <form onSubmit={handleAddTaskSubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="text-slate-500 mb-1.5 block">1. 任务标题/名称：</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none"
                    placeholder="例如：收拾书包和收拾书桌"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-500 mb-1.5 block">2. 任务要求/说明：</label>
                  <textarea
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none"
                    placeholder="例如：整理好课本、把垃圾丢进垃圾桶、擦拭书桌干净"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 mb-1.5 block">3. 设置奖励的金币数量：</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 font-bold outline-none font-mono"
                      value={taskCoins}
                      onChange={(e) => setTaskCoins(parseInt(e.target.value, 10) || 1)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 mb-1.5 block">4. 任务类别：</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none"
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value as any)}
                    >
                      <option value="chore">家务劳动 🧹</option>
                      <option value="study">自主学习 📖</option>
                      <option value="hygiene">个人卫生 🧼</option>
                      <option value="behavior">行为品德 🌟</option>
                      <option value="other">其他加分项 ✨</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 mb-1.5 block">5. 专属视觉图标 (Icon)：</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none"
                    value={taskIcon}
                    onChange={(e) => setTaskIcon(e.target.value)}
                  >
                    <option value="coins">金币/钱币 (Coins)</option>
                    <option value="bookopen">书籍/学习 (Book)</option>
                    <option value="gamepad">游戏/游乐 (Gamepad)</option>
                    <option value="clock">时间/效率 (Clock)</option>
                    <option value="tv">影院/屏幕 (Tv)</option>
                    <option value="star">星星/好习惯 (Star)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 border border-slate-800 text-white rounded-xl font-bold text-center text-sm shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 确定发布此任务设定
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: MANAGING REWARDS (花费金币的项目随时增减与设定) */}
        {activeSubTab === 'rewards' && (
          <motion.div
            key="subtab-rewards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left side list of Rewards */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3">
                🎁 金利大奖商店正在上架的奖品
              </h3>

              {rewards.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  目前商店空空如也，请在右侧侧边栏中上架精美零花和体验。
                </div>
              ) : (
                <div className="space-y-4">
                  {rewards.map((reward, index) => (
                    <div 
                      key={reward.id}
                      className="flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl gap-4 hover:border-slate-200 transition-all"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl shrink-0 w-11 h-11 flex items-center justify-center overflow-hidden border border-indigo-100">
                          <TaskRewardIcon name={reward.icon} className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            {reward.title}
                            <span className="text-[10px] font-black bg-indigo-500 text-white px-2 rounded-full font-mono">
                              售价: {reward.coins}金币
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-md">{reward.description}</p>
                          <span className="inline-block mt-1 text-[10px] font-semibold bg-stone-200/60 text-stone-500 px-2 py-0.5 rounded-full font-mono">
                            大类: {reward.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* 排序微调按钮 */}
                        <div className="flex flex-col gap-1 items-center bg-slate-100/80 border border-slate-200/60 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => onMoveReward(reward.id, 'up')}
                            disabled={index === 0}
                            className={`p-1 rounded-md transition-all ${
                              index === 0
                                ? 'text-slate-300 pointer-events-none'
                                : 'text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-xs cursor-pointer'
                            }`}
                            title="向上移动"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveReward(reward.id, 'down')}
                            disabled={index === rewards.length - 1}
                            className={`p-1 rounded-md transition-all ${
                              index === rewards.length - 1
                                ? 'text-slate-300 pointer-events-none'
                                : 'text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-xs cursor-pointer'
                            }`}
                            title="向下移动"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            onDeleteReward(reward.id);
                            audio.playError();
                          }}
                          className="text-slate-400 hover:text-red-500 p-2 rounded-xl border border-slate-200 hover:border-red-100 hover:bg-rose-50 transition-all shrink-0 cursor-pointer"
                          title="下架此奖品"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right side form to create Reward */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-1">
                <PlusCircle className="w-5 h-5 text-indigo-500" />
                新增大奖上架
              </h3>

              <form onSubmit={handleAddRewardSubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="text-slate-500 mb-1.5 block">1. 奖品名称：</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none"
                    placeholder="例如：玩iPad 30分钟、周末游乐园"
                    value={rewardTitle}
                    onChange={(e) => setRewardTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-500 mb-1.5 block">2. 兑换说明及细节限制：</label>
                  <textarea
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none"
                    placeholder="例如：用于看电视电脑。需要在一周内兑换，不可和学习时间冲突"
                    value={rewardDesc}
                    onChange={(e) => setRewardDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 mb-1.5 block">3. 兑换所需的金币价格：</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 font-bold outline-none font-mono"
                      value={rewardCoins}
                      onChange={(e) => setRewardCoins(parseInt(e.target.value, 10) || 1)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 mb-1.5 block">4. 奖品分类：</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none"
                      value={rewardCategory}
                      onChange={(e) => setRewardCategory(e.target.value as any)}
                    >
                      <option value="activity">玩乐体验 🎠</option>
                      <option value="treat">美味甜点 🍦</option>
                      <option value="toy">玩具大礼 🧸</option>
                      <option value="allowance">零花钱提现 💵</option>
                      <option value="other">其他特权 ✨</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 mb-1.5 block">5. 奖品大图图标 (Icon/自定义图片)：</label>
                  
                  {/* Icon type selection tabs */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIconType('preset');
                        setRewardIcon('gift');
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-[11px] font-extrabold transition-all cursor-pointer ${
                        iconType === 'preset'
                          ? 'bg-indigo-55 bg-indigo-50 border-indigo-200 text-indigo-650'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      🎪 选择预设分类图标
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIconType('custom_image');
                        setRewardIcon(customImageUrl || '');
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-[11px] font-extrabold transition-all cursor-pointer ${
                        iconType === 'custom_image'
                          ? 'bg-indigo-55 bg-indigo-50 border-indigo-200 text-indigo-650'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      🖼️ 自定义图片/上传
                    </button>
                  </div>

                  {iconType === 'preset' ? (
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none"
                      value={rewardIcon}
                      onChange={(e) => setRewardIcon(e.target.value)}
                    >
                      <option value="gift">礼物包装 (Gift)</option>
                      <option value="tv">影院屏幕 (Tv)</option>
                      <option value="gamepad">游戏配件 (Gamepad)</option>
                      <option value="clock">特权钟表 (Clock)</option>
                      <option value="money">零钱红包 (Money)</option>
                      <option value="star">徽章奖励 (Star)</option>
                    </select>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none font-mono text-[11px]"
                          placeholder="输入外部图片链接 (http://... 或 https://...)"
                          value={customImageUrl}
                          onChange={(e) => {
                            setCustomImageUrl(e.target.value);
                            setRewardIcon(e.target.value);
                          }}
                        />
                      </div>
                      
                      {/* Image direct file uploader via HTML FileReader */}
                      <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all text-center relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                setCustomImageUrl(base64);
                                setRewardIcon(base64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div className="text-[10px] text-slate-550 space-y-1">
                          <p className="font-extrabold text-indigo-600">🗂️ 点击此处选择本地图片上传</p>
                          <p className="font-medium text-slate-400">支持 JPG, PNG, GIF, SVG (会自动大小缩放)</p>
                        </div>
                      </div>

                      {rewardIcon && (rewardIcon.startsWith('http') || rewardIcon.startsWith('data:image/')) && (
                        <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-2">
                          <img
                            src={rewardIcon}
                            alt="Reward icon preview"
                            className="w-10 h-10 object-cover rounded-xl border border-white shrink-0 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-[10px] font-extrabold text-emerald-800">✅ 缩放预览正常</p>
                            <p className="text-[9px] text-slate-400 max-w-[170px] truncate">{rewardIcon}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-center text-sm shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 确定上架此商店奖品
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: MANAGING PENALTY & DEDUCTION RULES */}
        {activeSubTab === 'penalties' && (
          <motion.div
            key="subtab-penalties"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick Penalty Execution Panel */}
            <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 rounded-2xl p-6 text-white border border-rose-800/50 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                <h3 className="font-extrabold text-base text-rose-100 font-display">⚡ 快捷记录违规扣分事务</h3>
              </div>
              <p className="text-xs text-rose-300/80 mb-4 font-medium">当小朋友出现行为失控、违规或不守约定时，可在此直接扣除对应金币并记入档案。</p>

              <form onSubmit={handleApplyPenaltySubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-3">
                  <label className="text-rose-200 block mb-1 font-extrabold">1. 选择小朋友：</label>
                  <select
                    required
                    value={execChildId}
                    onChange={(e) => setExecChildId(e.target.value)}
                    className="w-full bg-slate-800/90 border border-rose-700/60 rounded-xl p-2.5 text-white outline-none focus:border-rose-400"
                  >
                    <option value="">-- 请选择受处分成员 --</option>
                    {children.map(c => (
                      <option key={c.id} value={c.id}>{c.avatar} {c.name} (当前: {c.coins}金币)</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="text-rose-200 block mb-1 font-extrabold">2. 选择违规扣分项：</label>
                  <select
                    required
                    value={execPenaltyId}
                    onChange={(e) => setExecPenaltyId(e.target.value)}
                    className="w-full bg-slate-800/90 border border-rose-700/60 rounded-xl p-2.5 text-white outline-none focus:border-rose-400"
                  >
                    <option value="">-- 请选择违规扣分规则 --</option>
                    {penalties.map(p => (
                      <option key={p.id} value={p.id}>{p.title} (-{p.coins} 金币)</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-rose-200 block mb-1 font-extrabold">3. 补充具体原因 (可选)：</label>
                  <input
                    type="text"
                    value={execMemo}
                    onChange={(e) => setExecMemo(e.target.value)}
                    placeholder="如: 超时20分钟、发脾气"
                    className="w-full bg-slate-800/90 border border-rose-700/60 rounded-xl p-2.5 text-white outline-none focus:border-rose-400"
                  />
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="submit"
                    disabled={!execChildId || !execPenaltyId}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md ${
                      !execChildId || !execPenaltyId
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 hover:shadow-rose-900/50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" /> 执行扣分
                  </button>
                </div>
              </form>
            </div>

            {/* Grid for Penalties List & Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left side list of Penalties */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>🚨 已配置的减分/扣分规则项目</span>
                  <span className="text-xs text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full font-mono font-bold border border-rose-100">
                    共 {penalties.length} 条规则
                  </span>
                </h3>

                {penalties.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    目前还没有配置减分扣分规则，请在右侧侧边栏中添加。
                  </div>
                ) : (
                  <div className="space-y-3">
                    {penalties.map((penalty) => (
                      <div 
                        key={penalty.id}
                        className="flex justify-between items-center bg-rose-50/40 border border-rose-100 p-4 rounded-2xl gap-4 hover:border-rose-300 transition-all"
                      >
                        <div className="flex gap-3 items-center">
                          <div className="bg-rose-100 text-rose-600 p-2 rounded-xl shrink-0 w-11 h-11 flex items-center justify-center border border-rose-200">
                            <TaskRewardIcon name={penalty.icon} className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              {penalty.title}
                              <span className="text-xs font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-full font-mono shadow-xs">
                                -{penalty.coins} 金币
                              </span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-md">{penalty.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setExecPenaltyId(penalty.id);
                              if (!execChildId && children.length > 0) {
                                setExecChildId(children[0].id);
                              }
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              audio.playUnlock();
                            }}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            title="选择此项并跳转执行扣分"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            执行扣分
                          </button>

                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: `确认删除扣分规则 [${penalty.title}] 吗？`,
                                message: '删除此扣分规则后，历史账单不受影响，但快捷扣分菜单中将不再出现此项目。',
                                confirmText: '确认删除',
                                cancelText: '取消',
                                type: 'danger',
                                onConfirm: () => {
                                  onDeletePenalty(penalty.id);
                                  audio.playError();
                                }
                              });
                            }}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 p-2 rounded-xl transition-all shrink-0 cursor-pointer"
                            title="删除扣分项"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side Form to add new Penalty */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-rose-600" />
                  新增减分扣分规则项目
                </h3>

                <form onSubmit={handleAddPenaltySubmit} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="text-slate-500 mb-1.5 block">1. 违规行为/扣分项目名称：</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none focus:border-rose-400"
                      placeholder="例：情绪发脾气、看电视超时..."
                      value={penaltyTitle}
                      onChange={(e) => setPenaltyTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 mb-1.5 block">2. 详细违规说明或规则提醒：</label>
                    <textarea
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none focus:border-rose-400 h-20"
                      placeholder="写下提示引导，引导孩子建立良好的自律规范..."
                      value={penaltyDesc}
                      onChange={(e) => setPenaltyDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 mb-1.5 block">3. 扣除金币数 (-Coins)：</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none font-mono text-sm font-bold text-rose-600"
                        value={penaltyCoins}
                        onChange={(e) => setPenaltyCoins(Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="text-slate-500 mb-1.5 block">4. 归属大类 (Category)：</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none"
                        value={penaltyCategory}
                        onChange={(e) => setPenaltyCategory(e.target.value as any)}
                      >
                        <option value="behavior">习惯品德 🌟</option>
                        <option value="study">自主学习 📖</option>
                        <option value="chore">家务劳动 🧹</option>
                        <option value="other">其他扣分项 🚨</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 mb-1.5 block">5. 视觉警示图标 (Icon)：</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 outline-none"
                      value={penaltyIcon}
                      onChange={(e) => setPenaltyIcon(e.target.value)}
                    >
                      <option value="alert">警示感叹号 (Alert)</option>
                      <option value="clock">超时钟表 (Clock)</option>
                      <option value="trash">垃圾乱扔 (Trash)</option>
                      <option value="star">行为习惯 (Star)</option>
                      <option value="bookopen">学习拖拉 (Book)</option>
                      <option value="gamepad">游戏超时 (Gamepad)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-center text-sm shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> 确定发布此减分扣分规则
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: TRANSACTION LEDGER logs audit for all children */}
        {activeSubTab === 'transactions' && (
          <motion.div
            key="subtab-transactions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  📜 家庭金币收支审计大账本
                </h3>
                <p className="text-xs text-slate-500">记录每个家庭成员完成任务、违规扣分、商店购买与管理员直接调整历史。</p>
              </div>

              <button
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: '确认清空账本流水吗？',
                    message: '确定要清空全部的历史流水账本吗？本操作不影响孩子当前拥有的金币，仅仅删除展示流水日志。',
                    confirmText: '确定清空',
                    cancelText: '取消',
                    type: 'danger',
                    onConfirm: () => {
                      onClearTransactions();
                      audio.playCoinCascade();
                    }
                  });
                }}
                className="text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50/50 py-2 px-3.5 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                清空并重启历史流水
              </button>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">执行人 / 小朋友</th>
                    <th className="py-3 px-4">操作类别</th>
                    <th className="py-3 px-4">变更金币点数</th>
                    <th className="py-3 px-4">详细事项说明</th>
                    <th className="py-3 px-4">精确记录戳时间</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                        当前还没有产生任何金币交易历史
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isEarn = tx.type === 'earn';
                      const isSpend = tx.type === 'spend';
                      const isDeduct = tx.type === 'deduct';
                      const isAdjust = tx.type === 'parent_adjust';

                      let badgeText = '系统微调';
                      let badgeStyle = 'bg-indigo-50 border-indigo-200 text-indigo-700';
                      let amtStyle = 'text-indigo-600';
                      let prefix = '';

                      if (isEarn) {
                        badgeText = '完成任务';
                        badgeStyle = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                        amtStyle = 'text-emerald-700';
                        prefix = '+';
                      } else if (isSpend) {
                        badgeText = '兑换奖品';
                        badgeStyle = 'bg-indigo-50 border-indigo-200 text-indigo-700';
                        amtStyle = 'text-indigo-700';
                        prefix = '-';
                      } else if (isDeduct) {
                        badgeText = '违规扣分 🚨';
                        badgeStyle = 'bg-rose-100 border-rose-300 text-rose-800 font-bold';
                        amtStyle = 'text-rose-700 font-black';
                        prefix = '-';
                      }

                      return (
                        <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all font-mono">
                          <td className="py-3.5 px-4 font-sans font-bold text-slate-800">
                            {tx.childName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                              {badgeText}
                            </span>
                          </td>
                          <td className={`py-3.5 px-4 font-black text-sm ${amtStyle}`}>
                            {prefix}{tx.amount}
                          </td>
                          <td className="py-3.5 px-4 font-sans max-w-sm text-slate-600 font-medium">
                            {tx.description}
                          </td>
                          <td className="py-3.5 px-4 text-[10px] text-slate-400 font-medium">
                            {new Date(tx.timestamp).toLocaleString('zh-CN')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* 🔮 Custom Confirmation Modal Dialog replacing window.confirm */}
      <AnimatePresence>
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-sm w-full relative z-10 space-y-6"
            >
              <div className="flex gap-4 items-start">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  confirmModal.type === 'danger' 
                    ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                    : 'bg-indigo-50 text-indigo-500 border border-indigo-100'
                }`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 text-left">
                  <h4 className="font-extrabold text-slate-800 text-base font-display">
                    {confirmModal.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                >
                  {confirmModal.cancelText || '取消'}
                </button>
                <button
                  onClick={() => {
                    audio.playCoin();
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-black transition-all cursor-pointer shadow-lg ${
                    confirmModal.type === 'danger'
                      ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-100'
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-100'
                  }`}
                >
                  {confirmModal.confirmText || '确定'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
