import { FarmAPI } from './farmApi';
import { GuestFarmStorage } from '../utils/guestFarmStorage';
import type { User } from '../types/user';

/**
 * Service for managing guest mode functionality
 */
export class GuestModeService {
  private static _migrating = false;

  /**
   * Create a guest user object
   */
  static createGuestUser(): User {
    return {
      id: 'guest',
      fullName: 'Guest User',
      email: 'guest@CropLab.com',
      phone: '',
      address: '',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Check if current session is in guest mode
   */
  static isGuestMode(): boolean {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');

    // If no auth token but guest token exists, we're in guest mode
    const guestToken = localStorage.getItem('guest_mode');
    return !token && !user && guestToken === 'true';
  }

  /**
   * Enable guest mode
   */
  static enableGuestMode(): User {
    localStorage.setItem('guest_mode', 'true');
    const guestUser = this.createGuestUser();
    localStorage.setItem('guest_user', JSON.stringify(guestUser));
    return guestUser;
  }

  /**
   * Get guest user data
   */
  static getGuestUser(): User | null {
    try {
      const guestUserStr = localStorage.getItem('guest_user');
      return guestUserStr ? JSON.parse(guestUserStr) : null;
    } catch (error) {
      console.error('Error getting guest user:', error);
      return null;
    }
  }

  /**
   * Disable guest mode (cleanup)
   */
  static disableGuestMode(): void {
    localStorage.removeItem('guest_mode');
    localStorage.removeItem('guest_user');
  }

  /**
   * Migrate all guest farms to user account after signup/signin
   */
  static async migrateGuestFarmsToUser(): Promise<{
    success: boolean;
    migratedCount: number;
    errors: string[];
  }> {
    // Prevent multiple concurrent migrations
    if (this._migrating) {
      console.warn('Migration already in progress, skipping duplicate call');
      return { success: false, migratedCount: 0, errors: ['Migration already in progress'] };
    }

    this._migrating = true;
    
    try {
      const guestFarms = GuestFarmStorage.getAllForMigration();
      const errors: string[] = [];
      let migratedCount = 0;

      console.log('🔍 Migration debug - Guest farms found:', {
        count: guestFarms.length,
        farms: guestFarms.map(f => ({ name: f.name, crop: f.crop }))
      });

      if (guestFarms.length === 0) {
        console.log('⚠️ No guest farms to migrate');
        return { success: true, migratedCount: 0, errors: [] };
      }

      console.log(`🔄 Starting migration of ${guestFarms.length} guest farms...`);

      // Get existing farms first to prevent duplicates
      let existingFarmNames: string[] = [];
      try {
        const existingFarms = await FarmAPI.getFarms(1, 100); // Get more farms to check
        if (existingFarms.code === 1) {
          existingFarmNames = existingFarms.result.farms.map(f => f.name.toLowerCase().trim());
          console.log('📋 Existing farm names:', existingFarmNames);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch existing farms, proceeding with migration:', error);
      }

      // Migrate farms with duplicate checking
      for (const farmData of guestFarms) {
        try {
          // Check for duplicate names
          const farmNameLower = farmData.name.toLowerCase().trim();
          if (existingFarmNames.includes(farmNameLower)) {
            console.log(`⏭️ Skipping farm "${farmData.name}" - already exists`);
            migratedCount++; // Count as successful to avoid error
            continue;
          }

          const createRequest = FarmAPI.transformToApiFormat(farmData);
          console.log('📤 Migrating farm:', farmData.name);
          console.log('🔍 Farm data being sent:', createRequest);
          
          const response = await FarmAPI.createFarm(createRequest);
          console.log('📥 Migration response:', response);

          if (response.code === 1) {
            migratedCount++;
            // Add to existing names to prevent duplicates in same migration
            existingFarmNames.push(farmNameLower);
            console.log(`✅ Successfully migrated farm: ${farmData.name}`);
          } else {
            const errorMsg = `Failed to migrate farm "${farmData.name}": ${response.message}`;
            console.error(`❌ ${errorMsg}`);
            errors.push(errorMsg);
          }
        } catch (error: unknown) {
          console.error('🐛 Full migration error details:', {
            farmName: farmData.name,
            error: error,
            errorType: typeof error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined
          });
          
          // Check if it's a timeout error but farm might have been created
          const isTimeoutError = error && typeof error === 'object' && 
            'type' in error && error.type === 'network' &&
            'message' in error && error.message === 'Request timeout';
            
          if (isTimeoutError) {
            console.log('⏱️ Timeout detected - farm might have been created anyway');
            // Don't treat timeout as complete failure since farm might exist
            migratedCount++;
          }
          
          const errorMessage = error instanceof Error ? error.message : JSON.stringify(error) || 'Unknown error';
          const errorMsg = `Failed to migrate farm "${farmData.name}": ${errorMessage}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }

        // Longer delay to prevent rate limiting and reduce server load
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Always clear guest farms after migration attempt
      console.log('🧹 Cleaning up guest farms...');
      GuestFarmStorage.clearAllFarms();
      this.disableGuestMode();
      
      const success = migratedCount > 0 || guestFarms.length === 0;
      console.log(
        `✅ Migration completed: ${migratedCount}/${guestFarms.length} farms migrated, success: ${success}`
      );

      return { success, migratedCount, errors };
    } finally {
      this._migrating = false;
    }
  }

  /**
   * Check if user should be automatically logged in as guest
   */
  static shouldAutoEnableGuest(): boolean {
    const hasAuthToken = !!localStorage.getItem('auth_token');
    const hasAuthUser = !!localStorage.getItem('auth_user');
    const hasGuestMode = !!localStorage.getItem('guest_mode');

    // Enable guest mode if no authentication and not already in guest mode
    return !hasAuthToken && !hasAuthUser && !hasGuestMode;
  }

  /**
   * Get total guest farms count
   */
  static getGuestFarmsCount(): number {
    return GuestFarmStorage.getCount();
  }

  /**
   * Check if there are guest farms to migrate
   */
  static hasGuestFarmsToMigrate(): boolean {
    const hasGuestFarms = GuestFarmStorage.hasGuestFarms();
    const guestFarmCount = GuestFarmStorage.getCount();
    console.log('🔍 hasGuestFarmsToMigrate check:', { hasGuestFarms, guestFarmCount });
    
    // Also check localStorage directly for debugging
    const rawData = localStorage.getItem('CropLab_guest_farms');
    console.log('🔍 localStorage guest_farms:', rawData);
    
    return hasGuestFarms;
  }

  /**
   * Force migration for debugging (call this manually in console)
   */
  static async debugMigration() {
    console.log('🐛 DEBUG: Force triggering migration...');
    const result = await this.migrateGuestFarmsToUser();
    console.log('🐛 DEBUG: Migration result:', result);
    return result;
  }
}

export default GuestModeService;
