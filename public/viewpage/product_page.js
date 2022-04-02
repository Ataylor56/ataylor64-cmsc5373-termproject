import { MENU, root } from './elements.js';
import * as Util from './util.js';
import { getProduct, getProductList } from '../controller/firestore_controller.js';
import { DEV } from '../model/constants.js';
import { currentUser } from '../controller/firebase_auth.js';
import { cart } from './cart_page.js';


export async function product_page(productId) {
    var product = await getProduct(productId);

	let html = `<h1>${product.brand} ${product.model} ${product.productStyle}</h1>
    <div class="container">
        <div class="row">
            <div class="col col-lg-2">
            <img src="${product.imageURL}" class="img-fluid" alt="...">   
            </div>
            <div class="col-lg-2">
                Brand: ${product.brand}<br>
                Model: ${product.model}<br>
                Colorway: ${product.productStyle}<br>
                Number In Stock: ${product.stock}
                <div class="container pt-3 ${currentUser && product.stock !== 0 ? 'd-block' : 'd-none'}">
                <form method="post" class="form-product-qty">
                    <button class="btn btn-outline-danger" type="submit" onclick="this.form.submitter='DEC'">&minus;</button>
                    <button class="btn btn-outline-danger" type="submit" onclick="this.form.submitter='INC'">&plus;</button><br>
                    <div id="item-count-${product.docId}" class="container rounded text-center text-white bg-primary d-inline-block w-50">
                        ${product.qty == null || product.qty == 0 ? 'Add' : product.qty}
                    </div>
                </form>
            </div>
            </div>
        </div>
    </div>   
    `;
    root.innerHTML = html;

    const productForms = document.getElementsByClassName('form-product-qty');
	for (let i = 0; i < productForms.length; i++) {
		productForms[i].addEventListener('submit', (e) => {
			e.preventDefault();
			const submitter = e.target.submitter;
			if (submitter == 'DEC') {
				cart.removeItem(product);
				if (product.qty > 0) --product.qty;
			} else if (submitter == 'INC') {
				cart.addItem(product);
				product.qty = product.qty == null ? 1 : product.qty + 1;
			} else {
				if (DEV) console.log(e);
				return;
			}
			const updateQty = product.qty == null || product.qty == 0 ? 'Add' : product.qty;
			document.getElementById(`item-count-${product.docId}`).innerHTML = updateQty;
			MENU.CartItemCount.innerHTML = `${cart.getTotalQty()}`;
		});
	}
}