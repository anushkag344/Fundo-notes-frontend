import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NoteInputComponent } from './note-input/note-input.component';
import { NotesComponent } from './notes/notes.component';
import { FormsModule } from '@angular/forms';

import { NoteService } from '../../services/note.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    SidebarComponent,
    NoteInputComponent,
    NotesComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  sidebarOpen: boolean = true;

  currentPage: string = 'Notes';

  icon: string = 'lightbulb';

  message: string = 'Notes you add appear here';

  notes: any[] = [];

  searchText: string = '';

  isGridView: boolean = true;
  selectedNote: any = null;
  showEditPopup = false;

  // New features state
  labels: any[] = [];
  showLabelsModal = false;
  newLabelName = '';
  editingLabelId: number | null = null;
  editingLabelName = '';

  showCollaboratorsModal = false;
  activeCollaboratorNote: any = null;
  collaboratorsList: any[] = [];
  newCollaboratorEmail = '';
  currentUserProfile: any = null;
  showPopupColorPicker = false;
  showPopupLabelsDropdown = false;
  popupLabelSearchText = '';

  showDeleteLabelConfirm = false;
  labelToDelete: any = null;
  createLabelFocused = false;
  labelError = '';
  labelSuccess = '';

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

  constructor(
    private noteService: NoteService,
    private userService: UserService
  ) {}
  openEditPopup(note: any): void {
    this.selectedNote = { ...note };
    this.showEditPopup = true;
    this.showPopupColorPicker = false;
    this.showPopupLabelsDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (this.showPopupColorPicker) {
      const colorWrapper = document.querySelector('.popup-color-wrapper');
      if (colorWrapper && !colorWrapper.contains(target)) {
        this.showPopupColorPicker = false;
      }
    }

    if (this.showPopupLabelsDropdown) {
      const labelWrapper = document.querySelector('.popup-labels-wrapper');
      if (labelWrapper && !labelWrapper.contains(target)) {
        this.showPopupLabelsDropdown = false;
      }
    }
  }

