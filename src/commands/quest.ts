const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require(`discord.js`)
const { loadQuests, saveQuests, loadPlayers, savePlayers, loadConfig, saveConfig } = require(`../game/gameData.js`)
const Quest = require(`../game/quest.js`)
const TurnInMessage = require("../game/turnInMessage.js")
const { permissionCheck } = require("../utils/util-functions.js")

function acceptQuest(logger, interaction, quests) {
    const name = interaction.options.getString(`name`)
    const players = loadPlayers(interaction.guildId, logger)

    if(!quests[name]) {
        logger.log(`No quest named ${name} exists`)
        return interaction.reply({content: `There's no quest named ${name}!`, ephemeral: true})
    }

    if(!players[interaction.user.id]) {
        logger.log(`${interaction.user.tag} does not have a profile`)
        return interaction.reply({content: `You do not have a Totally Epic Quests profile, ${interaction.member.displayName}!`, ephemeral: true})
    }

    if(quests[name].completedBy.includes(interaction.user.id)) {
        logger.log(`${interaction.user.tag} has already completed quest "${name}"`)
        return interaction.reply({content: `You have already completed ${name}!`, ephemeral: true})
    }

    if(quests[quests[name].prerequisite]) {
        if(!quests[quests[name].prerequisite].completedBy.includes(interaction.user.id)) {
            logger.log(`${interaction.user.tag} has not completed the prerequisite quest ${quests[name].prerequisite}`)
            return interaction.reply({content: `You must complete ${quests[name].prerequisite} before accepting this quest!`, ephemeral: true})
        }
    }

    if(players[interaction.user.id].currentQuest) {
        logger.log(`${interaction.user.tag} has already accepted a quest`)
        return interaction.reply({content: `You have already accepted a quest!`, ephemeral: true})
    }

    players[interaction.user.id].currentQuest = name
    savePlayers(interaction.guildId, players, logger)
    
    logger.log(`${interaction.user.tag} has accepted quest "${name}"`)
    interaction.reply({content: `${name} quest accepted!`, ephemeral: true})
}

function cancelQuest(logger, interaction) {
    const players = loadPlayers(interaction.guildId, logger)

            if(!players[interaction.user.id]) {
                logger.log(`${interaction.user.tag} does not have a profile`)
                return interaction.reply({content: `You do not have a Totally Epic Quests profile, ${interaction.member.displayName}!`, ephemeral: true})
            }
            
            if(!players[interaction.user.id].currentQuest) {
                logger.log(`${interaction.user.tag} does not have a current quest`)
                return interaction.reply({content: `You don't have a quest to cancel!`, ephemeral: true})
            }

            logger.log(`Cancelling ${interaction.user.tag}'s current quest`)
            const oldQuestName = players[interaction.user.id].currentQuest
            players[interaction.user.id].currentQuest = ""
            savePlayers(interaction.guildId, players, logger)

            interaction.reply({content: `${oldQuestName} quest cancelled!`, ephemeral: true})
}

function createQuest(logger, interaction, quests) {
    const name = interaction.options.getString(`name`)
    const description = interaction.options.getString(`description`)
    const reward = interaction.options.getNumber(`reward`)
    const prerequisiteName = interaction.options.getString(`prerequisite`)
    
    if(prerequisiteName) {
        if(!quests[prerequisiteName]) {
            logger.log(`The quest "${prerequisiteName}" does not exist, so it cannot be a prerequisite`)
            return interaction.reply({content: `There is no quest called "${prerequisiteName}", so it cannot be a prerequisite!`, ephemeral: true})
        }
    }
    
    let prerequisite = prerequisiteName
    if(prerequisiteName) {
        prerequisite = prerequisiteName
    }
    
    if(quests[name]) {
        logger.log(`A quest named ${name} already exists`)
        return interaction.reply({content: `That quest already exists!`, ephemeral: true})
    }

    quests[name] = new Quest(description, reward, prerequisite)
    logger.log(`Added new quest "${name}": ${JSON.stringify(quests[name])}`)

    saveQuests(interaction.guildId, quests, logger)

    interaction.reply({content: `${name} quest created!`, ephemeral: true})
}

function deleteQuest(logger, interaction, quests) {
    let name = interaction.options.getString(`name`)

    if(!quests[name]) {
        logger.log(`No quest named ${name} exists`)
        return interaction.reply({content: `There's no quest named ${name}!`, ephemeral: true})
    }

    delete quests[name]
    saveQuests(interaction.guildId, quests, logger)

    logger.log(`Deleted the "${name}" quest`)

    interaction.reply({content: `Quest deleted!`, ephemeral: true})
}

