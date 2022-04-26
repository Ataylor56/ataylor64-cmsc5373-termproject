export class Review {
	constructor(data) {
		if (data) {
			this.productId = data.productId.trim();
			this.uid = data.uid;
			this.email = data.email.trim();
			this.rating = typeof data.price == 'number' ? data.price : Number(data.rating);
			this.title = data.title.trim();
			this.summary = data.summary.trim();
			this.timestamp = data.timestamp;
			this.docId = data.docId;
		}
	}

	set_docId(id) {
		this.docId = id;
	}

	serialize() {
		return {
			productId: this.productId,
			uid: this.uid,
			email: this.email,
			rating: this.rating,
			title: this.title,
			summary: this.summary,
			timestamp: this.timestamp,
			docId: this.docId,
		};
	}
}
