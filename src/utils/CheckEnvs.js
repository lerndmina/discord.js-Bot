require("dotenv").config();
module.exports = () => {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const OWNER_ID = process.env.OWNER_ID;
  const PREFIX = process.env.PREFIX;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const TEST_SERVER = process.env.GUILD_ID;

  // Check all required environment variables are set
  if (!BOT_TOKEN) {
    log.error("Missing BOT_TOKEN environment variable.");
    process.exit(1);
  }
  if (!OWNER_ID) {
    log.error("Missing OWNER_ID environment variable.");
    process.exit(1);
  }
  if (!PREFIX) {
    log.error("Missing PREFIX environment variable.");
    process.exit(1);
  }
  if (!OPENAI_API_KEY) {
    log.error("Missing OPENAI_API_KEY environment variable.");
    process.exit(1);
  }
};
