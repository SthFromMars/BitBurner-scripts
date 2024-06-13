/** @param {NS} ns */

import { readFactionStage } from "./imports/file_utils";

export async function main(ns) {
    const stageNr = readFactionStage(ns);
    const factionNames = getFactions(ns, stageNr);
    const factions = factionNames.map((factionName) => {
        const 
    });
}

function getFactions(ns, stageNr) {
    let factions;
    switch (stageNr) {
        case 0:
            factions = ["CyberSec", "Tian Di Hui", "Netburners"];
            break;
        case 1:
            factions = ["NiteSec", "The Black Hand"];
            break;
        case 2:
            factions = ["BitRunners", "Daedalus"];
            break;
        case 3:
            factions = ["Daedalus"];
            break;
    }
    return factions;
}
