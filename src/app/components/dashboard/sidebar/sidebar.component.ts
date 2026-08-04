import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  @Input() collapsed: boolean = false;
  @Input() labels: any[] = [];
  @Input() selected: string = 'Notes';

  @Output() menuChange = new EventEmitter<string>();

  changeMenu(menu: string) {
    this.selected = menu;
    this.menuChange.emit(menu);
  }
}