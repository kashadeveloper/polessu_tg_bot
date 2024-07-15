import path from "path";
import config from "../../config.json";
import fs from "fs/promises";

export async function subscribeChat(id: number) {
  if (config.subscribedChats.includes(id)) return;
  config.subscribedChats.push(id);

  return await fs.writeFile(
    path.join(__dirname, "../../config.json"),
    JSON.stringify(config, undefined, "\t")
  );
}

export function isChatSubscribed(id: number) {
  return config.subscribedChats.includes(id);
}

export async function unsubscribeChat(id: number) {
  if (!config.subscribedChats.includes(id)) return;

  const index = config.subscribedChats.findIndex((x) => x === id);
  if (index == -1) return;

  config.subscribedChats.splice(index, 1);
  return await fs.writeFile(
    path.join(__dirname, "../../config.json"),
    JSON.stringify(config, undefined, "\t")
  );
}

export function getLastUpdateDate() {
  return config.stat.updateDate;
}

export function getLatestStat(): Record<string, any> {
  return config.stat;
}

export async function updateUploadData(data: Record<any, any>) {
  //@ts-ignore
  config.stat = data;
  return await fs.writeFile(
    path.join(__dirname, "../../config.json"),
    JSON.stringify(config, undefined, "\t")
  );
}

export function getChatsList() {
  return config.subscribedChats;
}
