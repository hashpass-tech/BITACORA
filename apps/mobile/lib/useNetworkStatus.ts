import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
  type: string | null;
}

/**
 * Hook to track network connectivity status
 * Provides real-time updates on network availability
 * Requirements: 32.1, 32.2
 */
export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    isConnecting: false,
    type: null,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let appStateSubscription: any = null;

    const setupNetworkListener = async () => {
      try {
        // Check initial network state
        const state = await NetInfo.fetch();
        setNetworkStatus({
          isOnline: state.isConnected ?? true,
          isConnecting: state.isConnecting ?? false,
          type: state.type ?? null,
        });

        // Subscribe to network state changes
        unsubscribe = NetInfo.addEventListener((state) => {
          setNetworkStatus({
            isOnline: state.isConnected ?? true,
            isConnecting: state.isConnecting ?? false,
            type: state.type ?? null,
          });
        });

        // Handle app state changes (resume from background)
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
          if (nextAppState === 'active') {
            // App has come to foreground, check network status
            const state = await NetInfo.fetch();
            setNetworkStatus({
              isOnline: state.isConnected ?? true,
              isConnecting: state.isConnecting ?? false,
              type: state.type ?? null,
            });
          }
        };

        appStateSubscription = AppState.addEventListener(
          'change',
          handleAppStateChange
        );
      } catch (error) {
        console.error('Failed to setup network listener:', error);
      }
    };

    setupNetworkListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
    };
  }, []);

  return networkStatus;
}
