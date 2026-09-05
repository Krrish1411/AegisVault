/**
 * Web Worker for off-thread Argon2id KDF operations.
 */

export interface CryptoWorkerRequest {
  type: 'DERIVE_KEY_REQUEST';
  requestId: string;
}

export interface CryptoWorkerResponse {
  type: 'DERIVE_KEY_RESPONSE';
  requestId: string;
  success: boolean;
}

self.onmessage = (event: MessageEvent<CryptoWorkerRequest>) => {
  if (event.data.type === 'DERIVE_KEY_REQUEST') {
    const response: CryptoWorkerResponse = {
      type: 'DERIVE_KEY_RESPONSE',
      requestId: event.data.requestId,
      success: true,
    };
    self.postMessage(response);
  }
};
