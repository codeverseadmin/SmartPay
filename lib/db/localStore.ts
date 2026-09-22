import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface DocumentWithId {
  _id: string;
  [key: string]: any;
}

export class ObjectIdMock {
  private id: string;
  constructor(id?: string) {
    this.id = id ? String(id) : crypto.randomBytes(12).toString('hex');
  }
  toString() {
    return this.id;
  }
  valueOf() {
    return this.id;
  }
  equals(other: any) {
    if (!other) return false;
    return this.id === (typeof other === 'string' ? other : other.toString());
  }
  toJSON() {
    return this.id;
  }
}

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function matchValue(docVal: any, queryVal: any): boolean {
  if (queryVal === undefined) return true;
  if (queryVal === null) return docVal === null;

  // Handle ObjectId comparison
  if (docVal && (docVal._id || typeof docVal === 'object')) {
    const docStr = docVal.toString();
    const queryStr = queryVal.toString();
    if (docStr === queryStr) return true;
  }

  if (typeof queryVal === 'object') {
    if (queryVal.$regex) {
      const reg = new RegExp(queryVal.$regex, queryVal.$options || '');
      return reg.test(String(docVal || ''));
    }
    if (queryVal.$gte !== undefined) {
      const docTime = new Date(docVal).getTime();
      const qTime = new Date(queryVal.$gte).getTime();
      return docTime >= qTime;
    }
    if (queryVal.$lte !== undefined) {
      const docTime = new Date(docVal).getTime();
      const qTime = new Date(queryVal.$lte).getTime();
      return docTime <= qTime;
    }
    if (queryVal.$gt !== undefined) {
      const docTime = new Date(docVal).getTime();
      const qTime = new Date(queryVal.$gt).getTime();
      return docTime > qTime;
    }
    if (queryVal.$lt !== undefined) {
      const docTime = new Date(docVal).getTime();
      const qTime = new Date(queryVal.$lt).getTime();
      return docTime < qTime;
    }
    if (queryVal.$ne !== undefined) {
      return String(docVal) !== String(queryVal.$ne);
    }
    if (Array.isArray(queryVal.$in)) {
      return queryVal.$in.some((item: any) => String(item) === String(docVal));
    }
  }

  return String(docVal) === String(queryVal);
}

function matchDoc(doc: any, query: Record<string, any>): boolean {
  for (const [key, val] of Object.entries(query)) {
    if (key === '$or' && Array.isArray(val)) {
      const orMatched = val.some((subQ) => matchDoc(doc, subQ));
      if (!orMatched) return false;
      continue;
    }
    if (key === '$and' && Array.isArray(val)) {
      const andMatched = val.every((subQ) => matchDoc(doc, subQ));
      if (!andMatched) return false;
      continue;
    }
    if (!matchValue(doc[key], val)) {
      return false;
    }
  }
  return true;
}

class QueryChain<T = any> implements PromiseLike<T> {
  private promise: Promise<T>;
  private executeFn: () => Promise<any>;
  private sortSpec: any = null;
  private skipCount: number = 0;
  private limitCount: number = 0;
  private populateFields: string[] = [];
  private selectFields: string = '';
  private isLean: boolean = false;

  constructor(executeFn: () => Promise<any>) {
    this.executeFn = executeFn;
    this.promise = this.exec();
  }

  sort(spec: any) {
    this.sortSpec = spec;
    this.promise = this.exec();
    return this;
  }

  skip(count: number) {
    this.skipCount = count;
    this.promise = this.exec();
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    this.promise = this.exec();
    return this;
  }

  populate(field: string) {
    this.populateFields.push(field);
    this.promise = this.exec();
    return this;
  }

  select(fields: string) {
    this.selectFields = fields;
    this.promise = this.exec();
    return this;
  }

  lean() {
    this.isLean = true;
    this.promise = this.exec();
    return this;
  }

