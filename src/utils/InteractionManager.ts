import { CommandInteraction, GuildMember, VoiceChannel } from 'discord.js';

export interface AuthorVoiceChannel {
    voiceChannel: VoiceChannel | null,
    errorMessage: string
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

