/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  Settings2, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  UserCheck, 
  Cloud, 
  Copy, 
  Check, 
  LogOut, 
  CheckCircle, 
  RefreshCw, 
  Github, 
  Database, 
  HelpCircle, 
  Lock, 
  ArrowRight,
  Wifi,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { 
  testGitHubToken,
  createGist,
  updateGist,
  getGist,
  SyncDataPayload
} from './utils/githubSync';
import { Child, Task, Penalty, Reward, Transaction } from './types';
import { audio } from './utils/audio';
import CoinShower, { triggerCoinShower } from './components/CoinShower';
import KidsDashboard from './components/KidsDashboard';
import ParentConsole from './components/ParentConsole';
import LoginScreen from './components/LoginScreen';

// Preseeded default children to make evaluation immediate and premium
const DEFAULT_CHILDREN: Child[] = [
  { id: '1', name: '小博 (哥哥)', avatar: '🦊', coins: 15, totalEarned: 45, totalSpent: 30 },
  { id: '2', name: '依依 (妹妹)', avatar: '🐼', coins: 28, totalEarned: 58, totalSpent: 30 },
  { id: '3', name: '萌萌 (弟弟)', avatar: '🐨', coins: 8, totalEarned: 18, totalSpent: 10 }
];

// Preseeded default tasks for getting coins
const DEFAULT_TASKS: Task[] = [
  { id: 't1', title: '认真刷牙3分钟 🪥', description: '早晚洗漱，每次刷够三分钟，爱护牙齿不蛀牙。', coins: 2, category: 'hygiene', icon: 'clock' },
  { id: 't2', title: '整理小房间与玩具 🧸', description: '把所有散落的积木和玩具放回箱子，床铺铺平整。', coins: 5, category: 'chore', icon: 'star' },
  { id: 't3', title: '自主读故事书30分钟 📚', description: '不玩电子设备，独立阅读一本课外书或绘本并和父母分享。', coins: 6, category: 'study', icon: 'bookopen' },
  { id: 't4', title: '收拾书桌和收拾书包 🎒', description: '根据明天的课程表自己整理好课本和文具盒。', coins: 4, category: 'study', icon: 'bookopen' },
  { id: 't5', title: '吃完饭主动收拾餐盘 🍽️', description: '把自己的饭碗送回洗碗池，顺便帮父母抹一下餐桌。', coins: 3, category: 'chore', icon: 'star' },
  { id: 't6', title: '乖乖上床睡觉不赖床 ⏰', description: '晚上10点前准时睡觉，早上闹钟响了立刻起床，不发脾气。', coins: 4, category: 'behavior', icon: 'clock' }
];

// Preseeded default penalties for deducting coins
const DEFAULT_PENALTIES: Penalty[] = [
  { id: 'p1', title: '情绪发脾气 / 摔东西 😡', description: '情绪失控大吵大闹、任性发脾气或故意摔玩具。', coins: 3, category: 'behavior', icon: 'alert' },
  { id: 'p2', title: '看电视/玩游戏超时 📱', description: '约定时间到了赖着不肯关电视或手机。', coins: 5, category: 'behavior', icon: 'clock' },
  { id: 'p3', title: '写作业拖拉磨蹭 ⏰', description: '走神玩橡皮写字不专心，导致作业拖拉到很晚。', coins: 4, category: 'study', icon: 'clock' },
  { id: 'p4', title: '顶嘴或对长辈不礼貌 😤', description: '对爸爸妈妈或长辈大喊大叫、缺乏礼貌。', coins: 3, category: 'behavior', icon: 'alert' },
  { id: 'p5', title: '玩完玩具随手乱扔不收拾 🚮', description: '积木绘本到处摆放，提醒后仍不归位收拾。', coins: 2, category: 'chore', icon: 'trash' }
];

// Preseeded default rewards for spending coins
const DEFAULT_REWARDS: Reward[] = [
  { id: 'r1', title: '看电视/玩iPad 30分钟 📺', description: '可以任意看自己喜欢的小马宝莉、奥特曼或拼图电子卡片。', coins: 12, icon: 'tv', category: 'activity' },
  { id: 'r2', title: '美味冰淇淋球一个 🍦', description: '和爸爸妈妈出门时任意挑选一个哈根达斯或甜筒！', coins: 15, icon: 'gift', category: 'treat' },
  { id: 'r3', title: '兑换 20 元家庭零花钱 💵', description: '折合成等量纸币，存入自己的小金罐中当做自主资金。', coins: 25, icon: 'money', category: 'allowance' },
  { id: 'r4', title: '挑选一个奥特曼/芭比新玩具 🎁', description: '累计超级努力换取，可以让父母在网上下单你心心念念的小礼物。', coins: 60, icon: 'gift', category: 'toy' },
  { id: 'r5', title: '周末去游乐场玩一次 🎡', description: '周末带你去商场里的淘气堡或户外野生动物园愉快玩一天！', coins: 80, icon: 'gamepad', category: 'activity' }
];

