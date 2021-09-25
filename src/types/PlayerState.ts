export interface PlayerState {
    name: string,
    id: string,
    role: unknown,
    reminders: unknown,
    isVoteless: boolean,
    isDead: boolean,
    pronouns: string,
}

/**
 * Generates a default player state from the given name and pronouns
 * @param name
 * @param pronouns
 */
export function buildDefaultPlayerState(name: string, pronouns = ''): PlayerState {
    return {
        name: name,
        id: '',
        isDead: false,
        isVoteless: false,
        pronouns: pronouns,
        reminders: '',
        role: '',
    };
}
