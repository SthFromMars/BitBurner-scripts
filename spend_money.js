/** @param {NS} ns */

import {
    readServerToHack,
    readRamToBuy,
    writeRamToBuy,
    removeRamToBuy,
} from "./imports/file_utils";
import tryNukeBackdoorAll from "try_nuke_backdoor_all";

const LEVEL = "LEVEL";
const RAM = "RAM";
const CORE = "CORE";
const NODE = "NODE";

const HACKNET_LIMIT = 1000000000;
const BOUGHT_SERVER_NAME = "martian";

export async function main(ns) {
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("sleep");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("exec");
    ns.disableLog("hasTorRouter");
    ns.disableLog("fileExists");
    ns.disableLog("scan");
    ns.disableLog("brutessh");
    ns.disableLog("ftpcrack");
    ns.disableLog("relaysmtp");
    ns.disableLog("httpworm");
    ns.disableLog("sqlinject");
    ns.disableLog("nuke");
    ns.disableLog("scp");

    // let hacknetBuying = true;
    let hacknetBuying = false; // hacknet disabled

    if (!ns.getPurchasedServers().length) removeRamToBuy(ns);

    while (true) {
        let hacknetPurchase = null;
        if (hacknetBuying) {
            hacknetPurchase = getHacknetPurchase(ns);
            if (hacknetPurchase.price > HACKNET_LIMIT) {
                hacknetBuying = false;
                hacknetPurchase = null;
            }
        }
        const serverPurchase = getServerUpgrade(ns);
        const programPurchase = getProgramPurchase(ns);

        if (hacknetBuying && hacknetPurchase.price * 10 < serverPurchase.price)
            await buyHacknet(ns, hacknetPurchase);
        else if (programPurchase.price < serverPurchase.price)
            await buyProgram(ns, programPurchase);
        else await buyServer(ns);
        await ns.sleep(10000);
    }
}

function getProgramPurchase(ns) {
    if (!ns.hasTorRouter()) return { program: "TOR", price: 200000 };
    if (!ns.fileExists("BruteSSH.exe")) {
        ns.alert("BruteSSH.exe price not set.");
        return { program: "BruteSSH.exe", price: Infinity };
    }
    if (!ns.fileExists("AutoLink.exe"))
        return { program: "AutoLink.exe", price: 1000000 };
    if (!ns.fileExists("DeepscanV1.exe"))
        return { program: "DeepscanV1.exe", price: 500000 };
    if (!ns.fileExists("FTPCrack.exe"))
        return { program: "FTPCrack.exe", price: 1500000 };
    if (!ns.fileExists("relaySMTP.exe"))
        return { program: "relaySMTP.exe", price: 5000000 };
    if (!ns.fileExists("DeepscanV2.exe"))
        return { program: "DeepscanV2.exe", price: 25000000 };
    if (!ns.fileExists("HTTPWorm.exe"))
        return { program: "HTTPWorm.exe", price: 30000000 };
    if (!ns.fileExists("SQLInject.exe"))
        return { program: "SQLInject.exe", price: 250000000 };

    return { program: null, price: Infinity };
}

async function buyProgram(ns, programPurchase) {
    let toBuy = programPurchase;
    while (true) {
        if (toBuy.price < ns.getServerMoneyAvailable("home")) {
            if (toBuy.program === "TOR") ns.singularity.purchaseTor();
            else ns.singularity.purchaseProgram(toBuy.program);

            await tryNukeBackdoorAll(ns);
            toBuy = getProgramPurchase(ns);
        } else break;
        await ns.sleep(0);
    }
}

