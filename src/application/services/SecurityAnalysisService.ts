export interface SecurityScoreSummary {
  readonly overallScore: number;
  readonly weakPasswordsCount: number;
  readonly reusedPasswordsCount: number;
  readonly oldPasswordsCount: number;
  readonly missingTotpCount: number;
  readonly totalItemsAnalyzed: number;
}

export interface SecurityAnalysisService {
  analyze(): SecurityScoreSummary;
}
