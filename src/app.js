import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()


const corsOptions = {
    origin: "http://localhost:5173",
    methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
    credentials: true,
  };

app.use(cors(corsOptions));


app.use(express.json({limit: "50kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.route.js'


//routes declaration
app.use("/users", userRouter)

app.get('/', (req, res) => {
    res.send('hellow guyes')
})


export { app }