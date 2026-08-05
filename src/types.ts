/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Child {
  id: string;
  name: string;
  avatar: string; // Avatar identifier or emoji
  coins: number;
  totalEarned: number;
  totalSpent: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  coins: number; // Gold coins earned upon completion
  category: 'chore' | 'study' | 'hygiene' | 'behavior' | 'other';
  icon: string; // Lucide icon name or emoji
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  coins: number; // Gold coins required to redeem
  icon: string; // Lucide icon name or emoji
  category: 'activity' | 'treat' | 'toy' | 'allowance' | 'other';
}

export interface Penalty {
  id: string;
  title: string;
  description: string;
  coins: number; // Gold coins deducted for violation
  category: 'behavior' | 'study' | 'chore' | 'other';
  icon: string; // Lucide icon name or emoji
}

export interface Transaction {
  id: string;
  childId: string;
  childName: string;
  type: 'earn' | 'spend' | 'deduct' | 'parent_adjust';
  amount: number;
  description: string;
  timestamp: string; // ISO format
  isRevoked?: boolean;
  revokedAt?: string;
}

export interface AppState {
  children: Child[];
  tasks: Task[];
  penalties: Penalty[];
  rewards: Reward[];
  transactions: Transaction[];
  activeChildId: string | null;
  isAdmin: boolean;
}
