/** @param {NS} ns */

import {
    removeRamToBuy,
} from "./imports/file_utils";

import spendMoney from "./imports/spend_money";

export async function main(ns) {
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("sleep");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("exec");
    ns.disableLog("hasTorRouter");
    ns.disableLog("fileExists");
    ns.disableLog("scan");
    ns.disableLog("brutessh");
    ns.disableLog("ftpcrack");
    ns.disableLog("relaysmtp");
    ns.disableLog("httpworm");
    ns.disableLog("sqlinject");
    ns.disableLog("nuke");
    ns.disableLog("scp");

    let hacknetBuying = true;

    if (!ns.getPurchasedServers().length) removeRamToBuy(ns);

    while (true) {

        hacknetBuying = spendMoney(ns, hacknetBuying)

        await ns.sleep(10000);
    }
}