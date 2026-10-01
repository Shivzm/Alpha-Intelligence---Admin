const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore: getFirestoreForApp } = require("firebase-admin/firestore");

const APP_NAME = "alpha-admin-api";
let database;

function serializeValue(value) {
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)]),
    );
  }
  return value;
}

function configurationError(code, message) {
  const error = new Error(message);
  error.statusCode = 503;
  error.code = code;
  return error;
}

function getFirebaseApp() {
  const existingApp = getApps().find((app) => app.name === APP_NAME);
  if (existingApp) return existingApp;

  const serializedAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serializedAccount) {
    throw configurationError(
      "FIREBASE_NOT_CONFIGURED",
      "Firestore is not configured for this backend."
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serializedAccount);
  } catch {
    throw configurationError(
      "FIREBASE_CONFIG_INVALID",
      "The Firebase service account configuration is invalid."
    );
  }

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw configurationError(
      "FIREBASE_CONFIG_INVALID",
      "The Firebase service account configuration is incomplete."
    );
  }

  const credential = cert({
    ...serviceAccount,
    private_key: serviceAccount.private_key.replace(/\\n/g, "\n"),
  });
  const options = {
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  };

  if (process.env.FIREBASE_STORAGE_BUCKET) {
    options.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }

  return initializeApp(options, APP_NAME);
}

function getFirestoreDb() {
  if (!database) {
    database = getFirestoreForApp(getFirebaseApp());
  }
  return database;
}

async function listDocuments(collectionName, limit = 50) {
  const snapshot = await getFirestoreDb()
    .collection(collectionName)
    .limit(limit)
    .get();

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...serializeValue(document.data()),
  }));
}

async function countDocuments(collectionName, filters = []) {
  let query = getFirestoreDb().collection(collectionName);
  for (const [field, operator, value] of filters) {
    query = query.where(field, operator, value);
  }
  const snapshot = await query.count().get();
  return snapshot.data().count;
}

module.exports = { countDocuments, getFirebaseApp, getFirestoreDb, listDocuments, serializeValue };
