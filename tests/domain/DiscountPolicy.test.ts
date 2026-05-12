import { describe, it, expect } from "vitest";
import { DiscountPolicy } from "@/core/domain/policies/DiscountPolicy";

describe("DiscountPolicy", () => {
  it("일반 고객은 할인이 없다", () => {
    expect(DiscountPolicy.apply(100000, "NORMAL")).toBe(100000);
  });

  it("실버 고객은 5% 할인이 적용된다", () => {
    expect(DiscountPolicy.apply(100000, "SILVER")).toBe(95000);
  });

  it("골드 고객은 10% 할인이 적용된다", () => {
    expect(DiscountPolicy.apply(100000, "GOLD")).toBe(90000);
  });

  it("음수 금액은 에러를 throw한다", () => {
    expect(() => DiscountPolicy.apply(-100, "NORMAL")).toThrow();
  });

  it("반올림은 Math.round 규칙을 따른다", () => {
    // 33333 * 5% = 1666.65 → round(1666.65) = 1667 → 33333 - 1667 = 31666
    expect(DiscountPolicy.apply(33333, "SILVER")).toBe(31666);
  });
});
