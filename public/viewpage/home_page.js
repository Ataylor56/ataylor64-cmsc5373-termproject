import { MENU, root } from './elements.js';
import { ROUTE_PATHNAMES } from '../controller/route.js';
import * as Util from './util.js';
import { getProductList } from '../controller/firestore_controller.js';
import { DEV } from '../model/constants.js';
import { currentUser } from '../controller/firebase_auth.js';
import { cart } from './cart_page.js';
import { product_page } from './product_page.js';

export function addEventListeners() {
	MENU.Home.addEventListener('click', async (e) => {
		history.pushState(null, null, ROUTE_PATHNAMES.HOME);
		const label = Util.disableButton(MENU.Home);
		await home_page();
		Util.enableButton(MENU.Home, label);
	});
}

export async function home_page() {
	let html = `<h1>Look what's all in stock!</h1>`;
	let products;
	try {
		products = await getProductList();
		if (cart && cart.getTotalQty() != 0) {
			cart.items.forEach((item) => {
				const p = products.find((e) => e.docId == item.docId);
				if (p) p.qty = item.qty;
			});
		}
	} catch (e) {
		if (DEV) console.log(e);
		Util.info('Failed to get the product list', JSON.stringify(e));
	}

	for (let i = 0; i < products.length; i++) {
		html += buildProductView(products[i], i);
	}
	root.innerHTML = html;
	
	for (let j = 0; j<products.length; j++)
	{
		var productMoreInfoButton = document.getElementById(`button-more-info-${products[j].docId}`);
		productMoreInfoButton.addEventListener('click', async (e) => {
			e.preventDefault();
			history.pushState(null, null, ROUTE_PATHNAMES.PRODUCT + '#' + products[j].docId);
			await product_page(products[j].docId);
		});
	};

	const productForms = document.getElementsByClassName('form-product-qty');
	for (let i = 0; i < productForms.length; i++) {
		productForms[i].addEventListener('submit', (e) => {
			e.preventDefault();
			const p = products[e.target.index.value];
			const submitter = e.target.submitter;
			if (submitter == 'DEC') {
				cart.removeItem(p);
				if (p.qty > 0) --p.qty;
			} else if (submitter == 'INC') {
				cart.addItem(p);
				p.qty = p.qty == null ? 1 : p.qty + 1;
			} else {
				if (DEV) console.log(e);
				return;
			}
			const updateQty = p.qty == null || p.qty == 0 ? 'Add' : p.qty;
			document.getElementById(`item-count-${p.docId}`).innerHTML = updateQty;
			MENU.CartItemCount.innerHTML = `${cart.getTotalQty()}`;
		});
	}
}

function buildProductView(product, index) {
	return `
    <div id="card-${product.docId}" class="card d-inline-flex" style="width: 18rem;">
        <img src="${product.imageURL}" class="card-img-top" alt="...">
        <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text">
            ${Util.currency(product.price.toFixed(2))}<br>
			Total Stock: ${product.stock}<br>
			<button id="button-more-info-${product.docId}" class="btn" type="submit">More Info &rarr;</button>
            </p>
            <div class="container pt-3 ${currentUser && product.stock !== 0 ? 'd-block' : 'd-none'}">
                <form method="post" class="form-product-qty">
                    <input type="hidden" name="index" value="${index}">
                    <button class="btn btn-outline-danger" type="submit" onclick="this.form.submitter='DEC'">&minus;</button>
                    <div id="item-count-${product.docId}" class="container rounded text-center text-white bg-primary d-inline-block w-50">
                        ${product.qty == null || product.qty == 0 ? 'Add' : product.qty}
                    </div>
                    <button class="btn btn-outline-danger" type="submit" onclick="this.form.submitter='INC'">&plus;</button>
                </form>
            </div>
        </div>
    </div>
    `;
}
