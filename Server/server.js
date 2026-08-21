import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import adminRoutes from './routes/admin.routes.js';   
import studentRoutes from "./routes/student.routes.js";
import examRoutes from "./routes/exam.routes.js"


const app = express();

connectDB();

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => res.send('SVGU Quiz API running'));

//Routes

app.use(notFound);
app.use(errorHandler);
app.use('/api/admin', adminRoutes)
app.use("/api/student",studentRoutes)
app.use("/api/exam" , examRoutes)


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));