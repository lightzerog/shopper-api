import { Measure } from "../models/measure";
import { Customer } from "../models/customer";
import { AppDataSource } from "../database/data-source";
import { injectable } from "tsyringe";
import { MeasureResponse } from "../usecases/responses";

@injectable()
export class MeasureRepository {
  private repository = AppDataSource.getRepository(Measure);

  async findMeasure(
    customer: Customer,
    measureType: string
  ): Promise<Measure[]> {
    return this.repository.findBy({
      type: measureType,
      customer: customer,
    });
  }

  async getMeasureFromCustomer(
    customerId: string,
    measureType: string
  ): Promise<MeasureResponse[]> {
    let measures;

    if (measureType != '') {
      measures = await this.repository
        .createQueryBuilder("measure")
        .innerJoin("measure.customer", "customer")
        .where("customer.id = :customerId")
        .andWhere("measure.type = :measureType")
        .andWhere("measure.has_confirmed = true")
        .setParameters({
          customerId: customerId,
          measureType: measureType,
        })
        .getMany();
    } else {
      measures = await this.repository
        .createQueryBuilder("measure")
        .innerJoin("measure.customer", "customer")
        .where("customer.id = :customerId")
        .andWhere("measure.has_confirmed = true")
        .setParameters({
          customerId: customerId,
        })
        .getMany();
    }

    let measureResponse: MeasureResponse[] = [];
    for (const measure of measures) {
      let newMeasure = new MeasureResponse(
        measure.id,
        measure.datetime,
        measure.type,
        measure.has_confirmed,
        measure.image_url
      );
      measureResponse.push(newMeasure);
    }

    return measureResponse;
  }

  async existsMeasureInMonth(
    customerId: string,
    measureDate: Date,
    measureType: string
  ): Promise<Measure | null> {
    let month = measureDate.getMonth() + 1;
    let year = measureDate.getFullYear();

    return this.repository
      .createQueryBuilder("measure")
      .innerJoin("measure.customer", "customer")
      .where("customer.id = :customerId")
      .andWhere("measure.type = :measureType")
      .andWhere("EXTRACT(MONTH FROM measure.datetime) = :measureMonth", {
        month,
      })
      .andWhere("EXTRACT(YEAR FROM measure.datetime) = :measureYear", { year })
      .andWhere("measure.has_confirmed = true")
      .setParameters({
        customerId: customerId,
        measureType: measureType,
        measureMonth: month,
        measureYear: year,
      })
      .getOne();
  }

  async measureToConfirm(measureId: string): Promise<Measure | null> {
    return this.repository
      .createQueryBuilder("measure")
      .where("measure.id = :measureId")
      .setParameters({
        measureId: measureId,
      })
      .getOne();
  }

  async createMeasure(measure: Measure): Promise<Measure> {
    return this.repository.save(measure);
  }
}
