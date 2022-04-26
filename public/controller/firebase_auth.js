import {
	getAuth,
	signOut,
	signInWithEmailAndPassword,
	onAuthStateChanged,
	createUserWithEmailAndPassword,
} from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js';
import * as Elements from '../viewpage/elements.js';
import * as Constants from '../model/constants.js';
import * as Util from '../viewpage/util.js';
import { routing, ROUTE_PATHNAMES } from './route.js';
import { initShoppingCart } from '../viewpage/cart_page.js';
import { DEV } from '../model/constants.js';
import { readAccountProfile } from '../viewpage/profile_page.js';
import { getPurchasedProductsList } from './firestore_controller.js';

const auth = getAuth();
export let currentUser = null;
export let purchasedProducts = [];

export function addEventListeners() {
	onAuthStateChanged(auth, authStateChanged);

	Elements.modalSignin.form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const email = e.target.email.value;
		const password = e.target.password.value;
		const button = e.target.getElementsByTagName('button')[0];
		const label = Util.disableButton(button);
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			Elements.modalSignin.modal.hide();
		} catch (error) {
			const errorCode = error.code;
			const errorMessage = error.message;
			Util.info('Sign in error', JSON.stringify(error), Elements.modalSignin.modal);
			if (Constants.DEV) {
				console.log(`error: ${errorCode} | ${errorMessage}`);
			}
		}
		Util.enableButton(button, label);
	});

	Elements.MENU.SignOut.addEventListener('click', async (e) => {
		try {
			await signOut(auth);
		} catch (error) {
			Util.info('Sign Out Error: Try again\n', JSON.stringify(error));
			if (Constants.DEV) {
				console.log(`sign out error\n${JSON.stringify(e)}`);
			}
		}
	});

	Elements.modalSignin.showSignupModal.addEventListener('click', () => {
		Elements.modalSignin.modal.hide();
		Elements.modalSignup.form.reset();
		Elements.modalSignup.modal.show();
	});

	Elements.modalSignup.form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const email = e.target.email.value;
		const password = e.target.password.value;
		const confirmPassword = e.target.passwordConfirm.value;

		if (password != confirmPassword) {
			window.alert('Passwords do not match!');
			return;
		} else {
			try {
				await createUserWithEmailAndPassword(auth, email, password);
				Util.info('Account created!', `You are now signed in as ${email}`, Elements.modalSignup.modal);
			} catch (e) {
				if (DEV) console.log(e);
				Util.info('Failed to create account', JSON.stringify(e), Elements.modalSignup.modal);
			}
		}
	});
}

async function authStateChanged(user) {
	currentUser = user;
	if (user) {
		let menus = document.getElementsByClassName('modal-preauth');
		for (let i = 0; i < menus.length; i++) {
			menus[i].style.display = 'none';
		}
		menus = document.getElementsByClassName('modal-postauth');
		for (let i = 0; i < menus.length; i++) {
			menus[i].style.display = 'block';
		}
		await readAccountProfile();
		initShoppingCart();
		purchasedProducts = await getPurchasedProductsList(currentUser.uid);
		routing(window.location.pathname, window.location.hash);
	} else {
		let menus = document.getElementsByClassName('modal-preauth');
		for (let i = 0; i < menus.length; i++) {
			menus[i].style.display = 'block';
		}
		menus = document.getElementsByClassName('modal-postauth');
		for (let i = 0; i < menus.length; i++) {
			menus[i].style.display = 'none';
		}
		history.pushState(null, null, ROUTE_PATHNAMES.HOME);
		purchasedProducts = [];
		routing(window.location.pathname, window.location.hash);
	}
}
