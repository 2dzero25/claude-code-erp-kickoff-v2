export type CustomerGrade = "NORMAL" | "SILVER" | "GOLD";

export interface Customer {
  id: string;
  name: string;
  grade: CustomerGrade;
}
