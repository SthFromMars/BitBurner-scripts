/** @param {NS} ns */
export async function main(ns) {
    const purchasedServers = [];
    ns.getPurchasedServers().forEach((server) => {
        purchasedServers.push({
            name: server,
            ram: ns.getServerMaxRam(server),
        });
    });
    // a-b
    purchasedServers.sort((server1, server2) => server1.ram - server2.ram);

    purchasedServers.forEach((server) => {
        ns.tprint("Server: ", server.name, " with RAM: ", server.ram, " GB\n");
    });
}
