import { SlashCommandBuilder } from '@discordjs/builders';
import { CategoryChannel, CommandInteraction, GuildMember, VoiceChannel } from 'discord.js';
import { getAuthorVoiceChannel, verifyOperator } from '../utils/InteractionManager';


const COMMAND_NAME = 'goodnight';
const COMMAND_DESCRIPTION = 'Moves everyone to the night voice cabins';

const CATEGORY_NAME_OPTION = 'category_name';
const DEFAULT_CATEGORY_NAME = 'night-cottages';

const STORYTELLER_ROLE_OPTION = 'storyteller_role';
const DEFAULT_STORYTELLER_ROLE = 'Storyteller';

module.exports = {
    data: new SlashCommandBuilder()
        .setName(COMMAND_NAME)
        .setDescription(COMMAND_DESCRIPTION)
        .addStringOption(option => option.setName(CATEGORY_NAME_OPTION)
            .setDescription(`Category name to move people to. Default: ${DEFAULT_CATEGORY_NAME}`))
        .addStringOption((option) => option.setName(STORYTELLER_ROLE_OPTION)
            .setDescription(`Storyteller role to manage. Default: ${DEFAULT_STORYTELLER_ROLE}`)),
    execute: async function(interaction: CommandInteraction) {
        if (!verifyOperator(interaction)) return;

        if (interaction.inGuild()) {
            // get the current guild
            const guild = interaction.guild;
            if (guild === undefined || guild === null) {
                return await interaction.reply({
                    content: 'Must execute this command in a Guild!',
                    ephemeral: true,
                });
            }

            const { errorMessage, voiceChannel } = getAuthorVoiceChannel(interaction);
            if (voiceChannel === null) {
                return await interaction.reply({
                    content: errorMessage,
                    ephemeral: true,
                });
            }

            // retrieve all players in the current channel
            const membersToMove = voiceChannel.members;

            // TODO: Separate out storytellers and place them into the same channel

            // ForEach member, assign to a unique channel
            const channelManager = guild.channels;
            const targetChannelCategoryName: string = interaction.options.getString(CATEGORY_NAME_OPTION) || DEFAULT_CATEGORY_NAME;
            const fetchedChannels = (await channelManager.fetch()).filter(c => c.name.toLowerCase() == targetChannelCategoryName.toLowerCase());

            if (fetchedChannels.size !== 1) {
                return await interaction.reply({
                    content: `Unable to resolve category: ${targetChannelCategoryName} as it has more than 1 result; count: ${fetchedChannels.size}`,
                    ephemeral: true,
                });
            }

            const fetchedChannel = fetchedChannels.first();

            if (fetchedChannel === null || fetchedChannel == undefined) {
                return await interaction.reply({
                    content: 'Unable to find target channel category',
                    ephemeral: true,
                });
            }

            if (fetchedChannel.type !== 'GUILD_CATEGORY') {
                return await interaction.reply({
                    content: `Target channel category should be of type 'GUILD_CATEGORY', actual: ${fetchedChannel.type}`,
                    ephemeral: true,
                });
            }

            const targetChannelCategory: CategoryChannel = (fetchedChannel as CategoryChannel);

            // Check if there are enough channels to put each member into a unique channel
            const targetVoiceChannels = targetChannelCategory.children.filter((channel) => channel.type === 'GUILD_VOICE');
            const targetCategoryVoiceChannelCount: number = targetVoiceChannels.size;
            if (targetCategoryVoiceChannelCount < membersToMove.size) {
                return await interaction.reply({
                    content: `Target category requires at least ${membersToMove.size} voice channels, category only has ${targetCategoryVoiceChannelCount}`,
                    ephemeral: true,
                });
            }

            const flattenedVoiceChannels: VoiceChannel[] = targetVoiceChannels.map((channel) => channel as VoiceChannel);
            const flattenedMembers = membersToMove.map(member => member);
            const calculatedMap: Map<VoiceChannel, GuildMember> = new Map();
            for (let i = 0; i < membersToMove.size; i += 1) {
                calculatedMap.set(flattenedVoiceChannels[i], flattenedMembers[i]);
            }

            const movePromise: Promise<GuildMember>[] = [];

            calculatedMap.forEach((member, channel) => {
                movePromise.push(member.voice.setChannel(channel));
            });

            await Promise.all(movePromise);

            return await interaction.reply({
                content: `Completed move! Moved ${calculatedMap.size} users`,
                ephemeral: true,
            });
        } else {
            return await interaction.reply({
                content: 'You should run this command in a guild!',
                ephemeral: true,
            });
        }
    },
};
