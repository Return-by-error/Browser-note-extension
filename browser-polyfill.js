document.addEventListener("DOMContentLoaded", () => {
  const newNoteBtn = document.getElementById("new-note-btn");
  const viewNotesBtn = document.getElementById("view-notes-btn");
  const noteForm = document.getElementById("note-form");
  const saveBtn = document.getElementById("save-note-btn");
  const cancelBtn = document.getElementById("cancel-note-btn");
  const deleteBtn = document.getElementById("delete-note-btn");
  const titleInput = document.getElementById("note-title");
  const urlInput = document.getElementById("note-url");
  const contentInput = document.getElementById("note-content");
  const saveMessage = document.getElementById("save-message");
  const savedNotesDiv = document.getElementById("saved-notes");
  const colorOptions = document.querySelectorAll(".color-option");

  let currentNoteId = null;
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
    resetForm();
    noteForm.style.display = "block";
    savedNotesDiv.style.display = "none";
    currentNoteId = null;
    deleteBtn.style.display = "none";
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      urlInput.value = tabs[0].url; // Auto-fill the URL
    } catch (error) {
      console.error("Error getting current tab:", error);
    }
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

  saveBtn.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !url || !content) return;

    // Create note object. If editing, reuse the note ID
    const newNote = {
      id: currentNoteId || Date.now(),
      title,
      url,
      content,
      color: selectedColor,
    };

    try {
      const result = await browser.storage.local.get("notes");
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
      await browser.storage.local.set({ notes });
      saveMessage.style.display = "block";
      resetForm();
      setTimeout(() => {
        saveMessage.style.display = "none";
        noteForm.style.display = "none";
      }, 1500);
      loadNotes();
    } catch (error) {
      console.error("Error saving note:", error);
    }
  });

  // Delete note
  deleteBtn.addEventListener("click", async () => {
    if (!currentNoteId) return;
    try {
      const result = await browser.storage.local.get("notes");
      let notes = result.notes || [];
      notes = notes.filter((note) => note.id !== currentNoteId);
      await browser.storage.local.set({ notes });
      alert("Note deleted!");
      noteForm.style.display = "none";
      resetForm();
      loadNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  });

  // Load saved notes, sorted by recency (newest first) and filtered by the current URL.
  async function loadNotes() {
    try {
      const result = await browser.storage.local.get("notes");
      let notes = result.notes || [];
      // Get the current tab's URL to filter notes.
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentUrl = tabs[0].url;
      // Only include notes with the same URL.
      notes = notes.filter((note) => note.url === currentUrl);
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
    } catch (error) {
      console.error("Error loading notes:", error);
    }
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
