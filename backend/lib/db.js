import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

//function to connect to the mongodb database

export const connectDB = async() => {
  try {

   

    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)  //actual connection

     mongoose.connection.on('connected', () => console.log('Database connected'))

  } catch (error) {

    console.log('Unable to connect to the database', error);

  }
}