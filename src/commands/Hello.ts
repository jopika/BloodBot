import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('replies with a hello! try it!')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('name to greet')
                .setRequired(true)),
    async execute(interaction: CommandInteraction) {
        await interaction.reply(`Hello ${interaction.options.getString('input')}!`);
    },
};
