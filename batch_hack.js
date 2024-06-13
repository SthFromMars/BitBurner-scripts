/** @param {NS} ns */

import tryNukeAll from "try_nuke_all";
import { readServersList } from "./imports/file_utils";

const serverPrepLevelEnum = {
    NO_PREP: 0,
    MIN_DIFFICULTY: 1,
    MAX_MONEY: 2,
};

const root2 = Math.pow(2, 0.5);
const RESET_TIME = 1000 * 60 * 60 * 2;

export async function main(ns) {
    ns.disableLog("sleep");
    ns.disableLog("getServerUsedRam");

    const serversToHackAmount = ns.args[0] ? ns.args[0] : Infinity;

    await tryNukeAll(ns);

    const serverList = readServersList(ns);
    const weakenCost = ns.getScriptRam("weaken.js");
    const growCost = ns.getScriptRam("grow.js");
    const hackCost = ns.getScriptRam("hack.js");

    let allBatchesFinishTime = 0;
    let lastReset = 0;
    let serversToHack = [];
    while (true) {
        if (allBatchesFinishTime + 100 > Date.now()) {
            const waitTime = allBatchesFinishTime + 100 - Date.now();
            ns.tprint(
                "Sleep time: " +
                    Math.floor(waitTime / 60 / 1000) +
                    ":" +
                    (Math.floor(waitTime / 1000) % 60) +
                    "\n Finish time: " +
                    new Date(allBatchesFinishTime)
            );
            await ns.sleep(allBatchesFinishTime + 100 - Date.now());
        }

        const hackLevel = ns.getHackingLevel();
        const currServers = getCurrServers(ns, serverList);
        const serversToRunOn = getServersToRunOn(currServers);
        if (Date.now() > lastReset + RESET_TIME) {
            serversToHack = getServersToHack(
                currServers,
                serversToHack,
                hackLevel
            );
            lastReset = Date.now();
        }

        let ranSomething = false;
        for (const server of serversToRunOn) {
            while (true) {
                let ranHackCount = 0;
                let outOfRam;
                for (let i = 0; i < serversToHack.length; i++) {
                    if (serversToHack[i].lockUntil + 100 > Date.now()) continue;

                    let prepLevelChanged = false;
                    let ranWeaken = false;

                    if (
                        serversToHack[i].prepLevel ===
                        serverPrepLevelEnum.NO_PREP
                    ) {
                        ranWeaken = true;
                        [serversToHack[i], outOfRam, prepLevelChanged] =
                            runWeaken(ns, server, serversToHack[i], weakenCost);
                    } else if (
                        serversToHack[i].prepLevel ===
                        serverPrepLevelEnum.MIN_DIFFICULTY
                    )
                        [serversToHack[i], outOfRam, prepLevelChanged] =
                            runGrow(
                                ns,
                                server,
                                serversToHack[i],
                                weakenCost,
                                growCost
                            );
                    else if (
                        serversToHack[i].prepLevel ===
                        serverPrepLevelEnum.MAX_MONEY
                    ) {
                        ranHackCount++;
                        [serversToHack[i], outOfRam] = runHack(
                            ns,
                            server,
                            serversToHack[i],
                            weakenCost,
                            growCost,
                            hackCost
                        );
                    } else
                        throw (
                            "no serverPrepLevelEnum\n" +
                            JSON.stringify(serversToHack[i], null, 4)
                        );

                    ranSomething = true;

                    if (
                        serversToHack[i].finishTime > allBatchesFinishTime &&
                        !ranWeaken
                    )
                        allBatchesFinishTime = serversToHack[i].finishTime;

                    if (prepLevelChanged)
                        serversToHack[i].lockUntil =
                            serversToHack[i].finishTime;

                    await ns.sleep(500 / serversToHackAmount);
                    if (outOfRam) break;
                    if (ranHackCount >= serversToHackAmount) break;
                }
                await ns.sleep(500 / serversToHackAmount);
                if (!ranSomething) break;
                if (outOfRam) break;
            }
            if (!ranSomething) break;
        }
    }
}

