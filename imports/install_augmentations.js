/** @param {NS} ns */

export async function main(ns) {
    ns.tprint(
        "Installing augmentations in 1h on: " +
            new Date(Date.now() + 3600000).toString()
    );
    await ns.sleep(3600000); // sleep for 1h to accumulate money

    await buyHomeServerUpgrades(ns);
    buyNeuroFluxGovernor(ns);

    // ns.singularity.installAugmentations("run_basics.js");
    ns.alert("Time to install augmentations");
    ns.exit();
}

async function buyHomeServerUpgrades(ns) {
    while (true) {
        const ramPrice = ns.singularity.getUpgradeHomeRamCost();
        const coresPrice = ns.singularity.getUpgradeHomeCoresCost();
        const playerMoney = ns.getServerMoneyAvailable("home");
        if (ramPrice < coresPrice && ramPrice < playerMoney)
            ns.singularity.upgradeHomeRam();
        else if (coresPrice < ramPrice && coresPrice < playerMoney)
            ns.singularity.upgradeHomeCores();
        else return;
        await ns.sleep(0);
    }
}

function buyNeuroFluxGovernor(ns) {
    let hightestFactionRep = 0;
    let hightestFaction;
    ns.getPlayer().factions.forEach((faction) => {
        const factionRep = ns.singularity.getFactionRep(faction);
        if (hightestFactionRep < factionRep) {
            hightestFactionRep = factionRep;
            hightestFaction = faction;
        }
    });
    while (ns.singularity.purchaseAugmentation("NeuroFlux Governor"));
}
