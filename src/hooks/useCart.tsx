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


  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    console.log(cart);
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const stockData = await api.get('/stock');
      const stockProducts: Stock[] = stockData.data;

      const { data } = await api.get('/products');
      const productToBeAdded: Product[] | undefined = data.filter((product: Product) => product.id === productId);
      
      if (!productToBeAdded) {
        toast.error('Erro na adição do produto');
        throw new Error();
      }

      const checkIfProductIsAlreadyInTheCart = cart.find(item => item.id === productId);
      const stockItemToBeAdded = stockProducts.find((stock: Stock) => stock.id === productId);

      if (!stockItemToBeAdded) {
        throw new Error('There is no one item with the provided id');
      }

      console.log(checkIfProductIsAlreadyInTheCart);

      if (checkIfProductIsAlreadyInTheCart) {
        if (cart[productId-1].amount >= stockProducts[productId-1].amount) {
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
        setCart(updatedCart);
      } else {
        const productToBeAddedToCart: Product = {
          amount: 1,
          id: productToBeAdded[0].id,
          image: productToBeAdded[0].image,
          price: productToBeAdded[0].price,
          title: productToBeAdded[0].title,
        };
        const updatedCart = cart;
        updatedCart.push(productToBeAddedToCart);
        console.log('AAAAAAAAA');
        console.log(updatedCart)
        setCart(updatedCart);
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productToBeRemoved = cart.map((product: Product) => product.id === productId);
      const updatedProductsCart = cart.filter(product => {
        if (product.id === productId) {
          return;
        }
        return product;
      });

      if (!productToBeRemoved) {
        throw new Error('Erro na remoção do produto');
      }

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

      const stockData = await api.get('/stock');
      const stockProducts: Stock[] = stockData.data;
      
      if (!productInTheCart) {
        toast.error('Erro ao adicionar/diminuir a quantidade no carrinho');
        throw new Error('Erro ao adicionar/diminuir a quantidade no carrinho');
      };

      if (productInTheCart.amount < amount) {
        if (productInTheCart.amount === stockProducts[productId-1].amount) {
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
        setCart(updatedCart);

      } else {
        const updatedCart = cart.map(item => {
          if (item.id === productId) {
            const newCart: Product = {...item, amount: (item.amount - 1)};
            return newCart;
          }
          return item;
        });
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
