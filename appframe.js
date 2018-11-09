const rp = require('request-promise-native');
const cheerio = require('cheerio');
const querystring = require('querystring');

const loginFailedStr = 'Login failed. Please check your credentials.';

class AppframeClient {
	constructor(props) {
		const {
			username,
			password,
			hostname,
		} = props;

		Object.assign(this, {
			hostname,
			password,
			username,
		});
		
		this.protocol = 'https:';
		this.jar = null;
	}

	createPostFormRequest(pathname, data) {
		const body = querystring.stringify(data);

		return {
			body,
			headers: {
				'Content-Length': body.length,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			jar: this.jar,
			method: 'POST',
			resolveWithFullResponse: true,
			url: this.getUrl(pathname)
		};
	}

	getUrl(pathname, query) {
		const url = new URL(`${this.protocol}//${this.hostname}`);
		url.pathname = pathname;

		if (query) url.search = query;

		return url;
	}

	async login() {
		if (this.jar) {
			await this.logout();
		}

		this.jar = rp.jar();
	
		const { password, username } = this;

		const body = {
			username,
			password,
			remember: false,
		};

		const options = this.createPostFormRequest('/login', body);

		try {
			console.log('Authenticating...');

			const res = await rp(options);
	
			if (res.statusCode === 200 && !res.body.includes(loginFailedStr)) {
				console.log('Authentication successful.');
	
				return {
					success: true
				};
			} else if (res.body.includes(loginFailedStr)) {
				console.warn(loginFailedStr);
	
				return {
					error: loginFailedStr,
					success: false
				};
			}

			console.warn(loginFailedStr);
			return {
				error: `Login failed (${res.statusCode}: ${res.statusMessage})`,
				success: false
			};
		} catch (err) {
			console.error(err);
	
			return {
				error: err,
				success: false
			};
		}
	}

	async logout() {
		const reqOptions = {
			jar: this.jar,
			method: 'POST',
			url: this.getUrl('logout'),
		};
	
		try {
			console.log('Logging out...');
			await rp(reqOptions);
		} catch (err) {
			if (err.statusCode !== 303) {
				this.jar = null;
				console.err(err.message);

				return false;
			}
		}

		this.jar = null;
		console.log('Logged out');

		return true;
	}

	getErrorFromBody(body) {
		const $ = cheerio.load(body);
	
		return $('#details pre').text();
	}

	getOptions(path, method, options) {
		const [pathname, search] = path.split('?');
	
		return Object.assign(
			{ method },
			options,
			{ uri: this.getUrl(pathname, search) }
		);
	}

	async get(path, options) {
		const reqOptions = this.getOptions(path, 'GET', options);

		return await this.request(reqOptions);
	}

	async post(path, options) {
		const reqOptions = this.getOptions(path, 'POST', options);
		
		return await this.request(reqOptions);
	}

	async request(options, isRetry = false) {
		const reqOptions = Object.assign(
			{
				resolveWithFullResponse: true
			},
			options,
			{ jar: this.jar }
		);

		try {
			const res = await rp(reqOptions);

			return res;
		} catch (err) {
			let errorMessage = err.message;

			if (err.statusCode === 401) {
				if (!isRetry) {
					const loginRes = await this.login();
	
					if (loginRes.success) {
						return await this.request(options, true);
					} else {
						errorMessage = '401 - Session expired. Login attempt failed.';
					}
				} else {
					errorMessage = '401 - Session expired. Failed to re-run request after new login.';
				}
			} else if (err.error.toLowerCase().indexOf('doctype') >= 0) {
				errorMessage = this.getErrorFromBody(err.error);

				if (errorMessage) errorMessage = `${err.statusCode} - ${errorMessage}`;
			}
			
			if (!errorMessage && err.statusCode) {
				errorMessage = `${err.statusCode} - ${err.response.statusMessage}`;
			}
	
			console.error(errorMessage);
	
			return {
				error: errorMessage,
				success: false
			};
		}
	}
}

module.exports = AppframeClient;
