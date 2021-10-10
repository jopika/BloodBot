import { SlashCommandBuilder } from '@discordjs/builders';
import { CategoryChannel, CommandInteraction } from 'discord.js';
import { verifyOperator } from '../utils/InteractionManager';

// todo: move this into general config
const CATEGORY_NAME_DEFAULT = 'night-text-channels';
const CATEGORY_NAME_OPTION = 'categoryname';

// To set up: set the member intent, ensure you can download member list

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletechannels')
        .setDescription('Remove ephemeral night channels for current game (when game is over)')
        .addStringOption(option => option.setName(CATEGORY_NAME_OPTION)
            .setDescription(`Name of generated category (default: ${CATEGORY_NAME_DEFAULT})`)
            .setRequired(false),
        ),
    async execute(interaction: CommandInteraction) {
        if (!verifyOperator(interaction)) return;

        if (interaction.inGuild()) {
            // get the current guild
            const guild = interaction.guild;
            if (guild === undefined || guild === null) {
                return await interaction.reply('Must execute this command in a Guild!');
            }

            const categoryName = interaction.options.getString(CATEGORY_NAME_OPTION) || CATEGORY_NAME_DEFAULT;

            await guild.channels.fetch();
            const channels = guild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY').filter(c => c.name.toLowerCase() == categoryName);
            console.log(channels);
            if (!channels) {
                return await interaction.reply({
                    content: `No such channels under ${CATEGORY_NAME_DEFAULT}`,
                    ephemeral: true,
                });
            }

            // TODO - might just want to find first
            channels.each(chan => {
                if (chan.type === 'GUILD_CATEGORY') {
                    const categoryChannel: CategoryChannel = chan as CategoryChannel;
                    console.log(categoryChannel.children);
                    categoryChannel.children.each(async (child) => {
                        await new Promise<void>((resolve) => {
                            setTimeout(() => {
                                resolve();
                            }, 300);
                        });
                        child.delete();
                    });
                    categoryChannel.delete();
                }
            });

            return await interaction.reply({
                content: `Deleted channels under ${categoryName}`,
                ephemeral: true,
            });
        } else {
            return await interaction.reply('Must execute this command in a Guild!');
        }
    },
};
