import { MENU, modalAddReview, root } from './elements.js';
import * as Util from './util.js';
import {
	addReview,
	getProduct,
	getReviewList,
	updateProduct,
	deleteProductReview,
	getReview,
	updateReview,
} from '../controller/firestore_controller.js';
import { DEV } from '../model/constants.js';
import { currentUser, purchasedProducts } from '../controller/firebase_auth.js';
import { cart } from './cart_page.js';
import { Review } from '../model/review.js';
import { accountInfo } from './profile_page.js';

export async function product_page(productId) {
	var product = await getProduct(productId);
	if (cart.hasItems()) {
		var currentProductInCart = cart.items.find((product) => product.docId == productId);
		product.qty = currentProductInCart.qty;
	}
	let html = `<h1>${product.brand} ${product.model} ${product.productStyle}</h1>
    <input type="hidden" name="productId" value=${productId}>
    <div class="container">
        <div class="row">
            <div class="col col-lg-2">
            <img src="${product.imageURL}" class="img-fluid" alt="...">   
            </div>
            <div class="col-lg-2">
                Type: ${product.type}<br>
                Brand: ${product.brand}<br>
                Model: ${product.model}<br>
                Colorway: ${product.productStyle}<br>
                Size: ${product.size}<br>
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
        <div class="m-3 container border border-dark">
        <h4 class="m-3">Reviews</h4>
        <div id="product-avg-rating" class="ml-3 p-3">Average Rating: ${+product.averageRating.toFixed(2)}</div>
        ${
			purchasedProducts.find((product) => product.docId == productId)
				? '<button id="menu-signin" class="btn btn-outline-danger m-3" data-bs-toggle="modal" data-bs-target="#modal-add-review">+ Add Review</button>'
				: ''
		}
        `;
	var reviews = await getReviewList(productId);
	html += `<div id="review-section">`;
	if (reviews && reviews.length > 0) {
		reviews.forEach((review) => {
			html += buildReviewView(review);
		});
	}

	html += `</div></div>`;
	root.innerHTML = html;

	if (reviews && reviews.length > 0) {
		reviews.forEach((review) => {
			if (currentUser.uid == review.uid) {
				var deleteButton = document.getElementById(`delete-${review.docId}`);
				var editButton = document.getElementById(`edit-${review.docId}`);
				var saveButton = document.getElementById(`save-${review.docId}`);
				var cancelButton = document.getElementById(`cancel-${review.docId}`);

				deleteButton.addEventListener('click', async (e) => deleteReview(review));
				editButton.addEventListener('click', async (e) => editReview(review));
				saveButton.addEventListener('click', async (e) => updateProductReview(review));
				cancelButton.addEventListener('click', async (e) => restoreReview(review));
			}
		});
	}

	const stars = document.getElementsByClassName('star');
	for (let i = 0; i < stars.length; i++) {
		stars[i].addEventListener('click', (e) => {
			e.preventDefault();
			const selectedRating = stars[i].id;
			modalAddReview.form.rating.value = selectedRating;
			modalAddReview.form.rating.innerHTML = `Rating: ${selectedRating}`;
			modalAddReview.form.getElementsByClassName('selected-rating')[0].innerHTML = `Rating: ${selectedRating}`;
		});
	}

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

async function restoreReview(r) {
	const reviewId = r.docId;
	const reviewTitle = document.getElementById(`${reviewId}-review-title`);
	const reviewRating = document.getElementById(`${reviewId}-review-rating`);
	const reviewSummary = document.getElementById(`${reviewId}-review-summary`);
	const review = await getReview(reviewId);
	reviewTitle.innerHTML = review.title;
	reviewRating.innerHTML = review.rating;
	reviewSummary.innerHTML = review.summary;
	reviewSummary.removeAttribute('contentEditable');
	reviewTitle.removeAttribute('contentEditable');
	document.getElementById(`cancel-${reviewId}`).style.display = 'none';
	document.getElementById(`save-${reviewId}`).style.display = 'none';
	document.getElementById(`edit-${reviewId}`).style.display = 'block';
	document.getElementById(`${review.docId}-star-wrapper`).innerHTML = '';
	document.getElementById(`${review.docId}-rating-wrapper`).style.display = 'block';
}

async function editReview(review) {
	const currentUserId = currentUser.uid;
	const reviewPostUserId = review.uid;
	if (currentUserId === reviewPostUserId) {
		try {
			const r = await getReview(review.docId);
			document.getElementById(`edit-${review.docId}`).style.display = 'none';
			document.getElementById(`save-${review.docId}`).style.display = 'block';
			document.getElementById(`cancel-${review.docId}`).style.display = 'block';
			const reviewTitle = document.getElementById(`${review.docId}-review-title`);
			reviewTitle.setAttribute('contentEditable', true);
			document.getElementById(`${review.docId}-rating-wrapper`).style.display = 'none';
			const starWrapper = document.getElementById(`${review.docId}-star-wrapper`);
			starWrapper.innerHTML = buildStars(r);
			const stars = document.getElementsByClassName(`${review.docId}-star`);
			for (let i = 0; i < stars.length; i++) {
				stars[i].addEventListener('click', () => {
					const newRating = stars[i].id;
					console.log(newRating);
					const ratingDisplay = document.getElementById(`${review.docId}-selected-rating`);
					ratingDisplay.innerHTML = `Selected Rating: ${newRating}`;
					document.getElementsByName(`${review.docId}-review-rating`)[0].value = newRating;
				});
			}

			const reviewSummary = document.getElementById(`${review.docId}-review-summary`);
			reviewSummary.setAttribute('contentEditable', true);
		} catch (error) {
			Util.info('Error', JSON.stringify(error));
		}
	} else {
		Util.info('This is not your review!', 'You are only allowed to edit reviews that you have created.');
	}
}

function buildStars(review) {
	return `
            <div class="p-2">
                <input type="hidden" name="${review.docId}-review-rating" value="${review.rating}">
                <img id="1" class="${review.docId}-star" src="images/star.svg" width="50px">
                <img id="2" class="${review.docId}-star" src="images/star.svg" width="50px">
                <img id="3" class="${review.docId}-star" src="images/star.svg" width="50px">
                <img id="4" class="${review.docId}-star" src="images/star.svg" width="50px">
                <img id="5" class="${review.docId}-star" src="images/star.svg" width="50px">
                <div class="p-2" id="${review.docId}-selected-rating"> Selected Rating: ${review.rating} </div> <br>
              </div>
            `;
}

async function updateProductReview(r) {
	const currentUserId = currentUser.uid;
	const reviewPostUserId = r.uid;
	const reviewId = r.docId;
	if (currentUserId === reviewPostUserId) {
		try {
			const reviewTitle = document.getElementById(`${reviewId}-review-title`);
			const reviewRating = document.getElementsByName(`${reviewId}-review-rating`)[0];
			const reviewSummary = document.getElementById(`${reviewId}-review-summary`);

			const review = await getReview(reviewId);
			const updateInfo = {};
			let ratingDifference = 0;
			if (reviewTitle.innerHTML.trim() != review.title) updateInfo.title = reviewTitle.innerHTML.trim();
			if (reviewRating.value != review.rating) updateInfo.rating = reviewRating.value;
			if (reviewRating.value != review.rating) ratingDifference = Number(updateInfo.rating) - review.rating;
			if (reviewSummary.innerHTML.trim() != review.summary) updateInfo.summary = reviewSummary.innerHTML.trim();
			if (updateInfo != {}) updateInfo.timestamp = Date.now();
			await updateReview(reviewId, updateInfo);
			Object.keys(updateInfo).forEach((key) => (review[key] = updateInfo[key]));

			const product = await getProduct(review.productId);
			product.get_new_average(ratingDifference);
			await updateProduct(review.productId, { totalRating: product.totalRating, averageRating: product.averageRating });
			reviewSummary.removeAttribute('contentEditable');
			reviewTitle.removeAttribute('contentEditable');
			const editButton = document.getElementById(`edit-${reviewId}`);
			const saveButton = document.getElementById(`save-${reviewId}`);
			editButton.style.display = 'block';
			saveButton.style.display = 'none';
			document.getElementById(`${review.docId}-star-wrapper`).innerHTML = '';
			document.getElementById(`cancel-${reviewId}`).style.display = 'none';
			document.getElementById(`${review.docId}-rating-wrapper`).style.display = 'block';
			document.getElementById(`${review.docId}-review-rating`).innerHTML = updateInfo.rating;
			document.getElementById('product-avg-rating').innerHTML = `Average Rating: ${+product.averageRating.toFixed(2)}`;
		} catch (error) {
			Util.info('Error', JSON.stringify(error));
		}
	} else {
		Util.info('This is not your review!', 'You are only allowed to delete reviews that you have created.');
	}
}

async function deleteReview(review) {
	const currentUserId = currentUser.uid;
	const reviewPostUserId = review.uid;
	if (currentUserId === reviewPostUserId) {
		try {
			const replyWrapper = document.getElementById(review.docId);
			replyWrapper.style.display = 'none';
			await deleteProductReview(review.docId);

			const product = await getProduct(review.productId);
			product.delete_rating(review.rating);
			const updateInfo = {
				totalReviews: product.totalReviews,
				totalRating: product.totalRating,
				averageRating: product.averageRating,
			};
			await updateProduct(review.productId, updateInfo);
			document.getElementById('product-avg-rating').innerHTML = `Average Rating: ${+product.averageRating.toFixed(2)}`;
		} catch (error) {
			Util.info('Error', JSON.stringify(error));
		}
	} else {
		Util.info('This is not your review!', 'You are only allowed to delete reviews that you have created.');
	}
}

function buildReviewView(review) {
	let editOptions = '';
	if (currentUser.uid == review.uid) {
		editOptions = `
        <div class="d-flex flex-row justify-content-end">

            <button style="display: none;" class="m-2" id="save-${review.docId}">
                SAVE
            </button>
            <button class="m-2" id="edit-${review.docId}">
                ✎
            </button>
            <button style="display: none;" class="m-2" id="cancel-${review.docId}">
                CANCEL
            </button>
            <button class="m-2" id="delete-${review.docId}">
                🗑
            </button>
        </div>
        `;
	}
	return `
    <div id="${review.docId}"class="border border-primary rounded mt-3">
        <div class="bg-info text-white p-2">
            <b class="p-2" id="${review.docId}-review-title">${review.title}</b><br>
            <div class="p-2" id="${review.docId}-rating-wrapper">
                Rating: <b id="${review.docId}-review-rating">${review.rating}</b><br>
            </div>
            <div id="${review.docId}-star-wrapper"></div>
            <div class="p-2">
            (On ${new Date(review.timestamp).toLocaleDateString()})
            </div>
            ${editOptions}
        </div>
        <b class="p-2">Summary:<br></b>
        <div class="p-2" id="${review.docId}-review-summary" class="p-2">
        ${review.summary}
        </div>
    </div>
    `;
}

export async function addNewReview(e) {
	e.preventDefault();
	const button = e.target.getElementsByTagName('button')[0];
	const productId = document.getElementsByName('productId')[0].value;
	const label = Util.disableButton(button);
	const uid = currentUser.uid;
	const email = currentUser.email;
	const rating = e.target.rating.value;
	const title = e.target.title.value;
	const summary = e.target.summary.value;
	const timestamp = Date.now();
	const docId = '';
	const review = new Review({
		productId,
		uid,
		email,
		rating,
		title,
		summary,
		timestamp,
		docId,
	});
	let product = null;
	try {
		const id = await addReview(review);
		review.set_docId(id);
		product = await getProduct(productId);
		product.add_rating(rating);
		product.set_docId(productId);
		let updateInfo = {
			totalReviews: product.totalReviews,
			totalRating: product.totalRating,
			averageRating: product.averageRating,
		};
		const productDocId = await updateProduct(productId, updateInfo);
	} catch (e) {
		if (DEV) console.log(e);
		Util.info('Error', JSON.stringify(e));
	}
	Util.enableButton(button, label);
	modalAddReview.form.getElementsByTagName('h6')[0].innerHTML = null;

	//update browser with review
	const reviewTag = document.createElement('div');
	reviewTag.innerHTML = buildReviewView(review);
	const reviewSection = document.getElementById('review-section');
	reviewSection.prepend(reviewTag);
	document.getElementById('product-avg-rating').innerHTML = `Average Rating: ${+product.averageRating.toFixed(2)}`;
	const deleteButton = document.getElementById(`delete-${review.docId}`);
	deleteButton.addEventListener('click', async (e) => {
		console.log(`clicked ${review.docId}`);
		deleteReview(review);
	});
	e.target.reset();
	modalAddReview.modal.hide();
}
