/**
 * Downloads the self-contained offline version of PocketLedger.
 * Uses Blob URL download to guarantee file download dialog inside any iframe or browser environment.
 */
export async function downloadOfflineApp(filename = 'PocketLedger_Offline.html'): Promise<void> {
  try {
    const res = await fetch('/pocketledger_offline.html');
    if (!res.ok) {
      throw new Error(`Failed to fetch offline file: ${res.statusText}`);
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 1000);
  } catch (err) {
    console.warn('Direct blob download failed, falling back to direct link:', err);
    // Fallback
    const fallbackLink = document.createElement('a');
    fallbackLink.href = '/pocketledger_offline.html';
    fallbackLink.download = filename;
    fallbackLink.target = '_blank';
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    setTimeout(() => {
      if (fallbackLink.parentNode) {
        fallbackLink.parentNode.removeChild(fallbackLink);
      }
    }, 1000);
  }
}
