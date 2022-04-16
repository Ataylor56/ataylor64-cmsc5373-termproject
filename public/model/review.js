export class Review {
	constructor(data) {
		if (data) {
			this.name = data.name.trim();
			this.rating = typeof data.price == 'number' ? data.price : Number(data.rating);
			this.summary = data.summary.trim();
		}
	}

	set_docId(id) {
		this.docId = id;
	}

	serialize() {
		return {
			name: this.name,
			rating: this.rating,
			summary: this.summary,
		};
	}
}
