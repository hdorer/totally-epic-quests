const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require(`discord.js`)
const { loadConfig, saveConfig } = require(`../game/gameData.js`)
const { RankRole } = require(`../game/rankRole.js`)

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`config`)
        .setDescription(`Edit the settings of the bot for this server.`)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommandGroup(subcommandGroup => subcommandGroup
            .setName(`rank-role`)
            .setDescription(`Configurate roles given to members based on their rank.  Requires Manage Server permissions.`)
            .addSubcommand(subcommand => subcommand
                .setName(`add`)
                .setDescription(`Add a role to the list.  Roles must be added in order from lowest rank to highest rank.`)
                .addRoleOption(option => option
                    .setName(`role`)
                    .setDescription(`The role to add to the list`)
                    .setRequired(true))
                .addNumberOption(option => option
                    .setName(`level`)
                    .setDescription(`What level a member must reach before getting this role`)
                    .setRequired(true)))
            .addSubcommand(subcommand => subcommand
                .setName(`remove`)
                .setDescription(`Remove a role from the list.`)
                .addRoleOption(option => option
                    .setName(`role`)
                    .setDescription(`The role to remove from the list`)
                    .setRequired(true)))
            .addSubcommand(subcommand => subcommand
                .setName(`view`)
                .setDescription(`View the list of rank roles`)))
        .addSubcommand(subcommand => subcommand
            .setName(`set-message-channel`)
            .setDescription(`Set the channel the bot will send standalone messages to.`)
            .addChannelOption(option => option
                .setName(`channel`)
                .setDescription(`The channel to send standalone messages to`)
                .setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName(`set-mod-channel`)
            .setDescription(`Set the channel the bot will send message meant for moderators to.`)
            .addChannelOption(option => option
                .setName(`channel`)
                .setDescription(`The channel to send messages for moderators to`)
                .setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName(`view`)
            .setDescription(`Show the config settings for this server.`)),
    async execute(logger, interaction) {
        logger.newline()
        logger.log(`${interaction.user.tag} used /config`)

        let config = loadConfig(interaction.guildId, logger)

        if(interaction.options.getSubcommandGroup() === `rank-role`) {
            logger.log(`Subcommand group: rank-role`)

            if(interaction.options.getSubcommand() === `add`) {
                logger.log(`Subcommand: add`)

                const role = interaction.options.getRole(`role`)
                const attainedAtLevel = interaction.options.getNumber(`level`)

                const rankRole = new RankRole(role.id, attainedAtLevel)

                config.rankRoles.push(rankRole)
                saveConfig(interaction.guildId, config, logger)
                
                logger.log(`Added RankRole ${JSON.stringify(rankRole)} to the RankRole list`)
                interaction.reply({content: `Added the ${role.name} role as a rank role!`, ephemeral: true})
            }
            if(interaction.options.getSubcommand() === `remove`) {
                logger.log(`Subcommand: remove`)

                const role = interaction.options.getRole(`role`)
                
                const rankRole = config.rankRoles.find(rankRole => rankRole.id === role.id)
                
                if(!rankRole) {
                    return interaction.reply({content: `The ${role.name} role is not in the list of rank roles!`, ephemeral: true})
                }
                
                const index = config.rankRoles.indexOf(rankRole)
                config.rankRoles.splice(index, 1)
                saveConfig(interaction.guildId, config, logger)

                logger.log(`Removed RankRole ${JSON.stringify(rankRole)} from the RankRole list`)
                interaction.reply({content: `Removed the ${role.name} role from the list of rank roles!`, ephemeral: true})
            }
            if(interaction.options.getSubcommand() === `view`) {
                logger.log(`Subcommand: view`)

                if(config.rankRoles.length <= 0) {
                    return interaction.reply({content: `You have not set up any rank roles for this server!`, ephemeral: true})
                }
                
                let buildOutput = () => {
                    // eslint-disable-next-line no-unused-vars
                    return new Promise((resolve, reject) => {
                        let output = `The rank roles for this server are:\n`

                        let rolesProcessed = 0
                        config.rankRoles.forEach(rankRole => {
                            interaction.guild.roles.fetch(rankRole.id)
                                .then(role => {
                                    output += `\n${role.name}, attained at level ${rankRole.attainedAtLevel}`
                                    rolesProcessed++

                                    if(rolesProcessed === config.rankRoles.length) {
                                        resolve(output)
                                    }
                                })
                        })
                    })
                }

                buildOutput().then(output => interaction.reply({content: output, ephemeral: true}))
            }
        }
        if(interaction.options.getSubcommand() === `set-message-channel`) {
            logger.log(`Subcommand: set-message-channel`)

            let channel = interaction.options.getChannel(`channel`)
            
            config.messageChannel = channel.id
            saveConfig(interaction.guildId, config, logger)

            logger.log(`Message channel set to #${channel.name} (id: ${channel.id})`)
            interaction.reply({content: `Set message channel to <#${channel.id}>!`, ephemeral: true})
        }
        if(interaction.options.getSubcommand() === `set-mod-channel`) {
            logger.log(`Subcommand: set-mod-channel`)

            let channel = interaction.options.getChannel(`channel`)
            
            config.modChannel = channel.id
            saveConfig(interaction.guildId, config, logger)

            logger.log(`Mod channel set to #${channel.name} (id: ${channel.id})`)
            interaction.reply({content: `Set mod channel to <#${channel.id}>!`, ephemeral: true})
        }
        if(interaction.options.getSubcommand() === `view`) {
            if(interaction.options.getSubcommandGroup() === `rank-role`) {
                return
            }

            logger.log(`Subcommand: view`)
            
            const output = new EmbedBuilder()
                .setTitle(`${interaction.guild.name} Config`)
                .setColor(0x39e75f)
                .addFields(
                    {name: `Message Channel`, value: config.messageChannel ? `<#${config.messageChannel}>` : `None`},
                    {name: `Mod Channel`, value: config.modChannel ? `<#${config.modChannel}>` : `None`}
                )
            
            logger.log(`Displaying this server's config`)
            interaction.reply({embeds: [output], ephemeral: true})
        }
    }
}