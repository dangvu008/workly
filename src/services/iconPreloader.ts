/**
 * ✅ Icon Preloader Service - Quản lý việc preload icons để cải thiện performance
 * Giải quyết vấn đề icon load chậm hơn ứng dụng
 */

import React from 'react';
import { Font } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

export class IconPreloaderService {
  private static instance: IconPreloaderService;
  private isPreloaded = false;
  private preloadPromise: Promise<void> | null = null;

  static getInstance(): IconPreloaderService {
    if (!IconPreloaderService.instance) {
      IconPreloaderService.instance = new IconPreloaderService();
    }
    return IconPreloaderService.instance;
  }

  /**
   * ✅ Preload icon fonts và critical icons
   */
  async preloadIcons(): Promise<void> {
    if (this.isPreloaded) {
      return;
    }

    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    this.preloadPromise = this._performPreload();
    return this.preloadPromise;
  }

  private async _performPreload(): Promise<void> {
    try {
      console.log('🎨 IconPreloader: Starting icon preload...');
      const startTime = Date.now();

      // Keep splash screen visible during preload
      await SplashScreen.preventAutoHideAsync();

      // Preload MaterialCommunityIcons font
      await this.preloadMaterialCommunityIcons();

      // Preload other icon fonts if needed
      await this.preloadOtherIconFonts();

      // Cache critical icons
      await this.cacheCriticalIcons();

      const endTime = Date.now();
      console.log(`✅ IconPreloader: Preload completed in ${endTime - startTime}ms`);

      this.isPreloaded = true;

      // Hide splash screen after preload
      await SplashScreen.hideAsync();

    } catch (error) {
      console.error('❌ IconPreloader: Error during preload:', error);
      // Hide splash screen even if preload fails
      await SplashScreen.hideAsync();
    }
  }

  /**
   * ✅ Preload MaterialCommunityIcons font
   */
  private async preloadMaterialCommunityIcons(): Promise<void> {
    try {
      // MaterialCommunityIcons thường được load tự động bởi @expo/vector-icons
      // Nhưng chúng ta có thể đảm bảo nó được load trước
      const fontMap = {
        'MaterialCommunityIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
      };

      await Font.loadAsync(fontMap);
      console.log('✅ IconPreloader: MaterialCommunityIcons font loaded');
    } catch (error) {
      console.warn('⚠️ IconPreloader: MaterialCommunityIcons already loaded or error:', error);
    }
  }

  /**
   * ✅ Preload other icon fonts if needed
   */
  private async preloadOtherIconFonts(): Promise<void> {
    try {
      // Nếu app sử dụng các icon fonts khác, load chúng ở đây
      const otherFonts = {
        // 'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
        // 'FontAwesome': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
      };

      if (Object.keys(otherFonts).length > 0) {
        await Font.loadAsync(otherFonts);
        console.log('✅ IconPreloader: Other icon fonts loaded');
      }
    } catch (error) {
      console.warn('⚠️ IconPreloader: Error loading other fonts:', error);
    }
  }

  /**
   * ✅ Cache critical icons để render nhanh hơn
   */
  private async cacheCriticalIcons(): Promise<void> {
    try {
      // Import critical icons list
      const { CRITICAL_ICONS, preloadCriticalIcons } = await import('../components/OptimizedIcon');
      
      await preloadCriticalIcons();
      console.log(`✅ IconPreloader: Cached ${CRITICAL_ICONS.length} critical icons`);
    } catch (error) {
      console.warn('⚠️ IconPreloader: Error caching critical icons:', error);
    }
  }

  /**
   * ✅ Check if icons are preloaded
   */
  isIconsPreloaded(): boolean {
    return this.isPreloaded;
  }

  /**
   * ✅ Force reload icons (for development/testing)
   */
  async reloadIcons(): Promise<void> {
    this.isPreloaded = false;
    this.preloadPromise = null;
    await this.preloadIcons();
  }

  /**
   * ✅ Get preload status
   */
  getPreloadStatus(): {
    isPreloaded: boolean;
    isPreloading: boolean;
  } {
    return {
      isPreloaded: this.isPreloaded,
      isPreloading: this.preloadPromise !== null && !this.isPreloaded,
    };
  }
}

// Export singleton instance
export const iconPreloader = IconPreloaderService.getInstance();

/**
 * ✅ Hook để sử dụng trong React components
 */
export const useIconPreloader = () => {
  const [status, setStatus] = React.useState(iconPreloader.getPreloadStatus());

  React.useEffect(() => {
    const checkStatus = () => {
      setStatus(iconPreloader.getPreloadStatus());
    };

    // Check status periodically during preload
    const interval = setInterval(checkStatus, 100);

    // Cleanup interval when preload is done
    if (status.isPreloaded) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [status.isPreloaded]);

  return status;
};

/**
 * ✅ Utility function để preload icons trong App.tsx
 */
export const initializeIconPreloader = async (): Promise<void> => {
  try {
    await iconPreloader.preloadIcons();
  } catch (error) {
    console.error('❌ Failed to initialize icon preloader:', error);
  }
};
