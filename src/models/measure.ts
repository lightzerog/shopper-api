import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Customer } from "./customer";

@Entity()
export class Measure  {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    datetime: Date

    @Column()
    type: string;

    @Column()
    value: number;

    @Column()
    has_confirmed: boolean;

    @Column()
    image_url: string;

    @ManyToOne(() => Customer, (customer) => customer.measures)
    customer: Customer;
}