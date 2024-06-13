/** @param {NS} ns */

import { readServersList } from "./imports/file_utils";

export async function main(ns) {
    const serversList = readServersList(ns);
    serversList.forEach((server) => {
        try {
            ns.brutessh(server.hostname);
        } catch (e) {}
        try {
            ns.ftpcrack(server.hostname);
        } catch (e) {}
        try {
            ns.relaysmtp(server.hostname);
        } catch (e) {}
        try {
            ns.httpworm(server.hostname);
        } catch (e) {}
        try {
            ns.sqlinject(server.hostname);
        } catch (e) {}
        try {
            ns.nuke(server.hostname);
        } catch (e) {}
        ns.scp(["weaken.js"], server.hostname);
        ns.scp(["grow.js"], server.hostname);
        ns.scp(["hack.js"], server.hostname);
    });
}

export default main;
