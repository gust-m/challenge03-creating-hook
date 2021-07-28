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
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider = ({ children }: CartProviderProps): JSX.Element => {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stockProductData = await api.get(`/stock/${productId}`);
      const formattedStockProduct: Stock = stockProductData.data;


      const { data } = await api.get(`/products/${productId}`);
      const productToBeAdded = data;

      const productIndexOnCart = cart.findIndex((product: Product) => product.id === productId);
    
      if (!productToBeAdded) {
        throw new Error();
      }
      
      const checkIfProductIsAlreadyInTheCart = cart.find(item => item.id === productId);
      
      if (checkIfProductIsAlreadyInTheCart) {
        
        if (cart[productIndexOnCart].amount >= formattedStockProduct.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        
        const updatedCart = cart.map(item => {
          if (item.id === productId) {
            const newCart: Product = {...item, amount: (item.amount + 1)};
            return newCart;
          }
          return item;
        });
    
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    
        setCart(updatedCart);
      } else {
        const productToBeAddedToCart: Product = {
          amount: 1,
          id: productToBeAdded.id,
          image: productToBeAdded.image,
          price: productToBeAdded.price,
          title: productToBeAdded.title,
        };
        const newUpdatedCart = cart.map(e => e);
        newUpdatedCart.push(productToBeAddedToCart);
    
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newUpdatedCart));
        setCart(newUpdatedCart);
      }
    
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productToBeRemoved = cart.find((product: Product) => product.id === productId);
      const updatedProductsCart = cart.filter(product => {
        if (product.id === productId) {
          return;
        }
        return product;
      });

      if (!productToBeRemoved) {
        throw new Error('Erro na remoção do produto');
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProductsCart));
      setCart(updatedProductsCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productInTheCart = cart.find(item => item.id === productId);

      const { data } = await api.get(`/stock/${productId}`);
      const stockProduct: Stock = data;
      
      if (!productInTheCart) {
        throw new Error();
      };


      if (productInTheCart.amount < amount) {
        if (productInTheCart.amount === stockProduct.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const updatedCart = cart.map(item => {
          if (item.id === productId) {
            const newCart: Product = {...item, amount: (item.amount + 1)};
            return newCart;
          }
          return item;
        });
    
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        setCart(updatedCart);

      } else {
        if (productInTheCart.amount === 1) {
          throw new Error();
        }

        const updatedCart = cart.map(item => {
          if (item.id === productId) {
            const newCart: Product = {...item, amount: (item.amount - 1)};
            return newCart;
          }
          return item;
        });

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        setCart(updatedCart);
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = (): CartContextData => {
  const context = useContext(CartContext);

  return context;
}
