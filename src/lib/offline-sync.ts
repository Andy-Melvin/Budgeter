import { offlineDB } from './offline-db';
import { supabase } from '@/integrations/supabase/client';

// Simple offline sync service
export class OfflineSyncService {
  private static instance: OfflineSyncService;
  private syncInProgress = false;

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  // Check if we're online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Generate temporary ID for offline records
  generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add income record (works offline and online)
  async addIncome(incomeData: any): Promise<string> {
    if (this.isOnline()) {
      try {
        const { data, error } = await supabase
          .from('income_sources')
          .insert(incomeData)
          .select()
          .single();
        
        if (error) throw error;
        return data.id;
      } catch (error) {
        console.log('Online save failed, saving offline:', error);
        return this.addIncomeOffline(incomeData);
      }
    } else {
      return this.addIncomeOffline(incomeData);
    }
  }

  private async addIncomeOffline(incomeData: any): Promise<string> {
    const tempId = this.generateTempId();
    const now = new Date().toISOString();
    
    await offlineDB.incomes.add({
      ...incomeData,
      id: tempId,
      sync_status: 'pending',
      created_at: now,
      updated_at: now
    });
    
    return tempId;
  }

  // Get incomes (combines online and offline data)
  async getIncomes(): Promise<any[]> {
    const onlineIncomes = this.isOnline() ? await this.getOnlineIncomes() : [];
    const offlineIncomes = await offlineDB.incomes.toArray();
    
    // Combine and deduplicate
    const allIncomes = [...onlineIncomes, ...offlineIncomes];
    return allIncomes.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  private async getOnlineIncomes(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('income_sources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log('Failed to fetch online incomes:', error);
      return [];
    }
  }

  // Sync offline data when back online
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline() || this.syncInProgress) return;

    this.syncInProgress = true;
    
    try {
      // Sync pending incomes
      const pendingIncomes = await offlineDB.incomes
        .where('sync_status')
        .equals('pending')
        .toArray();

      for (const income of pendingIncomes) {
        try {
          const { data, error } = await supabase
            .from('income_sources')
            .insert({
              description: income.description,
              amount: Number(income.amount),
              currency: income.currency,
              source_type: income.source_type,
              source_location: income.source_location,
              received_date: income.received_date
            })
            .select()
            .single();

          if (error) throw error;

          // Mark as synced
          await offlineDB.incomes
            .where('id')
            .equals(income.id)
            .modify({
              id: data.id,
              sync_status: 'synced',
              updated_at: new Date().toISOString()
            });

        } catch (error) {
          console.log('Failed to sync income:', error);
          await offlineDB.incomes
            .where('id')
            .equals(income.id)
            .modify({
              sync_status: 'failed',
              updated_at: new Date().toISOString()
            });
        }
      }

      // Similar sync logic for other data types...
      await this.syncAssets();
      await this.syncGoals();
      await this.syncTransactions();
      await this.syncBudgetCategories();

    } finally {
      this.syncInProgress = false;
    }
  }

  // Similar methods for other data types
  async addAsset(assetData: any): Promise<string> {
    if (this.isOnline()) {
      try {
        const { data, error } = await supabase
          .from('assets')
          .insert(assetData)
          .select()
          .single();
        
        if (error) throw error;
        return data.id;
      } catch (error) {
        return this.addAssetOffline(assetData);
      }
    } else {
      return this.addAssetOffline(assetData);
    }
  }

  private async addAssetOffline(assetData: any): Promise<string> {
    const tempId = this.generateTempId();
    const now = new Date().toISOString();
    
    await offlineDB.assets.add({
      ...assetData,
      id: tempId,
      sync_status: 'pending',
      created_at: now,
      updated_at: now
    });
    
    return tempId;
  }

  async getAssets(): Promise<any[]> {
    const onlineAssets = this.isOnline() ? await this.getOnlineAssets() : [];
    const offlineAssets = await offlineDB.assets.toArray();
    
    return [...onlineAssets, ...offlineAssets].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  private async getOnlineAssets(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  private async syncAssets(): Promise<void> {
    const pendingAssets = await offlineDB.assets
      .where('sync_status')
      .equals('pending')
      .toArray();

    for (const asset of pendingAssets) {
      try {
        const { data, error } = await supabase
          .from('assets')
          .insert({
            asset_name: asset.asset_name,
            asset_type: asset.asset_type,
            current_value: asset.current_value,
            currency: asset.currency,
            purchase_date: asset.purchase_date,
            notes: asset.notes
          })
          .select()
          .single();

        if (error) throw error;

        await offlineDB.assets
          .where('id')
          .equals(asset.id)
          .modify({
            id: data.id,
            sync_status: 'synced',
            updated_at: new Date().toISOString()
          });

      } catch (error) {
        await offlineDB.assets
          .where('id')
          .equals(asset.id)
          .modify({
            sync_status: 'failed',
            updated_at: new Date().toISOString()
          });
      }
    }
  }

  // Placeholder methods for other data types
  private async syncGoals(): Promise<void> {
    // Similar implementation for goals
  }

  private async syncTransactions(): Promise<void> {
    // Similar implementation for transactions
  }

  private async syncBudgetCategories(): Promise<void> {
    // Similar implementation for budget categories
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    pending: number;
    failed: number;
    synced: number;
  }> {
    const pending = await offlineDB.incomes
      .where('sync_status')
      .equals('pending')
      .count();
    
    const failed = await offlineDB.incomes
      .where('sync_status')
      .equals('failed')
      .count();
    
    const synced = await offlineDB.incomes
      .where('sync_status')
      .equals('synced')
      .count();

    return { pending, failed, synced };
  }
}

// Export singleton instance
export const offlineSync = OfflineSyncService.getInstance(); 