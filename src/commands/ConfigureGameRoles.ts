import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection, CommandInteraction, GuildMember } from 'discord.js';
import { getAuthorVoiceChannel } from '../utils/InteractionManager';

const STORYTELLER_ROLE_OPTION = 'storyteller_role';
const VILLAGE_ROLE_OPTION = 'village_role';
const SPECTATOR_ROLE_OPTION = 'spectator_role';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('preparegame')
        .setDescription('Manages roles for the server by assigning players and storytellers ' +
            'their corresponding roles')
        .addStringOption(option => option.setName(STORYTELLER_ROLE_OPTION)
            .setDescription('Storyteller role to track')
            .setRequired(true))
        .addStringOption(option => option.setName(VILLAGE_ROLE_OPTION)
            .setDescription('Village role to track')
            .setRequired(true))
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

        await interaction.guild?.members.fetch();

        const roles = await interaction.guild?.roles.fetch(undefined, { force: true });
        if (roles === undefined) {
            return await interaction.reply({
                content: 'Discord API returned an error',
                ephemeral: true,
            });
        }

        const storytellerRoleName = interaction.options.getString(STORYTELLER_ROLE_OPTION) as string;
        const storytellerRole = roles.find(role => role.name === storytellerRoleName);
        if (storytellerRole === undefined) {
            return await interaction.reply({
                content: `Given storyteller role: ${storytellerRoleName} does not exist in server, please provide a valid role. Available roles: ${JSON.stringify(roles.map(role => role.name))}`,
                ephemeral: true,
            });
        }

        const villageRoleName = interaction.options.getString(VILLAGE_ROLE_OPTION) as string;
        const villagerRole = roles.find(role => role.name === villageRoleName);
        if (villagerRole === undefined) {
            return await interaction.reply({
                content: `Given village role: ${storytellerRoleName} does not exist in server, please provide a valid role. Available roles: ${JSON.stringify(roles.map(role => role.name))}`,
                ephemeral: true,
            });
        }

        console.log(`Villager role: ${villagerRole.name}`);

        // const resolvedStorytellerRole = await interaction.guild?.roles.fetch(storytellerRole.id, { cache: false, force: true });
        // const resolvedVillagerRole = await interaction.guild?.roles.fetch(villagerRole.id, { cache: false, force: true });
        const resolvedStorytellerRole = interaction.guild?.roles.cache.get(storytellerRole.id);
        const resolvedVillagerRole = interaction.guild?.roles.cache.get(villagerRole.id);

        if (resolvedStorytellerRole === undefined || resolvedStorytellerRole === null) {
            return await interaction.reply({
                content: `Given storyteller role: ${storytellerRoleName} does not exist in server, please provide a valid role. Available roles: ${JSON.stringify(roles.map(role => role.name))}`,
                ephemeral: true,
            });
        }

        if (resolvedVillagerRole === undefined || resolvedVillagerRole === null) {
            return await interaction.reply({
                content: `Given village role: ${storytellerRoleName} does not exist in server, please provide a valid role. Available roles: ${JSON.stringify(roles.map(role => role.name))}`,
                ephemeral: true,
            });
        }

        console.log(`resolvedStoryteller members: ${JSON.stringify(resolvedStorytellerRole.members.map(member => member.displayName))}`);
        console.log(`resolvedVillager members: ${JSON.stringify(resolvedVillagerRole.members.map(member => member.displayName))}`);

        const currentStorytellers = resolvedStorytellerRole.members;
        const currentVillagers = resolvedVillagerRole.members;

        // get all members in the voice channel
        const members = voiceChannel.members;

        console.log(`New town: ${JSON.stringify(members.map(member => member.displayName))}`);

        const targetStorytellers = members.filter(member => member.displayName.includes('(ST)'));
        const targetVillagers = members.filter(member => !targetStorytellers.has(member.id));

        console.log(`targetStorytellers: ${JSON.stringify(targetStorytellers.map(member => member.displayName))}`);
        console.log(`targetVillagers: ${JSON.stringify(targetVillagers.map(member => member.displayName))}`);

        const storytellerDiff = calculateDifference(currentStorytellers, targetStorytellers);
        const villagerDiff = calculateDifference(currentVillagers, targetVillagers);

        storytellerDiff.membersToAdd.forEach(member => {
            console.log(`Added ${member.displayName} to ${resolvedStorytellerRole.name}`);
            member.roles.add(resolvedStorytellerRole);
        });
        storytellerDiff.membersToRemove.forEach(member => {
            console.log(`Removed ${member.displayName} from ${resolvedStorytellerRole.name}`);
            member.roles.remove(resolvedStorytellerRole);
        });

        villagerDiff.membersToAdd.forEach(member => {
            console.log(`Added ${member.displayName} to ${resolvedVillagerRole.name}`);
            member.roles.add(resolvedVillagerRole);
        });

        villagerDiff.membersToRemove.forEach(member => {
            console.log(`Removed ${member.displayName} from ${resolvedVillagerRole.name}`);
            member.roles.remove(resolvedVillagerRole);
        });

        return await interaction.reply({
            content: 'Completed setup',
            ephemeral: true,
        });

        // console.log(`Storyteller roleId: ${storytellerRole.id}`);
        // console.log(`Villager roleId: ${villagerRole.id}`);
        // console.log(`Villager role name: ${villagerRole.name}`);
        // console.log(`Village partial? ${JSON.stringify(villagerRole.members.mapValues(member => member.displayName))}`);
        // console.log(`Vil part: ${JSON.stringify(interaction?.guild?.roles?.cache.get(villagerRole.id)?.members.map(member => member.displayName))}`);
        //
        // const allMembers = await interaction.guild?.members.fetch();
        // // const villagerMembers = interaction.guild?.members.cache.filter(member => member.roles.cache.has(villagerRole.id));
        // const villagerMembers = allMembers?.filter(member => member.roles.cache.has(villagerRole.id));
        // console.log(`Found members count: ${villagerMembers?.size}`);
        //
        // const allRoleMembers = await interaction.guild?.roles.fetch(villagerRole.id);
        // const roleMembers = allRoleMembers?.members.map(member => member.displayName);
        // console.log(`Members: ${JSON.stringify(roleMembers)}`);
        //
        // return await interaction.reply({
        //     content: `Roles: ${JSON.stringify(roles.map(role => role.name))}`,
        //     ephemeral: true,
        // });

        // ==================================================

        // console.log(`Roles found: ${JSON.stringify(roles?)}`);

        // const roleManager = interaction.guild?.roles;
        // console.log(`Role Manager type: ${typeof roleManager}`);
        //
        // const roles = await roleManager?.fetch(undefined, { force: true, cache: true });
        // console.log(`Forced roles: ${JSON.stringify(roles?.values)}`);
        // console.log(`Cached roles: ${JSON.stringify(roleManager?.cache.values)}`);

        // if (interaction.guild === null) {
        //     console.log('Guild is undefined!');
        //     return;
        // }
        //
        // const role: Role = interaction.guild.roles.cache.find(x => x.name === 'Current Game') as Role;
        // console.log(`Roles: ${role?.name}`);
        // console.log(`Members with role: ${JSON.stringify(role?.members.size)}`);
        // console.log(`Cache hit with members with role: ${interaction.guild.roles.cache.get(role.id)?.members.size}`);
        //
        // const users = await interaction.guild.members.fetch();
        // users.forEach((user, id) => {
        //     console.log(id);
        //     if (user.roles.cache.get(role.id)) {
        //         console.log(`Found member: ${user.displayName}`);
        //     } else {
        //         console.log('miss');
        //     }
        // });

        // interaction.guild?.roles.fetch({cache: true, force: true})
        //     .then(roles => {
        //         if (roles !== null || typeof roles !== 'undefined') {
        //             console.log(`Server roles: ${JSON.stringify(roles.values)}`);
        //         }
        //     }).catch(console.error);

        // get all members who are previously assigned to the roles in question
        // console.log(`Role cache: ${JSON.stringify(interaction.guild?.roles.cache.values)}`);
        // const rolesCollection = await interaction.guild?.roles.fetch();
        // console.log(`Roles: ${JSON.stringify(rolesCollection?.values())}`);
        // if (rolesCollection === null || rolesCollection === undefined) {
        //     return await interaction.reply({
        //         content: 'Discord API returned an error, please try again',
        //         ephemeral: true,
        //     });
        // }
        //
        // const storytellerRoleName = interaction.options.getString(STORYTELLER_ROLE_OPTION) as string;
        // if (!rolesCollection.has(storytellerRoleName)) {
        //     return await interaction.reply({
        //             content: `Given storyteller role: ${storytellerRoleName} does not exist in server, please provide a valid role. Available roles: ${JSON.stringify(rolesCollection.values)}`,
        //             ephemeral: true,
        //         },
        //     );
        // }
        //
        // const villageRoleName = interaction.options.getString(VILLAGE_ROLE_OPTION) as string;
        // if (!rolesCollection.has(villageRoleName)) {
        //     return await interaction.reply({
        //             content: `Given village role: ${villageRoleName} does not exist in server, please provide a valid role. Available roles: ${JSON.stringify(rolesCollection.values)}`,
        //             ephemeral: true,
        //         },
        //     );
        // }
        //
        // const storytellerRole = rolesCollection.get(storytellerRoleName) as Role;
        // const villagerRole = rolesCollection.get(villageRoleName) as Role;
        //
        // const previousStorytellers = rolesCollection.get(storytellerRoleName)?.members;
        // const previousVillagers = rolesCollection.get(villageRoleName)?.members;
        //
        // // const spectatorRole = interaction.options.getString(STORYTELLER_ROLE_OPTION);
        // // if (!rolesCollection.has(spectatorRole)) {
        // //     return await interaction.reply({
        // //             content: `Given storyteller role: ${spectatorRole} does not exist in server, please provide a valid role`,
        // //             ephemeral: true,
        // //         },
        // //     );
        // // }
        //
        // // get all members in the voice channel
        // const members = voiceChannel.members;
        //
        // const newStorytellers = members.filter(member => member.id.includes('(ST)'));
        // const newVillagers = members.filter(member => !newStorytellers.has(member.id));
        //
        // const storytellersToRemove = previousStorytellers?.filter(member => !newStorytellers.has(member.id));
        // const villagerToRemove = previousVillagers?.filter(member => !newVillagers.has(member.id));
        //
        // const storytellersToAdd = newStorytellers.filter(member =>
        //     (previousStorytellers as Collection<string, GuildMember>).has(member.id));
        // const villagersToAdd = newVillagers.filter(member =>
        //     (previousVillagers as Collection<string, GuildMember>).has(member.id));
        //
        // storytellersToRemove?.forEach((member) => {
        //     member.roles.remove(storytellerRole);
        // });
        // storytellersToAdd.forEach(member => member.roles.add(storytellerRole));
        //
        // villagerToRemove?.forEach(member => member.roles.remove(villagerRole));
        // villagersToAdd.forEach(member => member.roles.add(villagerRole));
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
