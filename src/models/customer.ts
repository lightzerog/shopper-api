import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Measure } from "./measure";

@Entity()
export class Customer  {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @OneToMany(() => Measure, (measure) => measure.customer)
    measures: Measure[];
}