function runWeaken(ns, server, serverToHack, weakenCost) {
    let threadsNr;
    let done = false;
    let outOfRam = false;
    server.ramUsed = ns.getServerUsedRam(server.hostname);
    for (let i = root2; ; i *= root2) {
        threadsNr = Math.round(i);
        if (weakenCost * threadsNr > server.maxRam - server.ramUsed) {
            threadsNr = Math.round(i / root2);
            outOfRam = true;
            break;
        } else if (
            serverToHack.hackDifficulty -
                ns.weakenAnalyze(threadsNr, server.cpuCores) <=
            serverToHack.minDifficulty
        ) {
            done = true;
            break;
        }
    }
    if (threadsNr === 0) return [serverToHack, true, false];

    let waitTime = 0;
    const weakenTime = ns.getWeakenTime(serverToHack.hostname);
    if (Date.now() + weakenTime < serverToHack.finishTime + 100)
        waitTime = serverToHack.finishTime + 100 - (Date.now() + weakenTime);

    serverToHack.finishTime = Date.now() + waitTime + weakenTime;
    serverToHack.hackDifficulty =
        serverToHack.hackDifficulty -
        ns.weakenAnalyze(threadsNr, server.cpuCores);
    ns.exec(
        "weaken.js",
        server.hostname,
        { temporary: true, threads: threadsNr },
        serverToHack.hostname,
        waitTime,
        threadsNr
    );

    if (done) serverToHack.prepLevel = serverPrepLevelEnum.MIN_DIFFICULTY;

    return [serverToHack, outOfRam, done];
}

function runGrow(ns, server, serverToHack, weakenCost, growCost) {
    const singleThreadMultiplier = Math.pow(
        2,
        1 / ns.growthAnalyze(serverToHack.hostname, 2, server.cpuCores)
    );
    let growThreads;
    let done = false;
    let outOfRam = false;
    server.ramUsed = ns.getServerUsedRam(server.hostname);
    for (let i = root2; ; i *= root2) {
        growThreads = Math.round(i);
        const weakenThreads = Math.ceil(
            ns.growthAnalyzeSecurity(growThreads) /
                ns.weakenAnalyze(1, server.cpuCores)
        );

        if (
            weakenCost * weakenThreads + growCost * growThreads >
            server.maxRam - server.ramUsed
        ) {
            growThreads = Math.round(i / root2);
            outOfRam = true;
            break;
        } else if (
            serverToHack.moneyAvailable *
                Math.pow(singleThreadMultiplier, growThreads) >=
            serverToHack.moneyMax
        ) {
            done = true;
            break;
        }
    }

    if (growThreads === 0) return [serverToHack, true, false];

    const weakenThreads = Math.ceil(
        ns.growthAnalyzeSecurity(growThreads) /
            ns.weakenAnalyze(1, server.cpuCores)
    );

    const growTime = ns.getGrowTime(serverToHack.hostname);
    let growWaitTime = 0;
    if (Date.now() + growTime < serverToHack.finishTime + 100)
        growWaitTime = serverToHack.finishTime + 100 - (Date.now() + growTime);
    serverToHack.finishTime = Date.now() + growWaitTime + growTime;

    const weakenTime = ns.getWeakenTime(serverToHack.hostname);
    let weakenWaitTime = 0;
    if (Date.now() + weakenTime < serverToHack.finishTime + 100)
        weakenWaitTime =
            serverToHack.finishTime + 100 - (Date.now() + weakenTime);
    serverToHack.finishTime = Date.now() + weakenWaitTime + weakenTime;

    serverToHack.moneyAvailable =
        serverToHack.moneyAvailable *
        Math.pow(singleThreadMultiplier, growThreads);
    ns.exec(
        "grow.js",
        server.hostname,
        { temporary: true, threads: growThreads },
        serverToHack.hostname,
        growWaitTime,
        growThreads
    );
    ns.exec(
        "weaken.js",
        server.hostname,
        { temporary: true, threads: weakenThreads },
        serverToHack.hostname,
        weakenWaitTime,
        weakenThreads
    );

    if (done) serverToHack.prepLevel = serverPrepLevelEnum.MAX_MONEY;

    return [serverToHack, outOfRam, done];
}

