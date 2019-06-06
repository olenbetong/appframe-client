const dotenv = require("dotenv");
const AppframeClient = require("./appframe");

dotenv.config();

const {
  APPFRAME_LOGIN: username,
  APPFRAME_PWD: password,
  APPFRAME_HOSTNAME: hostname
} = process.env;

const failedClient = new AppframeClient({
  hostname,
  password: "asdlkfje",
  username: "asldkfje"
});

const testPath = "/api/elements/1.0/projects?ProjectID=P16-1157";

describe("AppframeClient", () => {
  let client;

  beforeEach(() => {
    client = new AppframeClient({
      hostname,
      password,
      username
    });
  });

  it("returns human readable error messages on login failed", async () => {
    const result = await failedClient.login();

    expect(result.success).toBe(false);

    const reqResult = await failedClient.get(testPath);

    expect(reqResult).toEqual({
      error: "401 - Session expired. Login attempt failed.",
      statusCode: 401,
      statusMessage: "Unauthorized",
      success: false
    });

    await failedClient.logout();
  });

  it("can log in", async () => {
    const result = await client.login();
    const result2 = await client.login();

    expect(result).toEqual({ success: true });
    expect(result2).toEqual({ success: true });
  });

  it("returns session cookies", async () => {
    const noCookies = client.getSessionCookies();
    expect(noCookies).toBe(null);

    await client.login();
    const cookies = client.getSessionCookies();

    expect(cookies).toHaveProperty("AppframeWebAuth");
    expect(cookies).toHaveProperty("AppframeWebSession");
    expect(cookies["AppframeWebAuth"]).toHaveProperty("creation");
    expect(cookies["AppframeWebAuth"]).toHaveProperty("hostOnly");
    expect(cookies["AppframeWebAuth"]).toHaveProperty("httpOnly");
    expect(cookies["AppframeWebAuth"]).toHaveProperty("path");
    expect(cookies["AppframeWebAuth"]).toHaveProperty("secure");
    expect(cookies["AppframeWebAuth"]).toHaveProperty("value");
  });

  it("can log out", async () => {
    await client.login();
    const result = await client.logout();

    expect(result).toBe(true);
  });

  it("can get authenticated stuff after login", async () => {
    const result = await client.get(testPath);

    expect(result instanceof Array).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].ProjectId).toBe("P16-1157");
  });

  it("parses error messages properly", async () => {
    const result = await client.post(encodeURIComponent(testPath));

    expect(result).toEqual({
      error:
        "400 - A potentially dangerous Request.Path value was detected from the client (?).",
      statusCode: 400,
      statusMessage: "Bad Request",
      success: false
    });
  });

  it("handles server errors", async () => {
    const articleId =
      "article-that-should-never-ever-exist-" +
      Math.random()
        .toString(32)
        .slice(2);

    const result = await client.get(articleId);

    expect(result).toEqual({
      error: "404 - Not Found",
      statusCode: 404,
      statusMessage: "Not Found",
      success: false
    });
  });

  afterAll(async () => {
    await client.logout();
  });
});
