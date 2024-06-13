/** @param {NS} ns */

export async function main(ns) {
    await recursivelyNukeBackdoor(ns, null, ns.getServer(ns.getHostname()));
}

async function recursivelyNukeBackdoor(ns, lastServer, thisServer) {
    ns.singularity.connect(thisServer.hostname);
    if (!thisServer.hasAdminRights) {
        try {
            ns.brutessh(thisServer.hostname);
        } catch (e) {}
        try {
            ns.ftpcrack(thisServer.hostname);
        } catch (e) {}
        try {
            ns.relaysmtp(thisServer.hostname);
        } catch (e) {}
        try {
            ns.httpworm(thisServer.hostname);
        } catch (e) {}
        try {
            ns.sqlinject(thisServer.hostname);
        } catch (e) {}
        try {
            ns.nuke(thisServer.hostname);
        } catch (e) {}
        ns.scp(["weaken.js"], thisServer.hostname, "home");
        ns.scp(["grow.js"], thisServer.hostname, "home");
        ns.scp(["hack.js"], thisServer.hostname, "home");
    }

    if (!thisServer.backdoorInstalled) {
        try {
            await ns.singularity.installBackdoor();
        } catch (e) {}
    }

    for (const serverName of ns.scan(thisServer.hostname)) {
        if (!lastServer || serverName !== lastServer.hostname)
            await recursivelyNukeBackdoor(
                ns,
                thisServer,
                ns.getServer(serverName)
            );
    }

    if (lastServer) ns.singularity.connect(lastServer.hostname);
}

export default main;
