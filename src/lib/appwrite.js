import { Client, Account, Databases, Functions } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const functions = new Functions(client);

// Database constants
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const TIMERS_COLLECTION = process.env.APPWRITE_TIMERS_COLLECTION_ID;
const QUEUE_COLLECTION = process.env.APPWRITE_QUEUE_COLLECTION_ID;

export { client, account, databases, functions, DATABASE_ID, TIMERS_COLLECTION, QUEUE_COLLECTION };
