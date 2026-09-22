/**
 * Google / Apple "Sign in" popups.
 *
 * Both providers require a client ID that's registered against your app's
 * real domain (Google Cloud Console / Apple Developer portal) — there's no
 * way around that from the frontend. Until those env vars are set, these
 * functions report a clear error instead of silently doing nothing, which
 * is what made the buttons look broken before.
 *
 * Configure:
 *   VITE_GOOGLE_CLIENT_ID   - Google Cloud Console > APIs & Services > Credentials
 *   VITE_APPLE_CLIENT_ID    - Apple Developer > Certificates, IDs & Profiles > Services ID
 *   VITE_APPLE_REDIRECT_URI - a URL registered on that Services ID
 * (see .env.example)
 */

const loadedScripts = new Set();

function loadScript(src) {
  if (loadedScripts.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Opens the Google OAuth popup and requests an access token.
 * @param {{ onSuccess?: (res: any) => void, onError?: (err: Error) => void }} handlers
 */
export async function signInWithGoogle({ onSuccess, onError } = {}) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    onError?.(new Error(
      'Google sign-in is not configured yet: set VITE_GOOGLE_CLIENT_ID in your .env file (see .env.example).'
    ));
    return;
  }

  try {
    await loadScript('https://accounts.google.com/gsi/client');
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error) {
          onError?.(new Error(response.error_description || response.error));
        } else {
          onSuccess?.(response);
        }
      },
    });
    client.requestAccessToken(); // this line opens the actual Google popup
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Opens the "Sign in with Apple" popup.
 * @param {{ onSuccess?: (res: any) => void, onError?: (err: Error) => void }} handlers
 */
export async function signInWithApple({ onSuccess, onError } = {}) {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
  const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI;
  if (!clientId || !redirectURI) {
    onError?.(new Error(
      'Apple sign-in is not configured yet: set VITE_APPLE_CLIENT_ID and VITE_APPLE_REDIRECT_URI in your .env file (see .env.example).'
    ));
    return;
  }

  try {
    await loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');
    window.AppleID.auth.init({
      clientId,
      scope: 'name email',
      redirectURI,
      usePopup: true,
    });
    const data = await window.AppleID.auth.signIn(); // this line opens the actual Apple popup
    onSuccess?.(data);
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}