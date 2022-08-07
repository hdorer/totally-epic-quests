const { SlashCommandBuilder } = require(`discord.js`)
const path = require(`path`)
const Player = require(`../game/player.js`)
const { loadPlayers, savePlayers } = require("../game/gameData.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`profile`)
        .setDescription(`Create or view your Totally Epic Quests profile.`)
        .addSubcommand(subcommand => subcommand
            .setName(`create`)
            .setDescription(`Create a Totally Epic Quests profile for yourself.`))
        .addSubcommand(subcommand => subcommand
            .setName(`view`)
            .setDescription(`View a Totally Epic Quests profile.`)
            .addUserOption(option => option
                .setName(`member`)
                .setDescription(`The member whose profile you want to view.  Leave blank to view your profile.`))),
    async execute(logger, interaction) {
        logger.log(`${interaction.user.tag} has used /profile`)

        let players = loadPlayers(logger, interaction.guildId)

        if(interaction.options.getSubcommand() === `create`) {
            logger.log(`Subcommand: create`)

            if(players[interaction.user.id]) {
                return interaction.reply(`${interaction.member.displayName}, you have already begun Totally Epic Quests!`)
            }

            let newPlayer = new Player()
            players[interaction.user.id] = newPlayer
            savePlayers(logger, interaction.guildId, players)
            logger.log(`Created new Player ${JSON.stringify(newPlayer)} (${interaction.user.id})`)
            interaction.reply(`${interaction.member.displayName}, your Totally Epic Quests have begun!`)
        }
        if(interaction.options.getSubcommand() === `view`) {
            logger.log(`Subcommand: view`)

            let showProfile = (member, isSelf) => {
                logger.log(`Viewing Player ${JSON.stringify(players[member.user.id])} (${member.user.tag})`)

                if(!players[member.user.id]) {
                    if(isSelf) {
                        return interaction.reply(`You do not have a Totally Epic Quests profile, ${interaction.member.displayName}!`)
                    } else {
                        return interaction.reply(`${member.displayName} does not have a Totally Epic Quests profile!`)
                    }
                }

                let output = ``
                if(isSelf) {
                    output = `Your Totally Epic Quests profile:`
                } else {
                    output = `${member.displayName}'s Totally Epic Quests profile:`
                }
                output += `\nLevel: ${players[member.user.id].level}`
                output += `\nExperience: ${players[member.user.id].experience}/${players[member.user.id].expToNextLevel}`

                interaction.reply(output)
            }
            
            if(!interaction.options.getMember(`member`)) {
                showProfile(interaction.member, true)
            } else {
                showProfile(interaction.options.getMember(`member`), interaction.user.id === interaction.options.getMember(`member`).user.id)
            }
        }
    }
}