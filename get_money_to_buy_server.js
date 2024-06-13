/** @param {NS} ns */

import { readRamToBuy } from "./imports/file_utils";

export async function main(ns) {
    const serverPurchase = ns.getPurchasedServerCost(readRamToBuy(ns).ram);
    if (serverPurchase > 1000000000)
        ns.tprint("$", serverPurchase / 1000000000, "b");
    else if (serverPurchase > 1000000)
        ns.tprint("$", serverPurchase / 1000000, "m");
    else if (serverPurchase > 1000) ns.tprint("$", serverPurchase / 1000, "k");
    else ns.tprint("$", serverPurchase / 1000);
}
