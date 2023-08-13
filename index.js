const express = require('express');
const app = express();
const loginRoutes = require('./routes/loginsystem'); 

const port = process.env.PORT || 3000;

app.use('/loginsystem', loginRoutes);


app.listen(3000, () => {
  console.log(`Server started in port 3000`);
 
});


