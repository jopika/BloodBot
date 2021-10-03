// import "reflect-metadata";
import { Client, Intents } from 'discord.js';
import { ICommand } from './types/CommandTypes';
import { populateGuildCommands, readCommands } from './CommandManager';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { token, clientId, guildIds } = require('../config.json');

function start(): void {

    const client: Client = new Client({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Intents.FLAGS.GUILD_VOICE_STATES,
            Intents.FLAGS.GUILD_MEMBERS,
        ],
    });

    const commandMap: Map<string, ICommand> = readCommands('./commands');

    (async () => {
        await populateGuildCommands(token, clientId, guildIds, commandMap);
    })();

    client.once('ready', () => {
        console.log('Ready!');
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        const commandName: string = interaction.commandName;
        const command: ICommand | undefined = commandMap.get(commandName);

        if (command === undefined) {
            await interaction.reply('Unable to parse command, try again with a valid command');
        } else {
            await command.execute(interaction);
        }
    });

    client.login(token);
}

start();
