const { SlashCommandBuilder, PermissionFlagsBits } = require(`discord.js`)
const { savePlayers, saveQuests, saveConfig } = require(`../game/gameData.js`)
const { GuildConfig } = require(`../game/guildConfig.js`)

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`init`)
        .setDescription(`Initialize the bot in this server.  Requires Manage Server permission.`)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(logger, interaction) {
        logger.newline()
        logger.log(`${interaction.user.tag} used /init`)
        
        try {
            savePlayers(interaction.guildId, {}, logger)
            saveQuests(interaction.guildId, {}, logger)
            saveConfig(interaction.guildId, new GuildConfig(), logger)
        } catch(err) {
            console.error(err)
            return interaction.reply(`Failed to initialize Totally Epic Quests!`)
        }
        
        logger.log(`Initialized Totally Epic Quests in ${interaction.guild.name} (id: ${interaction.guildId})`)
        interaction.reply(`Totally Epic Quests has been initialized in this server!`)
    }
}