function editQuest(logger, interaction, quests) {
    const name = interaction.options.getString(`name`)
    const newName = interaction.options.getString(`new-name`)
    const description = interaction.options.getString(`description`)
    const reward = interaction.options.getNumber(`reward`)
    const prerequisiteName = interaction.options.getString(`prerequisite`)

    if(!quests[name]) {
        logger.log(`No quest named ${name} exists`)
        return interaction.reply({content: `There's no quest named ${name}!`, ephemeral: true})
    }

    let newDescription = quests[name].description
    if(description) {
        newDescription = description
    }

    let newReward = quests[name].reward
    if(reward) {
        newReward = reward
    }

    let newPrerequisite = quests[name].prerequisite
    if(prerequisiteName) {
        if(!quests[prerequisiteName]) {
            logger.log(`The quest ${prerequisiteName} does not exist, so it cannot be a prerequisite`)
            return interaction.reply({content: `There is no quest called ${prerequisiteName}, so it cannot be a prerequisite!`, ephemeral: true})
        }
        
        newPrerequisite = prerequisiteName
    }

    const newCompletedBy = quests[name].completedBy

    if(newName) {
        quests[newName] = new Quest(newDescription, newReward, newPrerequisite)
        quests[newName].completedBy = newCompletedBy
        delete quests[name]
        
        logger.log(`The ${name} quest is now ${newName}: ${JSON.stringify(quests[newName])}`)
    } else {
        quests[name] = new Quest(newDescription, newReward, newPrerequisite)
        quests[name].completedBy = newCompletedBy
        
        logger.log(`The "${name}" quest is now: ${JSON.stringify(quests[name])}`)
    }

    saveQuests(interaction.guildId, quests, logger)

    interaction.reply({content: `${name} quest edited!`, ephemeral: true})
}

function listQuests(interaction, quests) {
    let buildQuestList = function() {
        let valueOutput = ``
        for(const name in quests) {
            valueOutput += `\n${name}`
            if(quests[name].completedBy.includes(interaction.user.id)) {
                valueOutput += ` ✅`
            }
        }
        
        if(valueOutput) {
            return valueOutput
        } else {
            return `This server has no quests!`
        }
    }
    
    const output = new EmbedBuilder()
        .setTitle(`Quests in ${interaction.guild.name}`)
        .setColor(0xbe2ed6)
        .addFields({name: `Page 1 of 1`, value: buildQuestList()})

    interaction.reply({embeds: [output], ephemeral: true})
}

function turnInQuest(logger, interaction) {
    const players = loadPlayers(interaction.guildId, logger)

    if(!players[interaction.user.id]) {
        logger.log(`${interaction.user.tag} does not have a profile`)
        return interaction.reply({content: `You do not have a Totally Epic Quests profile, ${interaction.member.displayName}!`, ephemeral: true})
    }
    
    if(!players[interaction.user.id].currentQuest) {
        logger.log(`${interaction.user.tag} does not have a current quest`)
        return interaction.reply({content: `You don't have a quest to turn in!`, ephemeral: true})
    }

    const config = loadConfig(interaction.guildId, logger)

    for(const message in config.turnInMessages) {
        if(config.turnInMessages[message].playerId === interaction.user.id) {
            logger.log(`${interaction.user.tag} has already turned in a quest`)
            return interaction.reply({content: `You've already turned in a quest for approval!`, ephemeral: true})
        }
    }

    logger.log(`Turning in quest ${players[interaction.user.id].currentQuest}`)

    interaction.guild.channels.fetch(config.modChannel)
        .then(channel => {
            logger.log(`Sending approval request to the server's mod channel`)

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`approve`)
                        .setLabel(`Approve`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`deny`)
                        .setLabel(`Deny`)
                        .setStyle(ButtonStyle.Danger)
                )
            
            channel.send({content: `${interaction.member.displayName} wants to turn in the ${players[interaction.user.id].currentQuest} quest!`, components: [buttons]})
                .then(message => {
                    logger.log(`Registering the approval request message in the config file`)

                    config.turnInMessages[message.id] = new TurnInMessage(interaction.user.id, players[interaction.user.id].currentQuest)
                    saveConfig(interaction.guildId, config, logger)
                })
        })

    interaction.reply({content: `Turning in your ${players[interaction.user.id].currentQuest} quest!  A moderator must approve it before you can claim your reward.`, ephemeral: true})
}

