const { loadConfig, saveConfig } = require(`../game/gameData.js`);
const { PermissionFlagsBits } = require(`discord.js`);
const { permissionCheck } = require("../utils/util-functions.js");

module.exports = {
    name: `deny`,
    async execute(logger, interaction) {
        logger.newline();
        logger.log(`${interaction.user.tag} pressed a "deny" button on message ${interaction.message.id}`);

        permissionCheck(logger, interaction, PermissionFlagsBits.ManageGuild, () => {
            const config = loadConfig(interaction.guildId, logger);
            const turnInMessage = config.turnInMessages[interaction.message.id];

            if(!turnInMessage) {
                logger.log(`There was no turn in message data associated with this message`);
                return interaction.update({content: `This message did not have any associated turn-in request data!  How strange...`, embeds: [], components: []});
            }

            delete config.turnInMessages[interaction.message.id];

            logger.log(`Successfully denied the turn-in request`);

            saveConfig(interaction.guildId, config, logger);

            const embed = interaction.message.embeds[0]; // since there is only one embed on the message
            const actionTakenField = embed.fields.find(field => field.name === `Action taken`);

            if(actionTakenField) {
                actionTakenField.value = `Denied by ${interaction.user}`;
            }
            
            interaction.update({embeds: [embed], components: []});

            interaction.guild.channels.fetch(config.messageChannel)
                .then(channel => interaction.client.users.fetch(turnInMessage.playerId)
                    .then(user => {
                        channel.send(`${user}, it seems that you haven't completed ${turnInMessage.questName} yet.  Keep trying!`);
                    }));
        })

        
    }
}