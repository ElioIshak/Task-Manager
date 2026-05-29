import express from "express";
import cors from "cors";
import config from "./config";
import api from "./api";


const app = express();
const port = config.PORT || 3000;

app.use(cors({
    origin: config.CLIENT_ORIGIN
}));
app.use(express.json());
app.use('/api', api);

app.listen(port, () => {
    console.log("-----------------------------------------------------------------")
    console.log(`- Server is running on port ${port} at http://localhost:${port} -`);
    console.log("-----------------------------------------------------------------")
});
