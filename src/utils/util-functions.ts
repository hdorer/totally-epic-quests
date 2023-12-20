/**
 * @param {Object} source 
 * @param {Object} target 
 */
function convertObject(source, target) {
    for(const key in Object.keys(source)) {
        if(key in target) {
            target[key] = source[key]
        }
    }
}

function permissionCheck(logger, interaction, permission, onPass, onFail = null) {
    if(interaction.memberPermissions.has(permission)) {
        onPass()
    } else {
        if(!onFail) {
            logger.log(`${interaction.user.tag} does not have permission to do this`)
            interaction.reply("You do not have permission to do this!")
        } else {
            onFail()
        }
    }
}

module.exports = { convertObject, permissionCheck }