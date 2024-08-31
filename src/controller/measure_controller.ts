import Joi, { number } from "joi";
import {
  ConfirmRequest,
  ConfirmSucess,
  CustomerMeasuresResponse,
  ErrorResponse,
  MeasureCreated,
  MeasureResponse,
  UploadRequest,
} from "../usecases/responses";
import { Request, Response } from "express";
import { Measure } from "../models/measure";
import { container, injectable } from "tsyringe";
import { MeasureService } from "../service/measure_service";

@injectable()
export class MeasureController {

  async uploadMeasure(req: Request, res: Response): Promise<void> {
    let measureService = container.resolve(MeasureService);

    //VALIDA REQUEST E RETORNA ERRO
    let validation = MeasureController.validateUpload(req);

    if (validation instanceof ErrorResponse) {
      MeasureController.ErrorResponse(
        res,
        400,
        validation.error_code,
        validation.error_description
      );
      return;
    }

    //DADOS VALIDADOS PASSAM
    let upload = req.body as UploadRequest;
    upload.measure_datetime = new Date(upload.measure_datetime);

    //VERIFICA SE EXISTE MEDICAO NO MES COM MESMO TIPO
    let exists = await measureService.existsMeasureInMonth(upload);

    if (exists) {
      MeasureController.ErrorResponse(
        res,
        409,
        "DOUBLE_REPORT",
        "Leitura do mês já realizada"
      );
      return;
    }

    //ENVIA IMAGEM PARA API GEMINI
    let geminiResponse = await measureService.sendToGemini(upload);
    let measureValue;

    try {
      measureValue = parseInt(geminiResponse[0]);

      if (isNaN(measureValue)) {
        throw new Error('INVALID_NUMBER');
      }
    } catch (error) {
      measureValue = 0;
    }

    //CRIA MEDIÇAO CASO NAO EXISTA
    let measure = await measureService.createMeasure(upload, measureValue, geminiResponse[1]);

    if (measure instanceof Measure) {
      let message = new MeasureCreated(
        measure.image_url,
        measure.value,
        measure.id
      );
      res.status(200).json(message);
      return;
    }

    MeasureController.ErrorResponse(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "INTERNAL_SERVER_ERROR"
    );
    return;
  }

  async patchMeasure(req: Request, res: Response): Promise<void> {
    let measureService = container.resolve(MeasureService);

    //VALIDA REQUEST
    let validation = MeasureController.validateConfirm(req);

    if (validation instanceof ErrorResponse) {
      MeasureController.ErrorResponse(
        res,
        400,
        validation.error_code,
        validation.error_description
      );
      return;
    }

    //PASSAM OS DADOS
    let confirm = req.body as ConfirmRequest;

    //VALIDA SE MEDIÇAO EXISTE
    let measure = await measureService.measureToConfirm(confirm.measure_uuid);

    if (!measure?.id) {
      MeasureController.ErrorResponse(
        res,
        404,
        "MEASURE_NOT_FOUND",
        "Leitura do mês não encontrada"
      );
      return;
    }

    //VALIDA SE MEDIÇÃO É CONFIRMADA
    if (measure.has_confirmed) {
      MeasureController.ErrorResponse(
        res,
        409,
        "CONFIRMATION_DUPLICATE",
        "Leitura do mês já realizada"
      );
      return;
    }

    measure.has_confirmed = true;
    measure.value = confirm.confirmed_value;
    measureService.saveMeasure(measure);

    let message: ConfirmSucess = {
      sucess: true,
    };

    res.status(200).json(message);
  }

  async getMeasureFromCustomer(req: Request, res: Response): Promise<void> {
    let customerCode = req.params.customerCode;
    let measureType = req.query.measure_type;

    if (measureType !== undefined) {
      measureType = String(measureType).toLowerCase();

      if (measureType != 'gas' && measureType != 'water') {
        MeasureController.ErrorResponse(res, 400, 'INVALID_TYPE', 'Tipo de medição não permitida');
        return;
      }
    }
    else {
      measureType = '';
    }

    let measureService = container.resolve(MeasureService);
    let measures = await measureService.getMeasureFromCustomer(customerCode, measureType);

    if (measures == null) {
      MeasureController.ErrorResponse(res, 404, 'MEASURES_NOT_FOUND', 'Nenhuma leitura encontrada');
      return;
    }

    let measuresResponse = new CustomerMeasuresResponse(customerCode, measures);
    res.status(200).json(measuresResponse);
  }

  static ErrorResponse(
    res: Response,
    status: number,
    error_code: string,
    error_description: string
  ): void {
    let message = new ErrorResponse(error_code, error_description);
    res.status(status).json(message);
  }

  static validateUpload(req: Request): any {
    const schema = Joi.object({
      image: Joi.string()
        .base64()
        .required()
        .error(new Error("FORMATO DE IMAGEM INVÁLIDO")),
      customer_code: Joi.string()
        .required()
        .error(new Error("CODIGO DE CLIENTE INVÁLIDO")),
      measure_datetime: Joi.date()
        .iso()
        .required()
        .error(new Error("DATA INVÁLIDA")),
      measure_type: Joi.string()
        .valid("WATER", "GAS")
        .required()
        .error(new Error("Tipo de medição não permitida")),
    });

    let error = schema.validate(req.body);

    if (error.error) {
      let message = new ErrorResponse("INVALID_DATA", error.error.message);
      return message;
    } else {
      return null;
    }
  }

  static validateConfirm(req: Request): any {
    const schema = Joi.object({
      measure_uuid: Joi.string()
        .required()
        .error(new Error("ID DA MEDIÇÃO INVÁLIDO")),
      confirmed_value: Joi.number()
        .integer()
        .required()
        .strict()
        .error(new Error("VALOR DA MEDIÇÃO INVÁLIDO")),
    });

    let validation = schema.validate(req.body);

    if (validation.error) {
      let message = new ErrorResponse("INVALID_DATA", validation.error.message);
      return message;
    } else {
      return null;
    }
  }
}