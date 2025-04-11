document.addEventListener("DOMContentLoaded", () => {
  const newNoteBtn = document.getElementById("new-note-btn");
  const viewNotesBtn = document.getElementById("view-notes-btn");
  const noteForm = document.getElementById("note-form");
  const saveBtn = document.getElementById("save-note-btn");
  const cancelBtn = document.getElementById("cancel-note-btn");
  const deleteBtn = document.getElementById("delete-note-btn"); // Delete button
  const titleInput = document.getElementById("note-title");
  const urlInput = document.getElementById("note-url");
  const contentInput = document.getElementById("note-content");
  const saveMessage = document.getElementById("save-message");
  const savedNotesDiv = document.getElementById("saved-notes");
  const colorOptions = document.querySelectorAll(".color-option");

  let currentNoteId = null; // Tracks the note being edited; null means new note
  let selectedColor = "note-yellow";

  // Handle color selection
  colorOptions.forEach((option) => {
    option.addEventListener("click", () => {
      colorOptions.forEach((o) => o.classList.remove("selected"));
      option.classList.add("selected");
      selectedColor = option.getAttribute("data-color");
    });
  });

  newNoteBtn.addEventListener("click", async () => {
    noteForm.style.display = "block";
    savedNotesDiv.style.display = "none";
    currentNoteId = null; // Reset for new note
    deleteBtn.style.display = "none"; // Hide delete button for new note
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    urlInput.value = tab.url; // Auto-fill the URL field from the current tab
    resetForm();
  });

  viewNotesBtn.addEventListener("click", () => {
    noteForm.style.display = "none";
    saveMessage.style.display = "none";
    loadNotes();
  });

  cancelBtn.addEventListener("click", () => {
    noteForm.style.display = "none";
    resetForm();
  });

  saveBtn.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !url || !content) return;

    // Create note object. If editing, reuse the note ID; otherwise, generate a new one.
    const newNote = {
      id: currentNoteId || Date.now(),
      title,
      url,
      content,
      color: selectedColor,
    };

    chrome.storage.local.get(["notes"], (result) => {
      const notes = result.notes || [];
      if (currentNoteId) {
        // Update existing note.
        const index = notes.findIndex((note) => note.id === currentNoteId);
        if (index > -1) {
          notes[index] = newNote;
        }
      } else {
        // Add new note.
        notes.push(newNote);
      }
      chrome.storage.local.set({ notes }, () => {
        saveMessage.style.display = "block";
        resetForm();
        setTimeout(() => {
          saveMessage.style.display = "none";
          noteForm.style.display = "none";
        }, 1500);
        loadNotes();
      });
    });
  });

  // Delete note functionality
  deleteBtn.addEventListener("click", () => {
    if (!currentNoteId) return;
    chrome.storage.local.get(["notes"], (result) => {
      let notes = result.notes || [];
      notes = notes.filter((note) => note.id !== currentNoteId);
      chrome.storage.local.set({ notes }, () => {
        alert("Note deleted!");
        noteForm.style.display = "none";
        resetForm();
        loadNotes();
      });
    });
  });

  // Load saved notes, sorted by recency (newest first)
  function loadNotes() {
    chrome.storage.local.get(["notes"], (result) => {
      let notes = result.notes || [];
      savedNotesDiv.innerHTML = "";
      savedNotesDiv.style.display = "block";

      if (notes.length === 0) {
        savedNotesDiv.innerHTML = "<p>No notes yet.</p>";
        return;
      }

      // Sort notes in descending order by ID (timestamp)
      notes.sort((a, b) => b.id - a.id);

      notes.forEach((note) => {
        const noteDiv = document.createElement("div");
        noteDiv.className = `note-card ${note.color}`;
        noteDiv.innerHTML = `
              <strong>${note.title}</strong><br>
              <small>${note.url}</small><br>
              <p>${note.content}</p>
            `;
        // Set up click event to open the note for editing/viewing.
        noteDiv.addEventListener("click", () => {
          currentNoteId = note.id;
          noteForm.style.display = "block";
          savedNotesDiv.style.display = "none";
          titleInput.value = note.title;
          urlInput.value = note.url;
          contentInput.value = note.content;
          selectedColor = note.color;
          colorOptions.forEach((o) => o.classList.remove("selected"));
          document
            .querySelector(`.color-option[data-color="${note.color}"]`)
            .classList.add("selected");
          // Display the delete button when editing an existing note.
          deleteBtn.style.display = "inline-block";
        });
        savedNotesDiv.appendChild(noteDiv);
      });
    });
  }

  function resetForm() {
    titleInput.value = "";
    urlInput.value = "";
    contentInput.value = "";
    selectedColor = "note-yellow";
    currentNoteId = null;
    colorOptions.forEach((o) => o.classList.remove("selected"));
    document.querySelector(".color-yellow").classList.add("selected");
    deleteBtn.style.display = "none";
  }
});
