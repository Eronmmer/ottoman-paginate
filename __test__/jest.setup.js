const dotenv = require("dotenv");
dotenv.config();
const { Ottoman, close } = require("ottoman");
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;

const bucketName = "travel-sample";
const username = DB_USERNAME;
const password = DB_PASSWORD;
const connectionString = "couchbase://127.0.0.1";
const connectUri = `${connectionString}/${bucketName}@${username}:${password}`;

beforeEach(async () => {
  let options = {};
  if (process.env.OTTOMAN_LEGACY_TEST) {
    options = { collectionName: "_default" };
  }
  const ottoman = new Ottoman(options);
  ottoman.connect(connectUri);
});

afterEach(async () => {
  close();
});
