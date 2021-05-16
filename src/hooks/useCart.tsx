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

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = window.localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.find(product => product.id === productId)
      if (productInCart) {
        const amount = productInCart.amount + 1
        updateProductAmount({
          productId, 
          amount
        })
      }
      else {
        const newProductCart = await api.get(`products/${productId}`).then(response => response.data)
        const newCart = [
          ...cart,
          {
            ...newProductCart,
            amount: 1
          }
        ]

        setCart(newCart);
        window.localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const hasInCart = cart.find(product => product.id === productId)
  
      if (hasInCart) {
        const newCart = cart.filter(product => product.id !== productId)
  
        setCart(newCart);
        window.localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
      else {
        throw new Error;
      }
      

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock: Stock = await api.get(`/stock/${productId}`).then(response => response.data)
      if (stock.amount >= amount && amount >= 1) {
        const newCart = cart.map(product => (
          product.id === productId ? 
          (
            {
              ...product,
              amount
            }
          ) : 
          (
            product
          )
        ))

        setCart(newCart)
        window.localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
      else {
        toast.error('Quantidade solicitada fora de estoque');
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

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
