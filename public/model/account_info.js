export class AccountInfo {
	constructor(data) {
		this.name = data.name;
		this.address = data.address;
		this.city = data.city;
		this.state = data.state;
		this.zip = data.zip;
		this.shirtSize = data.shirtSize;
		this.sweatshirtSize = data.sweatshirtSize;
		this.shoeSize = data.shoeSize;
		this.creditNo = data.creditNo;
		this.photoURL = data.photoURL;
	}

	serialize() {
		return {
			name: this.name,
			address: this.address,
			city: this.city,
			state: this.state,
			zip: this.zip,
			shirtSize: this.shirtSize,
			sweatshirtSize: this.sweatshirtSize,
			shoeSize: this.shoeSize,
			creditNo: this.creditNo,
			photoURL: this.photoURL,
		};
	}

	static instance() {
		return new AccountInfo({
			name: '',
			address: '',
			city: '',
			state: '',
			zip: '',
			shirtSize: '',
			sweatshirtSize: '',
			shoeSize: '',
			creditNo: '',
			photoURL: 'images/profile_default.svg',
		});
	}
}
