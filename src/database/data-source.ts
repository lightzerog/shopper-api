import { DataSource } from "typeorm";
import { Customer } from "../models/customer";
import { Measure } from "../models/measure";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "mysqldb",
    port: 3306,
    username: "root",
    password: "admin",
    database: "shopper",
    synchronize: true,
    logging: false,
    entities: [Customer, Measure],
})