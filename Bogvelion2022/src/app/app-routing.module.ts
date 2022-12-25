import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { LobbyPageComponent } from './pages/lobby-page/lobby-page.component';

const routes: Routes = [
  {path: "", component: LandingPageComponent},
  {path: "lobby/:id", component: LobbyPageComponent},
  {path: "admin/:id", component: AdminPageComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
