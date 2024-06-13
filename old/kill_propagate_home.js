/** @param {NS} ns */

import { readServerToHack } from "./imports/file_utils";

export async function main(ns) {
    const servers = ns.scan();
    const lastServerName = "";
    const thisServerName = ns.getHostname();
    servers.forEach((server) => {
        if (server !== lastServerName) {
            ns.killall(server);
            ns.scp("kill_propagate.js", server);
            ns.exec("kill_propagate.js", server, 1, thisServerName);
        }
    });
    const serverToHack = readServerToHack(ns);
    ns.kill("hack.js", "home", serverToHack);
    ns.kill("hack_auto.js", "home", serverToHack);
}
