import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

jest.setTimeout(60000);

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.CCPAYMENT_APP_ID = 'test-app-id';
  process.env.CCPAYMENT_APP_SECRET = 'test-app-secret';
  process.env.NOWPAYMENTS_API_KEY = 'test-api-key';
  process.env.NOWPAYMENTS_IPN_SECRET = 'test-ipn-secret';
});

afterAll(async () => {
  if (mongod) {
    await mongod.stop();
  }
});
