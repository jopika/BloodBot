import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember } from 'discord.js';
import { buildGameState } from '../types/GameState';
import { buildDefaultPlayerState, PlayerState } from '../types/PlayerState';
import { getAuthorVoiceChannel } from '../utils/InteractionManager';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generateconfig')
        .setDescription('Generates a JSON config for clocktower.online use')
        .addStringOption(option => option.setName('scriptname')
            .setDescription('Script to use')
            .setRequired(true)
            .addChoice('Trouble Brewing', 'tb')
            .addChoice('Bad Moon Rising', 'bmr')
            .addChoice('Sects and Violets', 'snv'),
        )
        .addBooleanOption(option => option
            .setName('forceinclude')
            .setDescription('Should we forcibly include the user who triggered this command?')
            .setRequired(false)),
    execute: async function(interaction: CommandInteraction) {
        const { errorMessage, voiceChannel } = getAuthorVoiceChannel(interaction);
        if (voiceChannel === null) {
            return await interaction.reply({
                content: errorMessage,
                ephemeral: true,
            });
        }

        const forceInclude = interaction.options.getBoolean('forceinclude');

        const players: PlayerState[] = [];

        const members = voiceChannel.members.map(guildMember => guildMember).filter((member) => {
            if (forceInclude) return true;
            return member.id !== (interaction.member as GuildMember).id;
        });

        players.push(...members.map(member => buildDefaultPlayerState(member.displayName)));
        const edition = interaction.options.getString('scriptname') as string;
        return await interaction.reply({
            content: `\`\`\`${JSON.stringify(buildGameState(players, edition))}\`\`\``,
            ephemeral: true,
        });
    },
};
