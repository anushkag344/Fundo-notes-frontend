import { Component, Input, Output, EventEmitter, HostListener, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements OnInit, OnChanges {

  @Input() notes: any[] = [];
  @Input() searchText: string = '';
  @Input() isGridView: boolean = true;
  @Input() currentPage: string = 'Notes';
  @Input() allLabels: any[] = [];

  numColumns: number = 4;
  noteColumns: any[][] = [];
  private highlightCache = new Map<string, SafeHtml>();

  ngOnInit(): void {
    this.updateNumColumns();
    this.rebuildNoteColumns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchText']) {
      this.highlightCache.clear();
    }
    if (changes['notes'] || changes['isGridView'] || changes['numColumns']) {
      this.rebuildNoteColumns();
    }
  }

  @HostListener('window:resize')
  updateNumColumns(): void {
    const width = window.innerWidth;
    let newCols = 4;
    if (width < 600) {
      newCols = 1;
    } else if (width < 900) {
      newCols = 2;
    } else if (width < 1200) {
      newCols = 3;
    } else {
      newCols = 4;
    }
    if (this.numColumns !== newCols) {
      this.numColumns = newCols;
      this.rebuildNoteColumns();
    }
  }

  rebuildNoteColumns(): void {
    if (!this.notes || this.notes.length === 0) {
      this.noteColumns = [];
      return;
    }
    if (!this.isGridView) {
      this.noteColumns = [this.notes];
      return;
    }

    const count = Math.min(this.numColumns, this.notes.length);
    const cols: any[][] = Array.from({ length: count }, () => []);

    this.notes.forEach((note, index) => {
      cols[index % count].push(note);
    });

    this.noteColumns = cols;
  }

  constructor(private sanitizer: DomSanitizer) {}

  highlight(text: string): SafeHtml {
    if (!text) return '';
    const query = this.searchText ? this.searchText.trim() : '';
    if (!query) return text;

    const cacheKey = `${query}___${text}`;
    if (this.highlightCache.has(cacheKey)) {
      return this.highlightCache.get(cacheKey)!;
    }

    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const regexSearch = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${regexSearch})`, 'gi');

    const highlighted = escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
    const safe = this.sanitizer.bypassSecurityTrustHtml(highlighted);
    this.highlightCache.set(cacheKey, safe);
    return safe;
  }

  @Output() deleteNote = new EventEmitter<number>();
  @Output() updateColor = new EventEmitter<{ id: number; color: string }>();
  @Output() togglePin = new EventEmitter<number>();
  @Output() toggleArchive = new EventEmitter<number>();
  @Output() toggleReminder = new EventEmitter<number>();
  @Output() restoreNote = new EventEmitter<number>();
  @Output() deleteForever = new EventEmitter<number>();

  // NEW OUTPUT FOR EDIT NOTE & REMINDER
  @Output() editNote = new EventEmitter<any>();
  @Output() openCollaborators = new EventEmitter<any>();
  @Output() addLabelToNote = new EventEmitter<{ noteId: number; labelId: number }>();
  @Output() removeLabelFromNote = new EventEmitter<{ noteId: number; labelId: number }>();
  @Output() createLabelAndAddToNote = new EventEmitter<{ noteId: number; labelName: string }>();
  @Output() setReminderEvent = new EventEmitter<{ noteId: number; reminderTime: string }>();
  @Output() removeReminderEvent = new EventEmitter<number>();

  activeColorPickerIndex: number | null = null;
  activeLabelsDropdownIndex: number | null = null;
  activeMoreMenuIndex: number | null = null;
  activeReminderIndex: number | null = null;
  labelSearchText: string = '';

  selectedNoteIds: Set<number> = new Set<number>();

  reminderViewMode: 'PRESETS' | 'PICK_CUSTOM' = 'PRESETS';
  customReminderDate: string = '';
  customReminderTime: string = '08:00';
  customReminderRepeat: string = 'NONE';

  toggleSelectNote(id: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.selectedNoteIds.has(id)) {
      this.selectedNoteIds.delete(id);
    } else {
      this.selectedNoteIds.add(id);
    }
  }

  isNoteSelected(id: number): boolean {
    return this.selectedNoteIds.has(id);
  }

  hasOpenMenu(index: number): boolean {
    return (
      this.activeColorPickerIndex === index ||
      this.activeReminderIndex === index ||
      this.activeMoreMenuIndex === index ||
      this.activeLabelsDropdownIndex === index
    );
  }

  colors: string[] = [
    '#ffffff',
    '#f28b82',
    '#fbbc04',
    '#fff475',
    '#ccff90',
    '#a7ffeb',
    '#cbf0f8',
    '#aecbfa',
    '#d7aefb',
    '#fdcfdf',
    '#e6c9a8',
    '#e8eaed'
  ];

  // OPEN EDIT POPUP
  openNote(note: any): void {
    this.editNote.emit(note);
  }

  onDelete(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.deleteNote.emit(id);
  }

  onTogglePin(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.togglePin.emit(id);
  }

  onToggleArchive(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.toggleArchive.emit(id);
  }

  onToggleReminder(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.toggleReminder.emit(id);
  }

  onRestore(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.restoreNote.emit(id);
  }

  onDeleteForever(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.deleteForever.emit(id);
  }

  toggleColorPicker(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMoreMenuIndex = null;
    this.activeLabelsDropdownIndex = null;
    this.activeReminderIndex = null;

    if (this.activeColorPickerIndex === index) {
      this.activeColorPickerIndex = null;
    } else {
      this.activeColorPickerIndex = index;
    }
  }

  changeNoteColor(id: number, color: string, event: MouseEvent): void {
    event.stopPropagation();
    this.updateColor.emit({ id, color });
    this.activeColorPickerIndex = null;
  }

  onOpenCollaborators(note: any, event: MouseEvent): void {
    event.stopPropagation();
    this.openCollaborators.emit(note);
  }

  toggleLabelsDropdown(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeLabelsDropdownIndex === index) {
      this.activeLabelsDropdownIndex = null;
      this.labelSearchText = '';
    } else {
      this.activeLabelsDropdownIndex = index;
      this.labelSearchText = '';
    }
  }

  toggleMoreMenu(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeColorPickerIndex = null;
    this.activeReminderIndex = null;
    this.labelSearchText = '';
    if (this.activeMoreMenuIndex === index) {
      this.activeMoreMenuIndex = null;
      this.activeLabelsDropdownIndex = null;
    } else {
      this.activeMoreMenuIndex = index;
      this.activeLabelsDropdownIndex = null;
    }
  }

  toggleReminderMenu(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeColorPickerIndex = null;
    this.activeLabelsDropdownIndex = null;
    this.activeMoreMenuIndex = null;
    this.labelSearchText = '';

    if (this.activeReminderIndex === index) {
      this.activeReminderIndex = null;
    } else {
      this.activeReminderIndex = index;
      this.reminderViewMode = 'PRESETS';
      const now = new Date();
      const pad = (n: number) => n < 10 ? '0' + n : n;
      this.customReminderDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      this.customReminderTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
  }

  setQuickReminder(noteId: number, preset: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    let reminderDate = new Date();

    if (preset === 'LATER_TODAY') {
      reminderDate.setHours(20, 0, 0, 0);
      if (reminderDate.getTime() <= Date.now()) {
        reminderDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
      }
    } else if (preset === 'TOMORROW') {
      reminderDate.setDate(reminderDate.getDate() + 1);
      reminderDate.setHours(8, 0, 0, 0);
    } else if (preset === 'NEXT_WEEK') {
      const day = reminderDate.getDay();
      const diff = (day === 0 ? 1 : 8 - day);
      reminderDate.setDate(reminderDate.getDate() + diff);
      reminderDate.setHours(8, 0, 0, 0);
    }

    const pad = (n: number) => n < 10 ? '0' + n : n;
    const isoString = `${reminderDate.getFullYear()}-${pad(reminderDate.getMonth() + 1)}-${pad(reminderDate.getDate())}T${pad(reminderDate.getHours())}:${pad(reminderDate.getMinutes())}:00`;

    this.setReminderEvent.emit({ noteId, reminderTime: isoString });
    this.activeReminderIndex = null;
  }

  saveCustomReminder(noteId: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!this.customReminderDate) return;

    const [hours, minutes] = this.customReminderTime.split(':');
    const [year, month, day] = this.customReminderDate.split('-');

    const pad = (n: any) => parseInt(n, 10) < 10 ? '0' + parseInt(n, 10) : n;
    const isoString = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00`;

    this.setReminderEvent.emit({ noteId, reminderTime: isoString });
    this.activeReminderIndex = null;
  }

  onRemoveReminder(noteId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.removeReminderEvent.emit(noteId);
  }

  formatReminderDate(reminder: any): string {
    if (!reminder) return '';
    try {
      const d = new Date(reminder);
      const now = new Date();

      const isToday = d.toDateString() === now.toDateString();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      const isTomorrow = d.toDateString() === tomorrow.toDateString();

      const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

      if (isToday) {
        return `Today, ${timeStr}`;
      } else if (isTomorrow) {
        return `Tomorrow, ${timeStr}`;
      } else {
        const monthStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `${monthStr}, ${timeStr}`;
      }
    } catch (e) {
      return String(reminder);
    }
  }

  @HostListener('document:click', ['$event'])
  closeAllMenus(event?: MouseEvent): void {
    if (event && event.target) {
      const target = event.target as HTMLElement;
      if (
        target.closest('.card-color-wrapper') ||
        target.closest('.card-reminder-wrapper') ||
        target.closest('.card-more-wrapper') ||
        target.closest('.card-more-popup') ||
        target.closest('.label-note-container') ||
        target.closest('.card-color-popup') ||
        target.closest('.reminder-popover')
      ) {
        return;
      }
    }
    this.activeColorPickerIndex = null;
    this.activeLabelsDropdownIndex = null;
    this.activeMoreMenuIndex = null;
    this.activeReminderIndex = null;
    this.labelSearchText = '';
  }

  getFilteredLabels(labels: any[]): any[] {
    if (!labels) return [];
    if (!this.labelSearchText || !this.labelSearchText.trim()) return labels;
    const query = this.labelSearchText.trim().toLowerCase();
    return labels.filter(l => l.name && l.name.toLowerCase().includes(query));
  }

  onCreateNewLabelForNote(noteId: number, labelName: string, event?: Event): void {
    if (event) event.stopPropagation();
    const name = labelName.trim();
    if (!name) return;
    this.createLabelAndAddToNote.emit({ noteId, labelName: name });
    this.labelSearchText = '';
  }

  onToggleLabel(noteId: number, labelId: number, event: any): void {
    const isChecked = event.target.checked;
    if (isChecked) {
      this.addLabelToNote.emit({ noteId, labelId });
    } else {
      this.removeLabelFromNote.emit({ noteId, labelId });
    }
  }

  isLabelOnNote(note: any, labelId: number): boolean {
    if (!note || !note.labels) return false;
    const targetLabel = this.allLabels ? this.allLabels.find((l: any) => l.id === labelId) : null;
    return note.labels.some((l: any) => l.id === labelId || (targetLabel && l.name && l.name.toLowerCase() === targetLabel.name.toLowerCase()));
  }

  onRemoveLabel(noteId: number, labelId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.removeLabelFromNote.emit({ noteId, labelId });
  }

}