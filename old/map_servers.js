/** @param {NS} ns */

export async function main(ns) {
    const thisServer = ns.getHostname();
    const serverArr = recursivelyScan(ns, "", thisServer);

    ns.write(
        "static_data/servers.script",
        JSON.stringify(serverArr, null, 4),
        "w"
    );
}

function recursivelyScan(ns, lastServer, thisServer) {
    let serverArr = [];
    ns.scan(thisServer).forEach((server) => {
        if (server !== lastServer)
            serverArr = [
                ...serverArr,
                ...recursivelyScan(ns, thisServer, server),
            ];
    });
    const thisServerObject = ns.getServer(thisServer);
    if (!thisServerObject.purchasedByPlayer) {
        delete thisServerObject.backdoorInstalled;
        delete thisServerObject.ftpPortOpen;
        delete thisServerObject.hasAdminRights;
        delete thisServerObject.httpPortOpen;
        delete thisServerObject.isConnectedTo;
        delete thisServerObject.moneyAvailable;
        delete thisServerObject.openPortCount;
        delete thisServerObject.purchasedByPlayer;
        delete thisServerObject.ramUsed;
        delete thisServerObject.smtpPortOpen;
        delete thisServerObject.sqlPortOpen;
        delete thisServerObject.sshPortOpen;
        delete thisServerObject.hackDifficulty;

        serverArr.push(thisServerObject);
    }
    return serverArr;
}
