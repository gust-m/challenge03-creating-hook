import React, { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';
import { useCallback } from 'react';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    const Acc = {...sumAmount};
    Acc[product.id] = product.amount;

    return Acc;
  }, {} as CartItemsAmount)

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await api.get('/products');
      const updatedProducts: ProductFormatted[] = data.map((product: Product) => {
        const newProduct = Object.assign(product, {
          priceFormatted: formatPrice(product.price),
        });
        return newProduct;
      });
      setProducts(updatedProducts);
    }

    loadProducts();
  }, []);

  const handleAddProduct = useCallback((id: number) => {
    addProduct(id);
  }, [addProduct]);

  return (
    <ProductList>
      {products.map(product => {
        return (
          <li key={product.id}>
            <img src={product.image} alt={product.title} />
            <strong>{product.title}</strong>
            <span>{formatPrice(product.price)}</span>
            <button
              type="button"
              data-testid="add-product-button"
              onClick={() => handleAddProduct(product.id)}
            >
              <div
                data-testid="cart-product-quantity"
              >
                <MdAddShoppingCart size={16} color="#FFF" />
                {cartItemsAmount[product.id] || 0}
              </div>
    
              <span>ADICIONAR AO CARRINHO</span>
            </button>
          </li>
        )
      })}
    </ProductList>
  );
};

export default Home;
