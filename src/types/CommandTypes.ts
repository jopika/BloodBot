import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

type CommandExecution = (interaction: CommandInteraction) => Promise<null>;

export interface ICommand {
    data: SlashCommandBuilder,
    execute: CommandExecution,
}
