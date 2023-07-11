import { Client, Collection } from "discord.js";

export default class MyClient extends Client {
  collection; // use correct type :)
  constructor(options) {
    super(options);
    this.collection = new Collection();
    this.loadCommands();
  }
  loadCommands() {
    // enter code here
  }
}
