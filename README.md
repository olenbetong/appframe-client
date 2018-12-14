# Appframe Web Client 

A simple proxy server that keeps a user logged in to an AppframeWeb website, and proxies requests to that website. Useful if you are developing applications locally and need to access code modules/data on an AppframeWeb website.

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

### Options

 * **username** - User that will be used to log in to the AppframeWeb website
 * **password** - Password for the user
 * **hostname** - Hostname the proxy will send requests to
 * **port** (optional) - Port where the proxy will listen to requests (default 8082)

## Changelog

### [2.0.0] - 2018-12-14

### Breaking changes

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

### [1.0.0] - 2018-11-09


 * Migrated client to it's own NPM package from @olenbetong/appframe-proxy