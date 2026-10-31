import { IPFS_GATEWAY } from "../config";

export const shortAddress = (address) =>
  address ? `${address.substring(0, 6)}...${address.slice(-4)}` : "—";

const units = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

// "3 days ago" style label for a millisecond timestamp
export const timeAgo = (timestamp) => {
  if (!timestamp) return "";
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
};

export const historyLabel = (event) => {
  switch (event.type) {
    case "registered":
      return `Registered by ${event.owner}`;
    case "verified":
      return "Verified by registrar";
    case "transferred":
      return `Transferred to ${event.owner}`;
    default:
      return event.type;
  }
};

export const ipfsUrl = (cid) => `${IPFS_GATEWAY.replace(/\/?$/, "/")}${cid}`;
