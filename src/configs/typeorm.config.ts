import {TypeOrmModuleOptions} from "@nestjs/typeorm";
import * as process from "node:process";

export const typeORMConfig : TypeOrmModuleOptions = {
  type : 'mysql',
  host : process.env.MYSQLHOST,
  port : 3306,
  username: 'root',
  password: process.env.MYSQLPASSWORD,
  database : process.env.MYSQLSCHEMAS,
  entities : [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize : true,
}