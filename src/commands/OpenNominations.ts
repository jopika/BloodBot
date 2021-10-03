import { SlashCommandBuilder } from '@discordjs/builders';
import { CategoryChannel, CommandInteraction, GuildMember, VoiceChannel } from 'discord.js';
import { getAuthorVoiceChannel, verifyOperator } from '../utils/InteractionManager';


const CHANNEL_NAME_OPTION = 'channel_name';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('opennominations')
        .setDescription('Moves everyone back to the invoker\'s voice channel')
        .addStringOption(option => option.setName(CHANNEL_NAME_OPTION)
            .setDescription('Channel name to move people to')),
    execute: async function(interaction: CommandInteraction) {
        if (!verifyOperator(interaction)) return;

        const { errorMessage, voiceChannel } = getAuthorVoiceChannel(interaction);
        if (voiceChannel === null) {
            return await interaction.reply({
                content: errorMessage,
                ephemeral: true,
            });
        }

        const category: CategoryChannel | null = voiceChannel.parent;
        if (category === null) {
            return await interaction.reply({
                content: 'Should perform this action in a category voice channel',
                ephemeral: true,
            });
        }

        // get all voice channels
        const childChannels = category.children;
        let membersToMove: GuildMember[] = [];
        childChannels.forEach(channel => {
            if (channel.isVoice()) {
                if (channel.id !== voiceChannel.id) {
                    console.log(`Found voice channel: ${channel.name}`);
                    membersToMove.push(...channel.members.values());
                }
            }
        });

        console.log(`Members to move: ${JSON.stringify(membersToMove.map(member => member.displayName))}`);

        interaction.reply({
            content: 'Moving people...',
            ephemeral: true,
        });

        while (membersToMove.length !== 0) {
            const movePromise: Promise<GuildMember>[] = [];

            interaction.followUp({
                content: `Remaining people: ${JSON.stringify(membersToMove.map(member => member.displayName))}`,
                ephemeral: true,
            });

            membersToMove.forEach(member => {
                movePromise.push(member.voice.setChannel(voiceChannel));
            });

            await Promise.all(movePromise);
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 200);
            });

            membersToMove = calculateRemainingToMove(voiceChannel, membersToMove);
        }
    },
};

/**
 * Calculates who left to move
 * @param channelToMove
 * @param membersToCalculate
 */
function calculateRemainingToMove(channelToMove: VoiceChannel, membersToCalculate: GuildMember[]): GuildMember[] {
    // TODO: Determine if we need to do a hard-pull for member information
    return membersToCalculate.filter(member => member.voice.channelId !== channelToMove.id);
}
