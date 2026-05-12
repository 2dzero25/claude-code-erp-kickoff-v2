export interface InventoryRepository {
  getStock(productId: string): Promise<number>;
  decrement(productId: string, quantity: number): Promise<void>;
}
