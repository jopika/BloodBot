import { CommandInteraction, GuildMember, VoiceChannel } from 'discord.js';

export interface AuthorVoiceChannel {
    voiceChannel: VoiceChannel | null,
    errorMessage: string
}

export function verifyOperator(interaction: CommandInteraction): boolean {
    if (checkRolePrivilege(interaction, 'Operator')) {
        return true;
    }

    interaction.reply({
        content: 'Only members with the "Operator" role can use this command!',
        ephemeral: true,
    });

    return false;
}

export function checkRolePrivilege(interaction: CommandInteraction, roleName: string): boolean {
    if (interaction.inGuild()) {
        const commandAuthor = interaction.member as GuildMember;
        const authorRoles = commandAuthor.roles.cache;
        const roleMatch = authorRoles.find((role) => role.name === roleName);
        return roleMatch !== undefined;
    }

    return false;
}

/**
 * Retrieves the voice channel that the command author is in
 * @param interaction command interaction that was executed
 */
export function getAuthorVoiceChannel(interaction: CommandInteraction): AuthorVoiceChannel {
    if (interaction.inGuild()) {
        // since this interaction is in a guild, grab the member directly
        const commandAuthor = interaction.member as GuildMember;
        if (commandAuthor.voice === null) {
            console.log(`An issue with resolving member: ${commandAuthor.displayName} voiceState`);
            return {
                voiceChannel: null,
                errorMessage: 'Discord API returned an error, please try again',
            };
        }

        if (commandAuthor.voice.channel === null) {
            console.log(`Member: ${commandAuthor.displayName} is not in a Voice Channel, skipping...`);
            return {
                voiceChannel: null,
                errorMessage: 'You are not in a Voice Channel, please join a Voice Channel and rerun the command',
            };
        }

        return {
            voiceChannel: commandAuthor.voice.channel as VoiceChannel,
            errorMessage: '',
        };
    } else {
        return {
            voiceChannel: null,
            errorMessage: 'Must execute this command in a Guild!',
        };
    }
}

