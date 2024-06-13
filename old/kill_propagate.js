/** @param {NS} ns */

export async function main(ns) {
    const servers = ns.scan();
    const lastServerName = ns.args[0];
    const thisServerName = ns.getHostname();
    servers.forEach((server) => {
        if (server !== lastServerName) {
            ns.killall(server);
            ns.scp("kill_propagate.js", server);
            ns.exec("kill_propagate.js", server, 1, thisServerName);
        }
    });
}
