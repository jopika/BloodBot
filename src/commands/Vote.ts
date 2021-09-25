import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Message } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('sets up a vote command with reactions'),
    async execute(interaction: CommandInteraction) {
        const message = await interaction.reply({ content: 'Here we go!', fetchReply: true }) as Message;
        message.react('👍').then(() => message.react('👎'));
    },
};
