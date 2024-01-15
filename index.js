import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3009;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Books",
  password: "postgres",
  port: 5432,
});
db.connect();

app.set("view engine", "ejs"); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Sample data, you can remove this or replace it with actual data
const listItems = [
    { id: 1, bookcover: 'book1.jpg', title: 'Book 1', author: 'Author 1', rating: 8, Summary: 'Summary 1' },
    { id: 2, bookcover: 'book2.jpg', title: 'Book 2', author: 'Author 2', rating: 9, Summary: 'Summary 2' }
];

app.get('/', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM books ORDER BY id ASC");
        const items = result.rows;

        // Fetch image information and update cover URLs dynamically
        for (const item of items) {
            if (!item.isbn) {
                console.error(`ISBN is null or undefined for item with ID ${item.id}`);
                continue; // Skip to the next iteration if isbn is null or undefined
            }

            try {
                const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${item.isbn}`);
                const bookcover = response.data.items[0].volumeInfo.imageLinks.thumbnail;


                // Further processing or use of the 'bookcover' variable
                // Assuming 'coverInfo' was meant to be 'bookcover' in the following line
                await db.query("UPDATE books SET bookcover = $1 WHERE id = $2", [bookcover, item.id]);
            } catch (error) {
                console.error(`Error fetching cover information for ISBN ${item.isbn}:`, error.message);
            }
        }

        res.render("index.ejs", { listItems: items });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// The rest of your code remains unchanged...

app.get("/:id", async(req, res) => {
    try {
        const result = await db.query("SELECT * FROM books WHERE id = $1", [req.params.id]);
        const formData = result.rows[0];
        const notes = formData.notes;

        res.render("notes.ejs", {
            Title: formData.Title,
            Notes: notes
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
});



app.get('/add', (req, res) => {
  res.render("add.ejs");
});

// Handle the form submission and insert the new book into the database
// Handle the form submission and insert the new book into the database
app.post('/add', async (req, res) => {
    try {
        const { title, author, rating, summary, bookcover, isbn,notes } = req.body;
  
        // Insert the new book into the database without specifying the id column
        await db.query("INSERT INTO books (book_name, author, rating, summary,notes, isbn) VALUES ($1, $2, $3, $4, $5, $6)",
            [title, author, rating, summary,notes, isbn]);
  
        // Redirect to the home page after adding the book
        res.redirect('/');
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
  });
  
app.post("/delete/:id", async (req, res) => {
    try{
        let deleteBook = await db.query('DELETE FROM books WHERE id=$1 RETURNING *', [req.params.id])
        console.log(deleteBook);
        res.redirect("/");
        }catch(error){
            console.log(error)
            }
            });
            // Start the server on port 3000 if it's not already


            // Edit route
app.get('/edit/:id', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM books WHERE id = $1", [req.params.id]);
        const formData = result.rows[0];

        res.render("edit.ejs", {
            id: formData.id,
            title: formData.book_name,
            author: formData.author,
            rating: formData.rating,
            summary: formData.summary,
            bookcover: formData.bookcover,
            isbn: formData.isbn,
            notes: formData.notes
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
});

// Edit form submission
app.post('/edit/:id', async (req, res) => {
    try {
        const { title, author, rating, summary, bookcover, isbn, notes } = req.body;
        const id = req.params.id;

        await db.query("UPDATE books SET book_name = $1, author = $2, rating = $3, summary = $4, bookcover = $5, isbn = $6, notes = $7 WHERE id = $8",
            [title, author, rating, summary, bookcover, isbn, notes, id]);

        res.redirect('/');
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
