import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember, Guild, OverwriteData } from 'discord.js';
import { buildGameState } from '../types/GameState';
import { buildDefaultPlayerState, PlayerState } from '../types/PlayerState';

let categoryName : string = "night-text-channels";

// TODO make a get-players utility
module.exports = {
    data: new SlashCommandBuilder()
        .setName('generatechannels')
        .setDescription('Generates ephemeral channels for players to use')
        .addBooleanOption(option => option
            .setName('addspectator')
            .setDescription('Make a spectator channel')
            .setRequired(false))
        .addStringOption(option => option.setName('currentlyPlayingRole')
            .setDescription('Role of current players (default: Current Game)')
            .setRequired(false))
        .addStringOption(option => option.setName('storytellerRole')
            .setDescription('Role of current storytellers (default: Storyteller)')
            .setRequired(false)
        ),
    async execute(interaction: CommandInteraction) {
        if (interaction.inGuild()) {
            // get the current guild
            let guildOrNull = interaction.guild; // TODO????
            if (guildOrNull === undefined || guildOrNull === null) {
                return await interaction.reply('Must execute this command in a Guild!');
            } 

            let guild : Guild = guildOrNull;
            
            const makeSpectator = interaction.options.getBoolean('addspectator');
            let inGameRoleStr = interaction.options.getString('currentlyPlayingRole') || "Current Game";
            let storytellerRoleStr = interaction.options.getString('storytellerRole') || "Storyteller";
            
            // get everyone with a certain role 
            // TODO bottom scratchings assume nothing in cache
            // let inGameMembers = guild.roles.fetch()
            // .then(roles => {
            //     if (roles) {
            //         roles.find(role => {
            //             if (role) {
            //                 role.name === inGameRole.members()
            //             }
            //     })
            // })
            // .catch(err => { return interaction.reply('No such role!')});

            // (inGameRole).members.map();

            // let ingameMembers = guild.members.fetch().
            //     then(members =>
            //     members.filter(member => member.roles.find("name", inGameRole),
            //     ))

            let inGameRole = guild.roles.cache.find(role => role.name === inGameRoleStr);
            if (inGameRole === undefined) {
                return await interaction.reply(`Could not find that role! Role: {$inGameRoleStr}`);
            }

            let inGameMembers = inGameRole.members;
            
            let storytellerRole = guild.roles.cache.find(role => role.name === storytellerRoleStr);
            if (storytellerRole === undefined) {
                return await interaction.reply(`Could not find that role! Role: {$inGameRoleStr}`);
            }
            let storytellers = storytellerRole.members;

            

            // make new category
            let storytellerPermissions: Array<OverwriteData> = storytellers.map(st => { return {id: st, type: "member", allow: "SEND_MESSAGES" }});
            guild.channels.create(categoryName, {reason: "Category for new night text channels for the current game", type: 'GUILD_CATEGORY'})
            .then(category => {
                inGameMembers.forEach(member => {
                    let nickname = member.nickname;
                    let permissions : OverwriteData = {id: member, type: "member", allow: "SEND_MESSAGES"};
                    let disallowed: Array<OverwriteData> = inGameMembers.filter(other => other !== member).map(other => {
                        return {id: other, type: "member", deny: "VIEW_CHANNEL"}
                    });
                    guild.channels.create(`night-{$nickname}`, { parent: category, type: "GUILD_TEXT", 
                        permissionOverwrites: [...disallowed, permissions, ...storytellerPermissions]} )
                });
                // TODO also want to make spectator channels that aren't visible to players.
                // const makeSpectator = interaction.options.getBoolean('addspectator');

            })
            .catch(err => console.log("Failure to create new category! " + err));
            


            return await interaction.reply(`Generated channels under {$categoryName}`);
        } else {
            return await interaction.reply('Must execute this command in a Guild!');
        }
    },
};
