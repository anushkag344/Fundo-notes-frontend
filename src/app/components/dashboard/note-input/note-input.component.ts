import { Component, EventEmitter, Input, Output, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-note-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './note-input.component.html',
  styleUrls: ['./note-input.component.css']
})
export class NoteInputComponent {
  @ViewChild('titleInput') titleInputRef?: ElementRef;
  @ViewChild('noteBox') noteBoxRef?: ElementRef;

  @Input() allLabels: any[] = [];

  isExpanded: boolean = false;
  showColorPicker: boolean = false;
  showMoreMenu: boolean = false;
  showLabelsDropdown: boolean = false;
  labelSearchText: string = '';
  selectedLabels: any[] = [];

  title: string = '';
  description: string = '';
  color: string = '#ffffff';
  isPinned: boolean = false;
  isArchived: boolean = false;

  colors: string[] = [
    '#ffffff', // White
    '#f28b82', // Red/Pink
    '#fbbc04', // Yellow
    '#fff475', // Light Yellow
    '#ccff90', // Green
    '#a7ffeb', // Teal
    '#cbf0f8', // Light Blue
    '#aecbfa', // Dark Blue
    '#d7aefb', // Purple
    '#fdcfdf', // Soft Pink
    '#e6c9a8', // Brown/Sand
    '#e8eaed'  // Gray
  ];

  constructor(private eRef: ElementRef) {}

  @Output() createNote = new EventEmitter<{ title: string; description: string; color: string; isPinned: boolean; isArchived: boolean; labels: any[] }>();
  @Output() createLabelEvent = new EventEmitter<string>();

  private justExpanded: boolean = false;

  expand(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isExpanded = true;
    this.justExpanded = true;
    setTimeout(() => {
      this.justExpanded = false;
      if (this.titleInputRef) {
        this.titleInputRef.nativeElement.focus();
      }
    }, 150);
  }

  toggleColorPicker(event: MouseEvent) {
    event.stopPropagation();
    this.showMoreMenu = false;
    this.showColorPicker = !this.showColorPicker;
  }

  selectColor(c: string, event: MouseEvent) {
    event.stopPropagation();
    this.color = c;
    this.showColorPicker = false;
  }

  toggleMoreMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showColorPicker = false;
    if (this.showMoreMenu) {
      this.showMoreMenu = false;
      this.showLabelsDropdown = false;
      this.labelSearchText = '';
    } else {
      this.showMoreMenu = true;
      this.showLabelsDropdown = false;
      this.labelSearchText = '';
    }
  }

  toggleLabelsDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showLabelsDropdown = !this.showLabelsDropdown;
    this.labelSearchText = '';
  }

  toggleLabelForNewNote(label: any, event: any) {
    const isChecked = event.target.checked;
    if (isChecked) {
      if (!this.selectedLabels.some(l => l.id === label.id)) {
        this.selectedLabels.push(label);
      }
    } else {
      this.selectedLabels = this.selectedLabels.filter(l => l.id !== label.id);
    }
  }

  isLabelSelectedForNewNote(labelId: number): boolean {
    return this.selectedLabels.some(l => l.id === labelId);
  }

  removeLabelFromNewNote(labelId: number, event: MouseEvent) {
    event.stopPropagation();
    this.selectedLabels = this.selectedLabels.filter(l => l.id !== labelId);
  }

  getFilteredLabels(labels: any[]): any[] {
    if (!labels) return [];
    if (!this.labelSearchText || !this.labelSearchText.trim()) return labels;
    const query = this.labelSearchText.trim().toLowerCase();
    return labels.filter(l => l.name && l.name.toLowerCase().includes(query));
  }

  onCreateNewLabel(labelName: string, event?: Event) {
    if (event) event.stopPropagation();
    const name = labelName.trim();
    if (!name) return;

    const existing = this.allLabels ? this.allLabels.find(l => l.name && l.name.toLowerCase() === name.toLowerCase()) : null;
    if (existing) {
      if (!this.selectedLabels.some(l => l.id === existing.id)) {
        this.selectedLabels.push(existing);
      }
    } else {
      const newLabel = { id: Date.now(), name: name };
      this.selectedLabels.push(newLabel);
      this.createLabelEvent.emit(name);
    }
    this.labelSearchText = '';
  }

  deleteNoteDraft(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.resetForm();
  }

  togglePin(event: MouseEvent) {
    event.stopPropagation();
    this.isPinned = !this.isPinned;
  }

  toggleArchive(event: MouseEvent) {
    event.stopPropagation();
    this.isArchived = !this.isArchived;
  }

  close(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }

    const titleEl = this.eRef.nativeElement.querySelector('.title-input') as HTMLInputElement;
    const descEl = this.eRef.nativeElement.querySelector('.content-input') as HTMLTextAreaElement;

    const currentTitle = titleEl ? titleEl.value : this.title;
    const currentDesc = descEl ? descEl.value : this.description;

    const safeTitle = (currentTitle || '').trim();
    const safeDesc = (currentDesc || '').trim();
    const safeLabels = this.selectedLabels || [];

    if (safeTitle || safeDesc || safeLabels.length > 0) {
      this.createNote.emit({
        title: safeTitle,
        description: safeDesc,
        color: this.color || '#ffffff',
        isPinned: !!this.isPinned,
        isArchived: !!this.isArchived,
        labels: [...safeLabels]
      });
    }
    this.resetForm();
  }

  @HostListener('document:mousedown', ['$event'])
  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    if (this.isExpanded && !this.justExpanded) {
      const target = event.target as Node;
      const box = this.noteBoxRef ? this.noteBoxRef.nativeElement : this.eRef.nativeElement.querySelector('.note-box.expanded');
      const clickedInsideBox = box ? box.contains(target) : false;

      if (target && !clickedInsideBox) {
        this.close();
      } else {
        if (this.showColorPicker) {
          const colorWrapper = this.eRef.nativeElement.querySelector('.color-picker-wrapper');
          if (colorWrapper && !colorWrapper.contains(target)) {
            this.showColorPicker = false;
          }
        }
        if (this.showMoreMenu) {
          const moreWrapper = this.eRef.nativeElement.querySelector('.more-menu-wrapper');
          if (moreWrapper && !moreWrapper.contains(target)) {
            this.showMoreMenu = false;
            this.showLabelsDropdown = false;
            this.labelSearchText = '';
          }
        }
      }
    }
  }

  resetForm() {
    this.title = '';
    this.description = '';
    this.color = '#ffffff';
    this.isPinned = false;
    this.isArchived = false;
    this.showColorPicker = false;
    this.showMoreMenu = false;
    this.showLabelsDropdown = false;
    this.labelSearchText = '';
    this.selectedLabels = [];
    this.isExpanded = false;
  }
}

