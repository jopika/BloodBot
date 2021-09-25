import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember } from 'discord.js';
import { buildGameState } from '../types/GameState';
import { buildDefaultPlayerState, PlayerState } from '../types/PlayerState';

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
    async execute(interaction: CommandInteraction) {
        if (interaction.inGuild()) {
            // since this interaction is in a guild, grab the member directly
            const commandAuthor = interaction.member as GuildMember;
            if (commandAuthor.voice === null) {
                console.log(`An issue with resolving member: ${commandAuthor.displayName} voiceState`);
                return await interaction.reply({
                    content: 'Discord API returned an error, please try again',
                    ephemeral: true,
                });
            }
            if (commandAuthor.voice.channel === null) {
                console.log(`Member: ${commandAuthor.displayName} is not in a Voice Channel, skipping`);
                return await interaction.reply({
                    content: 'You are not in a Voice Channel, please join a Voice Channel and rerun the command',
                    ephemeral: true,
                });
            }

            const voiceChannel = commandAuthor.voice.channel;
            const forceInclude = interaction.options.getBoolean('forceinclude');

            const players: PlayerState[] = [];

            const members = voiceChannel.members.map(guildMember => guildMember).filter((member) => {
                if (forceInclude) return true;
                return member.id !== commandAuthor.id;
            });

            players.push(...members.map(member => buildDefaultPlayerState(member.displayName)));
            const edition = interaction.options.getString('scriptname') as string;
            return await interaction.reply(`\`\`\`${JSON.stringify(buildGameState(players, edition))}\`\`\``);
        }
 else {
            return await interaction.reply('Must execute this command in a Guild!');
        }
    },
};
