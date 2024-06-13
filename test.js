/** @param {NS} ns */

import { readServersList } from "./imports/file_utils";

export async function main(ns) {
    ns.tprint(JSON.stringify(ns.getServer("home"), null, 4));
}
