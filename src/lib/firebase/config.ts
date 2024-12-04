import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAICwewb9nIfENQH-gOJgkpQXZKBity9ck",
  authDomain: "accounting-c3c06.firebaseapp.com",
  projectId: "accounting-c3c06",
  storageBucket: "accounting-c3c06.appspot.com",
  messagingSenderId: "670119019137",
  appId: "1:670119019137:web:f5c57a1a6f5ef05c720380"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const storage = getStorage(app);

// Настройка Storage
storage.maxOperationRetryTime = 120000; // 2 минуты
storage.maxUploadRetryTime = 120000; // 2 минуты

export { storage };

// Создаем необходимые индексы
const createRequiredIndexes = async () => {
  try {
    const indexes = [
      // Индексы для движений товаров
      {
        collectionGroup: 'productMovements',
        queryScope: 'COLLECTION',
        fields: [
          { fieldPath: 'productId', order: 'ASCENDING' },
          { fieldPath: 'type', order: 'ASCENDING' },
          { fieldPath: 'date', order: 'DESCENDING' }
        ]
      },
      // Индекс для транзакций по движениям
      {
        collectionGroup: 'transactions',
        queryScope: 'COLLECTION',
        fields: [
          { fieldPath: 'movementId', order: 'ASCENDING' },
          { fieldPath: 'date', order: 'DESCENDING' }
        ]
      },
      // Индекс для категорий
      {
        collectionGroup: 'categories',
        queryScope: 'COLLECTION',
        fields: [
          { fieldPath: 'row', order: 'ASCENDING' },
          { fieldPath: 'title', order: 'ASCENDING' }
        ]
      }
    ];

    // В реальном приложении здесь был бы код для создания индексов через Admin SDK
    console.log('Required indexes configuration:', indexes);
  } catch (error) {
    console.error('Error configuring indexes:', error);
  }
};

// Создаем индексы при инициализации
createRequiredIndexes();

// Enable offline persistence with unlimited cache size
enableIndexedDbPersistence(db, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
}).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support offline persistence.');
  }
});

createRequiredIndexes();

export default db;