import { Customer } from "../models/customer";
import { MeasureResponse, UploadRequest } from "../usecases/responses";
import { Measure } from "../models/measure";
import { CustomerRepository } from "../repositories/customer_repository";
import { MeasureRepository } from "../repositories/measure_repository";
import { inject, injectable } from "tsyringe";
import { fileManager, genAI } from "../server";
import path from "path";
import fs from "fs";
import { UploadFileResponse } from "@google/generative-ai/server";

@injectable()
export class MeasureService {
  constructor(
    @inject(MeasureRepository) private measureRepository: MeasureRepository,
    @inject(CustomerRepository) private customerRepository: CustomerRepository
  ) {}

  async createMeasure(
    upload: UploadRequest,
    measureValue: number,
    imageUrl: string
  ): Promise<Measure | void> {
    const data = await this.customerRepository.findById(upload.customer_code);

    if (!data || !data.id) {
      return;
    }

    const customer = new Customer();
    customer.id = data.id;
    customer.measures = data.measures;

    const measure = new Measure();
    measure.image_url = imageUrl;
    measure.datetime = upload.measure_datetime;
    measure.type = upload.measure_type;
    measure.value = measureValue;
    measure.has_confirmed = false;
    measure.customer = customer;

    return this.measureRepository.createMeasure(measure);
  }

  async existsMeasureInMonth(upload: UploadRequest): Promise<boolean> {
    const data = await this.measureRepository.existsMeasureInMonth(
      upload.customer_code,
      upload.measure_datetime,
      upload.measure_type
    );

    if (data?.id) {
      return true;
    } else {
      return false;
    }
  }

  async measureToConfirm(measureId: string): Promise<Measure | null> {
    return await this.measureRepository.measureToConfirm(measureId);
  }

  async saveMeasure(measure: Measure): Promise<void> {
    await this.measureRepository.createMeasure(measure);
  }

  async sendToGemini(upload: UploadRequest): Promise<[string, string]> {
      const prompt = "Identifique e extraia o número de um medidor de gás/água a partir da imagem anexa. Retorne o número em formato numérico, ignorando quaisquer outros caracteres ou símbolos. Priorize a precisão da leitura, mesmo que isso signifique um tempo de processamento maior.";
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const matches = upload.image.match(/^data:(.+);base64,(.+)$/);
      let imageData = upload.image;
      let mimeType = "";

      if (matches) {
        mimeType = matches[1];
        imageData = matches[2];
      }

      let imageBuffer = Buffer.from(imageData, "base64");
      let tempFilePath = path.join(__dirname, "temp_image.png");
      fs.writeFileSync(tempFilePath, imageBuffer);

      let uploadImage = await fileManager.uploadFile(tempFilePath, {
        mimeType: "image/png",
        displayName: "Meter",
      });

      fs.unlinkSync(tempFilePath);

      let fileData = {
        mimeType: uploadImage.file.mimeType,
        fileUri: uploadImage.file.uri,
      };

      let result = await model.generateContent([
        {
          fileData: fileData,
        },
        { text: prompt },
      ]);

      return [result.response.text(), uploadImage.file.uri];
  }

  async getMeasureFromCustomer(
    customerId: string,
    measureType: string
  ): Promise<MeasureResponse[] | null> {
    let measures = await this.measureRepository.getMeasureFromCustomer(
      customerId,
      measureType
    );

    if (measures.length == 0) {
      return null;
    } else {
      return measures;
    }
  }
}
