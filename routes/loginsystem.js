const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const {
  MongoClient
} = require('mongodb');
const {
  v4: uuidv4
} = require('uuid');
const router = express.Router();
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3500;

app.use(cors());
app.use(express.json());
router.use(cors());

const link = process.env.MONGODB_LINK;
const client = new MongoClient(link, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

client.connect((err) => {
  if (err) {
    console.error('Fout bij het verbinden met de database:', err);
    return;
  }
  console.log('Verbonden met de MongoDB-database');
});


app.use(express.static('public'));

app.get('/', (req, res) => {
  res.status(300).redirect('/index.html');
});


app.post('/register', async (req, res) => {
  const {
    username,
    email,
    password
  } = req.body;

  try {
    const account = await client
      .db('Augustus-web2')
      .collection('loginSysteem')
      .findOne({
        username
      });

    if (account) {
      return res.status(400).json({
        message: 'Deze gebruikersnaam is al in gebruik'
      });
    }

    const actualEmail = await client
      .db('Augustus-web2')
      .collection('loginSysteem')
      .findOne({
        email
      });

    if (actualEmail) {
      return res.status(400).json({
        message: 'Dit e-mail adres is al in gebruik'
      });
    }

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Vul a.u.b. alle verplichte velden in'
      });
    }

    const cryptedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await client.db('Augustus-web2').collection('loginSysteem').insertOne({
      userId,
      username,
      email,
      password: cryptedPassword,
    });

    res.status(200).json({
      message: 'succesvolle registratie',
      userId
    });
  } catch (error) {
    console.error('Fout bij het registreren:', error);
    res.status(500).json({
      message: 'Er is een fout opgetreden tijdens het registreren'
    });
  }
});

app.post('/login', async (req, res) => {
  const {
    email,
    password
  } = req.body;

  try {
    const actualUser = await client
      .db('Augustus-web2')
      .collection('loginSysteem')
      .findOne({
        email
      });

    if (!actualUser) {
      return res.status(400).json({
        message: 'Onjuist e-mailadres of wachtwoord'
      });
    }

    const passwordSimlair = await bcrypt.compare(password, actualUser.password);
    if (!passwordSimlair) {
      return res.status(400).json({
        message: 'Onjuist e-mailadres of wachtwoord'
      });
    }

    res.status(200).json({
      message: 'Succesvolle verbinding'
    });
  } catch (error) {
    console.error('Fout tijdens het verbinden:', error);
    res.status(500).json({
      message: 'Er is een fout opgetreden bij het inloggen'
    });
  }
});

app.post('/newChallenges', async (req, res) => {
  const {
    text,
    description,
    dataset,
    picture,
    result
  } = req.body;
  
  const {
    userId
  } = req.body;
  const challengeId = uuidv4();

  try {
    const actualUser = await client
      .db('Augustus-web2')
      .collection('loginSysteem')
      .findOne({
        userId
      });

    if (!actualUser) {
      return res.status(400).json({
        message: 'userID invalide'
      });
    }

    await client.db('Augustus-web2').collection('challenges').insertOne({
      challengeId,
      userId,
      text,
      description,
      dataset,
      picture,
      result,
    });

    res.status(200).json({
      message: 'Uitdaging succesvol gemaakt',
      challengeId,
      userId
    });
    
    
  } catch (error) {
    console.error('Fout bij het maken van de uitdaging:', error);
    res.status(500).json({
      message: 'Er is een fout opgetreden tijdens het maken van de uitdaging'
    });
  }
});



        
app.delete('/deleteChallenge/:challengeId', async (req, res) => {
  const { challengeId } = req.params;

  try {
    const deletedChallenge = await client
      .db('Augustus-web2')
      .collection('challenges')
      .findOneAndDelete({ challengeId });

    if (!deletedChallenge.value) {
      return res.status(400).json({
        message: 'Uitdaging niet gevonden of al verwijderd'
      });
    }

    res.status(200).json({
      message: 'Uitdaging succesvol verwijderd',
      challengeId
    });
  } catch (error) {
    console.error('Fout bij verwijderen van uitdaging:', error);
    res.status(500).json({
      message: 'Er is een fout opgetreden bij het verwijderen van de uitdaging'
    });
  }
});


app.get('/all-challenges', async (req, res) => {
  try {
    const challenges = await client
      .db('Augustus-web2')
      .collection('challenges')
      .find({})
      .toArray();

    res.status(200).json({ challenges });
  } catch (error) {
    console.error('Fout bij het ophalen van alle uitdagingen:', error);
    res.status(500).json({
      message: 'Er is een fout opgetreden bij het ophalen van alle uitdagingen'
    });
  }
});

app.get('/my-challenges', async (req, res) => {
  const { userId } = req.query;

  try {
    const challenges = await client
      .db('Augustus-web2')
      .collection('challenges')
      .find({ userId })
      .toArray();

    res.status(200).json({ challenges });
  } catch (error) {
    console.error('Fout bij ophalen van gebruikersuitdagingen:', error);
    res.status(500).json({
      message: 'Er is een fout opgetreden bij het ophalen van gebruikersuitdagingen'
    });
  }
});

app.post('/checkResult/:challengeId', async (req, res) => {
  const { challengeId } = req.params;
  const { result } = req.body;

  try {
    const challenge = await client
      .db('Augustus-web2')
      .collection('challenges')
      .findOne({
        challengeId
      });

    if (!challenge) {
      return res.status(404).json({ message: 'Défi introuvable' });
    }

    // Vérification du résultat soumis avec le résultat attendu du défi
    if (result === challenge.result) {
      res.status(200).json({ message: 'Challenge succeeded' });
    } else {
      res.status(400).json({ message: 'Challenge failed' });
    }
  } catch (error) {
    console.error('Error checking result:', error);
    res.status(500).json({ message: 'An error occurred while checking the result' });
  }
});


app.get('/challenges/:challengeId', async (req, res) => {
  const {
    challengeId
  } = req.params;

  try {
    const challenge = await client
      .db('Augustus-web2')
      .collection('challenges')
      .findOne({
        challengeId
      });

    if (!challenge) {
      return res.status(404).json({
        message: 'Défi introuvable'
      });
    }

    res.status(200).json(challenge);
  } catch (error) {
    console.error('Fout bij ophalen van gebruikersuitdagingen:', error);
    res.status(500).json({
      message: 'Er is een fout opgetreden bij het ophalen van gebruikersuitdagingen'
    });
  }
});

app.listen(port, () => {
  console.log(`Server is gestart op poort ${port}`);
});

module.exports = router;