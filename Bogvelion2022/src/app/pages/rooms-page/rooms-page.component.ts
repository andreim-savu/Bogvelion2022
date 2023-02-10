import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { IPlayer } from 'src/app/interfaces/player';
import { IRoom } from 'src/app/interfaces/room';

@Component({
  selector: 'app-rooms-page',
  templateUrl: './rooms-page.component.html',
  styleUrls: ['./rooms-page.component.scss']
})
export class RoomsPageComponent implements OnInit {

  @ViewChild('playersContainer')
  private playersContainer!: ElementRef;
  players: IPlayer[] = [];
  rooms: any[] = [];

  roomId: string = "";

  isRoomSelected: boolean = false;

  constructor(private firestore: AngularFirestore, private router: Router) { }

  ngOnInit(): void {
    this.firestore.collection('rooms').snapshotChanges().subscribe(() => {
      this.getRooms();
    });
  }

  getRooms(): void {
    this.rooms = [];

    this.firestore.collection('rooms').get().subscribe((res) => {
      res.forEach(doc => {
        console.log(doc.id);
        let room: IRoom = doc.data() as IRoom;

        if (room.status === "Starting") {
          let newRoom = {
            id: doc.id,
            room: room
          };
          this.rooms.push(newRoom);
        }
      })
    });
  }

  selectRoom(id: string): void {
    this.roomId = id;
    this.isRoomSelected = true;
  }

  addPlayer(playerName: HTMLInputElement): void {
    if (!playerName) { return; }
    let newPlayer: IPlayer = {
      id: this.generateRandomId(),
      name: playerName.value,
      score: 0
    }
    playerName.value = "";
    this.players.push(newPlayer);
    setTimeout(() => {
      this.playersContainer.nativeElement.scrollTop = this.playersContainer.nativeElement.scrollHeight;
    }, 10);
  }

  randomIcon(player: any) {
    player.id = this.generateRandomId();
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

  startRoom(): void {
    let games: unknown[] = [];
    this.firestore.collection('games').ref.get().then(res => {
      for (let doc of res.docs) {
        games.push(doc.data());
      }

      this.firestore.collection('rooms').doc(this.roomId).update({
        players: this.players,
        countdownTo: new Date().getTime() + 30 * 60000,
        status: "Lobby",
        allGames: games,
        currentTeams: "[]",
        currentGame: {
          name: "",
          playersPerTeam: 0,
          evenTeams: false,
          gamePlayed: false
        },
        participatingPlayers: []
      });

      this.router.navigate(["/admin/" + this.roomId]);
    });
  }
}
