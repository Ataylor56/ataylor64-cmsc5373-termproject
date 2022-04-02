import { home_page } from '../viewpage/home_page.js';
import { purchases_page } from '../viewpage/purchases_page.js';
import { cart_page } from '../viewpage/cart_page.js';
import { profile_page } from '../viewpage/profile_page.js';
import { product_page } from '../viewpage/product_page.js';

export const ROUTE_PATHNAMES = {
	HOME: '/',
	PURCHASES: '/purchase',
	PROFILE: '/profile',
	CART: '/cart',
	PRODUCT: '/product',
};

export const routes = [
	{ pathname: ROUTE_PATHNAMES.HOME, page: home_page },
	{ pathname: ROUTE_PATHNAMES.PURCHASES, page: purchases_page },
	{ pathname: ROUTE_PATHNAMES.PROFILE, page: profile_page },
	{ pathname: ROUTE_PATHNAMES.CART, page: cart_page },
	{ pathname: ROUTE_PATHNAMES.PRODUCT, page: product_page },
];

export function routing(pathname, hash) {
	const route = routes.find((element) => element.pathname === pathname);
	if (route) {
		if (hash && hash.length > 1) {
			route.page(hash.substring(1));
		} else {
			route.page();
		}
	} else routes[0].page();
}
