import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import { CustomerRoot } from './src/CustomerRoot';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ThemeTransitionOverlay } from './src/components/ThemeTransitionOverlay';

export default function App() {
  // Inject global CSS for mobile web ergonomics, smooth scrolling, and marquee on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'global-customer-front-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          /* Mobile web optimization: smooth scrolling, touch ergonomics, prevent unwanted overflow */
          html, body {
            overflow-x: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-tap-highlight-color: transparent !important;
            -webkit-touch-callout: none !important;
            touch-action: manipulation !important;
            -webkit-text-size-adjust: 100% !important;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", -apple-system-subheadline, "Helvetica Neue", Helvetica, Arial, sans-serif !important;
          }
          /* Prevent iOS Safari from auto-zooming on input focus */
          input, textarea, select {
            font-size: 16px !important;
            -webkit-appearance: none !important;
          }
          /* Make receipt and container scrollbars completely invisible and fit seamlessly with background */
          ::-webkit-scrollbar {
            width: 0px !important;
            height: 0px !important;
            background: transparent !important;
            display: none !important;
          }
          ::-webkit-scrollbar-track {
            background: transparent !important;
          }
          ::-webkit-scrollbar-thumb {
            background: transparent !important;
          }
          * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          /* Live Moving Word Banner Smooth Marquee */
          @keyframes srMarqueeLoop {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-50%, 0, 0);
            }
          }
          .sr-moving-marquee-track {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            width: max-content !important;
            white-space: nowrap !important;
            animation: srMarqueeLoop 26s linear infinite !important;
            will-change: transform !important;
          }
          .sr-moving-marquee-track:hover {
            animation-play-state: paused !important;
          }
        `;
        document.head.appendChild(style);
      }

      // Smoothly dismiss splash screen once React takes over the DOM
      if (typeof window.__dismissSplash === 'function') {
        window.__dismissSplash();
      } else {
        const sp = document.getElementById('sr-splash');
        if (sp) {
          sp.style.opacity = '0';
          setTimeout(() => {
            if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
          }, 320);
        }
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <View style={styles.container}>
          <CustomerRoot adminMode={false} />
          <ThemeTransitionOverlay />
        </View>
      </AppProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: Platform.OS === 'web' ? '100%' : '100%',
  },
});
