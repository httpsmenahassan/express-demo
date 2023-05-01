const express = require('express')
const app = express()
const bodyParser = require('body-parser') // allows us the look at the request coming in, particularly the body, makes req.body possible
const MongoClient = require('mongodb').MongoClient // how we're going to connect to the database

var db, collection;

// string used to connect to database via mongo atlas
const url = "mongodb+srv://demo:demo@cluster0-q2ojb.mongodb.net/test?retryWrites=true";
const dbName = "demo";

app.listen(3000, () => {
    MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
        if(error) {
            throw error;
        }
        db = client.db(dbName);
        console.log("Connected to `" + dbName + "`!");
    });
});

app.set('view engine', 'ejs') // telling express and EJS to expect EJS
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json()) // everything up to this point is boiler plate
app.use(express.static('public'))

// api
app.get('/', (req, res) => {
  db.collection('messages').find().toArray((err, result) => {
    if (err) return console.log(err)
    res.render('index.ejs', {messages: result})
  })
})

app.post('/messages', (req, res) => {
  //req.body is almost like a document.querySelector
  // when we submit the form, we get this huge chunk of text from the server
  db.collection('messages').insertOne({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database')
    res.redirect('/') // respond by telling them to redirect back to the main page because now there's a new value in the database and the page needs to be refreshed to display the new data 
  })
})


// no seperate count for dislike?
// have separate messages for thumbs down
// if thumbs down is going back as NaN -- means it's expecting it to be a number but you may be working with a string rather than a number

app.put('/messages', (req, res) => {
  db.collection('messages')
  .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    $set: {
      thumbUp:req.body.thumbUp + 1
    }
  }, {
    sort: {_id: -1},
    // advanced piece upsert:true
    upsert: true
  }, (err, result) => {
    if (err) return res.send(err)
    res.send(result)
  })
})

// Why do you need different paths for puts? If you have the same path for two different actions, the put will never reach the second action
app.put('/messages/thumbDown', (req, res) => {
  db.collection('messages')
  .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    $set: {
      thumbUp:req.body.thumbUp - 1
    }
  }, {
    sort: {_id: -1},
    upsert: true
  }, (err, result) => {
    if (err) return res.send(err)
    res.send(result)
  })
})



app.delete('/messages', (req, res) => {
  // find the one message trash can selected and delete it
  db.collection('messages').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
    if (err) return res.send(500, err)
    res.send('Message deleted!')
  })
})
