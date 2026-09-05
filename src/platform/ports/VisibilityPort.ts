export type VisibilityListener = (visible: boolean) => void;

export interface VisibilityPort {
  isVisible(): boolean;
  onVisibilityChange(listener: VisibilityListener): () => void;
}
