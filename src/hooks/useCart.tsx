import { useEffect } from 'react';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  stockProducts: Stock[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider = ({ children }: CartProviderProps): JSX.Element => {
  const [stockProducts, setStockProducts] = useState<Stock[]>(() => {
    const storagedStockProducts = localStorage.getItem('@Rocketshoes:stock');

    if (storagedStockProducts) {
      return JSON.parse(storagedStockProducts);
    }

    return [];
  });

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@Rocketshoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    const loadStockAmount = async () => {
      if (!stockProducts.length) {
        const { data } = await api.get('stock');
        const initialStockProducts = data;
        setStockProducts(initialStockProducts);
      }
    }
    loadStockAmount();
  }, [stockProducts.length]);

  useEffect(() => {
    localStorage.setItem('@Rocketshoes:stock', JSON.stringify(stockProducts));
    localStorage.setItem('@Rocketshoes:cart', JSON.stringify(cart));
  }, [stockProducts, cart]);

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get('/products');
      const productToBeAdded: Product = data.find((product: Omit<Product, 'amount'>) => product.id === productId);

      const checkIfProductIsAlreadyInTheCart = cart.find(item => item.id === productToBeAdded.id);
      const itemToBeAdded = stockProducts.find(stock => stock.id === productId);

      if (!itemToBeAdded) {
        throw new Error('There is no one item with the provided id');
      }

      const checkItemAmount = (itemToBeAdded.amount - 1) > -1;

      if (checkItemAmount) {
        const updatedStockProducts = stockProducts.map(stock => {
          if (stock.id === productId) {
            const updatedProduct: Stock = {id: stock.id, amount: (stock.amount-1)};

            return updatedProduct;
          }
          return stock;
        });
        setStockProducts(updatedStockProducts);

        if (checkIfProductIsAlreadyInTheCart) {
          const updatedCart = cart.map(item => {
            if (item.id === productId) {
              const newCart: Product = {...item, amount: (item.amount + 1)};
              return newCart;
            }
            return item;
          });
          setCart(updatedCart);
        } else {
          const updatedProduct = Object.assign(productToBeAdded, {
            amount: 1,
          });
          setCart([...cart, updatedProduct]);
        }

      } else {
        throw new Error('There is no more of this product in stock');
      }
    } catch (err) {
      toast.error(err);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount, stockProducts }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = (): CartContextData => {
  const context = useContext(CartContext);

  return context;
}
