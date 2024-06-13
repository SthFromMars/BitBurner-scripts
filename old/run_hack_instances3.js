/** @param {NS} ns */
export async function main(ns) {
    const serverToHack = ns.args[0];
    const thisServerName = ns.getHostname();

    let ramAvailable =
        ns.getServerMaxRam(thisServerName) -
        ns.getServerUsedRam(thisServerName);
    if (thisServerName === "home") ramAvailable -= 32;
    const ramScript = ns.getScriptRam("hack_auto.js");
    const threadsNr = Math.ceil(ramAvailable / ramScript / 1000);
    const instancesNr = Math.trunc(ramAvailable / ramScript / threadsNr);

    for (let i = 0; i < instancesNr; i++) {
        ns.run("hack_auto.js", threadsNr, serverToHack);
    }
}
