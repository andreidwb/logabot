import express, { Request, Response } from "express";
import pinoHttp from "pino-http";
import logger from "./util/logger";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));

app.get('/', (req: Request, res: Response) => res.send('Hello World!'));
app.get("/api/health", (req, res) => res.send({ message: "OK" }));
app.get("/api/nok", (req, res) => { throw new Error("test"); });

export { app };