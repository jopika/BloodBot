import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, OverwriteData } from 'discord.js';

// todo: move this into general config
const DEFAULT_NIGHT_CHANNEL_NAME = 'night-text-channels';
const DEFAULT_CURRENTLY_PLAYING_ROLE_NAME = 'Current Game';
const DEFAULT_STORYTELLER_ROLE_NAME = 'Storyteller';
const CURRENTLY_PLAYING_OPTION = 'currentlyplayingrole';
const STORYTELLER_ROLE_OPTION = 'storytellerrole';
const CATEGORY_NAME_OPTION = 'categoryname';

// To set up: set the member intent, ensure you can download member list

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generatechannels')
        .setDescription('Generates ephemeral channels for players to use')
        .addBooleanOption(option => option
            .setName('addspectator')
            .setDescription('Make a spectator channel')
            .setRequired(false))
        .addStringOption(option => option.setName(CURRENTLY_PLAYING_OPTION)
            .setDescription(`Role of current players (default: ${DEFAULT_CURRENTLY_PLAYING_ROLE_NAME})`)
            .setRequired(false))
        .addStringOption(option => option.setName(STORYTELLER_ROLE_OPTION)
            .setDescription(`Role of current storytellers (default: ${DEFAULT_STORYTELLER_ROLE_NAME})`)
            .setRequired(false))
        .addStringOption(option => option.setName(CATEGORY_NAME_OPTION)
            .setDescription(`Name of generated category (default: ${DEFAULT_NIGHT_CHANNEL_NAME})`)
            .setRequired(false),
        ),
    async execute(interaction: CommandInteraction) {
        if (interaction.inGuild()) {
            // get the current guild
            const guild = interaction.guild;
            if (guild === undefined || guild === null) {
                return await interaction.reply({
                    content: 'Must execute this command in a Guild!',
                    ephemeral: true,
                });
            }

            const roles = await guild.roles.fetch();
            await guild.members.fetch();

            // const makeSpectator = interaction.options.getBoolean('addspectator'); TODO: Add spectator channel
            const inGameRoleStr = interaction.options.getString(CURRENTLY_PLAYING_OPTION) || DEFAULT_CURRENTLY_PLAYING_ROLE_NAME;
            const storytellerRoleStr = interaction.options.getString(STORYTELLER_ROLE_OPTION) || DEFAULT_STORYTELLER_ROLE_NAME;
            const categoryNameStr = interaction.options.getString(CATEGORY_NAME_OPTION) || DEFAULT_NIGHT_CHANNEL_NAME;

            const inGameRole = roles.find(role => role.name === inGameRoleStr);
            if (!inGameRole) {
                return await interaction.reply({
                    content: `Could not find that role! Role: ${inGameRoleStr}`,
                    ephemeral: true,
                });
            }

            // Get members that are current playing, while validating the role exists
            const inGameMembers = guild.members.cache.filter(member => !!member.roles.cache.find(role => role.name === inGameRoleStr));

            const storytellerRole = guild.roles.cache.find(role => role.name === storytellerRoleStr);
            if (storytellerRole === undefined) {
                return await interaction.reply({
                    content: `Could not find that role! Role: ${storytellerRole}`,
                    ephemeral: true,
                });
            }
            const storytellers = storytellerRole.members;
            // storytellers should be able to use the channels
            const storytellerPermissions: Array<OverwriteData> = storytellers.map(st => {
                return { id: st, type: 'member', allow: ['SEND_MESSAGES'] };
            });

            // make new category
            guild.channels.create(categoryNameStr, {
                reason: 'Category for new night text channels for the current game',
                type: 'GUILD_CATEGORY',
            }).then(category => {
                // make new channels for each member
                inGameMembers.forEach(member => {
                    // override and allow the member to send messages
                    const permissions: OverwriteData = { id: member, type: 'member', allow: ['SEND_MESSAGES'] };
                    // remove the ability for all other current game players to view the channel
                    const disallowed: Array<OverwriteData> = inGameMembers.filter(other => other !== member).map(otherMember => {
                        return { id: otherMember, type: 'member', deny: ['VIEW_CHANNEL'] };
                    });

                    // remove the ability to everyone else to send messages
                    disallowed.push({ id: guild.roles.everyone, type: 'role', deny: ['SEND_MESSAGES'] });

                    guild.channels.create(`night-${member.nickname}`, {
                        parent: category, type: 'GUILD_TEXT',
                        permissionOverwrites: [...disallowed, permissions, ...storytellerPermissions],
                    });
                });
            }).catch(err => console.log('Failure to create new category! ' + err));

            return await interaction.reply({
                content: `Generated channels under ${DEFAULT_NIGHT_CHANNEL_NAME}`,
                ephemeral: true,
            });
        } else {
            return await interaction.reply({
                content: 'Must execute this command in a Guild!',
                ephemeral: true,
            });
        }
    },
};
