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

export class MongoConnection extends Connection {
  protected dbClient: mongodb.MongoClient;
  private options?: mongodb.MongoClientOptions;
  private db?: mongodb.Db;
  private getMongoDbUrl(): string {
    let mongoDbUrl: string = `mongodb://`;
    if (this.dbAuth.user) {
      mongoDbUrl += this.dbAuth.user;
      if (this.dbAuth.password) mongoDbUrl += `:${this.dbAuth.password}`;
      mongoDbUrl += `@${this.dbAuth.url}`;
    } else {
      mongoDbUrl += this.dbAuth.url;
    }
    return mongoDbUrl;
  }

  constructor(dbAuth: DbAuth, options?: mongodb.MongoClientOptions) {
    super(dbAuth);
    this.dbAuth = dbAuth;
    this.options = options;
    const mongoDbUrl: string = this.getMongoDbUrl();
    this.dbClient = new mongodb.MongoClient(mongoDbUrl, this.options);
  }

  protected async open(): Promise<boolean> {
    if (this.dbClient.isConnected()) {
      return true;
    }
    logger.info("start opening mongodb connection");
    try {
      await this.dbClient.connect();
    } catch (error) {
      logger.error(`Connect to mongoDB error: ${error}`);
      return false;
    }

    this.db = this.dbClient.db(this.dbAuth.dbName);

    logger.info("mongodb connection opened");
    return true;
  }

  protected async close(force?: boolean): Promise<void> {
    logger.info("start closing mongodb connection");
    await this.dbClient.close(force);
    this.db = undefined;
    logger.info("closed mongodb connection");
  }

  public async isConnect(): Promise<boolean> {
    return this.dbClient.isConnected();
  }

  public getDb(): mongodb.Db | undefined {
    return this.db;
  }

  public getClient(): mongodb.MongoClient {
    return this.dbClient;
  }
}
