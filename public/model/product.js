export class Product {
	constructor(data) {
		if (data) {
			this.name = data.name.trim();
			this.type = data.type.trim();
			this.brand = data.brand.trim();
			this.model = data.model.trim();
			this.productStyle = data.productStyle.trim();
			this.price = typeof data.price == 'number' ? data.price : Number(data.price);
			this.stock = typeof data.stock == 'number' ? data.stock : Number(data.stock);
			this.summary = data.summary.trim();
			this.imageName = data.imageName;
			this.imageURL = data.imageURL;
			this.qty = Number.isInteger(data.qty) ? data.qty : null;
		}
	}

	clone() {
		const copyData = this.serialize();
		const p = new Product(copyData);
		p.set_docId(this.docId);
		return p;
	}

	set_docId(id) {
		this.docId = id;
	}

	serialize() {
		return {
			name: this.name,
			type: this.type,
			brand: this.brand,
			model: this.model,
			productStyle: this.productStyle,
			price: this.price,
			stock: this.stock,
			summary: this.summary,
			imageName: this.imageName,
			imageURL: this.imageURL,
			qty: this.qty,
		};
	}
}
