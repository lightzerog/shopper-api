import { Customer } from "../models/customer";
import { AppDataSource } from "../database/data-source";
import { injectable } from "tsyringe";

@injectable()
export class CustomerRepository {
  private repository = AppDataSource.getRepository(Customer);

  async findById(id: string): Promise<Customer | null> {
    const customer = await this.repository.findOneBy({
      id: id,
    });

    return customer;
  }
}
