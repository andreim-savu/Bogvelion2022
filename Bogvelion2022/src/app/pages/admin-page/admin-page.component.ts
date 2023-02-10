import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { IGame } from 'src/app/interfaces/game';
import { IPlayer } from 'src/app/interfaces/player';
import { IRoom } from 'src/app/interfaces/room';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss']
})
export class AdminPageComponent implements OnInit {
  id = this.router.url.split('/').pop();

  roomData: IRoom = {
    players: [],
    status: "",
    countdownTo: 0,
    currentTeams: [],
    allGames: [],
    currentGame: {
      name: "",
      playersPerTeam: 0,
      evenTeams: false,
      description: "",
      gamePlayed: false
    },
    participatingPlayers: []
  };

  timerInterval: any;

  hoursLeft = 0;
  minutesLeft = "00";
  secondsLeft = "00";

  roomLoaded: boolean = false;

  selectedPlayer: IPlayer | null = null;

  constructor(private firestore: AngularFirestore, private router: Router) { }

  ngOnInit(): void {

    this.firestore.collection('rooms').doc(this.id).get().subscribe((res) => {
      const data: any = res.data();
      this.roomData = {
        players: data.players,
        status: data.status,
        countdownTo: parseInt(data.countdownTo),
        currentTeams: data.currentTeams ? JSON.parse(data.currentTeams) : [],
        allGames: data.allGames,
        currentGame: data.currentGame,
        participatingPlayers: data.participatingPlayers ? data.participatingPlayers : null
      }
      this.roomData.players.sort((a, b) => b.score - a.score);
      this.roomLoaded = true;
      this.startCountdown();
    });
  }

  selectPlayerForScore(player: IPlayer) {
    if (this.selectedPlayer === player) { this.selectedPlayer = null; }
    else { this.selectedPlayer = player; }
  }

  setNewScore(score: HTMLInputElement) {
    if (!this.selectedPlayer) { return; }

    let newScore = parseInt(score.value);

    this.selectedPlayer.score = newScore;
    this.firestore.collection('rooms').doc(this.id).update({
      players: this.roomData.players
    });
  }

  toggleGamePlayer(player: IPlayer) {
    if (this.roomData.participatingPlayers.includes(player)) {
      for (let i = 0; i < this.roomData.participatingPlayers.length; i++) {
        if (this.roomData.participatingPlayers[i] === player) {
          this.roomData.participatingPlayers.splice(i, 1);
        }
      }
    }
    else {
      this.roomData.participatingPlayers.push(player);
    }
  }

  isParticipatinPlayer(player: IPlayer): boolean {
    return this.roomData.participatingPlayers.includes(player);
  }

  addPlayer(playerName: HTMLInputElement): void {
    if (!playerName) { return; }
    let newPlayer: IPlayer = {
      id: this.generateRandomId(),
      name: playerName.value,
      score: 0
    }
    playerName.value = "";
    this.roomData.players.push(newPlayer);
    this.firestore.collection('rooms').doc(this.id).update({
      players: this.roomData.players
    });
  }

  addFiveMinutes() {
    if (this.roomData.countdownTo === 0) { this.roomData.countdownTo = new Date().getTime(); }
    this.roomData.countdownTo += 5 * 60000;

    this.firestore.collection('rooms').doc(this.id).update({
      countdownTo: this.roomData.countdownTo
    }).then(() => {
      this.startCountdown();
    });
  }

  startNow() {
    this.roomData.countdownTo = 0;
    this.firestore.collection('rooms').doc(this.id).update({
      countdownTo: this.roomData.countdownTo
    }).then(() => {
      this.startCountdown();
    });
  }

  addTime(minutes: string) {
    if (this.roomData.countdownTo === 0) { this.roomData.countdownTo = new Date().getTime(); }
    this.roomData.countdownTo += parseInt(minutes) * 60000;

    this.firestore.collection('rooms').doc(this.id).update({
      countdownTo: this.roomData.countdownTo
    }).then(() => {
      this.startCountdown();
    });
  }

