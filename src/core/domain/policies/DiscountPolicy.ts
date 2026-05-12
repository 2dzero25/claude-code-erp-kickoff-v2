import type { CustomerGrade } from "@/core/domain/entities/Customer";

/**
 * Apply a customer-grade discount to an original amount.
 *
 * TODO: 등급별 할인 정책을 구현한다.
 * 자세한 spec은 docs/lab-prompts/01-discount-policy.md 참고.
 *
 * 통과해야 하는 테스트: tests/domain/DiscountPolicy.test.ts (5)
 */
export class DiscountPolicy {
  static apply(_originalAmount: number, _grade: CustomerGrade): number {
    throw new Error("DiscountPolicy.apply is not implemented yet");
  }
}
