import { Router } from 'express';
import { wishlistController, cartController } from '../controllers/wishlist-cart.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Apply user authentication to all wishlist & cart endpoints
router.use(authenticateUser);

// =============================================================
// WISHLIST ENDPOINTS
// =============================================================
router.get('/wishlist', (req, res, next) => wishlistController.getWishlist(req, res, next));
router.post('/wishlist', (req, res, next) => wishlistController.addToWishlist(req, res, next));
router.post('/wishlist/:courseId', (req, res, next) => wishlistController.addToWishlist(req, res, next));
router.delete('/wishlist/:courseId', (req, res, next) => wishlistController.removeFromWishlist(req, res, next));

// =============================================================
// CART ENDPOINTS
// =============================================================
router.get('/cart', (req, res, next) => cartController.getCart(req, res, next));
router.post('/cart', (req, res, next) => cartController.addToCart(req, res, next));
router.post('/cart/:courseId', (req, res, next) => cartController.addToCart(req, res, next));
router.delete('/cart/:courseId', (req, res, next) => cartController.removeFromCart(req, res, next));
router.delete('/cart', (req, res, next) => cartController.clearCart(req, res, next));

export default router;
