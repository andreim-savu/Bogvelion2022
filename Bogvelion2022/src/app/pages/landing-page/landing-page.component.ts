import { Component, OnInit } from '@angular/core';
import { IPlayer } from 'src/app/interfaces/player';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit {

  players: IPlayer[] = [];

  constructor(private firestore: AngularFirestore, private router: Router) { }

  ngOnInit(): void {
  }

  addPlayer(playerName: HTMLInputElement): void {
    if (!playerName) { return; }
    let newPlayer: IPlayer = {
      id: crypto.randomUUID(),
      name: playerName.value,
      score: 0
    }
    playerName.value = "";
    this.players.push(newPlayer);
  }

  generateRandomId(): string {
    let id = Math.floor(Math.random() * 10000);
    return id.toString();
  }

  createRoom(): void {
    this.firestore.collection('rooms').add({
      players: this.players,
      status: "Lobby"
    }).then((docRef) => {
      this.router.navigate(["/lobby/" + docRef.id]);
    });
  }
}
