import { MENU, root } from './elements.js';
import { ROUTE_PATHNAMES } from '../controller/route.js';
import * as Util from './util.js';
import { getProductList } from '../controller/firestore_controller.js';
import { DEV } from '../model/constants.js';
import { currentUser } from '../controller/firebase_auth.js';
import { cart } from './cart_page.js';
import { product_page } from './product_page.js';

let filter = null;

export function addEventListeners() {
	MENU.Home.addEventListener('click', async (e) => {
		history.pushState(null, null, ROUTE_PATHNAMES.HOME);
		const label = Util.disableButton(MENU.Home);
		await home_page({ filter });
		Util.enableButton(MENU.Home, label);
	});
}

export async function home_page(props) {
	let html = `<h1>Check out all of our Products!</h1>`;

	if (!props) {
		filter = {
			selected: {
				brand: 'all',
				productType: 'all',
			},
			orderBy: 'name',
			order: 'asc',
		};
	} else {
		filter = props.filter;
	}

	const dropdownFilterList = await getDropdownFilterList();

	html += `
        <div class="d-flex flex-row justify-content-end ">
			<li class="dropdown">
				<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
				Brand: ${filter.selected.brand.toUpperCase()}
				</a>
				<ul class="dropdown-menu" aria-labelledby="navbarDropdown">
					<li id="all" class="filter-brand"><a class="dropdown-item" href="#">All</a></li>
					<li id="Adidas" class="filter-brand"><a class="dropdown-item" href="#">Adidas</a></li>
					<li id="Jordan" class="filter-brand"><a class="dropdown-item" href="#">Jordan</a></li>
					<li id="Yeezy" class="filter-brand"><a class="dropdown-item" href="#">Yeezy</a></li>
				</ul>
			</li>
			`;

	html += `
			<li class="dropdown">
				<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
				Product Type: ${filter.selected.productType.toUpperCase()}
				</a>
				<ul class="dropdown-menu" aria-labelledby="navbarDropdown">
					<li id="all" class="filter-type"><a class="dropdown-item" href="#">All</a></li>
					<li id="Shoes" class="filter-type"><a class="dropdown-item" href="#">Shoes</a></li>
					<li id="Shirts" class="filter-type"><a class="dropdown-item" href="#">Shirts</a></li>
					<li id="Sweatshirts" class="filter-type"><a class="dropdown-item" href="#">Sweatshirts</a></li>
					<li id="Accessories" class="filter-type"><a class="dropdown-item" href="#">Accessories</a></li>
				</ul>
			</li>
			`;

	if (filter.selected.brand == 'all') {
		html += `
			<li class="dropdown">
				<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
				Order By: ${filter.orderBy.toUpperCase()}
				</a>
				<ul class="dropdown-menu" aria-labelledby="navbarDropdown">
					${dropdownFilterList}
				</ul>
			</li>
			`;

		html += `
			<li class="dropdown">
				<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
				${filter.order.toUpperCase()}
				</a>
				<ul class="dropdown-menu" aria-labelledby="navbarDropdown">
					<li id="asc" class="order"><a class="dropdown-item" href="#">Ascending</a></li>
					<li id="desc" class="order"><a class="dropdown-item" href="#">Descending</a></li>
				</ul>
			</li>`;
	}
	html += '</div><br>';

	let products;
	try {
		products = await getProductList({ filter });
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

	const typeOptions = document.getElementsByClassName('filter-type');
	for (let i = 0; i < typeOptions.length; i++) {
		typeOptions[i].addEventListener('click', async (e) => {
			e.preventDefault();
			const id = typeOptions[i].id;
			if (id == 'all') {
				filter.where = null;
			} else {
				filter.where = {
					first: 'type',
					comparison: '==',
					second: typeOptions[i].id,
				};
			}
			filter.selected.productType = id;
			await home_page({ filter });
		});
	}

	const brandOptions = document.getElementsByClassName('filter-brand');
	for (let i = 0; i < brandOptions.length; i++) {
		brandOptions[i].addEventListener('click', async (e) => {
			e.preventDefault();
			const id = brandOptions[i].id;
			if (id == 'all') {
				filter.where = null;
			} else {
				filter.where = {
					first: 'brand',
					comparison: '==',
					second: brandOptions[i].id,
				};
			}
			filter.selected.brand = id;
			await home_page({ filter });
		});
	}

	const orderOptions = document.getElementsByClassName('order');
	for (let i = 0; i < orderOptions.length; i++) {
		orderOptions[i].addEventListener('click', async (e) => {
			e.preventDefault();
			filter.order = orderOptions[i].id;
			await home_page({ filter });
		});
	}

	const dropdownOptions = document.getElementsByClassName('filter');
	for (let j = 0; j < dropdownOptions.length; j++) {
		dropdownOptions[j].addEventListener('click', async (e) => {
			e.preventDefault();
			filter.orderBy = dropdownOptions[j].id;
			await home_page({ filter });
		});
	}

	for (let j = 0; j < products.length; j++) {
		var productMoreInfoButton = document.getElementById(`button-more-info-${products[j].docId}`);
		productMoreInfoButton.addEventListener('click', async (e) => {
			e.preventDefault();
			history.pushState(null, null, ROUTE_PATHNAMES.PRODUCT + '#' + products[j].docId);
			await product_page(products[j].docId);
		});
	}

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
			Type: ${product.type}<br>
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

async function getDropdownFilterList() {
	let html = '';
	if (filter.orderBy != 'name') {
		html += `<li id="name" class="filter"><a class="dropdown-item" href="#">Name</a></li>`;
	}
	if (filter.orderBy != 'brand' || filter.selected.brand != 'all') {
		html += `<li id="brand" class="filter"><a class="dropdown-item" href="#">Brand</a></li>`;
	}
	if (filter.orderBy != 'price') {
		html += `<li id="price" class="filter"><a class="dropdown-item" href="#">Price</a></li>`;
	}
	return html;
}
