export interface RiskDecision {
  approved: boolean;
  approvedSize: number;
  reason?: string;
}

export class RiskEngine {
  evaluate(size: number, combinedAsk?: number): RiskDecision {
    if (combinedAsk && combinedAsk >= 1) {
      return { approved: false, approvedSize: 0, reason: 'Paired cost is not below parity.' };
    }
    return { approved: size > 0, approvedSize: Math.max(1, size) };
  }
}
