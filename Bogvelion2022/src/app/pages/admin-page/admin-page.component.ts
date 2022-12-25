import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss']
})
export class AdminPageComponent implements OnInit {
  id = this.router.url.split('/').pop();

  countdownTo: number = 0;
  timerInterval: any;

  hoursLeft = 0;
  minutesLeft = "00";
  secondsLeft = "00";

  constructor(private firestore: AngularFirestore, private router: Router) { }

  ngOnInit(): void {

    this.firestore.collection('rooms').doc(this.id).get().subscribe((res) => {
      const data: any = res.data();
      this.countdownTo = parseInt(data.countdownTo);
      this.startCountdown();
    });
  }

  addFiveMinutes() {
    this.countdownTo += 5 * 60000;

    this.firestore.collection('rooms').doc(this.id).update({
      countdownTo: this.countdownTo
    }).then(() => {
      this.startCountdown();
    });
  }

  startCountdown() {

    clearInterval(this.timerInterval);
    let now = new Date().getTime();

    let distance = this.countdownTo - now;
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
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }
}
