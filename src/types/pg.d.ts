declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    query(queryText: string, values?: any[]): Promise<{ rows: any[] }>;
    end(): Promise<void>;
  }
}
