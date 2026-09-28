/** Configure VITE_GOOGLE_CLIENT_ID with an OAuth app registration (see .env.example). */

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
 * Renders Google's official sign-in button, which returns a signed ID token.
 * @param {{ onSuccess?: (credential: string) => void, onError?: (err: Error) => void }} handlers
 */
export async function initializeGoogleSignIn({ onSuccess, onError } = {}) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    onError?.(new Error(
      'Google sign-in is not configured yet: set VITE_GOOGLE_CLIENT_ID in your .env file (see .env.example).'
    ));
    return;
  }

  try {
    await loadScript('https://accounts.google.com/gsi/client');
    const googleIdentity = window.google?.accounts?.id;
    const container = document.getElementById('google-signin-button');
    if (!googleIdentity || !container) {
      throw new Error('Google sign-in could not initialize.');
    }

    googleIdentity.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          onSuccess?.(response.credential);
        } else {
          onError?.(new Error('Google did not return an identity credential.'));
        }
      },
    });
    container.replaceChildren();
    googleIdentity.renderButton(container, {
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: Math.min(container.clientWidth, 400),
    });
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}

