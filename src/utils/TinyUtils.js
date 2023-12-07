function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = sleep;

async function postWebhookToThread(url, threadId, content) {
  try {
    await fetch(`${url}?thread_id=${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content }),
    });
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
}

module.exports = postWebhookToThread;
