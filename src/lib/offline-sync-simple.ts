import { offlineDB } from './offline-db';
import { supabase } from '@/integrations/supabase/client';

// Simple offline sync service that works with your current setup
export class SimpleOfflineSync {
  private static instance: SimpleOfflineSync;

  static getInstance(): SimpleOfflineSync {
    if (!SimpleOfflineSync.instance) {
      SimpleOfflineSync.instance = new SimpleOfflineSync();
    }
    return SimpleOfflineSync.instance;
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
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    if (this.isOnline()) {
      try {
        const { data, error } = await supabase
          .from('income_sources')
          .insert({
            ...incomeData,
            user_id: user.id,
            amount: Number(incomeData.amount)
          })
          .select()
          .single();
        
        if (error) throw error;
        return data.id;
      } catch (error) {
        console.log('Online save failed, saving offline:', error);
        return this.addIncomeOffline(incomeData, user.id);
      }
    } else {
      return this.addIncomeOffline(incomeData, user.id);
    }
  }

  private async addIncomeOffline(incomeData: any, userId: string): Promise<string> {
    const tempId = this.generateTempId();
    const now = new Date().toISOString();
    
    await offlineDB.incomes.add({
      ...incomeData,
      user_id: userId,
      id: tempId,
      sync_status: 'pending',
      created_at: now,
      updated_at: now
    });
    
    return tempId;
  }

  // Get incomes (combines online and offline data)
  async getIncomes(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const onlineIncomes = this.isOnline() ? await this.getOnlineIncomes(user.id) : [];
    const offlineIncomes = await offlineDB.incomes
      .where('user_id')
      .equals(user.id)
      .toArray();
    
    // Combine and deduplicate
    const allIncomes = [...onlineIncomes, ...offlineIncomes];
    return allIncomes.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  private async getOnlineIncomes(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('income_sources')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log('Failed to fetch online incomes:', error);
      return [];
    }
  }

  // Add asset record
  async addAsset(assetData: any): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    if (this.isOnline()) {
      try {
        const { data, error } = await supabase
          .from('assets')
          .insert({
            ...assetData,
            user_id: user.id,
            current_value: Number(assetData.current_value)
          })
          .select()
          .single();
        
        if (error) throw error;
        return data.id;
      } catch (error) {
        return this.addAssetOffline(assetData, user.id);
      }
    } else {
      return this.addAssetOffline(assetData, user.id);
    }
  }

  private async addAssetOffline(assetData: any, userId: string): Promise<string> {
    const tempId = this.generateTempId();
    const now = new Date().toISOString();
    
    await offlineDB.assets.add({
      ...assetData,
      user_id: userId,
      id: tempId,
      sync_status: 'pending',
      created_at: now,
      updated_at: now
    });
    
    return tempId;
  }

  // Get assets
  async getAssets(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const onlineAssets = this.isOnline() ? await this.getOnlineAssets(user.id) : [];
    const offlineAssets = await offlineDB.assets
      .where('user_id')
      .equals(user.id)
      .toArray();
    
    return [...onlineAssets, ...offlineAssets].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  private async getOnlineAssets(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Sync offline data when back online
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log('Starting offline data sync...');

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
            received_date: income.received_date,
            user_id: user.id
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

        console.log('Synced income:', data.id);

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

    // Sync pending assets
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
            current_value: Number(asset.current_value),
            currency: asset.currency,
            purchase_date: asset.purchase_date,
            description: asset.notes,
            user_id: user.id
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

        console.log('Synced asset:', data.id);

      } catch (error) {
        console.log('Failed to sync asset:', error);
        await offlineDB.assets
          .where('id')
          .equals(asset.id)
          .modify({
            sync_status: 'failed',
            updated_at: new Date().toISOString()
          });
      }
    }

    console.log('Offline sync completed');
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

  // Clear synced data
  async clearSyncedData(): Promise<void> {
    await offlineDB.incomes
      .where('sync_status')
      .equals('synced')
      .delete();
    
    await offlineDB.assets
      .where('sync_status')
      .equals('synced')
      .delete();
  }
}

// Export singleton instance
export const simpleOfflineSync = SimpleOfflineSync.getInstance(); 