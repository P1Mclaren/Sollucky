import { useEffect } from 'react';
import { useTestMode } from '@/contexts/TestModeContext';

export function MetaTags() {
  const { isTestMode } = useTestMode();

  useEffect(() => {
    // Add or remove noindex meta tag based on test mode
    let metaTag = document.querySelector('meta[name="robots"]');

    if (isTestMode) {
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'robots');
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', 'noindex, nofollow');
    } else {
      if (metaTag) {
        metaTag.remove();
      }
    }

    return () => {
      // Cleanup on unmount
      const tag = document.querySelector('meta[name="robots"]');
      if (tag) tag.remove();
    };
  }, [isTestMode]);

  return null;
}