module.exports = {
    name: "interactionCreate",
    async execute(logger, interaction) {
        if(interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName)
            
            if(!command) {
                return
            }
        
            await command.execute(logger, interaction)
                .catch(error => {
                    console.error(error)
                    interaction.reply({content: `There was an error executing this command!`, ephemeral: true})
                })
        } else if(interaction.isButton()) {
            const button = interaction.client.buttons.get(interaction.customId)

            if(!button) {
                return
            }

            try {
                await button.execute(logger, interaction)
            } catch(error) {
                console.error(error)
                await interaction.reply({content: `There was an error performing this action!`, ephemeral: true})
            }
        }
    }
}