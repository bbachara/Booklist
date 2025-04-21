window.onload = function () {
  console.log("App started");
};

class Book {
  constructor(title, author, id = Date.now()) {
    this.title = title;
    this.author = author;
    this.id = id;
  }
}

class BooksList {
  constructor() {
    this.books = [];
    this.currentPage = 1;
    this.booksPerPage = 5;
  }

  init() {
    document
      .getElementById("saveButton")
      .addEventListener("click", (e) => this.saveButton(e));
    document
      .getElementById("darkModeToggle")
      .addEventListener("click", () => this.toggleDarkMode());
    document
      .getElementById("sortTitle")
      .addEventListener("click", () => this.sortByTitle());
    document
      .getElementById("sortAuthor")
      .addEventListener("click", () => this.sortByAuthor());
    document
      .getElementById("searchInput")
      .addEventListener("input", (e) => this.searchBooks(e));
    document
      .getElementById("exportCSV")
      .addEventListener("click", () => this.exportToCSV());
    document
      .getElementById("exportPDF")
      .addEventListener("click", () => this.exportToPDF());

    this.loadDataFromStorage();
    this.renderTable();
    this.renderPagination();

    // Initialize drag-and-drop functionality
    this.initDragAndDrop();
  }

  toggleDarkMode() {
    document.body.classList.toggle("dark");
  }

  loadDataFromStorage() {
    const data = storage.getItems();
    if (data) {
      this.books = data;
    }
  }

  saveButton(e) {
    const title = document.getElementById("bookTitle").value;
    const author = document.getElementById("bookAuthor").value;

    if (title === "" || author === "") {
      alert("Please fill in all fields");
      return;
    }

    e.preventDefault();

    const book = new Book(title, author);
    this.addBook(book);
  }

  addBook(book) {
    this.books.push(book);
    storage.saveItems(this.books);
    this.renderTable();
    this.renderPagination();
    this.clearForm();
  }

  clearForm() {
    document.getElementById("bookTitle").value = "";
    document.getElementById("bookAuthor").value = "";
  }

  renderTable() {
    const tableBody = document.querySelector("#booksTable tbody");
    tableBody.innerHTML = "";

    const filteredBooks = this.filteredBooks();
    const currentBooks = this.paginateBooks(filteredBooks);

    currentBooks.forEach((book) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>
          <button class="edit btn btn-warning">Edit</button>
          <button class="delete btn btn-danger">Delete</button>
        </td>
      `;

      tr.querySelector(".edit").addEventListener("click", () =>
        this.editBookById(book.id)
      );
      tr.querySelector(".delete").addEventListener("click", () =>
        this.deleteBook(book.id)
      );

      tableBody.appendChild(tr);
    });

    this.initDragAndDrop();
  }

  paginateBooks(filteredBooks) {
    const startIndex = (this.currentPage - 1) * this.booksPerPage;
    return filteredBooks.slice(startIndex, startIndex + this.booksPerPage);
  }

  filteredBooks() {
    const searchValue = document
      .getElementById("searchInput")
      .value.toLowerCase();
    return this.books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchValue) ||
        book.author.toLowerCase().includes(searchValue)
    );
  }

  sortByTitle() {
    this.books.sort((a, b) => a.title.localeCompare(b.title));
    this.renderTable();
  }

  sortByAuthor() {
    this.books.sort((a, b) => a.author.localeCompare(b.author));
    this.renderTable();
  }

  deleteBook(bookId) {
    this.books = this.books.filter((book) => book.id !== bookId);
    storage.saveItems(this.books);
    this.renderTable();
    this.renderPagination();
  }

  editBookById(bookId) {
    const book = this.books.find((b) => b.id === bookId);
    document.getElementById("bookTitle").value = book.title;
    document.getElementById("bookAuthor").value = book.author;
    document.getElementById("saveButton").textContent = "Update";
    document.getElementById("saveButton").onclick = (e) =>
      this.updateBook(e, book);
  }

  updateBook(e, book) {
    e.preventDefault();
    const title = document.getElementById("bookTitle").value;
    const author = document.getElementById("bookAuthor").value;

    if (title === "" || author === "") {
      alert("Please fill in all fields");
      return;
    }

    book.title = title;
    book.author = author;
    storage.saveItems(this.books);
    this.renderTable();
    this.clearForm();
    document.getElementById("saveButton").textContent = "Save";
    document.getElementById("saveButton").onclick = (e) => this.saveButton(e);
  }

  renderPagination() {
    const pageCount = Math.ceil(this.books.length / this.booksPerPage);
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    for (let i = 1; i <= pageCount; i++) {
      const pageButton = document.createElement("button");
      pageButton.textContent = i;
      pageButton.classList.add("page-link");
      if (i === this.currentPage) pageButton.classList.add("active");
      pageButton.addEventListener("click", () => {
        this.currentPage = i;
        this.renderTable();
        this.renderPagination();
      });
      pagination.appendChild(pageButton);
    }
  }

  initDragAndDrop() {
    const tbody = document.querySelector("#booksTable tbody");
    new Sortable(tbody, {
      handle: ".drag-handle",
      onEnd: (evt) => {
        const movedItem = this.books.splice(evt.oldIndex, 1)[0];
        this.books.splice(evt.newIndex, 0, movedItem);
        storage.saveItems(this.books);
        this.renderTable();
      },
    });
  }

  exportToCSV() {
    const csvRows = [];
    const headers = ["Title", "Author"];
    csvRows.push(headers.join(","));

    this.books.forEach((book) => {
      const row = [book.title, book.author];
      csvRows.push(row.join(","));
    });

    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "books.csv";
    link.click();
  }

  exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title to the PDF
    doc.setFontSize(18);
    doc.text("Book List", 14, 20);

    // Prepare table data
    const tableData = this.books.map((book) => [book.title, book.author]);

    // Add the table to the PDF
    doc.autoTable({
      head: [["Title", "Author"]],
      body: tableData,
      startY: 30, // position the table starting from 30
      theme: "grid", // Optional: grid theme for better appearance
      margin: { horizontal: 10 }, // Add horizontal margin for better spacing
    });

    // Save the generated PDF
    doc.save("books.pdf");
  }
}

const storage = {
  saveItems(items) {
    localStorage.setItem("books", JSON.stringify(items));
  },
  getItems() {
    return JSON.parse(localStorage.getItem("books")) || [];
  },
};

const booksList = new BooksList();
booksList.init();
