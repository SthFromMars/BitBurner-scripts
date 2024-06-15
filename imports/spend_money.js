/** @param {NS} ns */

import {
    readServerToHack,
    readRamToBuy,
    writeRamToBuy,
    readStageNr,
    readStages,
} from "./imports/file_utils";

const LEVEL = "LEVEL";
const RAM = "RAM";
const CORE = "CORE";
const NODE = "NODE";

const PurchaseTypeEnum = {
    HACKNET: 0,
    SERVER: 1,
    PROGRAM: 2,
    TRAVEL: 3,
    AUGMENTATION: 4,
};

const HACKNET_LIMIT = 1000000000;
const BOUGHT_SERVER_NAME = "martian";

export default async function (ns, hacknetBuyingPar) {
    let hacknetBuying = hacknetBuyingPar;

    let hacknetPurchase = { price: Infinity };
    if (hacknetBuying) {
        hacknetPurchase = getHacknetPurchase(ns);
        if (hacknetPurchase.price > HACKNET_LIMIT) {
            hacknetBuying = false;
            hacknetPurchase = { price: Infinity };
        }
    }
    const serverPurchase = getServerUpgrade(ns);
    const programPurchase = getProgramPurchase(ns);
    const travelPurchase = getTravelPurchase(ns);
    const augmentPurchase = getAugmentPurchase(ns);

    const smallestPurchase = {
        type: PurchaseTypeEnum.HACKNET,
        price: hacknetPurchase.price * 10,
    };
    if (serverPurchase.price < smallestPurchase.price) {
        smallestPurchase.type = PurchaseTypeEnum.SERVER;
        smallestPurchase.price = serverPurchase.price;
    } else if (programPurchase.price < smallestPurchase.price) {
        smallestPurchase.type = PurchaseTypeEnum.PROGRAM;
        smallestPurchase.price = programPurchase.price;
    } else if (travelPurchase.price < smallestPurchase.price) {
        smallestPurchase.type = PurchaseTypeEnum.TRAVEL;
        smallestPurchase.price = travelPurchase.price;
    } else if (augmentPurchase.price < smallestPurchase.price) {
        smallestPurchase.type = PurchaseTypeEnum.AUGMENTATION;
        smallestPurchase.price = augmentPurchase.price;
    }

    switch (smallestPurchase.type) {
        case PurchaseTypeEnum.HACKNET:
            await buyHacknet(ns, hacknetPurchase);
            break;
        case PurchaseTypeEnum.SERVER:
            await buyServer(ns);
            break;
        case PurchaseTypeEnum.PROGRAM:
            await buyProgram(ns, programPurchase);
            break;
        case PurchaseTypeEnum.TRAVEL:
            buyTravel(ns, travelPurchase);
            break;
        case PurchaseTypeEnum.AUGMENTATION:
            await buyAugment(ns, augmentPurchase);
            break;
    }

    return hacknetBuying;
}

function getAugmentPurchase(ns) {
    const stageNr = readStageNr(ns);
    const stages = readStages(ns);
    const currAugmentations = ns.singularity.getOwnedAugmentations(true);
    for (const augmentation of stages[stageNr].augmentations) {
        if (!currAugmentations.includes(augmentation.name)) {
            if (
                augmentation.repReq <=
                ns.singularity.getFactionRep(augmentation.faction)
            )
                return {
                    price: ns.singularity.getAugmentationPrice(
                        augmentation.name
                    ),
                    name: augmentation.name,
                    faction: augmentation.faction,
                };
            else return { price: Infinity };
        }
    }
    ns.alert("all augmentations purchased");
    return { price: Infinity };
}

async function buyAugment(ns, augmentPurchaseParam) {
    let augmentPurchase = augmentPurchaseParam;
    while (augmentPurchase.price < ns.getServerMoneyAvailable("home")) {
        ns.singularity.purchaseAugmentation(
            augmentPurchase.faction,
            augmentPurchase.name
        );
        augmentPurchase = getAugmentPurchase(ns);

        await ns.sleep(0);
    }
}

function getTravelPurchase(ns) {
    const stageNr = readStageNr(ns);
    if (stageNr !== 0) return { price: Infinity };
    const player = ns.getPlayer();
    if (!player.factions.includes("Tian Di Hui") && player.city !== "Chongqing")
        return {
            destination: "Chongqing",
            price: 200000,
        };
    else if (
        player.factions.includes("Tian Di Hui") &&
        player.city !== "Sector-12"
    )
        return {
            destination: "Sector-12",
            price: 200000,
        };
    else return { price: Infinity };
}

function buyTravel(ns, travelPurchase) {
    if (travelPurchase.price < ns.getServerMoneyAvailable("home"))
        ns.singularity.travelToCity(travelPurchase.destination);
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
