const express = require("express"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    User = require("./user"),
    Blog = require("./blog"),
    passport = require("passport"),

    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose");
const ObjectId = require('mongodb').ObjectId;
const path= require('path');
let session = require("express-session");
const cookieParser = require("cookie-parser");





const multer = require('multer');
const alert = require('alert');

mongoose.connect("mongodb://127.0.0.1:27017/auth_demo_app",{ useNewUrlParser: true }, { useMongoClient: true });
const app = express();;
mongoose.set('strictQuery', true);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const http = require('http').Server(app);
const io = require('socket.io')(http);


app.set("view engine", "ejs");
app.use(express.static('public'));
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage });
app.use(bodyParser.urlencoded({ extended: true }));
const oneDay = 1000 * 60 * 60 * 24;
app.use(require("express-session")({
    secret: "secret",
    cookie: { maxAge: oneDay },
    resave: false,
    saveUninitialized: false
}));





app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username
        });
    });
}));
passport.deserializeUser(User.deserializeUser());

app.get("/", async (req, res) => {
    res.render('home',);

});

app.get("/secret", isLoggedIn, async (req, res) => {
    const user = await User.find();
    res.render("secret",{user});
});
app.get("/update", isLoggedIn, async (req, res) => {

    res.render("update");

});
app.get("/profile", isLoggedIn, async (req, res) => {
    const id = req.user.id;
    const user = await User.findOne({_id:id});
    res.render("profile",{user});
});



app.get("/register", async (req, res) => {
    res.render("register");
});


app.post("/register", upload.single('image'), function (req, res, next) {
    const { filename } = req.file;
    User.register(new User({ fname: req.body.fname, lname: req.body.lname, image: filename, username: req.body.username, phone: req.body.phone }), req.body.password, function (err, user) {

        if (err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/secret");

        });
    });
});





// Login Form
app.get("/login", async (req, res) => {
    session=req.session;
    res.render("login",);
    
});

app.post("/login/", passport.authenticate("local", {

    failureRedirect: "/login"
}), async (req, res) => {
    try {
        const id = req.params.id;
        const { username, password } = req.body;
        // const user = await User.findOne({ username });
        if(req.body.username == username && req.body.password == password){
          const  session=req.session;
            session.userid=req.body.username;
            const user = await User.findOne({ username });
            console.log(req.session)
            // res.send(`Hey there, welcome <a href=\'/logout'>click to logout</a>`);
            res.render('profile',{user});
        }
        else{
            res.send('Invalid username or password');
        }


    //     if (user) {

    //         res.render('profile', { user });
    //     }
    } catch (error) {
        console.log(error);
        res.redirect('/error.html');
    }
   
});
app.get("/update/up", isLoggedIn, async (req, res) => {
    try {
        const id = req.user.id;
        console.log(id)
       
        const user = await User.findOne({ _id: id });
        console.log("hello")
        console.log(user)

        console.log(req.query.fname);

        user.fname = req.query.fname;
        user.lname = req.query.lname;

        user.username = req.query.username;
        user.phone = req.query.phone;


        user.save();
        res.render("profile", { user });

    } catch (error) {
        console.log(error);
        res.redirect('/error.html');
    }


});

app.get('/blog', async (req, res) => {
    const blogs = await Blog.find().sort('-date');

    res.render('blog', { blogs });
});
app.get('/blogs', async (req, res) => {
    const blogs = await Blog.find().sort('-date');

    res.render('blogs', { blogs });
});

app.post('/blogs', upload.single('image'), async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const { username, content } = req.body;
    const { filename } = req.file;

    const blog = new Blog({
        username,
        content,
        image: filename,
        date: new Date()
    });

    await blog.save();
    res.redirect('/blogs')
});
app.get('/blog/:id/edit', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(id);
        const blog = await Blog.findOne({ _id: id });
        console.log(blog)
        res.render('edit', { blog });
    } catch (error) {
        console.log(error);
        res.send('Error retrieving user');
    }
});

app.post("/blog/:id/update", upload.single('image'), async (req, res) => {
    // const imagePath = req.file.path.replace('public/uploads');
    try {
        let details = [];
        const id = req.params.id;
        console.log("my id is",id);
        let blogs = {};
        blogs = await Blog.findOne({ _id: req.params.id });
        console.log(typeof (blogs));
        console.log(blogs);
        const{filename}=req.file;
        blogs.image =filename;
            blogs.username = req.body.username,
            blogs.content = req.body.content,
        
          

        // user.save();
         blogs.save();
         console.log(blogs);

        res.send("updated");
        // res.render('blogs', { blogs});

    } catch (error) {
        console.log(error);
        res.send('Error updating user');
    }
})



app.get("/delete", isLoggedIn, async (req, res) => {
    try {
        const id = req.user.id;
        console.log(id)
        const user = await User.findOne({ _id: id });
        console.log(user)
        if (user) {
            const user1 = await user.deleteOne({})
            alert("Deleted")
            res.redirect('/login')

        } else {
            console.log("wrong")
            res.redirect('/error.html')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error.html');
    }
});

//chat 
// app.get('/chat' ,async(req,res)=>{
//     const user = await User.find();
//     res.render("chat",{user});
    
//  })
const Message = mongoose.model('Message', {
    name: String,
    message: String
})


 app.get('/register/:id/chat' , isLoggedIn,async(req,res)=>{
try {
    const id = req.params.id;
    console.log(id);
    const user1 = await User.findOne({ _id: id });
    console.log(user1)
    res.render('chat', { user1});
} catch (error) {
    console.log(error);
    res.send('Error retrieving user');
}
  })
  app.post('/register/:id/chats', isLoggedIn,async(req,res)=>{
    try {
        const id = req.user.id;
        console.log(id)
        const user1 = await User.findOne({ _id: id });
        console.log(user1)
        if (user1) {
            res.render('chat',{user1});

        } else {
            console.log("wrong")
            res.redirect('/error.html')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error.html');
    }

  })
  app.get('/messages',  isLoggedIn, async (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages);
    })
})
  
  app.get('/messages/:user',  isLoggedIn,async (req, res) => {
      const user = req.body.user
      Message.find({name: user},(err, messages)=> {
        res.send(messages);
      })
  })
  
  app.post('/messages', isLoggedIn, async (req, res) => {
      try{
          const message = new Message(req.body);
      
          const savedMessage = await message.save()
            console.log('saved');
      
          const censored = await Message.findOne({message:'badword'});
            if(censored)
              await Message.remove({_id: censored.id})
            else
              io.sockets.emit('message', req.body);
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
  //to create a new
  io.on('connection', () => {
      console.log('a user is connected')
  })
  
  
  
  
  




// Logout
app.get("/logout", isLoggedIn, async (req, res) => {
    req.logout(function (err) {
        req.session.destroy();
        if (err) { return next(err); }
        res.redirect('/');
    });
});


//to get profile page
app.get("/profile", isLoggedIn, async (req, res) => {
   
});
// app.get('/chat', async (req, res) => {
//     const blogs = await Blog.find().sort('-date');

//     res.render('blogs', { blogs });
// });

// check isLoggedIn
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

  const server = http.listen(6501, () => {
      console.log('server is running on port', server.address().port);
  });



// app.listen(6500, () => console.log('Server started on port 6500'));
