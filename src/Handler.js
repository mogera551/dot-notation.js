import { SYM_DIRECT } from "./Symbols.js";


const WILDCARD = "*";
const DELIMITER = ".";

export default class Handler {
  stackIndexes = [];

  get lastIndexes() {
    return this.stackIndexes[this.stackIndexes.length - 1];
  }

  /**
   * 
   * @param {any} target 
   * @param {string[]} pathNames 
   * @param {Proxy} receiver
   * @returns {any}
   */
  getByPathNames(target, pathNames, receiver) {
    let pathName = pathNames.pop();
    const remainNames = pathNames;
    if (pathName === WILDCARD) {
      const wildcardCount = remainNames.reduce((count, pathName) => count + ((pathName === WILDCARD) ? 1 : 0), 0);
      pathName = this.lastIndexes[wildcardCount];
    }
    if (remainNames.length > 0) {
      const parentName = remainNames.join(DELIMITER);
      if (Reflect.has(receiver, parentName)) {
        return Reflect.get(Reflect.get(receiver, parentName), pathName);
      }  else {
        return Reflect.get(this.getByPathNames(target, remainNames, receiver), pathName);
      }
    } else {
      return Reflect.get(receiver, pathName);
    }
  }

  /**
   * 
   * @param {any} target 
   * @param {string[]} pathNames 
   * @param {Proxy} receiver
   * @param {any} value
   * @returns {any}
   */
  setByPathNames(target, pathNames, value, receiver) {
    let pathName = pathNames.pop();
    const remainNames = pathNames;
    if (pathName === WILDCARD) {
      const indexCount = remainNames.reduce((count, pathName) => count + ((pathName === WILDCARD) ? 1 : 0), 0);
      pathName = this.lastIndexes[indexCount];
    }
    if (remainNames.length > 0) {
      const parentName = remainNames.join(DELIMITER);
      if (Reflect.has(receiver, parentName)) {
        return Reflect.set(Reflect.get(receiver, parentName), pathName, value);
      }  else {
        return Reflect.set(this.getByPathNames(target, remainNames, receiver), pathName, value);
      }
    } else {
      return Reflect.set(receiver, pathName, value);
    }
  }

  /**
   * 
   * @param {any} target 
   * @param {string} prop 
   * @param {Proxy} receiver 
   * @returns {any}
   */
  get(target, prop, receiver) {
    if (prop.includes(".")) {
      return this.getByPathNames(target, prop.split("."), receiver);
    }
    return Reflect.get(target, prop, receiver);
  }

  /**
   * 
   * @param {any} target 
   * @param {string} prop 
   * @param {Proxy} receiver 
   * @returns {Boolean}
   */
  has(target, prop, receiver) {
    return Reflect.has(target, prop, receiver);
  }

  /**
   * 
   * @param {object} target 
   * @param {string} prop 
   * @param {any} value 
   * @param {Proxy} receiver 
   */
  set(target, prop, value, receiver) {
    if (prop.includes(".")) {
      return this.setByPathNames(target, prop.split("."), value, receiver);
    }
   return Reflect.set(target, prop, value, receiver);
  }
}