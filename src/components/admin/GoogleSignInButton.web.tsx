import { useEffect, useRef } from 'react';

import type { GoogleSignInButtonProps } from './GoogleSignInButton';

type CredentialResponse = { credential?: string };

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        ux_mode?: 'popup' | 'redirect';
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
      disableAutoSelect: () => void;
    };
  };
};

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise: Promise<GoogleIdentity> | null = null;

const googleGlobal = () => (window as unknown as { google?: GoogleIdentity }).google;

function loadGoogleIdentity() {
  const existing = googleGlobal();
  if (existing?.accounts?.id) return Promise.resolve(existing);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const google = googleGlobal();
        if (google?.accounts?.id) resolve(google);
        else reject(new Error('Google sign-in did not load.'));
      };
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load Google sign-in. Check your connection or ad blocker.'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export function disableGoogleAutoSelect() {
  googleGlobal()?.accounts?.id?.disableAutoSelect();
}

export function GoogleSignInButton({ clientId, onCredential, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onCredential, onError });

  useEffect(() => {
    callbacks.current = { onCredential, onError };
  }, [onCredential, onError]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentity()
      .then((google) => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (response) => {
            if (response.credential) callbacks.current.onCredential(response.credential);
            else callbacks.current.onError?.('Google did not return a sign-in token. Please try again.');
          },
        });
        container.innerHTML = '';
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 280,
        });
      })
      .catch((err: Error) => {
        if (!cancelled) callbacks.current.onError?.(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return <div ref={containerRef} style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />;
}
