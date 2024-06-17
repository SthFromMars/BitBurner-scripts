/** @param {NS} ns */

export async function main(ns) {
    ns.run("batch_hack.js", 1, 10);
    ns.spawn("player_actions.js");
}
