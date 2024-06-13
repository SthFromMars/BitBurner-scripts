/** @param {NS} ns */

export async function main(ns) {
    const factionNames = [
        "CyberSec",
        "Tian Di Hui",
        "Netburners",
        "Sector-12",
        "NiteSec",
        "The Black Hand",
        "BitRunners",
        "Daedalus",
    ];
    const factions = [];

    factionNames.forEach((factionName) => {
        factions.push({
            name: factionName,
            augmentationNames:
                ns.singularity.getAugmentationsFromFaction(factionName),
        });
    });

    factions.forEach((faction) => {
        faction.augmentations = [];
        faction.augmentationNames.forEach((augmentationName) => {
            if (augmentationName === "NeuroFlux Governor") return;
            faction.augmentations.push({
                name: augmentationName,
                repReq: ns.singularity.getAugmentationRepReq(augmentationName),
                basePrice:
                    ns.singularity.getAugmentationBasePrice(augmentationName),
                prereq: ns.singularity.getAugmentationPrereq(augmentationName),
                factions: ns.singularity.getAugmentationFactions(augmentationName)
            });
        });
        delete faction.augmentationNames;
    });

    ns.tprint(JSON.stringify(factions, null, 4));
}
