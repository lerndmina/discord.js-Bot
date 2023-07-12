module.exports = async (message) => {
  try {
    await message.delete();
  } catch (error) {
    log.error(`Failed permission check for deleting a message.`);
  }
};
