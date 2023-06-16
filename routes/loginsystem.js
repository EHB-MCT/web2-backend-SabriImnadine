const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const {
  MongoClient
} = require('mongodb');

const router = express.Router();
require('dotenv').config();
 
const app = express();

const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
router.use(cors());
router.use(express.json());

// Config
const Link = process.env.MONGODB_LINK;
const client = new MongoClient(Link, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Connection
client.connect((err) => {
  if (err) {
    console.error('Error bij de connectie van de database :', err);
    return;
  }
  console.log('Connected in MongoDB');
});

// Inschrijving
app.post('/register', async (req, res) => {
  const {
    username,
    email,
    password
  } = req.body;
  
  try {
    // Check
    const account = await client.db('Augustus-web2').collection('loginSysteem').findOne({
      username
    });
    if (account) {
      return res.status(400).json({
        message: 'User al gebruikt'
      });
    }

    // Check
    const mail = await client.db('Augustus-web2').collection('loginSysteem').findOne({
      email
    });
    if (mail) {
      return res.status(400).json({
        message: 'Email al gebruikt'
      });
    }

    // Check
    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Elke veld moet ingevuld worden'
      });
    }

    
    const cryptedPassword = await bcrypt.hash(password, 10);

    // New user in database
    await client.db('Augustus-web2').collection('loginSysteem').insertOne({
      username,
      email,
      password: cryptedPassword,
    });

    res.status(200).json({
      message: 'Inschrijving voltooid'
    });
  } catch (error) {
    console.error('Error tijdens inscrijving :', error);
    res.status(500).json({
      message: 'Een error tijdens inschrijving'
    });
  }
});

// Connexion
app.post('/login', async (req, res) => {
  const {
    email,
    password
  } = req.body;

  try {
    
    const account = await client.db('Augustus-web2').collection('loginSysteem').findOne({
      email
    });
    if (!account) {
      return res.status(400).json({
        message: 'Mail or password incorrect'
      });
    }

    
    const passwordMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatch) {
      return res.status(400).json({
        message: 'Mail or password incorrect'
      });
    }

    res.status(200).json({
      message: 'Connexion succeed'
    });
  } catch (error) {
    console.error('Error tijdens connectie :', error);
    res.status(500).json({
      message: 'Error tijdens connectie'
    });
  }
});

// Start
app.listen(port, () => {
  console.log(`Server started in port ${port}`);
});

module.exports = router;