// Default preloaded historical transactions
const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', childId: '1', childName: '小博 (哥哥)', type: 'earn', amount: 5, description: '完成了日常任务“整理小房间与玩具”', timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString() },
  { id: 'tx2', childId: '2', childName: '依依 (妹妹)', type: 'earn', amount: 6, description: '完成了日常任务“自主读故事书30分钟”', timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() },
  { id: 'tx3', childId: '1', childName: '小博 (哥哥)', type: 'spend', amount: 12, description: '兑换了商店商品“看电视/玩iPad 30分钟”', timestamp: new Date(Date.now() - 3600000 * 0.8).toISOString() }
];

export default function App() {
  // ----------------------------------------------------
  // Persistent States synced with localStorage
  // ----------------------------------------------------
  const [children, setChildren] = useState<Child[]>(() => {
    const saved = localStorage.getItem('kids-coins-children');
    return saved ? JSON.parse(saved) : DEFAULT_CHILDREN;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('kids-coins-tasks');
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  const [penalties, setPenalties] = useState<Penalty[]>(() => {
    const saved = localStorage.getItem('kids-coins-penalties');
    return saved ? JSON.parse(saved) : DEFAULT_PENALTIES;
  });

  const [rewards, setRewards] = useState<Reward[]>(() => {
    const saved = localStorage.getItem('kids-coins-rewards');
    return saved ? JSON.parse(saved) : DEFAULT_REWARDS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('kids-coins-transactions');
    return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
  });

  const [activeChildId, setActiveChildId] = useState<string | null>(() => {
    const saved = localStorage.getItem('kids-coins-activechild');
    return saved ? JSON.parse(saved) : '1';
  });

  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('kids-coins-user') || '';
  });

  // ----------------------------------------------------
  // Cloud Synchronization States & Settings (GitHub Gist Exclusive)
  // ----------------------------------------------------
  const [gitSyncEnabled, setGitSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('kids-coins-gitsync-enabled') === 'true';
  });
  const [gitToken, setGitToken] = useState<string>(() => {
    return localStorage.getItem('kids-coins-gittoken') || '';
  });
  const [gitGistId, setGitGistId] = useState<string>(() => {
    return localStorage.getItem('kids-coins-gitgistid') || '';
  });
  const [gitLastSynced, setGitLastSynced] = useState<string>(() => {
    return localStorage.getItem('kids-coins-gitlastsynced') || '';
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string>('');
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [isSyncLoading, setIsSyncLoading] = useState<boolean>(false);
  const [copiedGistId, setCopiedGistId] = useState<boolean>(false);

  // Sync Mutation Protection Flags
  const isDirtyRef = useRef<boolean>(false);
  const isPullingRef = useRef<boolean>(false);

  // Custom non-blocking interactive confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Custom non-blocking toast messaging state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'amber' | 'error';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'amber' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 5000);
  };

  // Sync state modifications to local storage
  useEffect(() => {
    localStorage.setItem('kids-coins-children', JSON.stringify(children));
  }, [children]);

  useEffect(() => {
    localStorage.setItem('kids-coins-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('kids-coins-penalties', JSON.stringify(penalties));
  }, [penalties]);

  useEffect(() => {
    localStorage.setItem('kids-coins-rewards', JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem('kids-coins-transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (activeChildId) {
      localStorage.setItem('kids-coins-activechild', JSON.stringify(activeChildId));
    } else {
      localStorage.removeItem('kids-coins-activechild');
    }
  }, [activeChildId]);

  useEffect(() => {
    localStorage.setItem('kids-coins-gitsync-enabled', String(gitSyncEnabled));
  }, [gitSyncEnabled]);

  useEffect(() => {
    localStorage.setItem('kids-coins-gittoken', gitToken.trim());
  }, [gitToken]);

  useEffect(() => {
    localStorage.setItem('kids-coins-gitgistid', gitGistId.trim());
  }, [gitGistId]);

  useEffect(() => {
    localStorage.setItem('kids-coins-gitlastsynced', gitLastSynced);
  }, [gitLastSynced]);

  // ----------------------------------------------------
  // Gist Core Synchronizer Engine
  // ----------------------------------------------------

  // Safely apply remote payload into React state without marking as dirty
  const applyRemotePayload = (payload: SyncDataPayload) => {
    isPullingRef.current = true;
    if (Array.isArray(payload.children)) setChildren(payload.children);
    if (Array.isArray(payload.tasks)) setTasks(payload.tasks);
    if (Array.isArray(payload.penalties)) setPenalties(payload.penalties);
    if (Array.isArray(payload.rewards)) setRewards(payload.rewards);
    if (Array.isArray(payload.transactions)) setTransactions(payload.transactions);
    
    const nowStr = new Date().toLocaleString();
    setGitLastSynced(nowStr);
    setSyncStatus('synced');
  };

  // Pull data from Gist
  const pullFromGist = async (token = gitToken, gistId = gitGistId): Promise<SyncDataPayload | null> => {
    const cleanToken = token.trim();
    const cleanGistId = gistId.trim();

    if (!cleanToken || !cleanGistId) return null;

    setSyncStatus('syncing');
    setSyncErrorMessage('');

    try {
      const payload = await getGist(cleanToken, cleanGistId);
      if (payload) {
        setSyncStatus('synced');
        return payload;
      }
    } catch (err: any) {
      console.warn('Cloud Sync Pull notice:', err?.message || err);
      setSyncStatus('error');
      setSyncErrorMessage(err.message || '网络拉取失败，请检查 Gist ID 或 Token');
    }
    return null;
  };

  // Push local data to Gist
  const pushToGist = async (
    overrideData?: { children: Child[], tasks: Task[], penalties?: Penalty[], rewards: Reward[], transactions: Transaction[] },
    token = gitToken,
    gistId = gitGistId
  ) => {
    const cleanToken = token.trim();
    const cleanGistId = gistId.trim();

    if (!cleanToken || !cleanGistId) return;

    setSyncStatus('syncing');
    setSyncErrorMessage('');

    try {
      const payload: SyncDataPayload = {
        children: overrideData?.children ?? children,
        tasks: overrideData?.tasks ?? tasks,
        penalties: overrideData?.penalties ?? penalties,
        rewards: overrideData?.rewards ?? rewards,
        transactions: overrideData?.transactions ?? transactions,
        updatedAt: new Date().toISOString(),
        deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) : 'Web'
      };

      await updateGist(cleanToken, cleanGistId, payload);
      isDirtyRef.current = false;
      const nowStr = new Date().toLocaleString();
      setGitLastSynced(nowStr);
      setSyncStatus('synced');
    } catch (err: any) {
      console.warn('Cloud Sync Push notice:', err?.message || err);
      setSyncStatus('error');
      setSyncErrorMessage(err.message || '推送保存至 GitHub Gist 失败');
    }
  };

  // Auto-push debouncer on user mutations
  useEffect(() => {
    if (!gitSyncEnabled || !gitToken.trim() || !gitGistId.trim()) return;

    if (isPullingRef.current) {
      isPullingRef.current = false;
      return;
    }

    if (!isDirtyRef.current) return;

    const timer = setTimeout(() => {
      pushToGist();
    }, 2500);

    return () => clearTimeout(timer);
  }, [children, tasks, penalties, rewards, transactions, gitSyncEnabled, gitToken, gitGistId]);

  // Initial load or Gist connection activation
  useEffect(() => {
    if (gitSyncEnabled && gitToken.trim() && gitGistId.trim()) {
      pullFromGist().then(data => {
        if (data) {
          applyRemotePayload(data);
        }
      }).catch(() => {});
    }
  }, [gitSyncEnabled]);

  // Tab refocus check (pull latest cross-device changes)
  useEffect(() => {
    const handleFocus = () => {
      if (gitSyncEnabled && gitToken.trim() && gitGistId.trim() && !isDirtyRef.current) {
        pullFromGist().then(data => {
          if (data) {
            applyRemotePayload(data);
          }
        }).catch(() => {});
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [gitSyncEnabled, gitToken, gitGistId]);

  // Periodic Auto-Pull (every 25s)
  useEffect(() => {
    if (!gitSyncEnabled || !gitToken.trim() || !gitGistId.trim()) return;

    const interval = setInterval(() => {
      if (!isDirtyRef.current) {
        pullFromGist().then(data => {
          if (data) {
            applyRemotePayload(data);
          }
        });
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [gitSyncEnabled, gitToken, gitGistId]);

  // Manual Trigger Refresh Function
  const handleManualSyncRefresh = async () => {
    const cleanToken = gitToken.trim();
    const cleanGistId = gitGistId.trim();

    if (!cleanToken || !cleanGistId) {
      showToast('请先填写有效的 GitHub Token 与 Gist ID。', 'amber');
      return;
    }

    setIsSyncLoading(true);
    try {
      const data = await pullFromGist(cleanToken, cleanGistId);
      if (data) {
        applyRemotePayload(data);
        audio.playUnlock();
        triggerCoinShower(10);
        showToast('从 Gist 成功拉取最新积分与任务设定！', 'success');
      } else {
        showToast('Gist 暂无数据，已保留当前本地内容！', 'amber');
      }
    } catch (err: any) {
      showToast(`刷新同步失败: ${err.message || err}`, 'error');
    } finally {
      setIsSyncLoading(false);
    }
  };

  // Connect Existing Gist (Loads Gist data seamlessly across devices)
  const handleConnectExistingSpace = async () => {
    const cleanToken = gitToken.trim();
    const cleanGistId = gitGistId.trim();

    if (!cleanToken) {
      showToast('请输入 GitHub Token (PAT) 密钥！', 'amber');
      return;
    }
    if (!cleanGistId) {
      showToast('请输入要连接的 GitHub Gist ID！', 'amber');
      return;
    }

    setIsSyncLoading(true);
    setSyncErrorMessage('');

    try {
      await testGitHubToken(cleanToken);
      const remoteData = await getGist(cleanToken, cleanGistId);

      if (remoteData) {
        applyRemotePayload(remoteData);
        setGitSyncEnabled(true);
        triggerCoinShower(15);
        audio.playUnlock();
        showToast('🎉 成功与 Gist 连通！已同步载入云端最新金币积分数据！', 'success');
      } else {
        setConfirmDialog({
          isOpen: true,
          title: '☁️ Gist 中暂未存有数据',
          message: '指定的 Gist 中未检测到已存的金币习惯存档。是否将本设备当前的宝贝资料与金币初始化上传至该 Gist？',
          onConfirm: async () => {
            setConfirmDialog(null);
            setIsSyncLoading(true);
            try {
              await pushToGist(undefined, cleanToken, cleanGistId);
              setGitSyncEnabled(true);
              triggerCoinShower(10);
              audio.playUnlock();
              showToast('初始化数据已成功推入 Gist 云端！', 'success');
            } catch (err: any) {
              setSyncErrorMessage(err.message || '初始化数据推入 Gist 失败');
              showToast('初始化数据上传失败！', 'error');
            } finally {
              setIsSyncLoading(false);
            }
          }
        });
      }
    } catch (err: any) {
      setSyncErrorMessage(err.message || '连接 Gist 失败，请检查 Token 权限和 Gist ID 是否无误');
      showToast('连接 Gist 失败，请查看详细提示', 'error');
    } finally {
      setIsSyncLoading(false);
    }
  };

  // Automatically Create Brand New Gist
  const handleAutoCreateGist = async () => {
    const cleanToken = gitToken.trim();
    if (!cleanToken) {
      showToast('请先输入有效的 GitHub Token (PAT) 密钥！', 'amber');
      return;
    }

    setIsSyncLoading(true);
    setSyncErrorMessage('');

    try {
      await testGitHubToken(cleanToken);
      const payload: SyncDataPayload = {
        children,
        tasks,
        rewards,
        transactions,
        updatedAt: new Date().toISOString(),
        deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) : 'Web'
      };

      const newId = await createGist(cleanToken, payload);
      setGitGistId(newId);
      setGitSyncEnabled(true);
      setSyncStatus('synced');
      setGitLastSynced(new Date().toLocaleString());

      triggerCoinShower(20);
      audio.playUnlock();
      showToast('🎉 恭喜！已在云端成功创建全新的 Gist 数据同步空间！', 'success');
    } catch (err: any) {
      setSyncErrorMessage(err.message || '创建 Gist 空间失败，请确认 Token 勾选了 gist 权限！');
      showToast('创建 Gist 失败，请检查详细提示', 'error');
    } finally {
      setIsSyncLoading(false);
    }
  };

  // Disconnect Cloud Sync
  const handleDisconnectSync = () => {
    setConfirmDialog({
      isOpen: true,
      title: '🔌 确认断开 Gist 云端同步？',
      message: '断开后，应用将切回到本地单机运行模式。当前设备的修改不会同步到 Gist。',
      onConfirm: () => {
        setGitSyncEnabled(false);
        setSyncStatus('idle');
        setSyncErrorMessage('');
        audio.playError();
        setConfirmDialog(null);
        showToast('已断开 Gist 联机，切换为本地单机模式', 'amber');
      }
    });
  };

  // Test Token and Permissions handler
  const handleTestToken = async () => {
    const cleanToken = gitToken.trim();
    if (!cleanToken) {
      showToast('请先填写 GitHub Personal Access Token (PAT) 密钥！', 'amber');
      return;
    }

    setIsSyncLoading(true);
    setSyncErrorMessage('');

    try {
      const username = await testGitHubToken(cleanToken);
      audio.playUnlock();
      showToast(`✅ Token 验证成功！对应账号: ${username}，已具备 Gist 读写权限。`, 'success');
    } catch (err: any) {
      setSyncErrorMessage(err.message || 'Token 验证失败，请检查密钥是否正确并勾选了 gist 权限');
      showToast('Token 验证失败，详见界面上方排查提示', 'error');
    } finally {
      setIsSyncLoading(false);
    }
  };

  // Copy Gist ID helper
  const handleCopyGistId = () => {
    if (!gitGistId) return;
    navigator.clipboard.writeText(gitGistId.trim());
    setCopiedGistId(true);
    audio.playCoin();
    showToast('已复制 Gist ID，可直接发送到其他手机粘贴连接！', 'success');
    setTimeout(() => setCopiedGistId(false), 3000);
  };

  // ----------------------------------------------------
  // Children Handlers and Mutators (Mark isDirtyRef)
  // ----------------------------------------------------
  
  // Complete a task
  const handleCompleteTask = (childId: string, taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    isDirtyRef.current = true;
    setChildren(prev => {
      const idx = prev.findIndex(c => c.id === childId);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        coins: copy[idx].coins + task.coins,
        totalEarned: copy[idx].totalEarned + task.coins
      };
      
      const newTx: Transaction = {
        id: `tx-earn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        childId,
        childName: copy[idx].name,
        type: 'earn',
        amount: task.coins,
        description: `完成了日常任务“${task.title}”并领取了金币奖励！`,
        timestamp: new Date().toISOString()
      };
      setTransactions(prevTx => [newTx, ...prevTx]);

      return copy;
    });
  };

  // Redeem a reward
  const handleRedeemReward = (childId: string, rewardId: string): boolean => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return false;

    let possible = false;

    setChildren(prev => {
      const idx = prev.findIndex(c => c.id === childId);
      if (idx === -1) return prev;
      if (prev[idx].coins < reward.coins) return prev;

      possible = true;
      isDirtyRef.current = true;

      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        coins: copy[idx].coins - reward.coins,
        totalSpent: copy[idx].totalSpent + reward.coins
      };

      const newTx: Transaction = {
        id: `tx-spend-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        childId,
        childName: copy[idx].name,
        type: 'spend',
        amount: reward.coins,
        description: `在商店中兑换了奖励商品：${reward.title}`,
        timestamp: new Date().toISOString()
      };
      setTransactions(prevTx => [newTx, ...prevTx]);

      return copy;
    });

    return possible;
  };

  // Add child
  const handleAddChild = (name: string, avatar: string) => {
    isDirtyRef.current = true;
    const newChild: Child = {
      id: `child-${Date.now()}`,
      name,
      avatar,
      coins: 5,
      totalEarned: 5,
      totalSpent: 0
    };
    setChildren(prev => [...prev, newChild]);
    setActiveChildId(newChild.id);

    const newTx: Transaction = {
      id: `tx-parent-${Date.now()}`,
      childId: newChild.id,
      childName: name,
      type: 'parent_adjust',
      amount: 5,
      description: `注册账号大吉！系统赠送了 5 个闪亮新手开户金币 🎉`,
      timestamp: new Date().toISOString()
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // Delete child
  const handleDeleteChild = (id: string) => {
    isDirtyRef.current = true;
    setChildren(prev => prev.filter(c => c.id !== id));
    if (activeChildId === id) {
      setActiveChildId(children.length > 1 ? children.find(c => c.id !== id)?.id || null : null);
    }
  };

  // Update coins manually
  const handleUpdateChildCoins = (id: string, amount: number, memo: string) => {
    isDirtyRef.current = true;
    setChildren(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx === -1) return prev;
      const copy = [...prev];
      
      const oldCoins = copy[idx].coins;
      const computedNextCoins = copy[idx].coins + amount;
      const netChange = computedNextCoins < 0 ? -oldCoins : amount;

      copy[idx] = {
        ...copy[idx],
        coins: Math.max(0, computedNextCoins),
        totalEarned: amount > 0 ? copy[idx].totalEarned + amount : copy[idx].totalEarned
      };

      const newTx: Transaction = {
        id: `tx-adj-${Date.now()}`,
        childId: id,
        childName: copy[idx].name,
        type: 'parent_adjust',
        amount: netChange,
        description: `管理员手动微调：${memo}`,
        timestamp: new Date().toISOString()
      };
      setTransactions(prevTx => [newTx, ...prevTx]);

      return copy;
    });
  };

  // Add task
  const handleAddTask = (taskObj: Omit<Task, 'id'>) => {
    isDirtyRef.current = true;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...taskObj
    };
    setTasks(prev => [...prev, newTask]);
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    isDirtyRef.current = true;
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Add penalty item
  const handleAddPenalty = (penaltyObj: Omit<Penalty, 'id'>) => {
    isDirtyRef.current = true;
    const newPenalty: Penalty = {
      id: `penalty-${Date.now()}`,
      ...penaltyObj
    };
    setPenalties(prev => [...prev, newPenalty]);
  };

  // Delete penalty item
  const handleDeletePenalty = (id: string) => {
    isDirtyRef.current = true;
    setPenalties(prev => prev.filter(p => p.id !== id));
  };

  // Apply penalty (deduct coins from child)
  const handleApplyPenalty = (childId: string, penaltyId: string, customMemo?: string) => {
    const penalty = penalties.find(p => p.id === penaltyId);
    if (!penalty) return;

    isDirtyRef.current = true;
    setChildren(prev => {
      const idx = prev.findIndex(c => c.id === childId);
      if (idx === -1) return prev;
      const copy = [...prev];
      const oldCoins = copy[idx].coins;
      const newCoins = Math.max(0, oldCoins - penalty.coins);

      copy[idx] = {
        ...copy[idx],
        coins: newCoins
      };

      const newTx: Transaction = {
        id: `tx-deduct-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        childId,
        childName: copy[idx].name,
        type: 'deduct',
        amount: penalty.coins,
        description: customMemo ? `违规扣分：${penalty.title} (${customMemo})` : `违规扣分记录：${penalty.title}`,
        timestamp: new Date().toISOString()
      };
      setTransactions(prevTx => [newTx, ...prevTx]);

      return copy;
    });

    audio.playError();
    showToast(`已成功为该小朋友记录违规扣分：-${penalty.coins} 金币`, 'amber');
  };

  // Add reward
  const handleAddReward = (rewardObj: Omit<Reward, 'id'>) => {
    isDirtyRef.current = true;
    const newReward: Reward = {
      id: `reward-${Date.now()}`,
      ...rewardObj
    };
    setRewards(prev => [...prev, newReward]);
  };

  // Delete reward
  const handleDeleteReward = (id: string) => {
    isDirtyRef.current = true;
    setRewards(prev => prev.filter(r => r.id !== id));
  };

  // Move reward
  const handleMoveReward = (id: string, direction: 'up' | 'down') => {
    const index = rewards.findIndex(r => r.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rewards.length) return;

    isDirtyRef.current = true;
    const copy = [...rewards];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setRewards(copy);
    audio.playUnlock();
  };

  // Clear transactions
  const handleClearTransactions = () => {
    isDirtyRef.current = true;
    setTransactions([]);
  };

  if (currentUser !== 'Jerry') {
    return (
      <div className="min-h-screen relative" id="kids-gold-rewards-auth-container">
        <CoinShower />
        <LoginScreen onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('kids-coins-user', user);
          triggerCoinShower(15);
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 relative" id="kids-gold-rewards-container">
      {/* Dynamic Gold Splash Canvas Layer */}
      <CoinShower />

      {/* Floating Toast Messenger */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl border text-xs font-black flex items-center gap-2 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-900/90 border-rose-700 text-rose-100'
                : toast.type === 'amber'
                ? 'bg-amber-900/90 border-amber-700 text-amber-100'
                : 'bg-emerald-900/90 border-emerald-700 text-emerald-100'
            }`}
          >
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-black text-slate-800">{confirmDialog.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{confirmDialog.message}</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer transition-all"
                >
                  取消
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-md"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Top Bar Navigation */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:pt-6">
        <nav className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] px-5 py-4 sm:py-3.5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Logo Title */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { audio.playCoin(); triggerCoinShower(4); }}>
              <span className="bg-amber-400 p-2.5 rounded-2xl text-slate-900 shadow-[0_4px_12px_rgba(251,191,36,0.25)] flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 text-slate-900" />
              </span>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-800 flex items-center gap-1.5 font-display">
                  儿童金币积分管理星球 <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-extrabold uppercase">家庭版</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">
                  培养家务自主及自律好习惯 • 金币翻倍仪式感 🪙
                </p>
              </div>
            </div>

            {/* Cloud Sync Status Button */}
            <div className="flex items-center gap-2">
              {gitSyncEnabled && gitToken.trim() && gitGistId.trim() ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setShowSyncModal(true);
                      audio.playUnlock();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border transition-all duration-200 cursor-pointer shadow-xs hover:scale-105 active:scale-95 ${
                      syncStatus === 'syncing'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : syncStatus === 'error'
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    {syncStatus === 'syncing' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    ) : syncStatus === 'error' ? (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    ) : (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    <span>
                      {syncStatus === 'syncing'
                        ? '正在云同步 Gist...'
                        : syncStatus === 'error'
                        ? 'Gist 同步异常'
                        : 'Gist 云端已联机'}
                    </span>
                  </button>

                  <button
                    onClick={handleManualSyncRefresh}
                    disabled={isSyncLoading}
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 cursor-pointer transition-all"
                    title="立即从 Gist 手动拉取刷新"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncLoading ? 'animate-spin text-indigo-600' : ''}`} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowSyncModal(true);
                    audio.playUnlock();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-xs"
                >
                  <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                  <span>🌐 绑定 Gist 多端云同步</span>
                </button>
              )}
            </div>

            {/* Mode Switchers */}
            <div className="flex bg-slate-100/80 p-1 rounded-[12px] items-center gap-1 text-xs font-bold leading-none w-full md:w-auto">
              <button
                id="goto-kids-lobby-btn"
                onClick={() => {
                  setIsAdminMode(false);
                  audio.playUnlock();
                }}
                className={`flex-1 md:flex-initial px-4 py-2.5 rounded-[9px] flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  !isAdminMode 
                    ? 'bg-white text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-500 font-bold" />
                🧒 小朋友大厅（日常习惯）
              </button>

              <button
                id="goto-parent-backoffice-btn"
                onClick={() => {
                  setIsAdminMode(true);
                  audio.playUnlock();
                }}
                className={`flex-1 md:flex-initial px-4 py-2.5 rounded-[9px] flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isAdminMode 
                    ? 'bg-slate-900 text-amber-300 shadow-[0_2px_8px_rgba(0,0,0,0.15)] font-black' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Settings2 className="w-4 h-4 text-amber-400" />
                🔑 家长控制后台（增减设置）
              </button>

              <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

              <button
                id="logout-btn"
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: '🚪 确定退出当前登录账户吗？',
                    message: '退出后，您需要重新在门口输入昵称进行登录以便存取奖励和习惯。当前本地数据均会自动保留，请放心。',
                    onConfirm: () => {
                      setCurrentUser('');
                      localStorage.removeItem('kids-coins-user');
                      audio.playError();
                      setConfirmDialog(null);
                      showToast('已安全退出账户', 'amber');
                    }
                  });
                }}
                className="px-3 py-2 rounded-[9px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 shrink-0"
                title="退出账户"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">退出</span>
              </button>
            </div>

          </div>
        </nav>
      </div>

      {/* Main Screen Content */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        <AnimatePresence mode="wait">
          {!isAdminMode ? (
            <motion.div
              key="kids-view-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <KidsDashboard
                children={children}
                tasks={tasks}
                penalties={penalties}
                rewards={rewards}
                transactions={transactions}
                activeChildId={activeChildId}
                onSelectChild={setActiveChildId}
                onCompleteTask={handleCompleteTask}
                onRedeemReward={handleRedeemReward}
                onApplyPenalty={handleApplyPenalty}
              />
            </motion.div>
          ) : (
            <motion.div
              key="parent-view-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <ParentConsole
                children={children}
                tasks={tasks}
                penalties={penalties}
                rewards={rewards}
                transactions={transactions}
                onAddChild={handleAddChild}
                onDeleteChild={handleDeleteChild}
                onUpdateChildCoins={handleUpdateChildCoins}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onAddPenalty={handleAddPenalty}
                onDeletePenalty={handleDeletePenalty}
                onApplyPenalty={handleApplyPenalty}
                onAddReward={handleAddReward}
                onDeleteReward={handleDeleteReward}
                onMoveReward={handleMoveReward}
                onClearTransactions={handleClearTransactions}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* GitHub Gist Multi-Device Sync Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[5px] flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto" id="sync-settings-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_25px_60px_rgba(15,23,42,0.18)] max-w-lg w-full overflow-hidden relative p-6 sm:p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  audio.playUnlock();
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-all cursor-pointer font-bold text-sm leading-none"
              >
                ✕
              </button>

              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-500 text-white p-3 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                    <Cloud className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-800">🎁 GitHub Gist 跨设备极速数据同步</h3>
                    <p className="text-[10px] text-slate-400 font-bold">填入相同 Gist ID 与 Token 即可在手机、电脑等多设备实时同步</p>
                  </div>
                </div>

                {syncErrorMessage && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-rose-800 text-xs font-semibold leading-relaxed space-y-1.5 shadow-xs">
                    <div className="font-extrabold flex items-center gap-1.5 text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      Gist 云同步异常排查提示：
                    </div>
                    <p className="text-[11px] text-rose-700 font-medium">{syncErrorMessage}</p>
                    <div className="pt-1 text-[10px] text-rose-900 font-bold flex flex-wrap gap-2 border-t border-rose-200/60">
                      <span>💡 常用修复步骤：</span>
                      <span>1. 点击“测试 Token 权限”查看账号；</span>
                      <span>2. 若未授权，重新申请 Token 勾选 [gist] 选项；</span>
                      <span>3. 若 Gist ID 找不到，直接点击“在云端自动建新 Gist”。</span>
                    </div>
                  </div>
                )}

                {/* Form Inputs & Controls */}
                <div className="space-y-4">
                  {/* Token Input */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-700">
                        🔑 GitHub Personal Access Token (PAT):
                      </label>
                      <a
                        href="https://github.com/settings/tokens/new?description=KidsGoldGistSync&scopes=gist"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline text-[10px] font-black flex items-center gap-0.5"
                      >
                        申请 Token (必勾选 gist 权限) <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="例如: ghp_xxxxxxxxxxxxxx"
                        value={gitToken}
                        onChange={(e) => setGitToken(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                      />
                      <button
                        onClick={handleTestToken}
                        disabled={isSyncLoading || !gitToken.trim()}
                        className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 text-indigo-700 disabled:text-slate-400 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        title="测试 Token 权限"
                      >
                        <Check className="w-3.5 h-3.5" />
                        测试权限
                      </button>
                    </div>
                  </div>

                  {/* Gist ID Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">
                      🆔 Gist ID (多端同步唯一代码):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="请输入 32 位 Gist 字符串"
                        value={gitGistId}
                        onChange={(e) => setGitGistId(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                      />
                      {gitGistId.trim() && (
                        <button
                          onClick={handleCopyGistId}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="复制 Gist ID"
                        >
                          {copiedGistId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedGistId ? '已复制' : '复制'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={handleConnectExistingSpace}
                      disabled={isSyncLoading}
                      className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSyncLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Cloud className="w-4 h-4" />
                          <span>从 Gist 载入数据并连通</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleAutoCreateGist}
                      disabled={isSyncLoading}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSyncLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>在云端自动建新 Gist</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Connection Status Panel */}
                {gitSyncEnabled && gitToken.trim() && gitGistId.trim() && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-black text-emerald-900">Gist 云端同步已成功激活！</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {gitLastSynced ? `上次同步: ${gitLastSynced}` : '已连通'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      💡 <strong>多端同步使用指南：</strong><br />
                      将此处的 <strong>Gist ID</strong> 和 <strong>Token</strong> 复制填写到您的其他手机、平板或电脑上，点击“从 Gist 载入数据并连通”，各设备即可共享最新的金币与任务进度！
                    </p>

                    <div className="flex gap-2 pt-1 border-t border-emerald-200/60">
                      <button
                        onClick={handleManualSyncRefresh}
                        disabled={isSyncLoading}
                        className="flex-1 py-1.5 px-2 bg-white border border-emerald-200 hover:bg-emerald-100/50 text-emerald-800 rounded-lg text-xs font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncLoading ? 'animate-spin' : ''}`} />
                        <span>从云端刷新拉取</span>
                      </button>

                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: '📤 确认将本地数据强行覆盖至 Gist？',
                            message: '此操作会把当前设备的所有金币习惯推向 Gist，替换云端已有进度。确定要覆盖吗？',
                            onConfirm: async () => {
                              setConfirmDialog(null);
                              setIsSyncLoading(true);
                              try {
                                await pushToGist();
                                audio.playUnlock();
                                triggerCoinShower(10);
                                showToast('本地数据已覆盖至 Gist 云端！', 'success');
                              } catch (err: any) {
                                showToast('推送覆盖失败！', 'error');
                              } finally {
                                setIsSyncLoading(false);
                              }
                            }
                          });
                        }}
                        disabled={isSyncLoading}
                        className="flex-1 py-1.5 px-2 bg-white border border-emerald-200 hover:bg-emerald-100/50 text-emerald-800 rounded-lg text-xs font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>强制覆写至 Gist</span>
                      </button>

                      <button
                        onClick={handleDisconnectSync}
                        className="py-1.5 px-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-extrabold cursor-pointer transition-all shrink-0"
                      >
                        断开
                      </button>
                    </div>
                  </div>
                )}

                {/* Helpful Instruction Box */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1.5 text-[11px] text-slate-500 font-medium">
                  <h4 className="font-black text-slate-700 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                    云同步原理说明
                  </h4>
                  <p className="leading-relaxed">
                    所有积分、任务和打卡记录都保存在您个人 GitHub 账号下的私密 Gist 片段中。只有掌握您的 Gist ID 和 Token 的设备才能访问与更新，绝对私密且免费稳定。
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
