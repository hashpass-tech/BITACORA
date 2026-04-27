import { Alert } from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Show a toast-like notification using Alert
 * For React Native, we use Alert since there's no native toast
 * Requirements: 32.2, 32.4
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  onRetry?: () => void
): void {
  const title = {
    success: '✓ Success',
    error: '✕ Error',
    warning: '⚠ Warning',
    info: 'ℹ Info',
  }[type];

  const buttons = [{ text: 'OK', onPress: () => {} }];

  if (onRetry && type === 'error') {
    buttons.unshift({
      text: 'Retry',
      onPress: onRetry,
    });
  }

  Alert.alert(title, message, buttons);
}

/**
 * Show an error toast with optional retry
 */
export function showErrorToast(message: string, onRetry?: () => void): void {
  showToast(message, 'error', onRetry);
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string): void {
  showToast(message, 'success');
}

/**
 * Show a warning toast
 */
export function showWarningToast(message: string): void {
  showToast(message, 'warning');
}
