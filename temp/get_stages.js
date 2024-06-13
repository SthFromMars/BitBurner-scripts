/** @param {NS} ns */

export async function main(ns) {
    const factions = JSON.parse(ns.read("temp/factions.script"));
    const stages = [];
    stages.push(
        {
            factions: [
                {
                    name: "Tian Di Hui",
                    maxRep: 6250,
                },
                {
                    name: "Netburners",
                    maxRep: 12500,
                },
                {
                    name: "Sector-12",
                    maxRep: 12500,
                },
                {
                    name: "CyberSec",
                    maxRep: 18750,
                },
            ],
            augmentations: [
                ...factions[0].augmentations,
                ...factions[1].augmentations,
                ...factions[2].augmentations,
                ...factions[3].augmentations,
            ].sort((aug1, aug2) => -1 * (aug1.basePrice - aug2.basePrice)),
        },
        {
            factions: [
                {
                    name: "NiteSec",
                    maxRep: 50000,
                },
                {
                    name: "The Black Hand",
                    maxRep: 175000,
                },
            ],
            augmentations: [
                ...factions[4].augmentations,
                ...factions[5].augmentations,
            ].sort((aug1, aug2) => -1 * (aug1.basePrice - aug2.basePrice)),
        },
        {
            factions: [
                {
                    name: "BitRunners",
                    maxRep: 1000000,
                },
            ],
            augmentations: [...factions[6].augmentations].sort(
                (aug1, aug2) => -1 * (aug1.basePrice - aug2.basePrice)
            ),
        },
        {
            factions: [
                {
                    name: "Daedalus",
                    maxRep: 1000000,
                },
            ],
            augmentations: [
                factions[7].augmentations[0],
                factions[7].augmentations[1],
            ].sort((aug1, aug2) => -1 * (aug1.basePrice - aug2.basePrice)),
        },
        {
            factions: [
                {
                    name: "Daedalus",
                    maxRep: 2500000,
                },
            ],
            augmentations: [
                factions[7].augmentations[2],
                factions[7].augmentations[3],
            ].sort((aug1, aug2) => -1 * (aug1.basePrice - aug2.basePrice)),
        }
    );
    ns.tprint(JSON.stringify(stages, null, 4));
}
