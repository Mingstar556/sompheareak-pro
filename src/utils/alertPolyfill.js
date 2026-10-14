import { Platform, Alert } from 'react-native';

/**
 * Universal Web Alert Polyfill for React Native Web
 * React Native Web leaves Alert.alert as an empty no-op function.
 * This polyfill provides full support for alerts, confirmations with button callbacks,
 * and text prompts on web browsers.
 */
if (Platform.OS === 'web') {
  if (typeof window !== 'undefined') {
    Alert.alert = (title, message, buttons, options) => {
      const titleStr = title ? String(title) : '';
      const messageStr = message ? String(message) : '';
      const fullText = titleStr && messageStr ? `${titleStr}\n\n${messageStr}` : (titleStr || messageStr);

      // If no buttons or only 1 button (OK/acknowledge alert)
      if (!buttons || buttons.length <= 1) {
        window.alert(fullText);
        if (buttons && buttons[0] && typeof buttons[0].onPress === 'function') {
          buttons[0].onPress();
        }
        return;
      }

      // Multiple buttons -> standard confirmation dialog
      const cancelBtn = buttons.find((b) => b.style === 'cancel');
      const confirmBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];

      const confirmed = window.confirm(fullText);
      if (confirmed) {
        if (confirmBtn && typeof confirmBtn.onPress === 'function') {
          confirmBtn.onPress();
        }
      } else {
        if (cancelBtn && typeof cancelBtn.onPress === 'function') {
          cancelBtn.onPress();
        }
      }
    };

    Alert.prompt = (title, message, callbackOrButtons, type, defaultValue) => {
      const titleStr = title ? String(title) : '';
      const messageStr = message ? String(message) : '';
      const fullText = titleStr && messageStr ? `${titleStr}\n\n${messageStr}` : (titleStr || messageStr);

      const input = window.prompt(fullText, typeof defaultValue === 'string' ? defaultValue : '');
      if (input !== null) {
        if (typeof callbackOrButtons === 'function') {
          callbackOrButtons(input);
        } else if (Array.isArray(callbackOrButtons)) {
          const confirmBtn = callbackOrButtons.find((b) => b.style !== 'cancel') || callbackOrButtons[callbackOrButtons.length - 1];
          if (confirmBtn && typeof confirmBtn.onPress === 'function') {
            confirmBtn.onPress(input);
          }
        }
      }
    };
  }
}

export default Alert;
