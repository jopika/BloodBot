import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Guild, OverwriteData } from 'discord.js';

// todo: move this into general config
const categoryName = 'night-text-channels';
const gameRole = 'Current Game';
const stRole = 'Storyteller';


// To set up: set the member intent, ensure you can download member list

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generatechannels')
        .setDescription('Generates ephemeral channels for players to use')
        .addBooleanOption(option => option
            .setName('addspectator')
            .setDescription('Make a spectator channel')
            .setRequired(false))
        .addStringOption(option => option.setName('currentlyplayingrole')
            .setDescription('Role of current players (default: Current Game)')
            .setRequired(false))
        .addStringOption(option => option.setName('storytellerrole')
            .setDescription('Role of current storytellers (default: Storyteller)')
            .setRequired(false))
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

            const guild: Guild = guildOrNull;

            const roles = await guild.roles.fetch();
            await guild.members.fetch();

            // const makeSpectator = interaction.options.getBoolean('addspectator'); TODO: Add spectator channel
            const inGameRoleStr = interaction.options.getString('currentlyplayingrole') || gameRole;
            const storytellerRoleStr = interaction.options.getString('storytellerrole') || stRole;
            const categoryNameStr = interaction.options.getString('categoryname') || categoryName;

            const inGameRole = roles.find(role => role.name === inGameRoleStr);
            if (!inGameRole) {
                return await interaction.reply(`Could not find that role! Role: ${inGameRoleStr}`);
            }

            console.log(guild.members.cache.forEach(m => console.log(m.roles.cache)));
            const inGameMembers = guild.members.cache.filter(member => !!member.roles.cache.find(role => role.name === inGameRoleStr));


            const storytellerRole = guild.roles.cache.find(role => role.name === storytellerRoleStr);
            if (storytellerRole === undefined) {
                return await interaction.reply(`Could not find that role! Role: ${storytellerRole}`);
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
            })
                .then(category => {
                    // make new channels for each member
                    inGameMembers.forEach(member => {
                        const nickname = member.nickname || member.displayName || member.user.username;
                        console.log('nickname is ' + nickname);
                        const permissions: OverwriteData = { id: member, type: 'member', allow: ['SEND_MESSAGES'] };
                        const disallowed: Array<OverwriteData> = inGameMembers.filter(other => other !== member).map(other => {
                            console.log('not allowed');
                            console.log(other);
                            return { id: other, type: 'member', deny: ['VIEW_CHANNEL'] };
                        });
                        console.log([disallowed, permissions, ...storytellerPermissions]);


                        guild.channels.create(`night-${nickname}`, {
                            parent: category, type: 'GUILD_TEXT',
                            permissionOverwrites: [...disallowed, permissions, ...storytellerPermissions],
                        });
                    });

                })
                .catch(err => console.log('Failure to create new category! ' + err));

            return await interaction.reply(`Generated channels under ${categoryName}`);
        } else {
            return await interaction.reply('Must execute this command in a Guild!');
        }
    },
};
