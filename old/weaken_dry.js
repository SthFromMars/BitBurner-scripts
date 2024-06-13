/** @param {NS} ns */

export async function main(ns) {
    const serverToHack = ns.args[0];
    const waitTime = ns.args[1];
    const threadsNr = ns.args[2];
    const serverCpuCores = ns.args[3];
    const serverName = ns.args[4];
    ns.tprint(
        "WEAKEN, Targeting Server:",
        serverToHack,
        ", Finish time: ",
        Date.now() + waitTime + ns.getWeakenTime(serverToHack),
        ", Effect: ",
        ns.weakenAnalyze(threadsNr, serverCpuCores),
        ", Ran on: ",
        serverName
    );
    await ns.sleep(waitTime + ns.getWeakenTime(serverToHack));
}
