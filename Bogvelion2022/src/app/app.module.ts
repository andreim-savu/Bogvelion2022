import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';

import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { LobbyPageComponent } from './pages/lobby-page/lobby-page.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { RoomsPageComponent } from './pages/rooms-page/rooms-page.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    LobbyPageComponent,
    AdminPageComponent,
    RoomsPageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