  private async exec(): Promise<any> {
    let result = await this.executeFn();
    if (!result) return result;

    const isArray = Array.isArray(result);
    let items = isArray ? [...result] : [result];

    // Sorting
    if (this.sortSpec && isArray) {
      if (typeof this.sortSpec === 'string') {
        const desc = this.sortSpec.startsWith('-');
        const field = desc ? this.sortSpec.substring(1) : this.sortSpec;
        items.sort((a, b) => {
          const va = a[field] instanceof Date ? a[field].getTime() : a[field];
          const vb = b[field] instanceof Date ? b[field].getTime() : b[field];
          if (va < vb) return desc ? 1 : -1;
          if (va > vb) return desc ? -1 : 1;
          return 0;
        });
      } else if (typeof this.sortSpec === 'object') {
        for (const [field, dir] of Object.entries(this.sortSpec)) {
          const desc = dir === -1 || dir === '-1';
          items.sort((a, b) => {
            const va = a[field] instanceof Date ? a[field].getTime() : a[field];
            const vb = b[field] instanceof Date ? b[field].getTime() : b[field];
            if (va < vb) return desc ? 1 : -1;
            if (va > vb) return desc ? -1 : 1;
            return 0;
          });
        }
      }
    }

    // Skip
    if (this.skipCount > 0 && isArray) {
      items = items.slice(this.skipCount);
    }

    // Limit
    if (this.limitCount > 0 && isArray) {
      items = items.slice(0, this.limitCount);
    }

    // Populate
    if (this.populateFields.length > 0) {
      for (const field of this.populateFields) {
        for (const item of items) {
          if (field === 'paymentParts') {
            const partIds = Array.isArray(item.paymentParts) ? item.paymentParts : [];
            const resolvedParts = partIds
              .map((pid: any) => {
                const idStr = pid?._id ? pid._id.toString() : pid?.toString();
                return localStore.getCollection('paymentparts').find((p: any) => p._id.toString() === idStr);
              })
              .filter(Boolean);
            item.paymentParts = resolvedParts;
          }
        }
      }
    }

    // Select (e.g. '-passwordHash')
    if (this.selectFields) {
      const excludes = this.selectFields
        .split(' ')
        .filter((s) => s.startsWith('-'))
        .map((s) => s.substring(1));
      for (const item of items) {
        for (const exc of excludes) {
          delete item[exc];
        }
      }
    }

    if (this.isLean) {
      items = JSON.parse(JSON.stringify(items));
    }

    return isArray ? items : items[0] || null;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult> {
    return this.promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<T> {
    return this.promise.finally(onfinally);
  }
}

import defaultData from './defaultData.json';

class LocalDatabase {
  private data: {
    users: any[];
    invoices: any[];
    paymentparts: any[];
    customers: any[];
  } = {
    users: JSON.parse(JSON.stringify(defaultData.users || [])),
    invoices: JSON.parse(JSON.stringify(defaultData.invoices || [])),
    paymentparts: JSON.parse(JSON.stringify(defaultData.paymentparts || [])),
    customers: JSON.parse(JSON.stringify(defaultData.customers || [])),
  };

  private filePath: string;
  private initialized: boolean = false;

  constructor() {
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
    const dataDir = isServerless ? path.join('/tmp', '.data') : path.join(process.cwd(), '.data');
    this.filePath = path.join(dataDir, 'smartpay-db.json');
  }

  public init() {
    if (this.initialized) return;
    try {
      const dataDir = path.dirname(this.filePath);
      if (!fs.existsSync(dataDir)) {
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch {}
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users?.length ? parsed.users : JSON.parse(JSON.stringify(defaultData.users || [])),
          invoices: parsed.invoices?.length ? parsed.invoices : JSON.parse(JSON.stringify(defaultData.invoices || [])),
          paymentparts: parsed.paymentparts?.length ? parsed.paymentparts : JSON.parse(JSON.stringify(defaultData.paymentparts || [])),
          customers: parsed.customers || [],
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('[SmartPay LocalStore] Init warning (using in-memory default data):', err);
    }
    this.initialized = true;
  }

  public save() {
    try {
      const dataDir = path.dirname(this.filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SmartPay LocalStore] Save error:', err);
    }
  }

  public getCollection(name: string): any[] {
    this.init();
    const key = name.toLowerCase() as keyof typeof this.data;
    if (!this.data[key]) {
      this.data[key] = [];
    }
    return this.data[key];
  }

  public wrapDoc(doc: any, collectionName: string) {
    if (!doc) return null;
    const db = this;
    if (typeof doc._id === 'string') {
      // Keep doc._id string or ObjectIdMock
      const idStr = doc._id;
      doc._id = {
        toString: () => idStr,
        valueOf: () => idStr,
        toJSON: () => idStr,
        equals: (other: any) => (other ? idStr === (typeof other === 'string' ? other : other.toString()) : false),
      };
    }

    doc.save = async function () {
      const coll = db.getCollection(collectionName);
      const idStr = doc._id.toString();
      const idx = coll.findIndex((item: any) => item._id.toString() === idStr);
      const cleanCopy = { ...doc };
      delete cleanCopy.save;
      cleanCopy._id = idStr;
      if (idx >= 0) {
        coll[idx] = cleanCopy;
      } else {
        coll.push(cleanCopy);
      }
      db.save();
      return doc;
    };

    return doc;
  }

  public createModel(collectionName: string) {
    const db = this;

    function ModelConstructor(this: any, data: any) {
      const idStr = generateId();
      Object.assign(this, data);
      this._id = {
        toString: () => idStr,
        valueOf: () => idStr,
        toJSON: () => idStr,
        equals: (other: any) => (other ? idStr === (typeof other === 'string' ? other : other.toString()) : false),
      };
      if (!this.createdAt) this.createdAt = new Date();
      if (!this.updatedAt) this.updatedAt = new Date();
      if (!this.auditLog && collectionName === 'invoices') this.auditLog = [];

      this.save = async () => {
        const coll = db.getCollection(collectionName);
        const cleanCopy = { ...this };
        delete cleanCopy.save;
        cleanCopy._id = idStr;
        const idx = coll.findIndex((item: any) => item._id.toString() === idStr);
        if (idx >= 0) {
          coll[idx] = cleanCopy;
        } else {
          coll.push(cleanCopy);
        }
        db.save();
        return this;
      };
    }

    const modelObj: any = ModelConstructor;

    modelObj.find = (query: Record<string, any> = {}) => {
      return new QueryChain(async () => {
        const coll = db.getCollection(collectionName);
        const matched = coll.filter((doc) => matchDoc(doc, query));
        return matched.map((doc) => db.wrapDoc({ ...doc }, collectionName));
      });
    };

    modelObj.findOne = (query: Record<string, any> = {}) => {
      return new QueryChain(async () => {
        const coll = db.getCollection(collectionName);
        const found = coll.find((doc) => matchDoc(doc, query));
        return found ? db.wrapDoc({ ...found }, collectionName) : null;
      });
    };

    modelObj.findById = (id: any) => {
      return new QueryChain(async () => {
        const idStr = id?._id ? id._id.toString() : id?.toString();
        const coll = db.getCollection(collectionName);
        const found = coll.find((doc) => doc._id.toString() === idStr);
        return found ? db.wrapDoc({ ...found }, collectionName) : null;
      });
    };

    modelObj.countDocuments = async (query: Record<string, any> = {}) => {
      const coll = db.getCollection(collectionName);
      return coll.filter((doc) => matchDoc(doc, query)).length;
    };

    modelObj.create = async (data: any) => {
      const instance = new (modelObj as any)(data);
      await instance.save();
      return instance;
    };

    modelObj.deleteOne = async (query: Record<string, any> = {}) => {
      const coll = db.getCollection(collectionName);
      const idx = coll.findIndex((doc) => matchDoc(doc, query));
      if (idx >= 0) {
        coll.splice(idx, 1);
        db.save();
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    };

    modelObj.deleteMany = async (query: Record<string, any> = {}) => {
      const coll = db.getCollection(collectionName);
      if (Object.keys(query).length === 0) {
        const count = coll.length;
        coll.length = 0;
        db.save();
        return { deletedCount: count };
      }
      let deleted = 0;
      for (let i = coll.length - 1; i >= 0; i--) {
        if (matchDoc(coll[i], query)) {
          coll.splice(i, 1);
          deleted++;
        }
      }
      db.save();
      return { deletedCount: deleted };
    };

    modelObj.findByIdAndUpdate = (id: any, update: any, options: any = {}) => {
      return new QueryChain(async () => {
        const idStr = id?._id ? id._id.toString() : id?.toString();
        const coll = db.getCollection(collectionName);
        const idx = coll.findIndex((doc) => doc._id.toString() === idStr);
        if (idx === -1) return null;

        const doc = coll[idx];
        if (update.$inc) {
          for (const [k, v] of Object.entries(update.$inc)) {
            doc[k] = (doc[k] || 0) + (v as number);
          }
        }
        if (update.$set) {
          Object.assign(doc, update.$set);
        }
        // Direct field updates
        for (const [k, v] of Object.entries(update)) {
          if (!k.startsWith('$')) {
            doc[k] = v;
          }
        }
        doc.updatedAt = new Date();
        db.save();
        return db.wrapDoc({ ...doc }, collectionName);
      });
    };

    return modelObj;
  }
}

export const localStore = new LocalDatabase();
export const LocalUser = localStore.createModel('users');
export const LocalInvoice = localStore.createModel('invoices');
export const LocalPaymentPart = localStore.createModel('paymentparts');
export const LocalCustomer = localStore.createModel('customers');
