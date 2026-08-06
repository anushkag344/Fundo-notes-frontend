import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'fundoo-notes-ui';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Render free tier cold start fix:
    // App open hote hi backend ko silently ping karte hain
    // Taaki user form submit kare tab backend already awake ho
    this.http.get('https://fundo-notes-backend.onrender.com/health')
      .subscribe({ error: () => {} }); // errors silently ignore karo
  }
}
