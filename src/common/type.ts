export class Type {
  // Number 
  public static isInt(variable: any): boolean {
    return (
      (typeof variable === "number" || variable instanceof Number) &&
      // 'any' type for fix compiler error
      !isNaN(<any>variable) &&
      parseInt(<any>variable, 10) === variable
    )
  }
  public static isFloat(variable: any): boolean {
    return (
      (typeof variable === "number" || variable instanceof Number) &&
      !isNaN(<any>variable) &&
      parseFloat(<any>variable) === variable
    )
  }
  public static isNumber(variable: any): boolean {
    return (
      (typeof variable === "number" || variable instanceof Number) &&
      !isNaN(<any>variable)
    )
  }
  // Boolean
  public static isBoolean(variable: any): boolean {
    return (
      typeof variable === "boolean" || variable instanceof Boolean 
    )
  }
  // String
  public static isString(variable: any): boolean {
    return (
      typeof variable === "string" || variable instanceof String 
    )
  } 
  // Array
  public static isArray(variable: any): boolean {
    return (
      (typeof variable === "object" || variable instanceof Array) && 
      Array.isArray(variable)
    )
  }
  // Object
  public static isObject(variable: any): boolean {
    return (
      typeof variable === "object" || variable instanceof Object 
    )
  }
  // null
  public static isNull(variable: any): boolean {
    return (
      typeof variable === "object" && variable === null
    )
  }
  // Undefined
  public static isUndefined(variable: any): boolean {
    return (
      typeof variable === "undefined"
    )
  }
  // null or undefined
  public static isNullDef(variable: any): boolean {
    return (
      variable == null
    )
  }
  // function
  public static isFunc(variable: any): boolean {
    return (
      typeof variable === "function" || variable instanceof Function 
    )
  }

  // Date
  public static isDate(variable: any): boolean {
    return (
      variable instanceof Date 
    )
  }
}
(global as any).Type = Type