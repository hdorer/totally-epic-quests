const { convertObject } = require("../utils/util-functions")

class GuildConfig {
    /** @type {RankRole[]} */
    rankRoles = []
    /** @type {string} */
    modChannel = ""
    /** @type {string} */
    messageChannel = ""
    /** @type {Object} */
    turnInMessages = {}
}

/**
 * @param {Object} config 
 * @returns {GuildConfig}
 */
function convertConfig(config) {
    let newConfig = new GuildConfig()
    convertObject(config, newConfig)

    return newConfig
}

module.exports = { GuildConfig, convertConfig }