function runHack(ns, server, serverToHack, weakenCost, growCost, hackCost) {
    const singleThreadMultiplier = Math.pow(
        2,
        1 / ns.growthAnalyze(serverToHack.hostname, 2, server.cpuCores)
    );
    let hackThreads;
    let outOfRam = false;
    server.ramUsed = ns.getServerUsedRam(server.hostname);
    for (let i = root2; ; i *= root2) {
        hackThreads = Math.round(i);
        const weaken1Threads = Math.ceil(
            ns.hackAnalyzeSecurity(hackThreads) /
                ns.weakenAnalyze(1, server.cpuCores)
        );

        const growThreads = Math.ceil(
            ns.growthAnalyze(
                serverToHack.hostname,
                1 / (1 - ns.hackAnalyze(serverToHack.hostname) * hackThreads),
                server.cpuCores
            )
        );

        const weaken2Threads = Math.ceil(
            ns.growthAnalyzeSecurity(growThreads) /
                ns.weakenAnalyze(1, server.cpuCores)
        );

        if (
            hackCost * hackThreads +
                weakenCost * (weaken1Threads + weaken2Threads) +
                growCost * growThreads >
            server.maxRam - server.ramUsed
        ) {
            hackThreads = Math.round(i / root2);
            outOfRam = true;
            break;
        } else if (ns.hackAnalyze(serverToHack.hostname) * hackThreads >= 0.5) {
            break;
        }
    }

    if (hackThreads === 1) return [serverToHack, true, false];

    const weaken1Threads = Math.ceil(
        ns.hackAnalyzeSecurity(hackThreads) /
            ns.weakenAnalyze(1, server.cpuCores)
    );

    const growThreads = Math.ceil(
        ns.growthAnalyze(
            serverToHack.hostname,
            1 / (1 - ns.hackAnalyze(serverToHack.hostname) * hackThreads),
            server.cpuCores
        )
    );

    const weaken2Threads = Math.ceil(
        ns.growthAnalyzeSecurity(growThreads) /
            ns.weakenAnalyze(1, server.cpuCores)
    );

    const hacktime = ns.getHackTime(serverToHack.hostname);
    let hackWaitTime = 0;
    if (Date.now() + hacktime < serverToHack.finishTime + 100)
        hackWaitTime = serverToHack.finishTime + 100 - (Date.now() + hacktime);
    serverToHack.finishTime = Date.now() + hackWaitTime + hacktime;

    const weakenTime = ns.getWeakenTime(serverToHack.hostname);
    let weaken1WaitTime = 0;
    if (Date.now() + weakenTime < serverToHack.finishTime + 100)
        weaken1WaitTime =
            serverToHack.finishTime + 100 - (Date.now() + weakenTime);
    serverToHack.finishTime = Date.now() + weaken1WaitTime + weakenTime;

    const growTime = ns.getGrowTime(serverToHack.hostname);
    let growWaitTime = 0;
    if (Date.now() + growTime < serverToHack.finishTime + 100)
        growWaitTime = serverToHack.finishTime + 100 - (Date.now() + growTime);
    serverToHack.finishTime = Date.now() + growWaitTime + growTime;

    let weaken2WaitTime = 0;
    if (Date.now() + weakenTime < serverToHack.finishTime + 100)
        weaken2WaitTime =
            serverToHack.finishTime + 100 - (Date.now() + weakenTime);
    serverToHack.finishTime = Date.now() + weaken2WaitTime + weakenTime;

    ns.exec(
        "hack.js",
        server.hostname,
        { temporary: true, threads: hackThreads },
        serverToHack.hostname,
        hackWaitTime,
        hackThreads
    );
    ns.exec(
        "weaken.js",
        server.hostname,
        { temporary: true, threads: weaken1Threads },
        serverToHack.hostname,
        weaken1WaitTime,
        weaken1Threads
    );
    ns.exec(
        "grow.js",
        server.hostname,
        { temporary: true, threads: growThreads },
        serverToHack.hostname,
        growWaitTime,
        growThreads
    );
    ns.exec(
        "weaken.js",
        server.hostname,
        { temporary: true, threads: weaken2Threads },
        serverToHack.hostname,
        weaken2WaitTime,
        weaken2Threads
    );

    return [serverToHack, outOfRam];
}

function getServersToRunOn(currServers) {
    const serversToRunOn = currServers.filter(
        (server) => server.hasAdminRights && server.maxRam >= 8
    );
    serversToRunOn.sort(
        (server1, server2) => (server1.maxRam - server2.maxRam) * -1
    );
    for (const server of serversToRunOn) {
        if (server.hostname === "home") {
            server.maxRam -= 32;
            break;
        }
    }
    return serversToRunOn;
}

function getServersToHack(currServers, oldServersToHack, hackLevel) {
    const oldServerMap = new Map(
        oldServersToHack.map((server) => [server.hostname, server])
    );
    const serversToHack = currServers.filter(
        (server) =>
            server.hasAdminRights &&
            server.requiredHackingSkill <= hackLevel &&
            server.moneyMax
    );
    serversToHack.sort(
        (server1, server2) => (server1.moneyMax - server2.moneyMax) * -1
    );
    serversToHack.forEach((server) => {
        if (server.hackDifficulty === server.minDifficulty) {
            if (server.moneyAvailable === server.moneyMax)
                server.prepLevel = serverPrepLevelEnum.MAX_MONEY;
            else server.prepLevel = serverPrepLevelEnum.MIN_DIFFICULTY;
        } else server.prepLevel = serverPrepLevelEnum.NO_PREP;
        const oldServer = oldServerMap.get(server.hostname);
        if (oldServer) {
            server.lockUntil = oldServer.lockUntil;
            server.finishTime = oldServer.finishTime;
        } else {
            server.lockUntil = 0;
            server.finishTime = 0;
        }
    });
    return serversToHack;
}

function getCurrServers(ns, serverList) {
    const home = ns.getServer("home");
    // home.maxRam -= 32;
    home.maxRam -= 64;
    return [
        ...serverList.map((server) => ns.getServer(server.hostname)),
        ...ns
            .getPurchasedServers()
            .map((serverName) => ns.getServer(serverName)),
        home,
    ];
}
