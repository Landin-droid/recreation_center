const ngrok = require("@ngrok/ngrok");
require("dotenv").config();

async function startNgrok() {
  try {
    const listener = await ngrok.forward({
      addr: "localhost:5000",
      authtoken_from_env: true,
    });

    console.log(`🌐 ngrok is forwarding traffic from: ${listener.url()}`);
    console.log(`📍 Local server: http://localhost:5000`);
    console.log(
      `\n✅ Use this URL for webhooks: ${listener.url()}/api/payment/webhook`,
    );

    console.log(
      "\n📊 Traffic Inspector: https://dashboard.ngrok.com/traffic-inspector",
    );
  } catch (error) {
    console.error("❌ Error starting ngrok:", error.message);
    process.exit(1);
  }
}

startNgrok();