closeEditPopup(): void {
  if (!this.selectedNote) {
    this.showEditPopup = false;
    return;
  }

  const note = this.notes.find(n => n.id === this.selectedNote.id);
  if (note) {
    note.title = this.selectedNote.title || '';
    note.description = this.selectedNote.description || '';
    note.content = this.selectedNote.description || '';
    note.color = this.selectedNote.color || '#ffffff';
    note.isPinned = !!this.selectedNote.isPinned;
    note.isArchived = !!this.selectedNote.isArchived;
    this.notes = [...this.notes];
    this.saveLocalNotes();
    this.updateFilteredNotes();
  }

  this.showEditPopup = false;

  if (typeof this.selectedNote.id === 'number' && this.selectedNote.id < 1000000000000) {
    this.noteService.updateNote(
      this.selectedNote.id,
      {
        title: this.selectedNote.title || '',
        content: this.selectedNote.description || '',
        color: this.selectedNote.color || '#ffffff'
      }
    ).subscribe({
      next: () => {
        this.refreshCurrentPage();
      },
      error: err => console.log('Error updating note on backend:', err)
    });
  }
}

  saveLocalNotes(): void {
    try {
      localStorage.setItem('fundoo_local_notes', JSON.stringify(this.notes));
    } catch (e) {
      console.error('Error saving local notes:', e);
    }
  }

  loadLocalNotes(): void {
    try {
      const stored = localStorage.getItem('fundoo_local_notes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.notes = parsed;
        }
      }
      this.updateFilteredNotes();
    } catch (e) {
      console.error('Error loading local notes:', e);
    }
  }

  saveLocalLabels(): void {
    try {
      localStorage.setItem('fundoo_local_labels', JSON.stringify(this.labels));
    } catch (e) {
      console.error('Error saving local labels:', e);
    }
  }

  loadLocalLabels(): void {
    try {
      const stored = localStorage.getItem('fundoo_local_labels');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.labels = parsed;
        }
      }
    } catch (e) {
      console.error('Error loading local labels:', e);
    }
  }

  ngOnInit(): void {
    this.loadLocalNotes();
    this.loadLocalLabels();
    this.updateFilteredNotes();
    this.loadNotes();
    this.loadUserProfile();
    this.loadLabels();
  }

  refreshCurrentPage(): void {
    const page = this.currentPage;

    const processNotesList = (raw: any) => {
      let list: any[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && Array.isArray(raw.data)) {
        list = raw.data;
      } else if (raw && Array.isArray(raw.notes)) {
        list = raw.notes;
      } else if (raw && Array.isArray(raw.result)) {
        list = raw.result;
      }

      const serverNotes = list.map((n: any) => ({
        ...n,
        title: n.title || '',
        description: n.content !== undefined ? n.content : (n.description || ''),
        content: n.content !== undefined ? n.content : (n.description || ''),
        isPinned: n.isPinned !== undefined ? !!n.isPinned : (n.pinned !== undefined ? !!n.pinned : false),
        pinned: n.isPinned !== undefined ? !!n.isPinned : (n.pinned !== undefined ? !!n.pinned : false),
        isArchived: n.isArchived !== undefined ? !!n.isArchived : (n.archived !== undefined ? !!n.archived : false),
        archived: n.isArchived !== undefined ? !!n.isArchived : (n.archived !== undefined ? !!n.archived : false),
        isTrashed: n.isTrashed !== undefined ? !!n.isTrashed : (n.trashed !== undefined ? !!n.trashed : false),
        trashed: n.isTrashed !== undefined ? !!n.isTrashed : (n.trashed !== undefined ? !!n.trashed : false),
        labels: n.labels || [],
        collaborators: n.collaborators || []
      }));

      // Merge with local notes not present in server response
      const serverIds = new Set(serverNotes.map(sn => sn.id));
      const unsyncedLocal = this.notes.filter(ln => !serverIds.has(ln.id));
      this.notes = [...unsyncedLocal, ...serverNotes];
      this.saveLocalNotes();
      this.updateFilteredNotes();
    };

    if (page === 'Notes' || page === 'Reminders') {
      this.noteService.getNotes().subscribe({
        next: (res: any) => processNotesList(res?.data ?? res),
        error: (err: any) => {
          console.log('Error loading notes (using local notes fallback):', err);
          this.loadLocalNotes();
        }
      });
    } else if (page === 'Archive') {
      this.noteService.getArchivedNotes().subscribe({
        next: (res: any) => processNotesList(res?.data ?? res),
        error: (err: any) => {
          console.log('Error loading archived notes (using local fallback):', err);
          this.loadLocalNotes();
        }
      });
    } else if (page === 'Trash') {
      this.noteService.getTrashedNotes().subscribe({
        next: (res: any) => processNotesList(res?.data ?? res),
        error: (err: any) => {
          console.log('Error loading trashed notes (using local fallback):', err);
          this.loadLocalNotes();
        }
      });
    } else if (page.startsWith('label:')) {
      const labelId = parseInt(page.substring(6), 10);
      this.noteService.getNotesByLabel(labelId).subscribe({
        next: (res: any) => processNotesList(res?.data ?? res),
        error: (err: any) => {
          console.log('Error loading notes by label (using local fallback):', err);
          this.loadLocalNotes();
        }
      });
    }
  }

  loadNotes(): void {
    this.refreshCurrentPage();
  }

  onRefresh(): void {
    this.loadNotes();
    this.loadLabels();
    this.loadUserProfile();
  }

  loadArchivedNotes(): void {
    this.refreshCurrentPage();
  }

  loadTrashNotes(): void {
    this.refreshCurrentPage();
  }

  toggleSidebar(value?: boolean) {
    if (value !== undefined) {
      this.sidebarOpen = value;
    } else {
      this.sidebarOpen = !this.sidebarOpen;
    }
  }

  onSearchChange(text: string) {
    this.searchText = text ? text.toLowerCase() : '';
    this.updateFilteredNotes();
  }

  onViewToggle(isGrid: boolean) {
    this.isGridView = isGrid;
  }

  createLabelFromInput(name: string): void {
    const existing = this.labels.find(l => l.name && l.name.toLowerCase() === name.toLowerCase());
    if (existing) return;
    const newLabel = { id: Date.now(), name: name };
    this.labels = [...this.labels, newLabel];
    this.saveLocalLabels();
    this.noteService.createLabel(name).subscribe({
      next: (res: any) => {
        const serverLabel = res?.data ?? res;
        if (serverLabel && serverLabel.id) {
          newLabel.id = serverLabel.id;
          this.saveLocalLabels();
        }
      },
      error: (err: any) => console.log('Error creating label on backend:', err)
    });
  }

  onNoteCreated(note: any): void {
    const noteLabels = note.labels || [];
    const tempId = Date.now();
    const newNote = {
      id: tempId,
      title: note.title || '',
      description: note.description || '',
      content: note.description || '',
      color: note.color || '#ffffff',
      isPinned: !!note.isPinned,
      pinned: !!note.isPinned,
      isArchived: !!note.isArchived,
      archived: !!note.isArchived,
      isTrashed: false,
      trashed: false,
      labels: [...noteLabels],
      collaborators: [],
      createdAt: new Date().toISOString()
    };

    // Immediately insert into local array for Google Keep instant UI response
    this.notes = [newNote, ...this.notes];
    this.updateFilteredNotes();
    this.saveLocalNotes();

    const backendNote = {
      title: note.title || '',
      content: note.description || note.title || ' ',
      description: note.description || '',
      color: note.color || '#ffffff'
    };

    this.noteService.createNote(backendNote).subscribe({
      next: (res: any) => {
        const createdNoteId = res?.data?.id || res?.id || res?.data?.noteId;
        if (createdNoteId) {
          newNote.id = createdNoteId;
          const localMatch = this.notes.find(n => n.id === tempId);
          if (localMatch) {
            localMatch.id = createdNoteId;
          }
          this.saveLocalNotes();

          if (newNote.isPinned) {
            this.noteService.togglePin(createdNoteId).subscribe();
          }
          if (newNote.isArchived) {
            this.noteService.toggleArchive(createdNoteId).subscribe();
          }

          if (noteLabels.length > 0) {
            noteLabels.forEach((lbl: any) => {
              if (lbl.id && typeof lbl.id === 'number' && lbl.id < 1000000000000) {
                this.noteService.addLabelToNote(lbl.id, createdNoteId).subscribe();
              }
            });
          }
        }
        if (this.currentPage.startsWith('label:')) {
          const labelId = parseInt(this.currentPage.substring(6), 10);
          if (createdNoteId && !isNaN(labelId)) {
            this.noteService.addLabelToNote(labelId, createdNoteId).subscribe({
              next: () => {
                this.saveLocalNotes();
                this.updateFilteredNotes();
              },
              error: (err: any) => {
                console.log('Error adding label to created note:', err);
                this.updateFilteredNotes();
              }
            });
            return;
          }
        }
        this.saveLocalNotes();
        this.updateFilteredNotes();
      },
      error: (err: any) => {
        console.log('Backend create note offline/error, kept local note:', err);
        this.updateFilteredNotes();
      }
    });
  }

  onDeleteForever(id: number): void {
    this.notes = this.notes.filter(n => n.id !== id);
    this.updateFilteredNotes();
    this.saveLocalNotes();

    if (typeof id === 'number' && id < 1000000000000) {
      this.noteService.deleteNote(id).subscribe({
        next: () => {},
        error: (err: any) => console.log('Backend deleteNote error:', err)
      });
    }
  }

  deleteSelectedNote(): void {
    if (this.selectedNote && this.selectedNote.id) {
      const noteId = this.selectedNote.id;
      this.showEditPopup = false;
      this.showPopupLabelsDropdown = false;
      if (this.currentPage === 'Trash' || this.selectedNote.isTrash || this.selectedNote.isTrashed) {
        this.onDeleteForever(noteId);
      } else {
        this.onNoteDeleted(noteId);
      }
    }
  }

  onNoteDeleted(id: number): void {
    const note = this.notes.find(n => n.id === id);
    if (note) {
      note.isTrashed = !note.isTrashed;
      note.trashed = note.isTrashed;
      this.notes = [...this.notes];
      this.updateFilteredNotes();
      this.saveLocalNotes();
    }

    if (typeof id === 'number' && id < 1000000000000) {
      this.noteService.toggleTrash(id).subscribe({
        next: () => {},
        error: (err: any) => console.log('Backend toggleTrash error:', err)
      });
    }
  }

  onToggleArchive(id: number): void {
    const note = this.notes.find(n => n.id === id);
    if (note) {
      note.isArchived = !note.isArchived;
      note.archived = note.isArchived;
      this.notes = [...this.notes];
      this.updateFilteredNotes();
      this.saveLocalNotes();
    }

    if (typeof id === 'number' && id < 1000000000000) {
      this.noteService.toggleArchive(id).subscribe({
        next: () => {},
        error: (err: any) => console.log('Backend toggleArchive error:', err)
      });
    }
  }

  onNotePinToggled(id: number): void {
    const note = this.notes.find(n => n.id === id);
    if (note) {
      note.isPinned = !note.isPinned;
      note.pinned = note.isPinned;
      this.notes = [...this.notes];
      this.updateFilteredNotes();
      this.saveLocalNotes();
    }

    if (typeof id === 'number' && id < 1000000000000) {
      this.noteService.togglePin(id).subscribe({
        next: () => {},
        error: (err: any) => console.log('Backend togglePin error:', err)
      });
    }
  }

  onRestoreNote(id: number): void {

    this.noteService.toggleTrash(id).subscribe({

      next: () => {

        this.loadNotes();

      },

      error: (err: any) => {

        console.log(err);

      }

    });

  }

  onToggleReminder(id: number): void {

    console.log('Reminder API pending', id);

  }
  cachedFilteredNotes: any[] = [];
  cachedPinnedNotes: any[] = [];
  cachedOtherNotes: any[] = [];

  updateFilteredNotes(): void {
    const query = this.searchText ? this.searchText.trim().toLowerCase() : '';

    this.cachedFilteredNotes = this.notes.filter(note => {
      // 1. Page / Tab filter logic
      if (this.currentPage === 'Trash') {
        if (!note.isTrashed) return false;
      } else if (!query) {
        if (this.currentPage === 'Notes') {
          if (note.isArchived || note.isTrashed) return false;
        } else if (this.currentPage === 'Archive') {
          if (!note.isArchived || note.isTrashed) return false;
        } else if (this.currentPage === 'Reminders') {
          if (!note.reminder || note.isTrashed) return false;
        } else if (this.currentPage.startsWith('label:')) {
          if (note.isTrashed) return false;
          const labelId = parseInt(this.currentPage.substring(6), 10);
          const targetLabel = this.labels.find(l => l.id === labelId);
          const hasLabel = note.labels && Array.isArray(note.labels) && note.labels.some((l: any) => l.id === labelId || (targetLabel && l.name === targetLabel.name));
          if (!hasLabel) return false;
        }
      } else {
        if (note.isTrashed) return false;
      }

      // If search query is empty, return note based on tab filter
      if (!query) {
        return true;
      }

      // 2. Comprehensive substring search matching across all fields
      const titleMatch = note.title ? note.title.toLowerCase().includes(query) : false;
      const descMatch = note.description ? note.description.toLowerCase().includes(query) : false;
      const contentMatch = note.content ? note.content.toLowerCase().includes(query) : false;
      
      const labelMatch = note.labels && Array.isArray(note.labels)
        ? note.labels.some((l: any) => l.name && l.name.toLowerCase().includes(query))
        : false;

      const collabMatch = note.collaborators && Array.isArray(note.collaborators)
        ? note.collaborators.some((c: any) => 
            (c.email && c.email.toLowerCase().includes(query)) ||
            (c.firstName && c.firstName.toLowerCase().includes(query)) ||
            (c.lastName && c.lastName.toLowerCase().includes(query))
          )
        : false;

      return titleMatch || descMatch || contentMatch || labelMatch || collabMatch;
    });

    if (this.currentPage === 'Archive' || this.currentPage === 'Trash') {
      this.cachedPinnedNotes = [];
      this.cachedOtherNotes = this.cachedFilteredNotes;
    } else {
      this.cachedPinnedNotes = this.cachedFilteredNotes.filter(note => note.isPinned);
      this.cachedOtherNotes = this.cachedFilteredNotes.filter(note => !note.isPinned);
    }
  }

  get navbarTitle(): string {
    if (this.currentPage.startsWith('label:')) {
      const labelId = parseInt(this.currentPage.substring(6), 10);
      const label = this.labels.find(l => l.id === labelId);
      return label ? label.name : 'Label';
    }
    return this.currentPage;
  }

  get filteredNotes(): any[] {
    return this.cachedFilteredNotes;
  }

  get pinnedNotes(): any[] {
    return this.cachedPinnedNotes;
  }

  get otherNotes(): any[] {
    return this.cachedOtherNotes;
  }

  onNoteColorUpdated(data: any): void {
    const note = this.notes.find(n => n.id === data.id);
    if (note) {
      note.color = data.color;
      this.notes = [...this.notes];
      this.saveLocalNotes();
      this.updateFilteredNotes();
    }
    if (this.selectedNote && this.selectedNote.id === data.id) {
      this.selectedNote.color = data.color;
    }
    if (typeof data.id === 'number' && data.id < 1000000000000) {
      this.noteService.updateColor(data.id, data.color, note?.title, note?.content || note?.description).subscribe({
        next: () => {},
        error: (err: any) => console.log('Error updating note color on backend:', err)
      });
    }
  }

  changePage(page: string): void {
    if (window.innerWidth <= 768) {
      this.sidebarOpen = false;
    }

    if (page === 'Edit Labels') {
      this.openLabelsModal();
      return;
    }

    this.currentPage = page;

    if (page.startsWith('label:')) {
      const labelId = parseInt(page.substring(6), 10);
      const label = this.labels.find(l => l.id === labelId);
      this.icon = 'label';
      this.message = label ? `No notes with label "${label.name}"` : 'No notes with this label';
    } else {
      switch (page) {
        case 'Notes':
          this.icon = 'lightbulb';
          this.message = 'Notes you add appear here';
          break;
        case 'Reminders':
          this.icon = 'notifications';
          this.message = 'Notes with upcoming reminders appear here';
          break;
        case 'Archive':
          this.icon = 'archive';
          this.message = 'Your archived notes appear here';
          break;
        case 'Trash':
          this.icon = 'delete';
          this.message = 'No notes in Trash';
          break;
      }
    }

    this.updateFilteredNotes();
    this.refreshCurrentPage();
  }

  // Loaders
  loadUserProfile(): void {
    this.userService.getProfile().subscribe({
      next: (res: any) => {
        this.currentUserProfile = res.data;
      },
      error: err => console.log('Error loading user profile:', err)
    });
  }

  loadLabels(): void {
    this.noteService.getLabels().subscribe({
      next: (res: any) => {
        const fetched = res?.data ?? res;
        if (Array.isArray(fetched) && fetched.length > 0) {
          const serverIds = new Set(fetched.map((l: any) => l.id));
          const localOnly = this.labels.filter(l => typeof l.id === 'number' && l.id > 1000000000000 && !serverIds.has(l.id));
          this.labels = [...localOnly, ...fetched];
          this.saveLocalLabels();
        }
        if (this.showLabelsModal && this.labelError === 'Session expired. Please login again.') {
          this.labelError = '';
        }
      },
      error: (err: any) => {
        console.log('[loadLabels] ERROR (using local fallback):', err);
        this.loadLocalLabels();
      }
    });
  }

  // Labels management modal methods
  openLabelsModal(): void {
    this.showLabelsModal = true;
    this.labelError = '';
    this.labelSuccess = '';
  }

  closeLabelsModal(): void {
    this.showLabelsModal = false;
    this.newLabelName = '';
    this.editingLabelId = null;
    this.labelError = '';
    this.labelSuccess = '';
  }

  onCreateIconClick(): void {
    const name = this.newLabelName.trim();
    if (name) {
      this.createLabel();
    } else {
      this.newLabelName = '';
      this.createLabelFocused = false;
    }
  }

  createLabel(): void {
    const name = this.newLabelName.trim();
    if (!name) return;
    this.labelError = '';
    this.labelSuccess = '';

    const existing = this.labels.find(l => l.name && l.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      this.labelError = `Label "${existing.name}" already exists.`;
      return;
    }

    const newLabel = {
      id: Date.now(),
      name: name
    };

    // Optimistically add label
    this.labels = [...this.labels, newLabel];
    this.saveLocalLabels();

    const createdName = name;
    this.newLabelName = '';
    this.createLabelFocused = false;
    this.labelSuccess = `Label "${createdName}" created!`;
    setTimeout(() => this.labelSuccess = '', 2500);

    this.noteService.createLabel(name).subscribe({
      next: (res: any) => {
        const serverLabel = res?.data ?? res;
        if (serverLabel && serverLabel.id) {
          newLabel.id = serverLabel.id;
          this.saveLocalLabels();
        }
      },
      error: (err: any) => {
        console.log('Error creating label on backend (kept local label):', err);
      }
    });
  }

  startEditingLabel(label: any): void {
    this.editingLabelId = label.id;
    this.editingLabelName = label.name;
    this.labelError = '';
    this.labelSuccess = '';
  }

  saveLabelEdit(labelId: number): void {
    const name = this.editingLabelName.trim();
    if (!name) return;
    this.labelError = '';

    const label = this.labels.find(l => l.id === labelId);
    if (label) {
      label.name = name;
      this.saveLocalLabels();
    }
    this.editingLabelId = null;
    this.labelSuccess = 'Label updated!';
    setTimeout(() => this.labelSuccess = '', 2500);

    this.noteService.updateLabel(labelId, name).subscribe({
      next: () => {},
      error: (err: any) => console.log('Error updating label on backend:', err)
    });
  }

  deleteLabel(labelId: number): void {
    this.labelError = '';

    // 1. Remove label from local labels array
    this.labels = this.labels.filter(l => l.id !== labelId);
    this.saveLocalLabels();

    // 2. Remove label from notes array
    this.notes = this.notes.map(note => {
      if (note.labels && Array.isArray(note.labels)) {
        return {
          ...note,
          labels: note.labels.filter((l: any) => l.id !== labelId)
        };
      }
      return note;
    });
    this.updateFilteredNotes();
    this.saveLocalNotes();

    if (this.selectedNote && this.selectedNote.labels) {
      this.selectedNote.labels = this.selectedNote.labels.filter((l: any) => l.id !== labelId);
    }

    if (this.editingLabelId === labelId) {
      this.editingLabelId = null;
    }
    if (this.currentPage === 'label:' + labelId) {
      this.changePage('Notes');
    }

    if (typeof labelId === 'number' && labelId < 1000000000000) {
      this.noteService.deleteLabel(labelId).subscribe({
        next: () => {},
        error: (err: any) => console.log('Error deleting label on backend (kept local deletion):', err)
      });
    }
  }

  // Note-Label association methods
  addLabelToNote(noteId: number, labelId: number, labelObj?: any): void {
    const labelToAdd = labelObj || this.labels.find(l => l.id === labelId);
    const note = this.notes.find(n => n.id === noteId);

    if (note && labelToAdd) {
      if (!note.labels) note.labels = [];
      if (!note.labels.some((l: any) => l.id === labelToAdd.id || l.name === labelToAdd.name)) {
        note.labels = [...note.labels, labelToAdd];
        this.notes = [...this.notes];
        this.updateFilteredNotes();
        this.saveLocalNotes();
      }
    }
    if (this.selectedNote && this.selectedNote.id === noteId) {
      if (!this.selectedNote.labels) this.selectedNote.labels = [];
      if (labelToAdd && !this.selectedNote.labels.some((l: any) => l.id === labelToAdd.id || l.name === labelToAdd.name)) {
        this.selectedNote.labels = [...this.selectedNote.labels, labelToAdd];
      }
    }

    if (typeof labelId === 'number' && labelId < 1000000000000 && typeof noteId === 'number' && noteId < 1000000000000) {
      this.noteService.addLabelToNote(labelId, noteId).subscribe({
        next: () => {},
        error: err => console.log('Error adding label to note on backend:', err)
      });
    }
  }

  createLabelAndAddToNote(noteId: number, labelName: string): void {
    const name = labelName.trim();
    if (!name) return;

    const existing = this.labels.find(l => l.name && l.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      this.addLabelToNote(noteId, existing.id, existing);
      return;
    }

    this.noteService.createLabel(name).subscribe({
      next: (res: any) => {
        const serverLabel = res?.data ?? res;
        const createdLabel = (serverLabel && serverLabel.id) ? serverLabel : { id: Date.now(), name: name };
        if (!this.labels.some(l => l.name.toLowerCase() === name.toLowerCase())) {
          this.labels = [...this.labels, createdLabel];
          this.saveLocalLabels();
        }
        this.addLabelToNote(noteId, createdLabel.id, createdLabel);
      },
      error: (err: any) => {
        console.log('Error creating label on backend (falling back to local):', err);
        const createdLabel = { id: Date.now(), name: name };
        this.labels = [...this.labels, createdLabel];
        this.saveLocalLabels();
        this.addLabelToNote(noteId, createdLabel.id, createdLabel);
      }
    });
  }

  onCreateNewLabelForSelectedNote(labelName: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.selectedNote && this.selectedNote.id) {
      this.createLabelAndAddToNote(this.selectedNote.id, labelName);
      this.popupLabelSearchText = '';
    }
  }

  getFilteredLabelsForPopup(labels: any[]): any[] {
    if (!labels) return [];
    if (!this.popupLabelSearchText || !this.popupLabelSearchText.trim()) return labels;
    const query = this.popupLabelSearchText.trim().toLowerCase();
    return labels.filter(l => l.name && l.name.toLowerCase().includes(query));
  }

  removeLabelFromNote(noteId: number, labelId: number): void {
    const note = this.notes.find(n => n.id === noteId);
    if (note && note.labels) {
      note.labels = note.labels.filter((l: any) => l.id !== labelId);
      this.notes = [...this.notes];
      this.updateFilteredNotes();
      this.saveLocalNotes();
    }
    if (this.selectedNote && this.selectedNote.id === noteId) {
      this.selectedNote.labels = (this.selectedNote.labels || []).filter((l: any) => l.id !== labelId);
    }

    if (typeof labelId === 'number' && labelId < 1000000000000 && typeof noteId === 'number' && noteId < 1000000000000) {
      this.noteService.removeLabelFromNote(labelId, noteId).subscribe({
        next: () => {},
        error: err => console.log('Error removing label from note on backend:', err)
      });
    }
  }

  toggleLabelOnNote(noteId: number, labelId: number, event: any): void {
    const isChecked = event.target.checked;
    if (isChecked) {
      this.addLabelToNote(noteId, labelId);
    } else {
      this.removeLabelFromNote(noteId, labelId);
    }
  }

  isLabelOnNote(note: any, labelId: number): boolean {
    if (!note || !note.labels) return false;
    const targetLabel = this.labels ? this.labels.find((l: any) => l.id === labelId) : null;
    return note.labels.some((l: any) => l.id === labelId || (targetLabel && l.name && l.name.toLowerCase() === targetLabel.name.toLowerCase()));
  }

  // Reminder handlers
  onSetReminder(data: { noteId: number; reminderTime: string }): void {
    this.noteService.setReminder(data.noteId, data.reminderTime).subscribe({
      next: () => {
        this.loadNotes();
        if (this.selectedNote && this.selectedNote.id === data.noteId) {
          this.selectedNote.reminder = data.reminderTime;
        }
      },
      error: (err: any) => {
        console.log('Error setting reminder:', err);
        alert(err.error?.message || 'Error setting reminder');
      }
    });
  }

  onRemoveReminder(noteId: number): void {
    this.noteService.removeReminder(noteId).subscribe({
      next: () => {
        this.loadNotes();
        if (this.selectedNote && this.selectedNote.id === noteId) {
          this.selectedNote.reminder = null;
        }
      },
      error: (err: any) => console.log('Error removing reminder:', err)
    });
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

  formatEditedDate(dateStr: any): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  // Collaborators methods
  openCollaborators(note: any, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.activeCollaboratorNote = note;
    this.showCollaboratorsModal = true;
    this.newCollaboratorEmail = '';
    this.loadCollaborators(note.id);
  }

  closeCollaborators(): void {
    this.showCollaboratorsModal = false;
    this.activeCollaboratorNote = null;
    this.collaboratorsList = [];
    this.newCollaboratorEmail = '';
  }

  loadCollaborators(noteId: number): void {
    this.noteService.getCollaborators(noteId).subscribe({
      next: (res: any) => {
        this.collaboratorsList = res.data || [];
      },
      error: err => {
        console.log('Error loading collaborators:', err);
        this.collaboratorsList = [];
      }
    });
  }

  addCollaborator(): void {
    if (!this.newCollaboratorEmail.trim() || !this.activeCollaboratorNote) return;
    const noteId = this.activeCollaboratorNote.id;
    this.noteService.addCollaborator(noteId, this.newCollaboratorEmail.trim()).subscribe({
      next: () => {
        this.newCollaboratorEmail = '';
        this.loadCollaborators(noteId);
        this.loadNotes();
      },
      error: err => {
        let msg = err.error?.message || 'Error adding collaborator. Please check email.';
        if (typeof msg === 'string' && (msg.includes('duplicate key') || msg.includes('constraint') || msg.includes('violates unique constraint'))) {
          msg = 'This user is already a collaborator on this note.';
        }
        alert(msg);
        console.log('Error adding collaborator:', err);
      }
    });
  }

  removeCollaborator(email: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    if (!this.activeCollaboratorNote) return;
    const noteId = this.activeCollaboratorNote.id;
    this.noteService.removeCollaborator(noteId, email).subscribe({
      next: () => {
        this.collaboratorsList = this.collaboratorsList.filter(c => c.email !== email);
        if (this.activeCollaboratorNote && this.activeCollaboratorNote.collaborators) {
          this.activeCollaboratorNote.collaborators = this.activeCollaboratorNote.collaborators.filter((c: any) => c.email !== email);
        }
        this.loadCollaborators(noteId);
        this.loadNotes();
      },
      error: err => {
        console.log('Error removing collaborator:', err);
        alert(err.error?.message || 'Error removing collaborator');
      }
    });
  }

  confirmDeleteLabel(label: any, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.labelToDelete = label;
    this.showDeleteLabelConfirm = true;
  }

  cancelDeleteLabel(): void {
    this.labelToDelete = null;
    this.showDeleteLabelConfirm = false;
  }

  executeDeleteLabel(): void {
    if (!this.labelToDelete) return;
    const id = this.labelToDelete.id;
    this.deleteLabel(id);
    this.cancelDeleteLabel();
  }

  clearCreateInput(): void {
    this.newLabelName = '';
    this.createLabelFocused = false;
    this.labelError = '';
    this.labelSuccess = '';
  }
}