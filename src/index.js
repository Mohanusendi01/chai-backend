import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server running at PORT: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB Connection Failed: ", err);
  });

/*
(async ()=>{
    try {

        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR: ",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`app lisning on port: ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("ERROR: ",error)
        throw error
        
    }
})()
*/
