import React, { useState, useEffect } from 'react';
import { ArrowLeft, Barcode, QrCode, Plus, Minus, Image as ImageIcon, Trash2, History } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Product } from '../../../types/product';
import { BarcodeGenerator } from '../../../components/warehouse/BarcodeGenerator';
import { ProductHistory } from '../../../components/warehouse/ProductHistory';

export const ProductDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeCode, setActiveCode] = useState<'barcode' | 'qrcode'>('barcode');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      try {
        const productDoc = await getDoc(doc(db, 'products', id));
        if (productDoc.exists()) {
          setProduct({ id: productDoc.id, ...productDoc.data() } as Product);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Товар не найден</h2>
          <button
            onClick={() => navigate('/warehouse/products')}
            className="mt-4 text-emerald-600 hover:text-emerald-700"
          >
            Вернуться к списку товаров
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="text-gray-600">
                <ArrowLeft className="w-6 h-6"/>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Редактирование товара</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Информация о товаре */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                {product?.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900">{product?.name}</h2>
                <p className="text-sm text-gray-500">{product?.category}</p>
                <div className="mt-2">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Количество: <span className="font-medium">{product.quantity} {product.unit}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Средняя цена: <span className="font-medium">{product.averagePurchasePrice?.toLocaleString()} ₸</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Общая стоимость: <span className="font-medium">{(product.quantity * (product.averagePurchasePrice || 0)).toLocaleString()} ₸</span>
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.quantity > (product.minQuantity || 0) ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.quantity > (product.minQuantity || 0) ? 'В наличии' : 'Мало на складе'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Коды */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveCode('barcode')}
                  className={`px-3 py-1.5 rounded ${
                    activeCode === 'barcode' ? 'bg-emerald-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  <Barcode className="w-4 h-4 inline-block mr-1" />
                  Штрих-код
                </button>
                <button
                  onClick={() => setActiveCode('qrcode')}
                  className={`px-3 py-1.5 rounded ${
                    activeCode === 'qrcode' ? 'bg-emerald-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  <QrCode className="w-4 h-4 inline-block mr-1" />
                  QR-код
                </button>
              </div>
            </div>
            <BarcodeGenerator
              value={product?.id || ''}
              type={activeCode}
            />
          </div>

          {/* История операций */}
          <div className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
            <h3 className="text-lg font-medium">История операций</h3>
            <button
              onClick={() => setShowHistory(true)}
              className="px-3 py-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 flex items-center gap-1"
            >
              <History className="w-4 h-4" />
              Показать историю
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно истории */}
      {showHistory && product && (
        <ProductHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          product={product}
        />
      )}
    </div>
  );
};