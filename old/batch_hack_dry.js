/** @param {NS} ns */

import tryNukeAll from "try_nuke_all";
import getCurrServers from "./imports/get_curr_servers";

const serverPrepLevelEnum = {
    NO_PREP: 0,
    MIN_DIFFICULTY: 1,
    MAX_MONEY: 2,
};

export async function main(ns) {
    ns.disableLog("sleep");
    ns.disableLog("getServerUsedRam");

    const hackLevel = ns.args[0] ? ns.args[0] : ns.getHackingLevel();

    await tryNukeAll(ns);

    const currServers = getCurrServers(ns);
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
        server.lockUntil = 0;
        server.finishTime = 0;
    });

    serversToRunOn.forEach((server) => {
        // ns.scp(["weaken.js"], server.hostname);
        ns.scp(["weaken_dry.js"], server.hostname); // only in dry
        // ns.scp(["grow.js"], server.hostname);
        ns.scp(["grow_dry.js"], server.hostname); // only in dry
        // ns.scp(["hack.js"], server.hostname);
        ns.scp(["hackw_dry.js"], server.hostname); // only in dry
    });
    // const weakenCost = ns.getScriptRam("weaken.js");
    const weakenCost = ns.getScriptRam("weaken_dry.js"); // only in dry
    // const growCost = ns.getScriptRam("grow.js");
    const growCost = ns.getScriptRam("grow_dry.js"); // only in dry
    // const growCost = ns.getScriptRam("hack.js");
    const hackCost = ns.getScriptRam("hack_dry.js"); // only in dry

    let allBatchesFinishTime = 0;
    while (true) {
        if (allBatchesFinishTime + 100 > Date.now())
            await ns.sleep(allBatchesFinishTime + 100 - Date.now());
        let ranSomething = false;
        for (const server of serversToRunOn) {
            while (true) {
                let outOfRam;
                for (let i = 0; i < serversToHack.length; i++) {
                    if (serversToHack[i].lockUntil + 100 > Date.now()) continue;
                    let prepLevelChanged = false;
                    if (
                        serversToHack[i].prepLevel ===
                        serverPrepLevelEnum.NO_PREP
                    )
                        [serversToHack[i], outOfRam, prepLevelChanged] =
                            runWeaken(ns, server, serversToHack[i], weakenCost);
                    else if (
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
                    )
                        [serversToHack[i], outOfRam] = runHack(
                            ns,
                            server,
                            serversToHack[i],
                            weakenCost,
                            growCost,
                            hackCost
                        );
                    else
                        throw (
                            "no serverPrepLevelEnum\n" +
                            JSON.stringify(serversToHack[i], null, 4)
                        );

                    ranSomething = true;

                    if (serversToHack[i].finishTime > allBatchesFinishTime)
                        allBatchesFinishTime = serversToHack[i].finishTime;

                    if (prepLevelChanged)
                        serversToHack[i].lockUntil =
                            serversToHack[i].finishTime;

                            if (outOfRam) break;
                }
                if (!ranSomething) break;
                if (outOfRam) break;
            }
            if (!ranSomething) break;
            await ns.sleep(500);
        }
    }
}

function runWeaken(ns, server, serverToHack, weakenCost) {
    let threadsNr;
    let done = false;
    let outOfRam = false;
    server.ramUsed = ns.getServerUsedRam(server.hostname);
    for (threadsNr = 1; ; threadsNr++) {
        if (weakenCost * threadsNr > server.maxRam - server.ramUsed) {
            threadsNr--;
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
        // "weaken.js",
        "weaken_dry.js", // only in dry
        server.hostname,
        { temporary: true, threads: threadsNr },
        serverToHack.hostname,
        waitTime,
        // threadsNr
        threadsNr, // only in dry
        server.cpuCores, // only in dry
        server.hostname // only in dry
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
    for (growThreads = 1; ; growThreads++) {
        const weakenThreads = Math.ceil(
            ns.growthAnalyzeSecurity(growThreads) /
                ns.weakenAnalyze(1, server.cpuCores)
        );

        if (
            weakenCost * weakenThreads + growCost * growThreads >
            server.maxRam - server.ramUsed
        ) {
            growThreads--;
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
        // "grow.js",
        "grow_dry.js",
        server.hostname,
        { temporary: true, threads: growThreads },
        serverToHack.hostname,
        growWaitTime,
        // growThreads
        growThreads,
        server.cpuCores, // only in dry
        server.hostname // only in dry
    );
    ns.exec(
        // "weaken.js",
        "weaken_dry.js", // only in dry
        server.hostname,
        { temporary: true, threads: weakenThreads },
        serverToHack.hostname,
        weakenWaitTime,
        // weakenThreads
        weakenThreads, // only in dry
        server.cpuCores, // only in dry
        server.hostname // only in dry
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
    let done = false;
    let outOfRam = false;
    server.ramUsed = ns.getServerUsedRam(server.hostname);
    for (hackThreads = 1; ; hackThreads++) {
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
            hackThreads--;
            outOfRam = true;
            break;
        } else if (ns.hackAnalyze(serverToHack.hostname) * hackThreads >= 0.5) {
            done = true;
            break;
        }
    }

    if (hackThreads === 0) return [serverToHack, true, false];

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
        // "hack.js",
        "hack_dry.js",
        server.hostname,
        { temporary: true, threads: hackThreads },
        serverToHack.hostname,
        hackWaitTime,
        // hackThreads
        weakenThreads, // only in dry
        server.cpuCores, // only in dry
        server.hostname // only in dry
    );
    ns.exec(
        // "weaken.js",
        "weaken_dry.js",
        server.hostname,
        { temporary: true, threads: weaken1Threads },
        serverToHack.hostname,
        weaken1Threads,
        // weaken1Threads
        weakenThreads, // only in dry
        server.cpuCores, // only in dry
        server.hostname // only in dry
    );
    ns.exec(
        // "grow.js",
        "grow_dry.js",
        server.hostname,
        { temporary: true, threads: growThreads },
        serverToHack.hostname,
        growWaitTime,
        // growThreads
        growThreads,
        server.cpuCores, // only in dry
        server.hostname // only in dry
    );
    ns.exec(
        // "weaken.js",
        "weaken_dry.js",
        server.hostname,
        { temporary: true, threads: weaken2Threads },
        serverToHack.hostname,
        weaken2WaitTime,
        // weaken2Threads
        weakenThreads, // only in dry
        server.cpuCores, // only in dry
        server.hostname // only in dry
    );

    return [serverToHack, outOfRam];
}
