import { Play, Plus, Trash2, Edit3 } from "lucide-react";
import { useState, useEffect } from "react";
import { CreateNoteDialog } from "./createNoteModal";
import { noteApiService, CourseNote } from "../../../utils/noteApiService";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";

interface NotesProps {
  courseId: string;
  loading?: boolean;
}

export default function Notes({ courseId, loading = false }: NotesProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<CourseNote | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<CourseNote | null>(null);

  // Load notes when component mounts or courseId changes
  useEffect(() => {
    if (!courseId) {
      console.log('Notes: Missing courseId', { courseId });
      return;
    }

    const loadNotes = async () => {
      try {
        setLoadingNotes(true);
        setError(null);
        const courseIdNum = parseInt(courseId, 10);
        if (isNaN(courseIdNum)) {
          throw new Error('Invalid course ID');
        }
        const fetchedNotes = await noteApiService.getCourseNotes(courseIdNum);
        setNotes(fetchedNotes);
      } catch (err) {
        console.error('Error loading notes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load notes');
      } finally {
        setLoadingNotes(false);
      }
    };

    loadNotes();
  }, [courseId]);

  const handleCreateNote = async (note: { heading: string; content: string }) => {
    try {
      setError(null);
      const courseIdNum = parseInt(courseId, 10);
      if (isNaN(courseIdNum)) {
        throw new Error('Invalid course ID');
      }
      
      const createdNote = await noteApiService.createNote({
        courseId: courseIdNum,
        heading: note.heading,
        content: note.content
      });
      
      // Refresh notes list
      const updatedNotes = await noteApiService.getCourseNotes(courseIdNum);
      setNotes(updatedNotes);
    } catch (err) {
      console.error("Error creating note:", err);
      setError(err instanceof Error ? err.message : 'Failed to create note');
    }
  };

  const handleUpdateNote = async (noteId: string, updates: { heading: string; content: string }) => {
    try {
      setError(null);
      const noteIdNum = parseInt(noteId, 10);
      if (isNaN(noteIdNum)) {
        throw new Error('Invalid note ID');
      }
      
      await noteApiService.updateNote(noteIdNum, updates);
      setEditingNote(null);
      
      // Refresh notes list
      const courseIdNum = parseInt(courseId, 10);
      if (!isNaN(courseIdNum)) {
        const updatedNotes = await noteApiService.getCourseNotes(courseIdNum);
        setNotes(updatedNotes);
      }
    } catch (err) {
      console.error("Error updating note:", err);
      setError(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  const handleDeleteNote = (note: CourseNote) => {
    setNoteToDelete(note);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      setError(null);
      const noteIdNum = parseInt(noteToDelete.id, 10);
      if (isNaN(noteIdNum)) {
        throw new Error('Invalid note ID');
      }
      
      await noteApiService.deleteNote(noteIdNum);
      setDeleteConfirmOpen(false);
      setNoteToDelete(null);
      
      // Refresh notes list
      const courseIdNum = parseInt(courseId, 10);
      if (!isNaN(courseIdNum)) {
        const updatedNotes = await noteApiService.getCourseNotes(courseIdNum);
        setNotes(updatedNotes);
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const startEditing = (note: CourseNote) => {
    setEditingNote(note);
    setIsDialogOpen(true);
  };

  const handleEditSubmit = (note: { heading: string; content: string }) => {
    if (editingNote) {
      handleUpdateNote(editingNote.id, note);
    } else {
      handleCreateNote(note);
    }
    setEditingNote(null);
  };
  // Loading state
  if (loading || loadingNotes) {
    return (
      <div className="container mx-auto px-2 py-2">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-gray-500">Loading notes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-2 py-2">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <p className="text-red-500 text-center">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // No user state
  if (!user?.uid && !user?.email) {
    return (
      <div className="container mx-auto px-2 py-2">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <p className="text-gray-500 text-center">Please log in to view and create notes</p>
          <div className="text-sm text-gray-400">
            <p>Debug info:</p>
            <p>User object: {JSON.stringify(user, null, 2)}</p>
            <p>Course ID: {courseId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-2">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Course Notes</h2>
        <Button 
          onClick={() => {
            setEditingNote(null);
            setIsDialogOpen(true);
          }} 
          className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded flex items-center font-medium"
        >
          <span>Create A Note</span>
          <Plus size={16} className="ml-2" />
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Play size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-center mb-4">No notes yet. Create your first note to get started!</p>
          
          <Button
            onClick={() => {
              setEditingNote(null);
              setIsDialogOpen(true);
            }}
            className="bg-primary text-white hover:bg-primary/90 px-6 py-2 rounded flex items-center font-medium"
          >
            <Plus size={16} className="mr-2" />
            Create Your First Note
          </Button>
          
          
        </div>
      ) : (
        <div className="space-y-6">
          {notes.map((note) => (
            <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start flex-1">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mr-3 mt-1">
                    <Play size={14} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] text-[#000927] font-semibold font-['Poppins'] leading-relaxed mb-2">
                      {note.heading}
                    </h3>
                    <p className="text-[#181818] text-base font-normal font-['Kumbh_Sans'] leading-relaxed mb-2">
                      {note.content}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {note.createdAt.toLocaleDateString()} at {note.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(note)}
                    className="text-gray-500 hover:text-primary"
                  >
                    <Edit3 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNote(note)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateNoteDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingNote(null);
        }}
        onSubmit={handleEditSubmit}
        initialData={editingNote ? { heading: editingNote.heading, content: editingNote.content } : undefined}
        title={editingNote ? "Edit Note" : "Create New Note"}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {noteToDelete && (
            <div className="py-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-sm text-gray-900 mb-1">{noteToDelete.heading}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{noteToDelete.content}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setNoteToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteNote}
            >
              Delete Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}