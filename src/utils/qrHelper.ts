import QRCode from 'qrcode';

export interface QRCodeResult {
  qrDataUrl: string;
  shareUrl: string;
  networkUrl: string;
  sessionId: string;
}

export async function generatePhotoBoothQR(
  imageDataUrl: string, 
  title: string = 'SnapBox Photo Strip',
  preferredHost?: string
): Promise<QRCodeResult> {
  // Generate a random session token
  const sessionId = 'snap_' + Math.random().toString(36).substring(2, 9);
  const timestamp = new Date().toISOString();

  // 1. Post to local Vite server API so any external mobile device on the Wi-Fi network can fetch it!
  try {
    await fetch('/api/save-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: sessionId,
        image: imageDataUrl,
        title: title,
        timestamp: timestamp,
      }),
    });
  } catch (apiErr) {
    console.warn('Could not post session to local server API:', apiErr);
  }
  
  // 2. Also save in localStorage as local fallback
  try {
    const sessionPayload = {
      image: imageDataUrl,
      title: title,
      timestamp: timestamp,
    };
    localStorage.setItem(sessionId, JSON.stringify(sessionPayload));
    localStorage.setItem('snap_latest', JSON.stringify(sessionPayload));
  } catch (err) {
    console.warn('Could not save to localStorage (storage quota full?):', err);
  }

  // Construct sharing URL
  const origin = window.location.origin;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol || 'http:';
  
  // Prefer detected local network IP (192.168.8.139) so external phones can reach it over Wi-Fi
  const lanHost = preferredHost || '192.168.8.139';
  const networkUrl = `${protocol}//${lanHost}${port}/?session=${sessionId}`;

  // If currently browsing via localhost or 127.0.0.1, encode the LAN network URL into the QR code
  // so the phone's scanner connects directly to this computer!
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const shareUrl = isLocal ? networkUrl : `${origin}/?session=${sessionId}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });

    return { qrDataUrl, shareUrl, networkUrl, sessionId };
  } catch (error) {
    console.error('Failed to generate QR Code:', error);
    const fallbackDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 400,
      margin: 2
    });
    return { qrDataUrl: fallbackDataUrl, shareUrl, networkUrl, sessionId };
  }
}
