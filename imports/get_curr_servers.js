/** @param {NS} ns */

export default function (ns) {
    const thisServer = ns.getHostname();
    const serverArr = recursivelyScan(ns, "", thisServer);

    return serverArr;
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
    serverArr.push(thisServerObject);
    return serverArr;
}
