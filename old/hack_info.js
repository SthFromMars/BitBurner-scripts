/** @param {NS} ns */

import { readServerToHack } from "/imports/file_utils";

export async function main(ns) {
    const serverToHack = readServerToHack(ns);

    const securityLevel = ns.getServerSecurityLevel(serverToHack);
    const minSecurityLevel = ns.getServerMinSecurityLevel(serverToHack);
    const securityPercentage = (securityLevel / minSecurityLevel) * 100;

    const moneyAvailable = ns.getServerMoneyAvailable(serverToHack);
    const maxMoneyAvailable = ns.getServerMaxMoney(serverToHack);
    const moneyPercentage = (moneyAvailable / maxMoneyAvailable) * 100;

    ns.tprint(
        "\n    Security: ",
        "(",
        securityPercentage,
        "%) ",
        securityLevel,
        "/",
        minSecurityLevel,
        "\n    Money: ",
        "(",
        moneyPercentage,
        "%) ",
        moneyAvailable,
        "/",
        maxMoneyAvailable
    );
}
