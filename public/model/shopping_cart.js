import { Product } from './product.js';

export class ShoppingCart {
	constructor(uid) {
		this.uid = uid;
		this.items = []; // Array of Products
	}

	claimStock() {
		const updatedCart = this.items.forEach((p) => (p.stock -= p.qty));
		return updatedCart;
	}

	addItem(product) {
		const index = this.items.findIndex((e) => product.docId == e.docId);
		if (index < 0) {
			const newItem = product.clone();
			newItem.qty = 1;
			this.items.push(newItem);
		} else {
			this.items[index].qty++;
		}
	}

	removeItem(product) {
		const index = this.items.findIndex((e) => product.docId == e.docId);
		if (index >= 0) {
			--this.items[index].qty;
			if (this.items[index].qty == 0) {
				this.items.splice(index, 1);
			}
		}
	}

	getTotalQty() {
		let n = 0;
		this.items.forEach((p) => (n += p.qty));
		return n;
	}

	hasItems() {
		if (this.items.length > 0) {
			return true;
		}
		return false;
	}

	getTotalPrice() {
		let total = 0;
		this.items.forEach((p) => (total += p.price * p.qty));
		return total;
	}

	clear() {
		this.items.length = 0;
	}

	serialize(timestamp) {
		const serializedItems = this.items.map((e) => e.serialize());
		return { uid: this.uid, items: serializedItems, timestamp };
	}

	static deserialize(data) {
		const sc = new ShoppingCart(data.uid);
		if (data.items && Array.isArray(data.items)) {
			sc.items = data.items.map((e) => new Product(e));
		}
		sc.timestamp = data.timestamp;
		return sc;
	}
}
