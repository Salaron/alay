// like 'forEach' but async
Array.prototype.forEachAsync = async function(callback: <T>(element: T, index: number, originalArray: T[]) => Promise<void>): Promise<void> {
  for (let index = 0; index < this.length; index++) {
    await callback(this[index], index, this)
  }
}
// return random value from array
Array.prototype.randomValue = function <T>(): T {
  return this[Math.floor(Math.random() * this.length)]
}
// return object key by value
Object.defineProperty(Object.prototype, "getKey", {
  value(value: any) {
    for (const key in this) {
      if (this[key] == value) {
        return key
      }
    }
    return ""
  }
})
// remove property from object
// returns new object
Object.omit = (object: any, props: string[] | string) => {
  if (typeof props === "string") props = [props]

  const keys = Object.keys(object)
  let newObject: any = {}

  for (const key of keys) {
    if (!props.includes(key)) {
      newObject[key] = object[key]
    }
  }
  return newObject
}
String.prototype.splice = function(start: number, delCount: number, newSubStr: string) {
  return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount))
}
