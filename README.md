# Appframe Web Client 

A simple client to communicate with an AppframeWeb website in a node.js environment.

## Gettin started

### Installation

Install using NPM:

```
npm install --save-dev @olenbetong/appframe-client
```

### Usage

Import the client class, and pass username, password and hostname in an options object to the constructor. Call the login method to authenticate.

When authentication is complete, use the `get` or `post` methods to run requests to the AppframeWeb website.

```js
const AppframeClient = require('@olenbetong/appframe-client');
const client = new AppframeClient({
	username: 'mylogin',
	password: 'Password1',
	hostname: 'example.com'
});

const status = await client.login();
if (status.success) {
	const myResponse = await client.get('/my/api');
	const myApiData = JSON.parse(myResponse);

	console.log(myApiData);
} else {
	console.error(status.error);
}
```

If you want to use the client to log in, but use the session outside the client, you can get the session cookies using the `getSessionCookies` method.

```js
const AppframeClient = require('@olenbetong/appframe-client');
const client = new AppframeClient({
	username: 'mylogin',
	password: 'Password1',
	hostname: 'example.com'
});

const status = await client.login();
if (status.success) {
	const cookies = client.getSessionCookies();

	console.log(cookies);
	/**
	 * {
	 *   AppframeWebAuth: {
	 *     creation: [Date],
	 *     hostOnly: [bool],
	 *     httpOnly: [bool],
	 *     path: [string],
	 *     secure: [bool],
	 *     value: [string],
	 *   },
	 *   AppframeWebSession: {
	 *     creation: [Date],
	 *     hostOnly: [bool],
	 *     httpOnly: [bool],
	 *     path: [string],
	 *     secure: [bool],
	 *     value: [string],
	 *   }
	 * }
	 */
} else {
	console.error(status.error);
}
```

## Changelog

### [2.1.2] - 2019-01-16

 * Removed obsolete stuff from README
 * Updated dependencies

### [2.1.1] - 2018-12-18

#### Changed

 * Git repository moved to olenbetong organization

### [2.1.0] - 2018-12-18

#### Added

 * `getSessionCookies` - New method to get session cookies

### [2.0.0] - 2018-12-14

#### Breaking changes

 * Client requests now return the body of the response instead of the response. If the content type is JSON, the body will be parsed before it is returned as an object.

### [1.0.4] - 2018-12-14

#### Changed

 * If server returns error on login, display the error instead of a login failed string.

### [1.0.3] - 2018-11-26

#### Changed

 * Updated dependencies

### [1.0.2] - 2018-11-26

#### Fixed

 * Handle requests that are redirected to login page

### [1.0.1] - 2018-11-16

#### Changed

 * Moved repository to GitHub

### 1.0.0 - 2018-11-09


 * Migrated client to it's own NPM package from @olenbetong/appframe-proxy

[UNRELEASED]: https://github.com/bjornarvh/appframe-client/compare/v2.1.1...HEAD
[2.1.1]: https://github.com/olenbetong/appframe-client/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/olenbetong/appframe-client/compare/v2.1.0...v2.1.0
[2.1.0]: https://github.com/olenbetong/appframe-client/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/olenbetong/appframe-client/compare/v1.0.4...v2.0.0
[1.0.4]: https://github.com/olenbetong/appframe-client/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/olenbetong/appframe-client/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/olenbetong/appframe-client/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/olenbetong/appframe-client/compare/v1.0.0...v1.0.1