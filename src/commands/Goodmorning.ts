import { SlashCommandBuilder } from '@discordjs/builders';
import { CategoryChannel, Collection, CommandInteraction, GuildMember, VoiceChannel } from 'discord.js';
import { verifyOperator } from '../utils/InteractionManager';

const DESTINATION_CHANNEL_NAME_OPTION = 'dest_channel_name';
const DEFAULT_DESTINATION_CHANNEL_NAME = 'town square';

const SOURCE_CATEGORY_NAME_OPTION = 'orig_category_name';
const DEFAULT_SOURCE_CATEGORY_NAME = 'night-cottages';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('goodmorning')
        .setDescription('Moves everyone back from night cottages to town square')
        .addStringOption(option => option.setName(DESTINATION_CHANNEL_NAME_OPTION)
            .setDescription(`Channel name to move people to. Default: ${DEFAULT_DESTINATION_CHANNEL_NAME}`))
        .addStringOption(option => option.setName(SOURCE_CATEGORY_NAME_OPTION)
            .setDescription(`Category name to move people from. Default: ${DEFAULT_SOURCE_CATEGORY_NAME}`)),
    execute: async function(interaction: CommandInteraction) {
        if (!verifyOperator(interaction)) return;

        const destinationChannelName = interaction.options.getString(DESTINATION_CHANNEL_NAME_OPTION) || DEFAULT_DESTINATION_CHANNEL_NAME;
        const sourceCategoryName = interaction.options.getString(SOURCE_CATEGORY_NAME_OPTION) || DEFAULT_SOURCE_CATEGORY_NAME;

        const guild = interaction.guild;
        if (guild === undefined || guild === null) {
            return await interaction.reply({
                content: 'Must execute this command in a Guild!',
                ephemeral: true,
            });
        }

        const channelManager = guild.channels;
        const channelCollection = await channelManager.fetch();
        const destinationChannels = channelCollection.filter(c => c.name.toLowerCase() === destinationChannelName.toLowerCase());
        const sourceCategories = channelCollection.filter(c => c.name.toLowerCase() === sourceCategoryName.toLowerCase());

        if (destinationChannels.size !== 1) {
            return await interaction.reply({
                content: `Unable to resolve destination channel as ${destinationChannelName} has more than 1 result. Count: ${destinationChannels.size}`,
                ephemeral: true,
            });
        }

        if (sourceCategories.size !== 1) {
            return await interaction.reply({
                content: `Unable to resolve destination channel as ${sourceCategoryName} has more than 1 result. Count: ${sourceCategories.size}`,
                ephemeral: true,
            });
        }

        const unresolvedDestinationChannel = destinationChannels.first();
        const unresolvedSourceCategory = sourceCategories.first();

        // Verify that the destination and the source are of the right type
        if (unresolvedDestinationChannel?.type !== 'GUILD_VOICE') {
            return await interaction.reply({
                content: `Target channel category should be of type 'GUILD_VOICE', actual: ${unresolvedDestinationChannel?.type}`,
                ephemeral: true,
            });
        }

        if (unresolvedSourceCategory?.type !== 'GUILD_CATEGORY') {
            return await interaction.reply({
                content: `Target channel category should be of type 'GUILD_CATEGORY', actual: ${unresolvedSourceCategory?.type}`,
                ephemeral: true,
            });
        }

        const destinationChannel = (unresolvedDestinationChannel as VoiceChannel);
        const sourceCategory = (unresolvedSourceCategory as CategoryChannel);

        const membersToMove = sourceCategory.children.flatMap((channel) => {
            if (channel.isVoice()) {
                return channel.members;
            } else {
                return new Collection<string, GuildMember>();
            }
        });

        interaction.reply({
            content: `Moving people: ${JSON.stringify(membersToMove.map(member => member.displayName))}`,
            ephemeral: true,
        });

        const movePromises: Promise<GuildMember>[] = [];

        membersToMove.forEach((member) => {
            movePromises.push(member.voice.setChannel(destinationChannel));
        });

        await Promise.all(movePromises);

        return await interaction.followUp({
            content: `Completed move! Moved ${membersToMove.size} users`,
            ephemeral: true,
        });
    },
};
