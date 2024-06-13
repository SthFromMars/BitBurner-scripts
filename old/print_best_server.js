/** @param {NS} ns */

import { readServersList } from "./imports/file_utils";

export async function main(ns) {
    const skill = ns.args[0];
    const serverList = readServersList(ns);
    serverList.sort((server1, server2) => server2.moneyMax - server1.moneyMax);

    for (let i = 0; i < serverList.length; i++) {
        if (serverList[i].requiredHackingSkill <= skill) {
            ns.tprint(JSON.stringify(serverList[i], null, 4));
            return;
        }
    }
}