function viewQuest(logger, interaction, quests) {
    let name = interaction.options.getString(`name`)
            
    if(!quests[name]) {
        logger.log(`No quest named ${name} exists`)
        return interaction.reply({content: `There's no quest named ${name}!`, ephemeral: true})
    }

    logger.log(`Viewing quest "${name}"`)

    const output = new EmbedBuilder()
        .setTitle(quests[name].completedBy.includes(interaction.user.id) ? `${name} ✅` : name)
        .setColor(0xbe2ed6)
        .setDescription(quests[name].description)
        .addFields(
            {name: `Reward`, value: quests[name].reward.toString()},
            {name: `Prerequisite`, value: quests[name].prerequisite ? quests[name].prerequisite : `None`}
        )

    interaction.reply({embeds: [output], ephemeral: true})
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`quest`)
        .setDescription(`View, accept, turn in, create, edit, or delete quests.`)
        .addSubcommand(subcommand => subcommand
            .setName(`create`)
            .setDescription(`Create a new quest.`)
            .addStringOption(option => option
                .setName(`name`)
                .setDescription(`The name of the quest`)
                .setRequired(true))
            .addStringOption(option => option
                .setName(`description`)
                .setDescription(`A short description for the quest`)
                .setRequired(true))
            .addNumberOption(option => option
                .setName(`reward`)
                .setDescription(`How much experience a member recieves upon completing the quest`)
                .setRequired(true))
            .addStringOption(option => option
                .setName(`prerequisite`)
                .setDescription(`The quest to be completed before accepting this quest`)))
        .addSubcommand(subcommand => subcommand
            .setName(`delete`)
            .setDescription(`Delete an existing quest.`)
            .addStringOption(option => option
                .setName(`name`)
                .setDescription(`The name of the quest to delete`)
                .setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName(`list`)
            .setDescription(`View a list of all available quests.`))
        .addSubcommand(subcommand => subcommand
            .setName(`edit`)
            .setDescription(`Edit an existing quest.`)
            .addStringOption(option => option
                .setName(`name`)
                .setDescription(`The name of the quest`)
                .setRequired(true))
            .addStringOption(option => option
                .setName(`new-name`)
                .setDescription(`The new name of the quest`))
            .addStringOption(option => option
                .setName(`description`)
                .setDescription(`A short description for the quest`))
            .addNumberOption(option => option
                .setName(`reward`)
                .setDescription(`How much experience a member recieves upon completing the quest`))
            .addStringOption(option => option
                .setName(`prerequisite`)
                .setDescription(`The quest to be completed before accepting this quest`)))
        .addSubcommand(subcommand => subcommand
            .setName(`view`)
            .setDescription(`View more info on a specific quest`)
            .addStringOption(option => option
                .setName(`name`)
                .setDescription(`The name of the quest to view`)
                .setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName(`accept`)
            .setDescription(`Accept a quest!`)
            .addStringOption(option => option
                .setName(`name`)
                .setDescription(`The name of the quest you wish to accept`)
                .setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName(`turn-in`)
            .setDescription(`Turn in your current quest and claim the reward (requires moderator approval).`))
        .addSubcommand(subcommand => subcommand
            .setName(`cancel`)
            .setDescription(`Stop attempting your current quest.`)),
    async execute(logger, interaction) {
        logger.newline()
        logger.log(`${interaction.user.tag} used /quest`)

        const quests = loadQuests(interaction.guildId, logger)

        if(interaction.options.getSubcommand() === `create`) {
            logger.log(`Subcommand: create`)

            permissionCheck(logger, interaction, PermissionFlagsBits.ManageGuild, () => createQuest(logger, interaction, quests))
            return
        }
        if(interaction.options.getSubcommand() === `delete`) {
            logger.log(`Subcommand: delete`)

            permissionCheck(logger, interaction, PermissionFlagsBits.ManageGuild, () => deleteQuest(logger, interaction, quests))
        }
        if(interaction.options.getSubcommand() === `list`) {
            logger.log(`Subcommand: list`)

            listQuests(interaction, quests)
        }
        if(interaction.options.getSubcommand() === `edit`) {
            logger.log(`Subcommand: edit`)

            permissionCheck(logger, interaction, PermissionFlagsBits.ManageGuild, () => editQuest(logger, interaction, quests))
        }
        if(interaction.options.getSubcommand() === `view`) {
            logger.log(`Subcommand: view`)
            
            viewQuest(logger, interaction, quests)
        }
        if(interaction.options.getSubcommand() === `accept`) {
            logger.log(`Subcommand: accept`)

            acceptQuest(logger, interaction, quests)
        }
        if(interaction.options.getSubcommand() === `turn-in`) {
            logger.log(`Subcommand: turn-in`)

            turnInQuest(logger, interaction)
        }
        if(interaction.options.getSubcommand() === `cancel`) {
            logger.log(`Subcommand: cancel`)

            cancelQuest(logger, interaction)
        }
    }
}