import { collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { doc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types/warehouse';

interface Movement {
  id: string;
  type: 'in' | 'out';
  quantity: number;
  price: number;
  totalPrice: number;
  previousQuantity: number;
  newQuantity: number;
  previousAveragePrice: number;
  newAveragePrice: number;
  supplier?: string;
}

export const deleteProductMovement = async (movement: Movement, product: Product) => {
  const batch = writeBatch(db);

  try {
    // Проверяем существование движения
    const movementRef = doc(db, 'productMovements', movement.id);
    const movementDoc = await getDoc(movementRef);
    
    if (!movementDoc.exists()) {
      throw new Error('Движение товара не найдено');
    }

    const movementData = movementDoc.data();

    // Находим связанные транзакции
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('movementId', '==', movement.id)
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    // Удаляем все связанные транзакции
    transactionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Обновляем количество и цены товара
    const productRef = doc(db, 'products', product.id);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      throw new Error('Товар не найден');
    }

    const currentProduct = productDoc.data() as Product;

    if (movement.type === 'in') {
      // Если это был приход - вычитаем количество и пересчитываем среднюю цену
      const newQuantity = currentProduct.quantity - movement.quantity;
      const newTotalPrice = (currentProduct.totalPurchasePrice || 0) - movement.totalPrice;
      const newAveragePrice = newQuantity > 0 ? newTotalPrice / newQuantity : 0;
      
      batch.update(productRef, {
        quantity: newQuantity,
        totalPurchasePrice: newTotalPrice,
        averagePurchasePrice: newAveragePrice,
        updatedAt: serverTimestamp()
      });

      // Если был указан поставщик, обновляем его баланс
      if (movement.supplier) {
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('title', '==', movement.supplier),
          where('row', '==', 2)
        );
        
        const categoriesSnapshot = await getDocs(categoriesQuery);
        if (!categoriesSnapshot.empty) {
          const categoryDoc = categoriesSnapshot.docs[0];
          const currentAmount = parseFloat(categoryDoc.data().amount.replace(/[^\d.-]/g, ''));
          batch.update(doc(db, 'categories', categoryDoc.id), {
            amount: `${(currentAmount + movement.totalPrice).toLocaleString()} ₸`,
            updatedAt: serverTimestamp()
          });
        }
      }
    } else {
      // Если это был расход - возвращаем количество
      batch.update(productRef, {
        quantity: currentProduct.quantity + movement.quantity,
        updatedAt: serverTimestamp()
      });
    }

    // Удаляем движение
    batch.delete(movementRef);

    await batch.commit();
  } catch (error) {
    console.error('Error deleting product movement:', error);
    throw new Error('Не удалось удалить операцию');
  }
};