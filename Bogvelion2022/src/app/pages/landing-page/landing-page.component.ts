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

  createRoom(): void {
    this.firestore.collection('rooms').add({
      players: [],
      status: "Starting"
    }).then((docRef) => {
      this.router.navigate(["/lobby/" + docRef.id]);
    });
  }
}
