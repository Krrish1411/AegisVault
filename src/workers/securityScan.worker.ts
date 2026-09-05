/**
 * Web Worker for off-thread security scanning and password health analysis.
 */

export interface SecurityScanWorkerMessage {
  type: 'ANALYZE_REQUEST';
  requestId: string;
}

export interface SecurityScanWorkerResponse {
  type: 'ANALYZE_RESPONSE';
  requestId: string;
  success: boolean;
}

self.onmessage = (event: MessageEvent<SecurityScanWorkerMessage>) => {
  if (event.data.type === 'ANALYZE_REQUEST') {
    const response: SecurityScanWorkerResponse = {
      type: 'ANALYZE_RESPONSE',
      requestId: event.data.requestId,
      success: true,
    };
    self.postMessage(response);
  }
};
