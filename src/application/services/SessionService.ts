export type SessionStatus = 'locked' | 'unlocked' | 'uninitialized';

export interface SessionService {
  getStatus(): SessionStatus;
  startInactivityTimer(): void;
  resetInactivityTimer(): void;
  clearSession(): void;
}
