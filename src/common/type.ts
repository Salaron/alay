export enum TYPE {
  INT,
  FLOAT,
  NUMBER, // INT or FLOAT
  BOOLEAN,
  STRING,
  NULL
}

export class Type {
  // Number
  public static isInt(variable: any): variable is number {
    return (
      (typeof variable === "number" || variable instanceof Number) &&
      // 'any' type for fix compiler error
      !isNaN(<any>variable) &&
      parseInt(<any>variable, 10) === variable
    )
  }
  public static isFloat(variable: any): variable is number {
    return (
      (typeof variable === "number" || variable instanceof Number) &&
      !isNaN(<any>variable) &&
      parseFloat(<any>variable) === variable
    )
  }
  public static isNumber(variable: any): variable is number {
    return (
      (typeof variable === "number" || variable instanceof Number) &&
      !isNaN(<any>variable)
    )
  }
  // Boolean
  public static isBoolean(variable: any): variable is boolean {
    return (
      typeof variable === "boolean" || variable instanceof Boolean
    )
  }
  // String
  public static isString(variable: any): variable is string {
    return (
      typeof variable === "string" || variable instanceof String
    )
  }
  // Array
  public static isArray(variable: any): variable is Array<any> {
    return (
      (typeof variable === "object" || variable instanceof Array) &&
      Array.isArray(variable)
    )
  }
  // Object
  public static isObject(variable: any): variable is any {
    return (
      typeof variable === "object" || variable instanceof Object
    )
  }
  // null
  public static isNull(variable: any): variable is null {
    return (
      typeof variable === "object" && variable === null
    )
  }
  // Undefined
  public static isUndefined(variable: any): variable is undefined {
    return (
      typeof variable === "undefined"
    )
  }
  // null or undefined
  public static isNullDef(variable: any): variable is null | undefined {
    return (
      variable == null
    )
  }
  // function
  public static isFunc(variable: any): variable is Function { // tslint:disable-line
    return (
      typeof variable === "function" || variable instanceof Function
    )
  }

  // Date
  public static isDate(variable: any): variable is Date {
    return (
      variable instanceof Date
    )
  }

  public TYPES: typeof TYPE = TYPE
}
(global as any).Type = Type
