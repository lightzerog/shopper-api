import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./database/data-source";
import { container } from "tsyringe";
import { MeasureController } from "./controller/measure_controller";
import * as Validate from  "./middleware/validate"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

dotenv.config();
AppDataSource.initialize();

let measureController = container.resolve(MeasureController);

let app = express();
app.use(express.json());
app.post("/upload", measureController.uploadMeasure);
app.patch("/confirm", measureController.patchMeasure);
app.get("/:customerCode/list", measureController.getMeasureFromCustomer);

app.use(Validate.validateJSON);

let apiKey = String(process.env.GEMINI_API_KEY);
export let genAI = new GoogleGenerativeAI(apiKey);
export let fileManager = new GoogleAIFileManager(apiKey);

let port = 3000;
app.listen(port, () => console.log('Port opened in ' + port));