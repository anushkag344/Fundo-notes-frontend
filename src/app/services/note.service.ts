import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoteService {

  private apiUrl = 'https://fundo-notes-backend.onrender.com/api/notes';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  createNote(note: any): Observable<any> {
    return this.http.post(this.apiUrl, note, this.getHeaders());
  }

  getNotes(): Observable<any> {
    return this.http.get(this.apiUrl, this.getHeaders());
  }

  updateNote(id: number, note: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, note, this.getHeaders());
  }

  updateColor(id: number, color: string, title?: string, content?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { title: title || '', content: content || '', color }, this.getHeaders());
  }

  deleteNote(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  togglePin(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/pin`, {}, this.getHeaders());
  }
  toggleArchive(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/archive`, {}, this.getHeaders());
  }

  toggleTrash(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/trash`, {}, this.getHeaders());
  }

  setReminder(id: number, reminderTime: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/reminder`, { reminderTime }, this.getHeaders());
  }

  removeReminder(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/reminder`, this.getHeaders());
  }
getArchivedNotes(): Observable<any> {
  return this.http.get(`${this.apiUrl}/archived`, this.getHeaders());
}
getTrashedNotes(): Observable<any> {
  return this.http.get(`${this.apiUrl}/trash`, this.getHeaders());
}

getPinnedNotes(): Observable<any> {
  return this.http.get(`${this.apiUrl}/pinned`, this.getHeaders());
}

getLabels(): Observable<any> {
  return this.http.get('http://localhost:8080/api/labels', this.getHeaders());
}

createLabel(name: string): Observable<any> {
  return this.http.post('http://localhost:8080/api/labels', { name }, this.getHeaders());
}

updateLabel(id: number, name: string): Observable<any> {
  return this.http.put(`http://localhost:8080/api/labels/${id}`, { name }, this.getHeaders());
}

deleteLabel(id: number): Observable<any> {
  return this.http.delete(`http://localhost:8080/api/labels/${id}`, this.getHeaders());
}

addLabelToNote(labelId: number, noteId: number): Observable<any> {
  return this.http.post(`http://localhost:8080/api/labels/${labelId}/notes/${noteId}`, {}, this.getHeaders());
}


removeLabelFromNote(labelId: number, noteId: number): Observable<any> {
  return this.http.delete(`http://localhost:8080/api/labels/${labelId}/notes/${noteId}`, this.getHeaders());
}

getNotesByLabel(labelId: number): Observable<any> {
  return this.http.get(`http://localhost:8080/api/labels/${labelId}/notes`, this.getHeaders());
}

getCollaborators(noteId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/${noteId}/collaborators`, this.getHeaders());
}

addCollaborator(noteId: number, email: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/${noteId}/collaborators`, { email, permission: 'READ' }, this.getHeaders());
}

removeCollaborator(noteId: number, email: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${noteId}/collaborators/${email}`, this.getHeaders());
}

getSharedNotes(): Observable<any> {
  return this.http.get(`${this.apiUrl}/shared`, this.getHeaders());
}
}