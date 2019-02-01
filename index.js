const Client = require("./appframe");
const dotenv = require("dotenv");

dotenv.load();

const {
  APPFRAME_LOGIN: username,
  APPFRAME_PWD: password,
  APPFRAME_HOSTNAME: hostname
} = process.env;

const client = new Client({
  hostname,
  password,
  username
});

async function doStuff() {
  const loginResult = await client.login();

  if (loginResult.success === true) {
    const result = await client.get("portal");

    console.log(result);
  }
}

doStuff();
