import { MENU, modalAddReview, root } from './elements.js';
import { ROUTE_PATHNAMES } from '../controller/route.js';
import * as Util from './util.js';
import { addReview, getProduct, getProductList, updateProduct } from '../controller/firestore_controller.js';
import { DEV } from '../model/constants.js';
import { currentUser } from '../controller/firebase_auth.js';
import { cart } from './cart_page.js';
import { product_page, addNewReview } from './product_page.js';
import { accountInfo } from './profile_page.js';
import { Review } from '../model/review.js';

let filter = null;
let last = null;
let first = null;

export function addEventListeners() {
	MENU.Home.addEventListener('click', async (e) => {
		history.pushState(null, null, ROUTE_PATHNAMES.HOME);
		const label = Util.disableButton(MENU.Home);
		await home_page();
		Util.enableButton(MENU.Home, label);
	});
	modalAddReview.form.addEventListener('submit', async (e) => {
		addNewReview(e);
	});
}

export async function home_page(props) {
	let html = `<h1>Check out all of our Products!</h1>`;

	if (!props) {
		filter = {
			selected: {
				size: 'all',
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
	const sizeOptions = await getSizeOptions();
	let mySize = '';
	if (currentUser) {
		if (accountInfo.shirtSize || accountInfo.sweatshirtSize || accountInfo.shoeSize) {
			mySize = '<li id="my-size" class="filter-size"><a class="dropdown-item" href="#">My Size</a></li>';
		}
	}
	html += `
        <div class="container">
			<div class="d-flex justify-content-start mt-3">
			<button id="back" class="btn btn-outline-primary page-button m-2">&larr;</button>
			<div class="m-3 text-primary">1</div>
			<button id="next" class="btn btn-outline-primary page-button m-2">&rarr;</button>
			</div>
			<div class="d-flex justify-content-end">
			<li class="dropdown">
				<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
				Brand: ${filter.selected.brand.toUpperCase()}
				</a>
				<ul class="dropdown-menu" aria-labelledby="navbarDropdown">
					<li id="all" class="filter-brand"><a class="dropdown-item" href="#">All</a></li>
					<li id="Adidas" class="filter-brand"><a class="dropdown-item" href="#">Adidas</a></li>
					<li id="Jordan" class="filter-brand"><a class="dropdown-item" href="#">Jordan</a></li>
					<li id="Yeezy" class="filter-brand"><a class="dropdown-item" href="#">Yeezy</a></li>
					<li id="Essentials" class="filter-brand"><a class="dropdown-item" href="#">Essentials</a></li>
				</ul>
			</li>
			`;

	if (filter.selected.brand == 'all') {
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
			<li class="dropdown">
				<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
				Size: ${filter.selected.size.toUpperCase()}
				</a>
				<ul class="dropdown-menu" aria-labelledby="navbarDropdown">
					${mySize}
					${sizeOptions}
				</ul>
			</li>
			`;
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
		last = products.pop();
		first = products.pop();
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

	const pageButtons = document.getElementsByClassName('page-button');
	for (let i = 0; i < pageButtons.length; i++) {
		pageButtons[i].addEventListener('click', async (e) => {
			e.preventDefault();
			const direction = pageButtons[i].id;
			console.log(direction);
		});
	}

	const sizeFilterOptions = document.getElementsByClassName('filter-size');
	for (let i = 0; i < sizeFilterOptions.length; i++) {
		sizeFilterOptions[i].addEventListener('click', async (e) => {
			e.preventDefault();
			const id = sizeFilterOptions[i].id;
			if (id == 'all') {
				filter.where = null;
			} else if (id == 'my-size') {
				filter.where = {
					first: 'size',
					comparison: '==',
					second: accountInfo.shoeSize,
				};
			} else {
				filter.where = {
					first: 'size',
					comparison: '==',
					second: sizeFilterOptions[i].id,
				};
			}
			filter.selected.size = id;
			await home_page({ filter });
		});
	}

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
			Rating: ${product.averageRating == 0 ? 'Not Rated' : +product.averageRating.toFixed(2)}<br>
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

async function getSizeOptions() {
	let html = '';
	if (filter.selected.productType == 'Shoes') {
		html += `
		<li id="6" class="filter-size"><a class="dropdown-item" href="#">6</a></li>
		<li id="7" class="filter-size"><a class="dropdown-item" href="#">7</a></li>
		<li id="8" class="filter-size"><a class="dropdown-item" href="#">8</a></li>
		<li id="9" class="filter-size"><a class="dropdown-item" href="#">9</a></li>
		<li id="10" class="filter-size"><a class="dropdown-item" href="#">10</a></li>
		<li id="11" class="filter-size"><a class="dropdown-item" href="#">11</a></li>
		<li id="12" class="filter-size"><a class="dropdown-item" href="#">12</a></li>
		`;
	} else if (filter.selected.productType == 'Shirts' || filter.selected.productType == 'Sweatshirts') {
		html += `
		<li id="s" class="filter-size"><a class="dropdown-item" href="#">S</a></li>
		<li id="m" class="filter-size"><a class="dropdown-item" href="#">M</a></li>
		<li id="l" class="filter-size"><a class="dropdown-item" href="#">L</a></li>
		<li id="xl" class="filter-size"><a class="dropdown-item" href="#">XL</a></li>
		<li id="2xl" class="filter-size"><a class="dropdown-item" href="#">2XL</a></li>
		`;
	} else {
		html += `
		<li id="s" class="filter-size"><a class="dropdown-item" href="#">S</a></li>
		<li id="m" class="filter-size"><a class="dropdown-item" href="#">M</a></li>
		<li id="l" class="filter-size"><a class="dropdown-item" href="#">L</a></li>
		<li id="xl" class="filter-size"><a class="dropdown-item" href="#">XL</a></li>
		<li id="2xl" class="filter-size"><a class="dropdown-item" href="#">2XL</a></li>
		<li id="6" class="filter-size"><a class="dropdown-item" href="#">6</a></li>
		<li id="7" class="filter-size"><a class="dropdown-item" href="#">7</a></li>
		<li id="8" class="filter-size"><a class="dropdown-item" href="#">8</a></li>
		<li id="9" class="filter-size"><a class="dropdown-item" href="#">9</a></li>
		<li id="10" class="filter-size"><a class="dropdown-item" href="#">10</a></li>
		<li id="11" class="filter-size"><a class="dropdown-item" href="#">11</a></li>
		<li id="12" class="filter-size"><a class="dropdown-item" href="#">12</a></li>
		`;
	}
	return html;
}
