import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../services/wishlistService';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import type { WishlistItem, CartItem } from '../types';

interface WishlistCartContextType {
  wishlistCount: number;
  cartCount: number;
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  refreshWishlist: () => Promise<void>;
  refreshCart: () => Promise<void>;
  refreshAll: () => Promise<void>;
  isInWishlist: (courseId: string) => boolean;
  isInCart: (courseId: string) => boolean;
}

const WishlistCartContext = createContext<WishlistCartContextType | undefined>(undefined);

export const WishlistCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const refreshWishlist = useCallback(async () => {
    if (!currentUser || role !== 'student') {
      setWishlistItems([]);
      return;
    }
    try {
      const res = await wishlistService.getWishlist();
      if (res.success && Array.isArray(res.data)) {
        setWishlistItems(res.data);
      } else {
        setWishlistItems([]);
      }
    } catch {
      setWishlistItems([]);
    }
  }, [currentUser, role]);

  const refreshCart = useCallback(async () => {
    if (!currentUser || role !== 'student') {
      setCartItems([]);
      return;
    }
    try {
      const res = await cartService.getCart();
      if (res.success && Array.isArray(res.data)) {
        setCartItems(res.data);
      } else {
        setCartItems([]);
      }
    } catch {
      setCartItems([]);
    }
  }, [currentUser, role]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshWishlist(), refreshCart()]);
  }, [refreshWishlist, refreshCart]);

  useEffect(() => {
    if (currentUser && role === 'student') {
      refreshAll();
    } else {
      setWishlistItems([]);
      setCartItems([]);
    }
  }, [currentUser, role, refreshAll]);

  const isInWishlist = useCallback(
    (courseId: string) => {
      return wishlistItems.some((item) => item.course?.id === courseId || item.courseId === courseId);
    },
    [wishlistItems]
  );

  const isInCart = useCallback(
    (courseId: string) => {
      return cartItems.some((item) => item.course?.id === courseId || item.courseId === courseId);
    },
    [cartItems]
  );

  return (
    <WishlistCartContext.Provider
      value={{
        wishlistCount: wishlistItems.length,
        cartCount: cartItems.length,
        wishlistItems,
        cartItems,
        refreshWishlist,
        refreshCart,
        refreshAll,
        isInWishlist,
        isInCart,
      }}
    >
      {children}
    </WishlistCartContext.Provider>
  );
};

export const useWishlistCart = () => {
  const context = useContext(WishlistCartContext);
  if (!context) {
    throw new Error('useWishlistCart must be used within a WishlistCartProvider');
  }
  return context;
};
