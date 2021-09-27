import { SlashCommandBuilder } from '@discordjs/builders';
import { CategoryChannel, CommandInteraction, Guild } from 'discord.js';

// todo: move this into general config
const categoryName = 'night-text-channels';

// To set up: set the member intent, ensure you can download member list

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletechannels')
        .setDescription('Remove ephemeral night channels for current game (when game is over)')
        .addStringOption(option => option.setName('categoryname')
            .setDescription('Name of generated category (default: night-text-channels)')
            .setRequired(false),
        ),
    async execute(interaction: CommandInteraction) {
        if (interaction.inGuild()) {
            // get the current guild
            // TODO????
            const guildOrNull = interaction.guild;
            if (guildOrNull === undefined || guildOrNull === null) {
                return await interaction.reply('Must execute this command in a Guild!');
            }

            const categoryNameStr = interaction.options.getString('categoryname') || categoryName;

            const guild: Guild = guildOrNull;

            await guild.channels.fetch();
            const channels = guild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY').filter(c => c.name.toLowerCase() == categoryNameStr);
            console.log(channels);
            if (!channels) {
                return await interaction.reply(`No such channels under ${categoryName}`);
            }

            // console.log(channel.type);
            // TODO - might just want to find first
            channels.each(chan => {
                if (chan.type === 'GUILD_CATEGORY') {
                    const categoryChannel: CategoryChannel = chan as CategoryChannel;
                    console.log(categoryChannel.children);
                    categoryChannel.children.each(child =>
                        child.delete());
                    categoryChannel.delete();
                }
            });

            // let channelId = channel.id;
            // console.log(channelId);
            // console.log(guild.channels.cache.get(channelId).children);

            // console.log(channel);
            // // let deletes = channel.children.map(childChannel => {
            // //     console.log(childChannel);
            // //     return childChannel.delete();
            // // })

            // // Promise.all(deletes);

            // let cat_chan: CategoryChannel = <CategoryChannel>channel;
            // console.log(cat_chan.children);

            // channel.children.each(child =>
            //     child.delete());

            return await interaction.reply(`Deleted channels under ${categoryNameStr}`);
        } else {
            return await interaction.reply('Must execute this command in a Guild!');
        }
    },
};
