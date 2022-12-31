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
    currentGame: {
      name: "",
      playersPerTeam: 0,
      evenTeams: false
    },
    validGames: [],
    participatingPlayers: []
  };

  timerInterval: any;

  hoursLeft = 0;
  minutesLeft = "00";
  secondsLeft = "00";

  roomLoaded: boolean = false;

  constructor(private firestore: AngularFirestore, private router: Router) { }

  ngOnInit(): void {

    this.firestore.collection('rooms').doc(this.id).get().subscribe((res) => {
      const data: any = res.data();
      console.log(data);
      console.log(data.participatingPlayers);
      this.roomData = {
        players: data.players,
        status: data.status,
        countdownTo: parseInt(data.countdownTo),
        currentTeams: data.currentTeams ? JSON.parse(data.currentTeams) : [],
        currentGame: data.currentGame,
        validGames: data.validGames,
        participatingPlayers: data.participatingPlayers ? data.participatingPlayers : null
      }
      this.roomLoaded = true;
      this.startCountdown();
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
      id: crypto.randomUUID(),
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
    console.log("This " + this.roomData.countdownTo);
    console.log("Date " + new Date().getTime());
    this.roomData.countdownTo = this.roomData.countdownTo - parseInt(minutes) * 60000 > new Date().getTime()
      ? this.roomData.countdownTo - parseInt(minutes) * 60000
      : 0;

    console.log("This " + this.roomData.countdownTo);
    console.log("Date " + new Date().getTime());
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
  }

  getValidGames() {
    let validGames = [];
    this.roomData.status = "PickGame";
    for (let game of this.testGames) {
      if (this.roomData.participatingPlayers.length % game.playersPerTeam !== 0) {
        continue;
      }

      if (!(this.roomData.participatingPlayers.length > game.playersPerTeam)) {
        continue;
      }

      if (game.evenTeams && (this.roomData.participatingPlayers.length / game.playersPerTeam) % 2 !== 0 ) {
        continue;
      }

      validGames.push(game);
    }
    this.roomData.validGames = validGames;
    this.firestore.collection('rooms').doc(this.id).update({
      status: this.roomData.status,
      validGames: this.roomData.validGames,
      participatingPlayers: this.roomData.participatingPlayers
    });
  }

  selectGame(game: IGame) {
    this.makeTeams(game.playersPerTeam);
    this.roomData.status = "InGame";
    this.roomData.currentGame = game;
    this.firestore.collection('rooms').doc(this.id).update({
      status: this.roomData.status,
      currentTeams: JSON.stringify(this.roomData.currentTeams),
      currentGame: game
    });
  }

  endGame() {

    this.roomData.status = "Lobby";
    this.roomData.participatingPlayers = [];
    this.roomData.currentTeams = [];
    this.roomData.countdownTo = new Date().getTime() + 45 * 60000;
    this.firestore.collection('rooms').doc(this.id).update({
      players: this.roomData.players,
      countdownTo: this.roomData.countdownTo,
      status: this.roomData.status,
      currentTeams: JSON.stringify(this.roomData.currentTeams),
      currentGame: {
        name: "",
        playersPerTeam: 0,
        evenTeams: false
      },
      validGames: [],
      participatingPlayers: []
    }).then(() => {
      this.startCountdown();
    });
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

    this.endGame();
  }

  makeTeams(playersPerTeam: number) {
    console.log(playersPerTeam);
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

      for (let i = 0; i < this.roomData.participatingPlayers.length / playersPerTeam; i++) {
        let newTeam = [];
        for (let j = i * 2; j < i * 2 + playersPerTeam; j++) {
          newTeam.push(this.roomData.participatingPlayers[j]);
        }
        teams.push(newTeam);
      }
      console.log(teams);
    }
    else {
      for (let i = 0; i < this.roomData.participatingPlayers.length; i++) {
        teams.push([this.roomData.participatingPlayers[i]]);
      }
    }
    this.roomData.currentTeams = teams;
  }

  testGames: any[] = [
    {
      name: "Just Dance",
      playersPerTeam: 1,
      evenTeams: false
    },
    {
      name: "Mini beer pong",
      playersPerTeam: 2,
      evenTeams: true
    },
    {
      name: "Airplane thing",
      playersPerTeam: 2,
      evenTeams: false
    },
    {
      name: "Blind Cocktail",
      playersPerTeam: 2,
      evenTeams: true
    },
    {
      name: "Draw on back",
      playersPerTeam: 4,
      evenTeams: true
    },
    {
      name: "Mime without seeing",
      playersPerTeam: 3,
      evenTeams: false
    },
    {
      name: "Speed Jenga",
      playersPerTeam: 2,
      evenTeams: false
    }
  ]
}
