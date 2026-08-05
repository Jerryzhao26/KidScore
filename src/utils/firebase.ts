/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Child, Task, Reward, Transaction } from '../types';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Core test connectivity checker required by guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: 'anonymous-client',
      email: 'not-using-auth-login'
    },
    operationType,
    path
  };
  console.error('Firestore Error Payload:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FamilySpaceData {
  id: string;
  name: string;
  children: Child[];
  tasks: Task[];
  rewards: Reward[];
  transactions: Transaction[];
  updatedAt?: string;
}

/**
 * Creates a brand new family space document in firestore
 */
export async function createFamilySpace(spaceId: string, name: string, data: Omit<FamilySpaceData, 'id' | 'name'>): Promise<void> {
  const path = `spaces/${spaceId}`;
  try {
    const spaceData: FamilySpaceData = {
      id: spaceId,
      name,
      children: data.children,
      tasks: data.tasks,
      rewards: data.rewards,
      transactions: data.transactions,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'spaces', spaceId), spaceData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Updates an exisiting family space with state data
 */
export async function updateFamilySpace(spaceId: string, updates: Partial<Omit<FamilySpaceData, 'id'>>): Promise<void> {
  const path = `spaces/${spaceId}`;
  try {
    const docRef = doc(db, 'spaces', spaceId);
    const updatedPayload = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updatedPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Attempts to retrieve an existing family space
 */
export async function getFamilySpace(spaceId: string): Promise<FamilySpaceData | null> {
  const path = `spaces/${spaceId}`;
  try {
    const docRef = doc(db, 'spaces', spaceId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as FamilySpaceData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
