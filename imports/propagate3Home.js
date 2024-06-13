/** @param {NS} ns */

import { readServerToHack } from "/imports/file_utils.js";

export default async function (ns, runOnHome, waitTime) {
    const thisServerName = ns.getHostname();
    const lastServerName = null;
    const serverToHack = readServerToHack(ns);
    const promises = [];
    const boughtServerRegex = new RegExp("^martian");

    const servers = ns.scan();
    for (let i = 0; i < servers.length; i++) {
        const server = servers[i];

        if (server !== lastServerName) {
            if (boughtServerRegex.test(server)) {
                ns.scp("run_hack_instances3.js", server);
                ns.scp("hack.js", server);
                ns.scp("hack_auto.js", server);

                ns.exec("run_hack_instances3.js", server, 1, serverToHack);
            } else {
                try {
                    ns.brutessh(server);
                } catch (e) {}
                try {
                    ns.ftpcrack(server);
                } catch (e) {}
                try {
                    ns.relaysmtp(server);
                } catch (e) {}
                try {
                    ns.httpworm(server);
                } catch (e) {}
                try {
                    ns.sqlinject(server);
                } catch (e) {}
                try {
                    ns.nuke(server);
                } catch (e) {}

                ns.scp("propagate3.js", server);
                ns.scp("run_hack_instances3.js", server);
                ns.scp("hack_auto.js", server);
                ns.exec(
                    "propagate3.js",
                    server,
                    1,
                    waitTime - 1,
                    thisServerName,
                    serverToHack
                );
                promises.push(
                    new Promise((resolve) => {
                        setTimeout(() => {
                            ns.exec(
                                "run_hack_instances3.js",
                                server,
                                1,
                                serverToHack
                            );
                            resolve();
                        }, waitTime * 1000);
                    })
                );
            }
        }
    }
    if (promises.length > 0) await Promise.all(promises);
    if (runOnHome)
        ns.exec("run_hack_instances3.js", thisServerName, 1, serverToHack);
}
