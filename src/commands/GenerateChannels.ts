import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, OverwriteData } from 'discord.js';
import { verifyOperator } from '../utils/InteractionManager';

// todo: move this into general config
const DEFAULT_NIGHT_CHANNEL_NAME = 'night-text-channels';
const DEFAULT_CURRENTLY_PLAYING_ROLE_NAME = 'Current Game';
const DEFAULT_STORYTELLER_ROLE_NAME = 'Storyteller';
const DEFAULT_SPECTATOR_ROLE_NAME = 'Spectator';

const SPECTATOR_CHANNEL_NAME = 'spectator-chat';

const PLAYER_ROLE_OPTION = 'currentlyplayingrole';
const STORYTELLER_ROLE_OPTION = 'storytellerrole';
const SPECTATOR_ROLE_OPTION = 'spectatorrole';

const CATEGORY_NAME_OPTION = 'categoryname';

// To set up: set the member intent, ensure you can download member list

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generatechannels')
        .setDescription('Generates ephemeral channels for players to use')
        .addBooleanOption(option => option.setName(SPECTATOR_ROLE_OPTION)
            .setDescription('Make a spectator channel')
            .setRequired(false))
        .addStringOption(option => option.setName(PLAYER_ROLE_OPTION)
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

            const roles = await guild.roles.fetch();
            await guild.members.fetch();

            // TODO: Add spectator channel
            const spectatorRoleStr = interaction.options.getBoolean(SPECTATOR_ROLE_OPTION) || DEFAULT_SPECTATOR_ROLE_NAME;
            const inGameRoleStr = interaction.options.getString(PLAYER_ROLE_OPTION) || DEFAULT_CURRENTLY_PLAYING_ROLE_NAME;
            const storytellerRoleStr = interaction.options.getString(STORYTELLER_ROLE_OPTION) || DEFAULT_STORYTELLER_ROLE_NAME;
            // const categoryNameStr = interaction.options.getString(CATEGORY_NAME_OPTION) || DEFAULT_NIGHT_CHANNEL_NAME;
            const categoryNameStr = DEFAULT_NIGHT_CHANNEL_NAME;

            const inGameRole = roles.find(role => role.name === inGameRoleStr);
            if (!inGameRole) {
                return await interaction.reply({
                    content: `Could not find that role! Role: ${inGameRoleStr}`,
                    ephemeral: true,
                });
            }

            const spectatorRole = guild.roles.cache.find(role => role.name === spectatorRoleStr);
            if (!spectatorRole) {
                return await interaction.reply({
                    content: `Could not find that role! Role: ${spectatorRole}`,
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
            // const observers = spectatorRole.members;

            // storytellers should be able to use the channels
            // const storytellerPermissions: Array<OverwriteData> = storytellers.map(st => {
            //     return { id: st, type: 'member', allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'] };
            // });

            const storytellerPermission: OverwriteData = {
                id: storytellerRole.id,
                type: 'role',
                allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
            };

            // observers are able to see the channel, but not interact with it
            const spectatorPermission: OverwriteData = { id: spectatorRole.id, type: 'role', allow: ['VIEW_CHANNEL'] };

            // make new category
            guild.channels.create(categoryNameStr, {
                reason: 'Category for new night text channels for the current game',
                type: 'GUILD_CATEGORY',
            }).then(category => {
                // make new channels for each member
                inGameMembers.forEach(member => {
                    // override and allow the member to send messages
                    const memberPermissions: OverwriteData = {
                        id: member,
                        type: 'member',
                        allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                    };
                    // remove the ability for all other current game players to view the channel
                    const disallowed: Array<OverwriteData> = inGameMembers.filter(other => other !== member).map(otherMember => {
                        return { id: otherMember, type: 'member', deny: ['VIEW_CHANNEL'] };
                    });

                    // remove the ability to everyone else to send messages
                    disallowed.push({
                        id: guild.roles.everyone,
                        type: 'role',
                        deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                    });

                    guild.channels.create(`night-${member.nickname || member.displayName}`, {
                        parent: category, type: 'GUILD_TEXT',
                        permissionOverwrites: [...disallowed, memberPermissions, storytellerPermission, spectatorPermission],
                    });
                });
            }).catch(err => console.log('Failure to create new category! ' + err));

            return await interaction.reply({
                content: `Generated channels under ${categoryNameStr}`,
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
