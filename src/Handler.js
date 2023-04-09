import { PropertyName } from "./PropertyName.js";
import { SYM_DIRECT } from "./Symbols.js";

const WILDCARD = "*";
const DELIMITER = ".";

/**
 * @typedef {{propName:PropertyName,match:RegExpMatchArray}} MatchProperty
 */

export default class Handler {
  /**
   * @type {number[][]}
   */
  stackIndexes = [];
  /**
   * @type {string[]|undefined}
   */
  definedProperties;
  /**
   * @type {Set<string>|undefined}
   */
  setOfDefinedProperties;
  /**
   * @type {PropertyName[]|undefined}
   */
  definedPropertyNames;
  /**
   * @type {Map<string,MatchProperty>}
   */
  matchByName;

  /**
   * 
   * @param {string[]} definedProperties 
   */
  constructor(definedProperties) {
    this.definedProperties = definedProperties;
    this.setOfDefinedProperties = definedProperties ? new Set(definedProperties) : undefined;
    this.definedPropertyNames = definedProperties ? definedProperties.map(name => PropertyName.create(name)) : undefined;
    this.matchByName = definedProperties ? new Map : undefined;
  }

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
   * @param {PropertyName} propName 
   * @param {Proxy} receiver
   * @returns {any}
   */
  getByPropertyName(target, propName, receiver) {
    if (Reflect.has(target, propName.name, receiver)) {
      return Reflect.get(target, propName.name, receiver);
    }
    const parentValue = this.getByPropertyName(target, PropertyName.create(propName.parentPath), receiver);
    const lastPathName = (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName;
    return Reflect.get(parentValue, lastPathName);
  }

  /**
   * 
   * @param {any} target 
   * @param {PropertyName} propName 
   * @param {any} value
   * @param {Proxy} receiver
   * @returns {any}
   */
  setByPropertyName(target, propName, value, receiver) {
    if (Reflect.has(target, propName.name, receiver)) {
      Reflect.set(target, propName.name, value, receiver);
      return true;
    }
    const parentValue = this.getByPropertyName(target, PropertyName.create(propName.parentPath), receiver);
    const lastPathName = (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName;
    Reflect.set(parentValue, lastPathName, value);
    return true;
  }

  /**
   * 
   * @param {any} target 
   * @param {string} prop 
   * @param {Proxy} receiver 
   * @returns {any}
   */
  get(target, prop, receiver) {
    if (this.definedPropertyNames) {
      if (this.setOfDefinedProperties.has(prop)) {
        return this.getByPropertyName(target, PropertyName.create(prop), receiver);
      }
      const getFunc = ({propName, match}) => {
        this.stackIndexes.push(match.slice(1));
        try {
          return this.getByPropertyName(target, propName, receiver);
        } finally {
          this.stackIndexes.pop();
        }
      };
      if (this.matchByName.has(prop)) {
        return getFunc(this.matchByName.get(prop));
      }
      for(const propName of this.definedPropertyNames) {
        const match = propName.regexp.exec(prop);
        if (!match) continue;
        this.matchByName.set(prop, {propName, match});
        return getFunc({propName, match});
      }
      throw new Error(`undefined property ${prop}`);
    } else {
      if (prop.includes(".")) {
        return this.getByPathNames(target, prop.split("."), receiver);
      }
      return Reflect.get(target, prop, receiver);
    }
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
    if (this.definedPropertyNames) {
      if (this.setOfDefinedProperties.has(prop)) {
        return this.setByPropertyName(target, PropertyName.create(prop), value, receiver);
      }
      const setFunc = ({propName, match}, value) => {
        this.stackIndexes.push(match.slice(1));
        try {
          return this.setByPropertyName(target, propName, value, receiver);
        } finally {
          this.stackIndexes.pop();
        }
      };
      if (this.matchByName.has(prop)) {
        return setFunc(this.matchByName.get(prop), value);
      }
      for(const propName of this.definedPropertyNames) {
        const match = propName.regexp.exec(prop);
        if (!match) continue;
        this.matchByName.set(prop, {propName, match});
        return setFunc({propName, match}, value);
      }
      throw new Error(`undefined property ${prop}`);
    } else {
      if (prop.includes(".")) {
        return this.setByPathNames(target, prop.split("."), value, receiver);
      }
      return Reflect.set(target, prop, value, receiver);
  
    }

  }
}