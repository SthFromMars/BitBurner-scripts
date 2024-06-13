/** @param {NS} ns */

export async function main(ns) {
    const serverToHack = ns.args[0];
    const waitTime = ns.args[1];
    const threadsNr = ns.args[2];
    const serverCpuCores = ns.args[3];
    const serverName = ns.args[4];

    const singleThreadMultiplier = Math.pow(
        2,
        1 / ns.growthAnalyze(serverToHack, 2, serverCpuCores)
    );

    ns.tprint(
        "GROW, Targeting Server:",
        serverToHack,
        ", Finish time: ",
        Date.now() + waitTime + ns.getGrowTime(serverToHack),
        ", Effect: ",
        Math.pow(singleThreadMultiplier, threadsNr),
        ", Ran on: ",
        serverName
    );
    await ns.sleep(waitTime + ns.getGrowTime(serverToHack));
}
