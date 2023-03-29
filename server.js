const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
// const User = require("./user");
mongoose.set('strictQuery', true);
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

app.set("view engine", "ejs");
const Message = mongoose.model('Message', {
    name: String,
    message: String
})

mongoose.connect('mongodb://127.0.0.1:27017/auth_demo_app',{ useNewUrlParser: true }, { useMongoClient: true });
app.get('/chat/' ,async(req,res)=>{
  let id = req.params.id;
  let find1=await User.findById(id);
console.log(find1);
   res.render('chat',{id:id});
})
app.get('/messages', async (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages);
    })
})

app.get('/messages/:user', async (req, res) => {
    const user = req.params.user
    Message.find({name: user},(err, messages)=> {
      res.send(messages);
    })
})

app.post('/messages', async (req, res) => {
    try{
        const message = new Message(req.body);
    
        const savedMessage = await message.save()
          console.log('saved');
    
        const censored = await Message.findOne({message:'badword'});
          if(censored)
            await Message.remove({_id: censored.id})
          else
            io.emit('message', req.body);
          res.sendStatus(200);
      }
      catch (error){
        res.sendStatus(500);
        return console.log('error',error);
      }
      finally{
        console.log('Message Posted')
      }
})

io.on('connection', () => {
    console.log('a user is connected')
})



const server = http.listen(6500, () => {
    console.log('server is running on port', server.address().port);
});


