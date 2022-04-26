export class Product {
	constructor(data) {
		if (data) {
			this.name = data.name.trim();
			this.type = data.type ? data.type.trim() : '';
			this.brand = data.brand.trim();
			this.model = data.model.trim();
			this.productStyle = data.productStyle.trim();
			this.size = data.size ? data.size.trim() : '';
			this.price = typeof data.price == 'number' ? data.price : Number(data.price);
			this.stock = typeof data.stock == 'number' ? data.stock : Number(data.stock);
			this.totalReviews = data.totalReviews && typeof data.totalReviews == 'number' ? Number(data.totalReviews) : Number(0);
			this.totalRating = data.totalRating && typeof data.totalRating == 'number' ? Number(data.totalRating) : Number(0);
			this.averageRating = data.averageRating && typeof data.averageRating == 'number' ? Number(data.averageRating) : Number(0);
			this.summary = data.summary.trim();
			this.imageName = data.imageName;
			this.imageURL = data.imageURL;
			this.qty = Number.isInteger(data.qty) ? data.qty : null;
			this.docId = data.docId;
		}
	}

	clone() {
		const copyData = this.serialize();
		const p = new Product(copyData);
		p.set_docId(this.docId);
		return p;
	}

	add_rating(rating) {
		if (isNaN(this.totalReviews)) {
			this.totalReviews = Number(0);
		}
		if (isNaN(this.totalRating)) {
			this.totalRating = Number(0);
		}
		this.totalReviews += Number(1);
		this.totalRating += Number(rating);

		if (isNaN(this.averageRating)) {
			this.averageRating = Number(0);
		}
		const newAverage = this.totalRating / this.totalReviews;
		this.averageRating = newAverage;
	}

	get_new_average(rating) {
		this.totalRating += rating;
		const newAverage = this.totalRating / this.totalReviews;
		this.averageRating = newAverage;
	}

	delete_rating(reviewRating) {
		this.totalReviews -= 1;
		this.totalRating -= reviewRating;
		this.averageRating = this.totalRating / this.totalReviews;
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
			size: this.size,
			price: this.price,
			stock: this.stock,
			totalReviews: this.totalReviews,
			totalRating: this.totalRating,
			averageRating: this.averageRating,
			summary: this.summary,
			imageName: this.imageName,
			imageURL: this.imageURL,
			qty: this.qty,
			docId: this.docId,
		};
	}
}
