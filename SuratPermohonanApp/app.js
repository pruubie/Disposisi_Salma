const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

import LoginScreen from './public/login.html';


const app = express();
app.use(bodyParser.json());

// Menyajikan file statis dari folder 'public'
app.use(express.static("public"));

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "surat_permohonan",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
  console.log("Connected to MySQL Database!");
});

// Abstract class for User
class User {
  constructor(nim) {
    if (new.target === User) {
      throw new Error("Cannot instantiate an abstract class!");
    }
    this.nim = nim;
  }

  LoginScreen() {
    throw new Error("Abstract method must be implemented in subclass!");
  }
}

// Mahasiswa class (inherits User)
class Mahasiswa extends User {
  constructor(nim) {
    super(nim);
  }

  LoginScreen(password, callback) {
    const query = "SELECT * FROM users WHERE nim = ? AND role = 'mahasiswa'";
    db.query(query, [this.nim], (err, result) => {
      if (err) return callback(err, null);
      if (result.length === 0) return callback(new Error("User not found!"), null);

      bcrypt.compare(password, result[0].password, (err, match) => {
        if (err) return callback(err, null);
        if (!match) return callback(new Error("Invalid credentials!"), null);

        const token = jwt.sign({ nim: this.nim, role: "mahasiswa" }, "SECRET_KEY", { expiresIn: "1h" });
        callback(null, { token });
      });
    });
  }
}

// Tendik class (inherits User)
class Tendik extends User {
  constructor(nim) {
    super(nim);
  }

  LoginScreen(password, callback) {
    const query = "SELECT * FROM users WHERE nim = ? AND role = 'tendik'";
    db.query(query, [this.nim], (err, result) => {
      if (err) return callback(err, null);
      if (result.length === 0) return callback(new Error("User not found!"), null);

      bcrypt.compare(password, result[0].password, (err, match) => {
        if (err) return callback(err, null);
        if (!match) return callback(new Error("Invalid credentials!"), null);

        const token = jwt.sign({ nim: this.nim, role: "tendik" }, "SECRET_KEY", { expiresIn: "1h" });
        callback(null, { token });
      });
    });
  }
}

// Inner class for handling Surat
class Surat {
  constructor() {
    this.statuses = ["verifikator", "supervisor", "manajer", "wd", "dekan"];
  }

  static validateData(data) {
    if (!data.nim || !data.jenisSurat || !data.lampiran) {
      throw new Error("Incomplete data!");
    }
  }

  submitSurat(data, callback) {
    Surat.validateData(data);

    const query = "INSERT INTO surat (nim, jenis_surat, lampiran, status) VALUES (?, ?, ?, ?)";
    db.query(query, [data.nim, data.jenisSurat, data.lampiran, this.statuses[0]], (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  }

  updateStatus(suratId, newStatus, callback) {
    if (!this.statuses.includes(newStatus)) {
      throw new Error("Invalid status!");
    }

    const query = "UPDATE surat SET status = ? WHERE id = ?";
    db.query(query, [newStatus, suratId], (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  }

  static uploadDocument(suratId, filePath, callback) {
    const query = "UPDATE surat SET document_path = ?, status = 'completed' WHERE id = ?";
    db.query(query, [filePath, suratId], (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  }
}

// Exception handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: err.message });
});

// Routes
app.post("/login", (req, res) => {
  const { nim, password, role } = req.body;

  let user;
  if (role === "mahasiswa") user = new Mahasiswa(nim);
  else if (role === "tendik") user = new Tendik(nim);
  else return res.status(400).send({ error: "Invalid role!" });

  user.LoginScreen(password, (err, result) => {
    if (err) return res.status(401).send({ error: err.message });
    
    // Setelah login berhasil, arahkan ke halaman mahasiswa
    res.redirect("/dashboard.html");
  });
});

app.post("/submit-surat", (req, res) => {
  const surat = new Surat();

  try {
    surat.submitSurat(req.body, (err, result) => {
      if (err) return res.status(400).send({ error: err.message });
      res.send({ message: "Surat submitted successfully!", data: result });
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.put("/update-status/:id", (req, res) => {
  const surat = new Surat();
  const { id } = req.params;
  const { newStatus } = req.body;

  try {
    surat.updateStatus(id, newStatus, (err, result) => {
      if (err) return res.status(400).send({ error: err.message });
      res.send({ message: "Status updated successfully!", data: result });
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.post("/upload-document/:id", (req, res) => {
  const { id } = req.params;
  const { filePath } = req.body;

  Surat.uploadDocument(id, filePath, (err, result) => {
    if (err) return res.status(400).send({ error: err.message });
    res.send({ message: "Document uploaded successfully!", data: result });
  });
});

// Server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});