import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class ITransactionalService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Executes the provided work function within a TypeORM database transaction.
   *
   * @template T - The return type of the work function.
   * @param work - A function that takes an EntityManager and performs database operations.
   * @returns A promise that resolves to the result of the work function.
   * @protected
   */
  protected async withTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return await this.dataSource.transaction(async (manager) => {
      return await work(manager);
    });
  }
}
