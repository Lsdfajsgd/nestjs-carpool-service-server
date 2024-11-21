import {TypeOrmModuleOptions} from "@nestjs/typeorm";
import * as process from "node:process";
import * as path from "node:path";

export const typeORMConfig : TypeOrmModuleOptions = {
  type : 'mysql',
  host : '127.0.0.1',
  port : 3306,
  username: 'root',
  password: 'Min56km55**',
  database : 'test',
  entities : [__dirname + '/../**/*.entity{.ts,.js}', path.resolve(__dirname, '../matching/entities/*.entity{.ts,.js}')],
  synchronize : true,
}