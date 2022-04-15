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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return []
  })

  const addProduct = async (productId: number) => {
    try {
      const updateCart: Product[] = [...cart]
      const stock = await api.get('/stock/' + productId)
      if (updateCart.find(p => p.id === productId)) {
        updateCart.map(prod =>
          prod.id === productId ?
            (prod.amount < stock.data.amount) ?
              { ...prod, amount: ++prod.amount } :
              toast.error('Quantidade solicitada fora de estoque')
            :
            prod
          )
      } else {
        const p = await api.get('/products/' + productId)
        const newProduct : Product = {...p.data, amount: 1}
        updateCart.push(newProduct)
      }
      console.log(updateCart)
      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
    } catch (e) {
      toast.error('Erro na adição do produto ' + e)
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const deleteCart: Product[] = [...cart]
      const index = deleteCart.findIndex(prod => prod.id === productId)
      console.log(deleteCart, index)
      deleteCart.splice(index, 1)
      console.log(deleteCart)
      setCart(deleteCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(deleteCart))
    } catch {
      toast.error('Erro na exclusão do produto ')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get('/stock/' + productId)
      const updateCart: Product[] = [...cart]
      if (stock.data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque')
      } else {
        const NewCart = updateCart.map(prod => (prod.id === productId) ? { ...prod, amount } : prod)
        setCart(NewCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(NewCart))
      }

   } catch (e) {
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
