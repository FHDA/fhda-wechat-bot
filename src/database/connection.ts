import { logger } from "../logger";
import * as util from "../util";
import * as mongodb from "mongodb";

export interface DbAuth {
  url: string;
  user?: string;
  password?: string;
  dbName?: string;
}

abstract class Connection {
  protected dbClient: any;
  protected dbAuth: DbAuth;

  constructor(dbAuth: DbAuth) {
    this.dbAuth = dbAuth;
  }

  protected abstract async open(): Promise<any>;
  protected abstract async close(): Promise<any>;
  public abstract async isConnect(): Promise<boolean>;
  protected async reconnect(
    delayReconnectionTime: number = 3000
  ): Promise<any> {
    await this.close();
    logger.info(
      `database connection closed, ` +
        `delay ${delayReconnectionTime} ms to open connection`
    );
    util.sleep(delayReconnectionTime);
    await this.open();
  }
}