function getServerUpgrade(ns) {
    const servers = ns.getPurchasedServers();
    const ramToBuyObject = readRamToBuy(ns);
    const ramToBuy =
        ramToBuyObject.ram < 1048576 ? ramToBuyObject.ram : 1048576;
    if (servers.length < 25) {
        return {
            ram: ramToBuy,
            price: ns.getPurchasedServerCost(ramToBuy),
            name: null,
        };
    } else {
        const smallestServer = { ram: Infinity };
        servers.forEach((server) => {
            const serverRam = ns.getServerMaxRam(server);
            if (serverRam < smallestServer.ram) {
                smallestServer.ram = serverRam;
                smallestServer.name = server;
            }
        });
        if (smallestServer.ram < 1048576) {
            return {
                ram: ramToBuy,
                price: ns.getPurchasedServerUpgradeCost(
                    smallestServer.name,
                    ramToBuy
                ),
                name: smallestServer.name,
            };
        } else {
            return {
                ram: null,
                price: Infinity,
                name: null,
            };
        }
    }
}

async function buyServer(ns) {
    const serverToHack = readServerToHack(ns);
    while (true) {
        const currMoney = ns.getServerMoneyAvailable("home");
        const serverUpgrade = getServerUpgrade(ns);
        if (currMoney > serverUpgrade.price) {
            let success;
            if (serverUpgrade.name)
                success = ns.upgradePurchasedServer(
                    serverUpgrade.name,
                    serverUpgrade.ram
                );
            else {
                serverUpgrade.name = ns.purchaseServer(
                    BOUGHT_SERVER_NAME,
                    serverUpgrade.ram
                );
                ns.scp(["weaken.js"], serverUpgrade.name);
                ns.scp(["grow.js"], serverUpgrade.name);
                ns.scp(["hack.js"], serverUpgrade.name);
                success = Boolean(serverUpgrade.name);
            }
            if (success) {
                const serverToBuy = readRamToBuy(ns);
                serverToBuy.nr++;
                if (serverToBuy.nr % 25 === 0) {
                    serverToBuy.nr = 0;
                    serverToBuy.ram *= 2;
                }
                writeRamToBuy(ns, serverToBuy);
            }
        } else break;

        await ns.sleep(0);
    }
}

function getHacknetPurchase(ns) {
    const nodesNr = ns.hacknet.numNodes();
    const cheapest = {
        price: ns.hacknet.getPurchaseNodeCost(),
        nodeNr: null,
        type: NODE,
    };

    for (let i = 0; i < nodesNr; i++) {
        const currLevelPrice = ns.hacknet.getLevelUpgradeCost(i, 1);
        const currRamPrice = ns.hacknet.getRamUpgradeCost(i, 1);
        const currCorePrice = ns.hacknet.getCoreUpgradeCost(i, 1);

        if (currLevelPrice < cheapest.price) {
            cheapest.price = currLevelPrice;
            cheapest.nodeNr = i;
            cheapest.type = LEVEL;
        }
        if (currRamPrice < cheapest.price) {
            cheapest.price = currRamPrice;
            cheapest.nodeNr = i;
            cheapest.type = RAM;
        }
        if (currCorePrice < cheapest.price) {
            cheapest.price = currCorePrice;
            cheapest.nodeNr = i;
            cheapest.type = CORE;
        }
    }

    return cheapest;
}

async function buyHacknet(ns, hacknetPurchase) {
    let toBuy = hacknetPurchase;
    while (true) {
        const currMoney = ns.getServerMoneyAvailable("home");
        if (currMoney < toBuy.price) break;
        if (toBuy.price > HACKNET_LIMIT) break;

        if (toBuy.type === NODE) {
            ns.hacknet.purchaseNode();
        }
        if (toBuy.type === LEVEL) {
            ns.hacknet.upgradeLevel(toBuy.nodeNr, 1);
        }
        if (toBuy.type === RAM) {
            ns.hacknet.upgradeRam(toBuy.nodeNr, 1);
        }
        if (toBuy.type === CORE) {
            ns.hacknet.upgradeCore(toBuy.nodeNr, 1);
        }
        toBuy = getHacknetPurchase(ns);
        await ns.sleep(0);
    }
}
