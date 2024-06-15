/** @param {NS} ns */

import { removeRamToBuy } from "./imports/file_utils";

import spendMoney from "./imports/spend_money";
import factionWork from "./imports/faction_work";
import tryNukeBackdoorAll from "try_nuke_backdoor_all";

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

    const focus = ns.args[0] !== undefined ? ns.args[0] : false;
    let hacknetBuying = true;

    if (!ns.getPurchasedServers().length) removeRamToBuy(ns);

    while (true) {
        hacknetBuying = await spendMoney(ns, hacknetBuying);
        await factionWork(ns, focus);
        await tryNukeBackdoorAll(ns)

        await ns.sleep(10000);
    }
}
