/** @param {NS} ns */

import killOnAll from "kill_on_all";
import { writeServerToHack } from "./imports/file_utils";
import tryNukeAll from "try_nuke_all";
import runOnAll from "run_on_all";

export async function main(ns) {
    const newServer = ns.args[0];
    const runOnHome = ns.args[1] !== undefined ? ns.args[1] : true;

    await killOnAll(ns);
    writeServerToHack(ns, newServer);
    await tryNukeAll(ns);
    await runOnAll(ns, runOnHome);
}
