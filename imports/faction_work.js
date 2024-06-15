/** @param {NS} ns */

import { readStageNr, readStages } from "./imports/file_utils";

export default async function main(ns, focus) {
    ns.singularity.checkFactionInvitations().forEach((invitation) => {
        if (invitation !== "Chongqing") {
            ns.singularity.joinFaction(invitation);
        }
    });
    const stageNr = readStageNr(ns);
    const stages = readStages(ns);
    const currFactions = ns.getPlayer().factions;
    for (const faction of stages[stageNr].factions) {
        if (
            ns.singularity.getFactionRep(faction.name) < faction.maxRep &&
            currFactions.includes(faction.name)
        ) {
            ns.singularity.workForFaction(faction.name, "hacking", focus);
            break;
        }
    }
}
