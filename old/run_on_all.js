/** @param {NS} ns */

import { readServersList, readServerToHack } from "./imports/file_utils";
const MAX_INSTANCES = 1000;

export async function main(ns, runOnHomePar) {
    let runOnHome = true;
    if (runOnHomePar !== undefined) runOnHome = runOnHomePar;
    else if (ns.args[0] !== undefined) runOnHome = ns.args[0];

    const serversList = readServersList(ns);
    const serverToHack = readServerToHack(ns);
    const ramScript = ns.getScriptRam("hack_auto.js");

    serversList.forEach((server) =>
        runOnServer(ns, server.hostname, serverToHack, ramScript)
    );
    ns.getPurchasedServers().forEach((server) =>
        runOnServer(ns, server, serverToHack, ramScript)
    );
    if (runOnHome) runOnServer(ns, "home", serverToHack, ramScript);
}

export function runOnServer(ns, server, serverToHack, ramScript) {
    let ramAvailable = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    if (server === "home") ramAvailable -= 32;
    if (ramAvailable <= 0) return;
    const threadsNr = Math.ceil(ramAvailable / ramScript / 1000);
    const instancesNr = Math.trunc(ramAvailable / ramScript / threadsNr);
    ns.scp("hack_auto.js", server);
    for (let i = 0; i < instancesNr; i++) {
        ns.exec("hack_auto.js", server, threadsNr, serverToHack);
    }
}

export default main;
