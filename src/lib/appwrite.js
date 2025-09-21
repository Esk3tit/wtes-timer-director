import { Client, Account, Functions, TablesDB } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setDevKey(process.env.NEXT_PUBLIC_APPWRITE_DEV_KEY);

const account = new Account(client);
const functions = new Functions(client);
const tables = new TablesDB(client);

// Database constants
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const TIMERS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_TIMERS_COLLECTION_ID;
const QUEUE_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_QUEUE_COLLECTION_ID;

export { client, account, tables, functions, DATABASE_ID, TIMERS_COLLECTION, QUEUE_COLLECTION };
