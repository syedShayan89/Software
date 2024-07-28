import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from './app.js'
import bodyParser from "body-parser";


app.use(bodyParser.json());


dotenv.config({
    path: './env'
});


connectDB()
.then(() => {app.listen(process.env.PORT || 8000, () => 
    {console.log (`server is running on PORT : ${process.env.PORT}`)
  })
})
.catch((err) => {
    console.log (`mongodb connection failed !!! `, err)
});





























// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error" ,(error) =>{
//             console.log("error ", error);
//             throw error
//         })

//         app.listen(process.env.PORT, ()=>{
//             console.log(`app is listing on port ${process.env.PORT}`)
//         })

//     } catch (error) {
//         console.error("ERROR: ", error)
//         throw err
//     }
// })()