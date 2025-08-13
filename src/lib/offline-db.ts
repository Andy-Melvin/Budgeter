import Dexie, { Table } from 'dexie';

// Define the database schema
export interface OfflineIncome {
  id?: string;
  description: string;
  amount: string;
  currency: string;
  source_type: string;
  source_location: string;
  received_date: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface OfflineAsset {
  id?: string;
  asset_name: string;
  asset_type: string;
  current_value: string;
  currency: string;
  purchase_date: string;
  notes?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface OfflineGoal {
  id?: string;
  goal_name: string;
  target_amount: string;
  currency: string;
  target_date: string;
  current_amount: string;
  notes?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface OfflineTransaction {
  id?: string;
  description: string;
  amount: string;
  currency: string;
  category_id: string;
  transaction_date: string;
  transaction_type: 'income' | 'expense';
  notes?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface OfflineBudgetCategory {
  id?: string;
  category_name: string;
  budgeted_amount: string;
  currency: string;
  month: string;
  spent_amount: string;
  color?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
  updated_at: string;
}

export class BudgeterOfflineDB extends Dexie {
  incomes!: Table<OfflineIncome>;
  assets!: Table<OfflineAsset>;
  goals!: Table<OfflineGoal>;
  transactions!: Table<OfflineTransaction>;
  budgetCategories!: Table<OfflineBudgetCategory>;

  constructor() {
    super('BudgeterOfflineDB');
    
    this.version(1).stores({
      incomes: 'id, sync_status, created_at',
      assets: 'id, sync_status, created_at',
      goals: 'id, sync_status, created_at',
      transactions: 'id, sync_status, created_at',
      budgetCategories: 'id, sync_status, created_at'
    });
  }
}

export const offlineDB = new BudgeterOfflineDB();

// Utility functions for offline operations
export const offlineUtils = {
  // Check if we're online
  isOnline: () => navigator.onLine,

  // Generate a temporary ID for offline records
  generateTempId: () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  // Add a record to offline storage
  async addRecord<T>(
    table: Table<T>,
    record: any
  ): Promise<string> {
    const tempId = this.generateTempId();
    const now = new Date().toISOString();
    
    const offlineRecord = {
      ...record,
      id: tempId,
      sync_status: 'pending',
      created_at: now,
      updated_at: now
    };

    await table.add(offlineRecord as T);
    return tempId;
  },

  // Update a record in offline storage
  async updateRecord<T>(
    table: Table<T>,
    id: string,
    updates: any
  ): Promise<void> {
    const now = new Date().toISOString();
    
    await table.update(id, {
      ...updates,
      sync_status: 'pending',
      updated_at: now
    });
  },

  // Delete a record from offline storage
  async deleteRecord<T>(table: Table<T>, id: string): Promise<void> {
    await table.delete(id);
  },

  // Get all pending records that need to be synced
  async getPendingRecords<T>(table: Table<T>): Promise<T[]> {
    return await table.where('sync_status').equals('pending').toArray();
  },

  // Mark a record as synced
  async markAsSynced<T>(
    table: Table<T>,
    tempId: string,
    realId: string
  ): Promise<void> {
    await table.where('id').equals(tempId).modify({
      id: realId,
      sync_status: 'synced',
      updated_at: new Date().toISOString()
    });
  },

  // Mark a record as failed to sync
  async markAsFailed<T>(
    table: Table<T>,
    id: string
  ): Promise<void> {
    await table.where('id').equals(id).modify({
      sync_status: 'failed',
      updated_at: new Date().toISOString()
    });
  }
}; 