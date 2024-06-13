/** @param {NS} ns */

import { readServersList, readServerToHack } from "./imports/file_utils";

export async function main(ns) {
    const serverToHack = readServerToHack(ns);
    const serversList = readServersList(ns);

    serversList.forEach((server) => ns.killall(server.hostname));
    ns.getPurchasedServers().forEach((server) => ns.killall(server));
    ns.kill("hack_auto.js", "home", serverToHack);
}

export default main;