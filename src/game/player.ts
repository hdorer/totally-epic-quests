const { convertObject } = require("../utils/util-functions")

class Player {
    /** @type {number} */
    level = 1
    /** @type {number} */
    experience = 0
    /** @type {number} */
    expToNextLevel = 100
    /** @type {string} */
    currentQuest = ""
}

/**
 * @param {Object} players
 * @returns {Object}
 */
 function convertPlayers(players) {
    let newPlayers = {}
    for(const id in players) {
        newPlayers[id] = new Player()
        convertObject(players, newPlayers)
    }

    return newPlayers
}

/**
 * @param {Player} player 
 */
function levelUp(player) { // This should be a member of of the Player class, but the players aren't loaded as Players and I can't get prototypes to work.  Fuck Javascript
    player.level++
    player.expToNextLevel = 100 * Math.pow(player.level, 2)
}

module.exports = { Player, levelUp, convertPlayers }