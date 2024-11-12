import {TypeOrmModuleOptions} from "@nestjs/typeorm";
import * as process from "node:process"; 

export const typeORMConfig : TypeOrmModuleOptions = {
  type : 'mysql',
  host : 'localhost',
  port : 3306,
  username: 'root',
  password: 'rlawjdals1',
  database : 'carpool-db',
  entities : [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize : true,
}