  removeTime(minutes: string) {
    if (this.roomData.countdownTo === 0) { return; }
    this.roomData.countdownTo = this.roomData.countdownTo - parseInt(minutes) * 60000 > new Date().getTime()
      ? this.roomData.countdownTo - parseInt(minutes) * 60000
      : 0;

    this.firestore.collection('rooms').doc(this.id).update({
      countdownTo: this.roomData.countdownTo
    }).then(() => {
      this.startCountdown();
    });
  }

  startCountdown() {

    clearInterval(this.timerInterval);
    let now = new Date().getTime();

    let distance = this.roomData.countdownTo - now;

    if (distance < 0) {
      this.startGameSetup();
      return;
    }
    this.roomData.participatingPlayers = [];
    this.hoursLeft = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    this.minutesLeft = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString();
    if (this.minutesLeft.length === 1) { this.minutesLeft = "0" + this.minutesLeft; }
    this.secondsLeft = Math.floor((distance % (1000 * 60)) / 1000).toString();
    if (this.secondsLeft.length === 1) { this.secondsLeft = "0" + this.secondsLeft; }

    this.timerInterval = setInterval(() => {
      now = new Date().getTime();

      distance = this.roomData.countdownTo - now;

      this.hoursLeft = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.minutesLeft = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString();
      if (this.minutesLeft.length === 1) { this.minutesLeft = "0" + this.minutesLeft; }
      this.secondsLeft = Math.floor((distance % (1000 * 60)) / 1000).toString();
      if (this.secondsLeft.length === 1) { this.secondsLeft = "0" + this.secondsLeft; }

      if (distance < 0) {
        this.startGameSetup();
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  startGameSetup() {
    this.roomData.countdownTo = 0;
    this.hoursLeft = 0;
    this.minutesLeft = "00";
    this.secondsLeft = "00";

    this.roomData.participatingPlayers = [];
    for (let player of this.roomData.players) {
      this.roomData.participatingPlayers.push(player);
    }
  }

  startGame2() {
    //Check games that weren't played yet
    let potentialGames: IGame[] = [];

    for (let game of this.roomData.allGames) {
      if (game.gamePlayed) { continue; }
      potentialGames.push(game);
    }
    console.log(11111);
    console.log(potentialGames);
    console.log(11111);

    //Check for what games we can make equal teams, also if there are even teams for even games

    let equalTeamGames: IGame[] = [];

    for (let game of potentialGames) {
      if (this.roomData.participatingPlayers.length % game.playersPerTeam !== 0) {
        continue;
      }

      if (!(this.roomData.participatingPlayers.length > game.playersPerTeam)) {
        continue;
      }

      if (game.evenTeams && (this.roomData.participatingPlayers.length / game.playersPerTeam) % 2 !== 0) {
        continue;
      }
      equalTeamGames.push(game);
    }

    //If there are available games make the teams and start

    if (equalTeamGames.length > 0) {
      console.log(2222);
      console.log(equalTeamGames);
      console.log(2222);
      let randomGameIndex = Math.floor(Math.random() * equalTeamGames.length);
      this.roomData.currentGame = equalTeamGames[randomGameIndex];
      this.makeTeams(this.roomData.currentGame.playersPerTeam);
    }

    else {
      for (let game of potentialGames) {
        if ((this.roomData.participatingPlayers.length - 1) % game.playersPerTeam !== 0) {
          continue;
        }

        if (!((this.roomData.participatingPlayers.length - 1) > game.playersPerTeam)) {
          continue;
        }

        if (game.evenTeams && ((this.roomData.participatingPlayers.length) / game.playersPerTeam) % 2 === 0) {
          continue;
        }
        equalTeamGames.push(game);
      }

      if (equalTeamGames.length > 0) {
        console.log(3333);
        console.log(equalTeamGames);
        console.log(3333);
        let randomGameIndex = Math.floor(Math.random() * equalTeamGames.length);
        this.roomData.currentGame = equalTeamGames[randomGameIndex];
        this.makeBeeTeams(this.roomData.currentGame.playersPerTeam);
      }

      else {
        console.log(4444);
        console.log(potentialGames);
        console.log(4444);
        let randomGameIndex = Math.floor(Math.random() * potentialGames.length);
        this.roomData.currentGame = potentialGames[randomGameIndex];
        this.makeTeams(this.roomData.currentGame.playersPerTeam);
      }
    }

    //If there are still no valid games pick a random one and make teams as best you can :(
    this.roomData.status = "PickGame";
    this.firestore.collection('rooms').doc(this.id).update({
      currentGame: this.roomData.currentGame,
      status: this.roomData.status,
      participatingPlayers: this.roomData.participatingPlayers,
      currentTeams: JSON.stringify(this.roomData.currentTeams)
    });
  }

  makeTeams(playersPerTeam: number) {
    let teams: IPlayer[][] = [];
    if (playersPerTeam > 1) {
      for (let i = 0; i < 500; i++) {
        let index1 = Math.floor(Math.random() * this.roomData.participatingPlayers.length);
        let index2 = Math.floor(Math.random() * this.roomData.participatingPlayers.length);

        if (index1 === index2) { continue; }

        let tempPlayer = this.roomData.participatingPlayers[index1];
        this.roomData.participatingPlayers[index1] = this.roomData.participatingPlayers[index2];
        this.roomData.participatingPlayers[index2] = tempPlayer;
      }

      for (let i = 0; i < this.roomData.participatingPlayers.length; i++) {
        if (this.roomData.participatingPlayers[i].name === "Catalin" || this.roomData.participatingPlayers[i].name === "Alexandra") {
          this.roomData.participatingPlayers.push(this.roomData.participatingPlayers.splice(i, 1)[0]);
          break;
        }
      }

      for (let i = 0; i < this.roomData.participatingPlayers.length; i++) {
        if (this.roomData.participatingPlayers[i].name === "Bee") {
          this.roomData.participatingPlayers.push(this.roomData.participatingPlayers.splice(i, 1)[0]);
          break;
        }
      }

      let tempPlayers: IPlayer[] = [...this.roomData.participatingPlayers];

      while (tempPlayers.length > 0) {
        let newTeam: IPlayer[] = [];
        if (tempPlayers.length > playersPerTeam) {
          for (let i = 0; i < playersPerTeam; i++) {
            newTeam.push(tempPlayers.pop()!);
          }
        }
        else {
          newTeam = tempPlayers;
          tempPlayers = [];
        }
        teams.push(newTeam);
      }

    }
    else {
      for (let i = 0; i < this.roomData.participatingPlayers.length; i++) {
        teams.push([this.roomData.participatingPlayers[i]]);
      }
    }
    console.log(teams);
    this.roomData.currentTeams = teams;
  }

  makeBeeTeams(playersPerTeam: number) {
    let teams: IPlayer[][] = [];
    if (playersPerTeam > 1) {
      for (let i = 0; i < 500; i++) {
        let index1 = Math.floor(Math.random() * this.roomData.participatingPlayers.length);
        let index2 = Math.floor(Math.random() * this.roomData.participatingPlayers.length);

        if (index1 === index2) { continue; }

        let tempPlayer = this.roomData.participatingPlayers[index1];
        this.roomData.participatingPlayers[index1] = this.roomData.participatingPlayers[index2];
        this.roomData.participatingPlayers[index2] = tempPlayer;
      }

      for (let i = 0; i < this.roomData.participatingPlayers.length; i++) {
        if (this.roomData.participatingPlayers[i].name === "Bee") {
          this.roomData.participatingPlayers.push(this.roomData.participatingPlayers.splice(i, 1)[0]);
          break;
        }
      }

      let bee: IPlayer = this.roomData.participatingPlayers.pop()!;

      let tempPlayers: IPlayer[] = [...this.roomData.participatingPlayers];

      while (tempPlayers.length > 0) {
        let newTeam: IPlayer[] = [];
        if (tempPlayers.length > playersPerTeam) {
          for (let i = 0; i < playersPerTeam; i++) {
            newTeam.push(tempPlayers.pop()!);
          }
        }
        else {
          newTeam = tempPlayers;
          tempPlayers = [];
        }
        teams.push(newTeam);
      }

      let beePlaced = false;
      for (let team of teams) {
        if (beePlaced) { break; }
        for (let member of team) {
          if (member.name === "Catalin" || member.name === "Alexandra") {
            team.push(bee);
            beePlaced = true;
            break;
          }
        }
      }
    }
    else {
      for (let i = 0; i < this.roomData.participatingPlayers.length; i++) {
        teams.push([this.roomData.participatingPlayers[i]]);
      }
    }
    console.log(teams);
    this.roomData.currentTeams = teams;
  }

  selectGame(game: IGame) {
    this.roomData.currentGame = game;
    this.firestore.collection('rooms').doc(this.id).update({
      currentGame: game
    });
  }

  startGame() {
    this.roomData.status = "InGame";
    this.firestore.collection('rooms').doc(this.id).update({
      status: this.roomData.status,
      currentTeams: JSON.stringify(this.roomData.currentTeams)
    });
  }

  endGame(isFinished: boolean) {
    if (isFinished) {
      for (let game of this.roomData.allGames) {
        if (game.name === this.roomData.currentGame.name) {
          game.gamePlayed = true;
          break;
        }
      }
    }

    this.roomData.status = "Lobby";
    this.roomData.participatingPlayers = [];
    this.roomData.currentTeams = [];
    this.roomData.countdownTo = new Date().getTime() + 45 * 60000;
    this.firestore.collection('rooms').doc(this.id).update({
      players: this.roomData.players,
      countdownTo: this.roomData.countdownTo,
      status: this.roomData.status,
      currentTeams: JSON.stringify(this.roomData.currentTeams),
      allGames: this.roomData.allGames,
      currentGame: {
        name: "",
        playersPerTeam: 0,
        evenTeams: false,
        description: "",
        gamePlayed: false
      },
      participatingPlayers: []
    }).then(() => {
      this.startCountdown();
    });
    this.roomData.players.sort((a, b) => b.score - a.score);
  }

  updateTeamScore(team: IPlayer[], input: HTMLInputElement) {
    for (let player of team) {
      for (let i = 0; i < this.roomData.players.length; i++) {
        if (player.id === this.roomData.players[i].id) {
          this.roomData.players[i].score += parseInt(input.value);
        }
      }
    }
  }

  setScores() {
    let buttons = document.getElementsByClassName("fake-button");
    console.log(buttons);
    for (let button of buttons as any) {
      button.click();
    }

    this.endGame(true);
  }

  generateRandomId(): string {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";

    for (let i = 0; i < 19; i++) {
      if ((i + 1) % 5 === 0) {
        id += "-";
        continue;
      }

      id += characters[Math.floor(Math.random() * characters.length)];
    }
    console.log(id);
    return id;
  }

  async test() {
    // let a = this.firestore.collection('games').snapshotChanges().subscribe(res => {
    //   console.log(res[0].payload.doc.data());
    // })

    // let game: IGame = {
    //   name: "Two truths and a LIE",
    //   playersPerTeam: 1,
    //   evenTeams: false,
    //   description: "Each player tell 3 statements, two of which are true and one must be a lie. On a piece of paper the other players write which one they think the lie is, earning points for each correct guess. Goes on until all players took a turn.",
    //   gamePlayed: false
    // }
    // this.firestore.collection('games').add(game);
    // return;
    let games: unknown[] = [];
    this.firestore.collection('games').ref.get().then(res => {
      for (let doc of res.docs) {
        console.log(doc.data());
        games.push(doc.data());
      }
      console.log(games);
      this.firestore.collection('rooms').doc(this.id).update({
        allGames: games
      });
    });
  }
}
