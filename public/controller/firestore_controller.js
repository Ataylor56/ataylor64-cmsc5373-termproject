import {
	getFirestore,
	query,
	collection,
	orderBy,
	getDocs,
	getDoc,
	setDoc,
	addDoc,
	updateDoc,
	deleteDoc,
	where,
	doc,
	limit,
	startAfter,
} from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js';
import { AccountInfo } from '../model/account_info.js';
import { COLLECTION_NAMES } from '../model/constants.js';
import { Product } from '../model/product.js';
import { Review } from '../model/review.js';
import { ShoppingCart } from '../model/shopping_cart.js';

const db = getFirestore();

export async function addReview(review) {
	const docRef = await addDoc(collection(db, COLLECTION_NAMES.PRODUCT_REVIEW), review.serialize());
	return docRef.id;
}

export async function updateProduct(productId, updateInfo) {
	const docRef = doc(db, COLLECTION_NAMES.PRODUCT, productId);
	await updateDoc(docRef, updateInfo);
	return docRef.id;
}

export async function updateReview(reviewId, updateInfo) {
	const docRef = doc(db, COLLECTION_NAMES.PRODUCT_REVIEW, reviewId);
	await updateDoc(docRef, updateInfo);
	return docRef.id;
}

export async function deleteProductReview(reviewId) {
	const docRef = doc(db, COLLECTION_NAMES.PRODUCT_REVIEW, reviewId);
	await deleteDoc(docRef);
}

export async function getReviewList(productId) {
	let reviewList = [];
	const q = query(collection(db, COLLECTION_NAMES.PRODUCT_REVIEW), where('productId', '==', productId), orderBy('timestamp', 'desc'));
	const snapShot = await getDocs(q);
	snapShot.forEach((doc) => {
		const r = new Review(doc.data());
		r.set_docId(doc.id);
		reviewList.push(r);
	});
	return reviewList;
}

export async function getProductList(props) {
	const filter = props.filter;
	let q = null;
	const last = props.last ? props.last : null;
	const products = [];

	if (filter.where && last == null) {
		q = query(collection(db, COLLECTION_NAMES.PRODUCT), where(filter.where.first, filter.where.comparison, filter.where.second), limit(8));
	} else if (filter.where && last) {
		q = query(
			collection(db, COLLECTION_NAMES.PRODUCT),
			where(filter.where.first, filter.where.comparison, filter.where.second),
			startAfter(last),
			limit(8)
		);
	} else if (!filter.where && last == null) {
		q = query(collection(db, COLLECTION_NAMES.PRODUCT), orderBy(filter.orderBy, filter.order), limit(8));
	} else {
		q = query(collection(db, COLLECTION_NAMES.PRODUCT), orderBy(filter.orderBy, filter.order), startAfter(last), limit(8));
	}
	const snapShot = await getDocs(q);
	const lastProduct = snapShot.docs[snapShot.docs.length - 1];
	const firstProduct = snapShot.docs[0];
	console.log(lastProduct);
	snapShot.forEach((doc) => {
		const p = new Product(doc.data());
		p.set_docId(doc.id);
		products.push(p);
	});
	products.push(firstProduct);
	products.push(lastProduct);
	return products;
}

export async function getNextProducts(props) {
	const filter = props.filter;
}

export async function checkout(cart) {
	const data = cart.serialize(Date.now());
	await addDoc(collection(db, COLLECTION_NAMES.PURCHASE_HISTORY), data);
}

export async function updateCheckoutProducts(uid, updateInfo) {
	const docRef = doc(db, COLLECTION_NAMES.PRODUCT, uid);
	await updateDoc(docRef, updateInfo);
}

export async function getPurchaseHistory(uid) {
	const q = query(collection(db, COLLECTION_NAMES.PURCHASE_HISTORY), where('uid', '==', uid), orderBy('timestamp', 'desc'));
	const snapShot = await getDocs(q);

	const carts = [];
	snapShot.forEach((doc) => {
		const sc = ShoppingCart.deserialize(doc.data());
		carts.push(sc);
	});
	return carts;
}

export async function getPurchasedProductsList(uid) {
	const q = query(collection(db, COLLECTION_NAMES.PURCHASE_HISTORY), where('uid', '==', uid), orderBy('timestamp', 'desc'));
	const snapShot = await getDocs(q);

	const products = [];
	snapShot.forEach((doc) => {
		const sc = ShoppingCart.deserialize(doc.data());
		sc.items.forEach((product) => {
			products.push(product);
		});
	});
	return products;
}

export async function getProduct(uid) {
	const docRef = doc(db, COLLECTION_NAMES.PRODUCT, uid);
	const docSnap = await getDoc(docRef);
	if (docSnap.exists()) {
		const p = new Product(docSnap.data());
		p.set_docId(uid);
		return p;
	}
}

export async function getReview(uid) {
	const docRef = doc(db, COLLECTION_NAMES.PRODUCT_REVIEW, uid);
	const docSnap = await getDoc(docRef);
	if (docSnap.exists()) {
		const r = new Review(docSnap.data());
		r.set_docId(uid);
		return r;
	}
}

export async function getAccountInfo(uid) {
	const docRef = doc(db, COLLECTION_NAMES.ACCOUNT_INFO, uid);
	const docSnap = await getDoc(docRef);
	if (docSnap.exists()) {
		return new AccountInfo(docSnap.data());
	} else {
		const defaultInfo = AccountInfo.instance();
		const accountDocRef = doc(db, COLLECTION_NAMES.ACCOUNT_INFO, uid);
		await setDoc(accountDocRef, defaultInfo.serialize());
		return defaultInfo;
	}
}

export async function updateAccountInfo(uid, updateInfo) {
	const docRef = doc(db, COLLECTION_NAMES.ACCOUNT_INFO, uid);
	await updateDoc(docRef, updateInfo);
}
