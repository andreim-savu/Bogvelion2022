import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { IGame } from 'src/app/interfaces/game';
import { IPlayer } from 'src/app/interfaces/player';

@Component({
  selector: 'app-lobby-page',
  templateUrl: './lobby-page.component.html',
  styleUrls: ['./lobby-page.component.scss']
})
export class LobbyPageComponent implements OnInit {

  id = this.router.url.split('/').pop();

  players: IPlayer[] = [];
  currentTeams: IPlayer[][] = [];
  currentGame = {
    name: "",
    playersPerTeam: 0,
    evenTeams: false
  };
  validGames: IGame[] = [];

  firstPlace: IPlayer | null = null;
  secondPlace: IPlayer | null = null;
  thirdPlace: IPlayer | null = null;

  hoursLeft = 0;
  minutesLeft = "00";
  secondsLeft = "00";

  countdownTo: number = 0;
  timerInterval: any;

  status: string = "";

  constructor(private firestore: AngularFirestore, private router: Router) { }

  ngOnInit(): void {      
    this.firestore.collection('rooms').doc(this.id).valueChanges().subscribe((res) => {
      this.getRoomInfo();
    });
  }

  getRoomInfo(): void {
    this.players = [];

    this.firestore.collection('rooms').doc(this.id).get().subscribe((res) => {
      const data: any = res.data();
      this.players = data.players;
      this.countdownTo = parseInt(data.countdownTo);
      this.status = data.status;
      this.currentTeams = data.currentTeams ? JSON.parse(data.currentTeams) : [];
      this.currentGame = data.currentGame;
      this.validGames = data.validGames;
      console.log(this.status);
      console.log(data.countdownTo);
      this.setLeaderboard();
      this.startCountdown();
    });
  }

  startCountdown() {

    clearInterval(this.timerInterval);
    let now = new Date().getTime();

    let distance = this.countdownTo - now;
    if (distance < 0) { 
      this.countdownTo = 0;
      this.hoursLeft = 0;
      this.minutesLeft = "00";
      this.secondsLeft = "00";
      return; 
    }
    this.hoursLeft = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    this.minutesLeft = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString();
    if (this.minutesLeft.length === 1) { this.minutesLeft = "0" + this.minutesLeft; }
    this.secondsLeft = Math.floor((distance % (1000 * 60)) / 1000).toString();
    if (this.secondsLeft.length === 1) { this.secondsLeft = "0" + this.secondsLeft; }
    
    this.timerInterval = setInterval(() => {
      now = new Date().getTime();

      distance = this.countdownTo - now;

      this.hoursLeft = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.minutesLeft = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString();
      if (this.minutesLeft.length === 1) { this.minutesLeft = "0" + this.minutesLeft; }
      this.secondsLeft = Math.floor((distance % (1000 * 60)) / 1000).toString();
      if (this.secondsLeft.length === 1) { this.secondsLeft = "0" + this.secondsLeft; }

      if (distance < 0) {
        this.countdownTo = 0;
        this.hoursLeft = 0;
        this.minutesLeft = "00";
        this.secondsLeft = "00";
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  setLeaderboard() {
    this.players.sort((a, b) => b.score - a.score);
    this.firstPlace = this.players[0];
    this.secondPlace = this.players[1];
    this.thirdPlace = this.players[2];
  }

  startGame() {
    
  }
}
