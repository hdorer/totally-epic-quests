const { Client, Collection, GatewayIntentBits } = require(`discord.js`)
const { token } = require(`./config.json`)
const fs = require(`fs`)
const path = require(`path`)
const { dirname } = require("path")
const Logger = require(`./utils/logger.js`)

const client = new Client({intents: [GatewayIntentBits.Guilds]})
const logger = new Logger(path.join(__dirname, `logs`, `log.txt`))

const eventsPath = path.join(__dirname, `events`)
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(`.js`))

for(const file of eventFiles) {
    const filePath = path.join(eventsPath, file)
    const event = require(filePath)

    if(event.once) {
        client.once(event.name, (...args) => event.execute(logger, ...args))
    } else {
        client.on(event.name, (...args) => event.execute(logger, ...args))
    }
}

client.commands = new Collection()
const commandsPath = path.join(__dirname, `commands`)
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(`.js`))

for(const file of commandFiles) {
    const filePath = path.join(commandsPath, file)
    const command = require(filePath)

    client.commands.set(command.data.name, command)
}

logger.log(`Logger initialized`)

client.login(token)

module.exports = logger