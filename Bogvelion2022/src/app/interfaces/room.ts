import { IGame } from "./game";
import { IPlayer } from "./player";

export interface IRoom {
    countdownTo: number;
    players: IPlayer[];
    status: string;
    currentTeams: IPlayer[][];
    allGames: IGame[];
    currentGame: IGame;
    participatingPlayers: IPlayer[];
}
