export interface OrderApprovalDto {
  orderId: string;
}

export interface OrderApprovalResult {
  orderId: string;
  finalAmount: number;
  approvedAt: Date;
}
