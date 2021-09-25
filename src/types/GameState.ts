import { PlayerState } from './PlayerState';

export interface GameState {
    bluffs: string[],
    edition: {
        id: string
    },
    fabled: string[],
    players: PlayerState[],
}

/**
 * Builds the GlobalGameState based on the players given and the edition
 * @param playerStates players in the game
 * @param edition edition to play
 */
export function buildGameState(playerStates: PlayerState[], edition = 'tb'): GameState {
    return {
        bluffs: [],
        edition: { id: edition },
        fabled: [],
        players: playerStates,
    };
}
