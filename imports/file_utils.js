const serverToHackFilename = "data/serverToHack.script";
const ramToBuyFilename = "data/ramToBuy.script";

export function readServerToHack(ns) {
    const serverToHack = ns.read(serverToHackFilename);
    if (!serverToHack) throw new Error("serverToHack not found");

    return serverToHack;
}

export function writeServerToHack(ns, serverToHack) {
    ns.write(serverToHackFilename, serverToHack, "w");
}

export function readRamToBuy(ns) {
    let ramToBuy = ns.read(ramToBuyFilename);
    if (!ramToBuy) {
        ramToBuy = ns.read("static_data/ramToBuyDefault.script");

        if (!ramToBuy) throw new Error("serverToHack not found");
    }
    return JSON.parse(ramToBuy);
}

export function writeRamToBuy(ns, ramToBuy) {
    ns.write(ramToBuyFilename, JSON.stringify(ramToBuy), "w");
}

export function removeRamToBuy(ns) {
    ns.rm(ramToBuyFilename);
}

export function readServersList(ns) {
    const serversList = ns.read("static_data/servers.script");
    if (!serversList) throw new Error("serversList not found");

    return JSON.parse(serversList);
}

export function readStage(ns) {
    const factionStage = Number.parseInt(ns.read("data/stage.script"));
    return factionStage ? factionStage : 0;
}
