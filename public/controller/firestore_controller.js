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
	where,
	doc,
} from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js';
import { AccountInfo } from '../model/account_info.js';
import { COLLECTION_NAMES } from '../model/constants.js';
import { Product } from '../model/product.js';
import { ShoppingCart } from '../model/shopping_cart.js';

const db = getFirestore();

export async function getProductList() {
	const products = [];
	const q = query(collection(db, COLLECTION_NAMES.PRODUCT), orderBy('name'));
	const snapShot = await getDocs(q);

	snapShot.forEach((doc) => {
		const p = new Product(doc.data());
		p.set_docId(doc.id);
		products.push(p);
	});
	return products;
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

export async function getProduct(uid) {
	const docRef = doc(db, COLLECTION_NAMES.PRODUCT, uid);
	const docSnap = await getDoc(docRef);
	if (docSnap.exists()) {
		return new Product(docSnap.data());
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
