import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection, CommandInteraction, GuildMember } from 'discord.js';
import { getAuthorVoiceChannel } from '../utils/InteractionManager';

const STORYTELLER_ROLE_OPTION = 'storyteller_role';
const TOWNSFOLK_ROLE_OPTION = 'townsfolk_role';
const SPECTATOR_ROLE_OPTION = 'spectator_role';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('preparegame')
        .setDescription('Manages roles for the server by assigning players and storytellers ' +
            'their corresponding roles')
        .addStringOption(option => option.setName(STORYTELLER_ROLE_OPTION)
            .setDescription('Storyteller role to track, default: \'Storyteller\'')
            .setRequired(false))
        .addStringOption(option => option.setName(TOWNSFOLK_ROLE_OPTION)
            .setDescription('Townsfolk role to track, default: \'Current Game\'')
            .setRequired(false))
        .addStringOption(option => option.setName(SPECTATOR_ROLE_OPTION)
            .setDescription('Spectator role to track')
            .setRequired(false)),
    execute: async function(interaction: CommandInteraction) {
        const { errorMessage, voiceChannel } = getAuthorVoiceChannel(interaction);
        if (voiceChannel === null) {
            return await interaction.reply({
                content: errorMessage,
                ephemeral: true,
            });
        }

        // Force the guild members list to refresh
        await interaction.guild?.members.fetch();

        const roles = await interaction.guild?.roles.fetch(undefined, { force: true });
        if (roles === undefined) {
            return await interaction.reply({
                content: 'Discord API returned an error',
                ephemeral: true,
            });
        }

        const storytellerRoleName = interaction.options.getString(STORYTELLER_ROLE_OPTION) || 'Storyteller';
        const storytellerRole = roles.find(role => role.name === storytellerRoleName);
        if (storytellerRole === undefined) {
            return await interaction.reply({
                content: `Given storyteller role: ${storytellerRoleName} does not exist in server, please provide a valid role. Available roles: ${JSON.stringify(roles.map(role => role.name))}`,
                ephemeral: true,
            });
        }

        const townsfolkRoleName = interaction.options.getString(TOWNSFOLK_ROLE_OPTION) || 'Current Game';
        const townsfolkRole = roles.find(role => role.name === townsfolkRoleName);
        if (townsfolkRole === undefined) {
            return await interaction.reply({
                content: `Given townsfolk role: ${storytellerRoleName} does not exist in server, please provide a valid role. Available roles: ${JSON.stringify(roles.map(role => role.name))}`,
                ephemeral: true,
            });
        }

        const currentStorytellers = storytellerRole.members;
        const currentTownsfolk = townsfolkRole.members;

        // get all members in the voice channel
        const members = voiceChannel.members;

        console.log(`New town: ${JSON.stringify(members.map(member => member.displayName))}`);

        const targetStorytellers = members.filter(member => member.displayName.includes('(ST)'));
        const targetTownsfolk = members.filter(member => !targetStorytellers.has(member.id));

        const storytellerDiff = calculateDifference(currentStorytellers, targetStorytellers);
        const townsfolkDiff = calculateDifference(currentTownsfolk, targetTownsfolk);

        storytellerDiff.membersToAdd.forEach(member => {
            console.log(`Added ${member.displayName} to ${storytellerRole.name}`);
            member.roles.add(storytellerRole);
        });
        storytellerDiff.membersToRemove.forEach(member => {
            console.log(`Removed ${member.displayName} from ${storytellerRole.name}`);
            member.roles.remove(storytellerRole);
        });

        townsfolkDiff.membersToAdd.forEach(member => {
            console.log(`Added ${member.displayName} to ${townsfolkRole.name}`);
            member.roles.add(townsfolkRole);
        });

        townsfolkDiff.membersToRemove.forEach(member => {
            console.log(`Removed ${member.displayName} from ${townsfolkRole.name}`);
            member.roles.remove(townsfolkRole);
        });

        return await interaction.reply({
            content: 'Completed setup',
            ephemeral: true,
        });
    },
};

interface DeltaCalculation {
    membersToAdd: GuildMember[],
    membersToRemove: GuildMember[],
}

/**
 * Calculates the members to add and remove based on the current state and the target state
 * @param currentMembers
 * @param targetMemberState
 */
function calculateDifference(currentMembers: Collection<string, GuildMember>,
                             targetMemberState: Collection<string, GuildMember>): DeltaCalculation {
    const membersToAdd = targetMemberState.filter(member => currentMembers.get(member.id) === undefined).map(member => member);
    const membersToRemove = currentMembers.filter(member => targetMemberState.get(member.id) === undefined).map(member => member);

    return {
        membersToAdd: membersToAdd,
        membersToRemove: membersToRemove,
    };
}
