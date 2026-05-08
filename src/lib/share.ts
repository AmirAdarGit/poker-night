export type ShareResult =
  | { kind: 'shared' }
  | { kind: 'copied' }
  | { kind: 'failed' };

export async function shareGameLink(
  url: string,
  title: string,
  text: string,
): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({ url, title, text });
      return { kind: 'shared' };
    } catch (err) {
      // User cancelled — treat like nothing happened, but try clipboard as a courtesy
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { kind: 'failed' };
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return { kind: 'copied' };
    } catch {
      // fall through
    }
  }

  return { kind: 'failed' };
}

export function buildGameUrl(gameId: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('g', gameId);
  url.hash = '';
  return url.toString();
}

export function readGameIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('g');
  return id && id.length > 0 ? id : null;
}

export function setGameIdInUrl(gameId: string | null): void {
  const url = new URL(window.location.href);
  if (gameId) {
    url.searchParams.set('g', gameId);
  } else {
    url.searchParams.delete('g');
  }
  url.hash = '';
  window.history.replaceState({}, '', url.toString());
}
