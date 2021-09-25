import { REST } from '@discordjs/rest';
import { ICommand } from './types/CommandTypes';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';

/**
 * Reads and processes the commands from a directory
 * @param commandDirectory directory to read command definitions from
 */
export function readCommands(commandDirectory: string): Map<string, ICommand> {
    const commandFiles = fs.readdirSync(`./build/${commandDirectory}`).filter(file => file.endsWith('.js'));
    const constructedCommands: Map<string, ICommand> = new Map();

    for (const file of commandFiles) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command = require(`${commandDirectory}/${file}`);

        constructedCommands.set(command.data.name, command);
    }

    return constructedCommands;
}

/**
 * Pushes slash commands
 * @param token secret to use for authentication
 * @param clientId clientId to assume
 * @param guildIds guildIds to publish commands to
 * @param commandMapping commands to publish
 */
export async function populateGuildCommands(token: string, clientId: string, guildIds: string[], commandMapping: Map<string, ICommand>): Promise<void> {
    const rest = new REST({ version: '9' }).setToken(token);

    try {
        console.log(`Started refreshing application (/) commands with clientId: ${clientId}, guildIds: [${guildIds.toString()}] for ${commandMapping.size} commands`);

        const commandList: unknown[] = [];

        commandMapping.forEach(command => {
            commandList.push(command.data.toJSON());
        });

        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commandList },
            );
        }

        console.log('Completed refreshing application (/) commands.');
    } catch (err: unknown) {
        console.error(err);
    }
}
