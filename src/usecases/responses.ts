export class UploadRequest {
  image: string;
  customer_code: string;
  measure_datetime: Date;
  measure_type: "WATER" | "GAS";

  constructor(
    image: string,
    customer_code: string,
    measure_datetime: Date,
    measure_type: "WATER" | "GAS"
  ) {
    this.image = image;
    this.customer_code = customer_code;
    this.measure_datetime = measure_datetime;
    this.measure_type = measure_type;
  }
}

export class MeasureCreated {
  image_url: string;
  measure_value: number;
  measure_uuid: string;

  constructor(image_url: string, measure_value: number, measure_uuid: string) {
    this.image_url = image_url;
    this.measure_value = measure_value;
    this.measure_uuid = measure_uuid;
  }
}

export class ErrorResponse {
  error_code: string;
  error_description: string;

  constructor(error_code: string, error_description: string) {
    this.error_code = error_code;
    this.error_description = error_description;
  }
}

export class ConfirmRequest {
  measure_uuid: string;
  confirmed_value: number;

  constructor(measure_uuid: string, confirmed_value: number) {
    this.measure_uuid = measure_uuid;
    this.confirmed_value = confirmed_value;
  }
}

export class ConfirmSucess {
  sucess: boolean;

  constructor(sucess: boolean) {
    this.sucess = sucess;
  }
}

export class MeasureResponse {
  measure_uuid: string;
  measure_datetime: Date;
  measure_type: string;
  has_confirmed: boolean;
  image_url: string;

  constructor(
      measure_uuid: string,
      measure_datetime: Date,
      measure_type: string,
      has_confirmed: boolean,
      image_url: string
  ) {
      this.measure_uuid = measure_uuid;
      this.measure_datetime = measure_datetime;
      this.measure_type = measure_type;
      this.has_confirmed = has_confirmed;
      this.image_url = image_url;
  }
}

export class CustomerMeasuresResponse {
  customer_code: string;
  measures: MeasureResponse[];

  constructor(customer_code: string, measures: MeasureResponse[]) {
      this.customer_code = customer_code;
      this.measures = measures;
  }
}
