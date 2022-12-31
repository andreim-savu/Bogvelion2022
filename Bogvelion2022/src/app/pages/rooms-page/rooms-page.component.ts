import { Component, OnInit } from '@angular/core';
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

  getRooms(): void{
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

  startRoom(): void {
    this.firestore.collection('rooms').doc(this.roomId).update({
      players: this.players,
      countdownTo: new Date().getTime() + 30 * 60000,
      status: "Lobby",
      currentTeams: "[]",
      currentGame: {
        name: "",
        playersPerTeam: 0,
        evenTeams: false
      },
      validGames: [],
      participatingPlayers: []
    });

    this.router.navigate(["/admin/" + this.roomId]);
  }
}
