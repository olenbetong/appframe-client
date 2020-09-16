const nodeFetch = require("node-fetch");
const fetchCookie = require("fetch-cookie");
const tough = require("tough-cookie");
const cheerio = require("cheerio");
const merge = require("deepmerge");

const loginFailedStr = "Login failed. Please check your credentials.";

class AppframeClient {
  constructor(props) {
    this.hostname = props.hostname;
    this.password = props.password;
    this.username = props.username;
    this.protocol = props.protocol || "https:";
    this.jar = new tough.CookieJar();
    this.fetch = fetchCookie(nodeFetch, this.jar);
    this._loginRequest = null;
  }

  getUrl(pathname, query) {
    const url = new URL(`${this.protocol}//${this.hostname}`);
    url.pathname = pathname;

    if (query) url.search = query;

    return url.toString();
  }

  async loginAsync() {
    if (await this.jar.getCookieString("AppframeWebAuth")) {
      await this.logout();
    }

    await this.jar.removeAllCookies();

    const { password, username } = this;

    const body = JSON.stringify({
      username,
      password,
      remember: false,
    });

    let url = this.getUrl("login");
    let options = {
      body,
      headers: {
        Accept: "application/json",
        "Content-Length": body.length,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      method: "POST",
    };

    try {
      const response = await this.fetch(url, options);

      if (response.ok) {
        const status = await response.json();

        if (status.success) {
          return status;
        } else {
          const error = status.error
            ? `Login failed: ${status.error}`
            : loginFailedStr;

          return Object.assign(
            {
              error,
              success: false,
            },
            status
          );
        }
      } else {
        return {
          error: `Login failed (${response.statusCode}: ${response.statusMessage})`,
          success: false,
        };
      }
    } catch (err) {
      return {
        error: err.message,
        success: false,
      };
    }
  }

  login() {
    if (
      this._loginRequest !== null &&
      typeof this._loginRequest.then === "function"
    ) {
      return this._loginRequest;
    } else {
      this._loginRequest = this.loginAsync().finally(
        () => (this._loginRequest = null)
      );

      return this._loginRequest;
    }
  }

  async logout() {
    let url = this.getUrl("logout");
    let reqOptions = {
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      method: "POST",
    };

    try {
      await this.fetch(url, reqOptions);
    } catch (err) {
      if (err.statusCode !== 303) {
        await this.jar.removeAllCookies();

        return false;
      }
    }

    await this.jar.removeAllCookies();

    return true;
  }

  getErrorFromBody(body) {
    const $ = cheerio.load(body);

    return $("#details pre").text();
  }

  getOptions(path, method, options = {}) {
    const [pathname, search] = path.split("?");

    return Object.assign({ method }, options, {
      url: this.getUrl(pathname, search),
    });
  }

  getSessionCookies() {
    if (this.jar) {
      let url = `${this.protocol}//${this.hostname}`;
      let sessionCookies = this.jar.getCookiesSync(url);
      let cookies = {};

      for (let cookie of sessionCookies) {
        if (["AppframeWebAuth", "AppframeWebSession"].includes(cookie.key)) {
          cookies[cookie.key] = {
            creation: cookie.creation,
            httpOnly: cookie.httpOnly,
            hostOnly: cookie.hostOnly,
            path: cookie.path,
            secure: cookie.secure,
            value: cookie.value,
          };
        }
      }

      let cookieNames = Object.keys(cookies);

      if (
        !cookieNames.includes("AppframeWebAuth") ||
        !cookieNames.includes("AppframeWebSession")
      ) {
        return null;
      }

      return cookies;
    }

    return null;
  }

  async get(path, options) {
    const reqOptions = this.getOptions(path, "GET", options);

    return await this.request(reqOptions);
  }

  async post(path, options) {
    const reqOptions = this.getOptions(path, "POST", options);

    return await this.request(reqOptions);
  }

  async request(options, isRetry = false) {
    let reqOptions = merge(
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest", // setting X-Requested-With makes the server return 401 instead of redirecting to login
        },
      },
      options
    );

    try {
      let response = await this.fetch(options.url, reqOptions);

      if (response.ok) {
        let contentType = response.headers.get("content-type");

        if (contentType && contentType.indexOf("application/json") > -1) {
          return await response.json();
        }

        return await response.text();
      } else {
        let body = await response.text();

        throw {
          error: body,
          statusCode: response.status,
          statusMessage: response.statusText,
        };
      }
    } catch (err) {
      let errorMessage = err.message;

      if (err.statusCode === 401) {
        if (!isRetry) {
          let loginRes = await this.login();

          if (loginRes.success) {
            return await this.request(options, true);
          } else {
            errorMessage = "401 - Session expired. Login attempt failed.";
          }
        } else {
          errorMessage =
            "401 - Session expired. Failed to re-run request after new login.";
        }
      } else if (err.error?.toLowerCase().indexOf("doctype") >= 0) {
        errorMessage = this.getErrorFromBody(err.error);

        if (errorMessage) errorMessage = `${err.statusCode} - ${errorMessage}`;
      }

      if (!errorMessage && err.statusCode) {
        errorMessage = `${err.statusCode} - ${err.statusMessage}`;
      }

      return {
        error: errorMessage,
        success: false,
        statusCode: err.statusCode,
        statusMessage: err.statusMessage,
      };
    }
  }
}

module.exports = AppframeClient;
