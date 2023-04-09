import { PropertyName } from "./PropertyName.js";
import { WILDCARD, DELIMITER, SYM_DIRECT_GET, SYM_DIRECT_SET } from "./Const.js";

/**
 * @typedef {{propName:PropertyName,match:RegExpMatchArray}} MatchProperty
 */

export class Handler {
  /**
   * @type {number[][]}
   */
  #stackIndexes = [];
  /**
   * @type {Set<string>}
   */
  #setOfDefinedProperties;
  /**
   * @type {PropertyName[]}
   */
  #definedPropertyNames;
  /**
   * @type {Map<string,MatchProperty>}
   */
  #matchByName;

  /**
   * 
   * @param {string[]} definedProperties
   */
  constructor(definedProperties) {
    if (definedProperties == null) throw new Error(`definedProperties is null`);
    this.#setOfDefinedProperties = new Set(definedProperties);
    this.#definedPropertyNames = definedProperties.map(name => PropertyName.create(name));
    this.#matchByName = new Map;
  }

  get lastIndexes() {
    return this.#stackIndexes[this.#stackIndexes.length - 1];
  }

  get stackIndexes() {
    return this.#stackIndexes;
  }

  /**
   * @type {Set<string>}
   */
  get setOfDefinedProperties() {
    return this.#setOfDefinedProperties;
  }

  /**
   * @type {PropertyName[]}
   */
  get definedPropertyNames() {
    return this.#definedPropertyNames;
  }

  /**
   * @type {Map<string,MatchProperty>}
   */
  get matchByName() {
    return this.#matchByName;
  }

  /**
   * 
   * @param {any} target 
   * @param {PropertyName} propName 
   * @param {Proxy} receiver
   * @returns {any}
   */
  #getByPropertyName(target, propName, receiver) {
    let value;
    if (Reflect.has(target, propName.name, receiver)) {
      value = Reflect.get(target, propName.name, receiver);
    } else {
      const parentValue = this.#getByPropertyName(target, PropertyName.create(propName.parentPath), receiver);
      const lastPathName = (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName;
      value = Reflect.get(parentValue, lastPathName);
    }
    return value;
  }

  /**
   * 
   * @param {any} target 
   * @param {PropertyName} propName 
   * @param {any} value
   * @param {Proxy} receiver
   * @returns {any}
   */
  #setByPropertyName(target, propName, value, receiver) {
    if (Reflect.has(target, propName.name, receiver)) {
      Reflect.set(target, propName.name, value, receiver);
    } else {
      const parentValue = this.#getByPropertyName(target, PropertyName.create(propName.parentPath), receiver);
      const lastPathName = (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName;
      Reflect.set(parentValue, lastPathName, value);
    }
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
    if (prop === SYM_DIRECT_GET) {
      return (prop, indexes) => {
        if (this.#setOfDefinedProperties.has(prop)) {
          this.#stackIndexes.push(indexes);
          try {
            return this.#getByPropertyName(target, PropertyName.create(prop), receiver);
          } finally {
            this.#stackIndexes.pop();
          }
        }
        throw new Error(`undefined property ${prop}`);
      }
    }
    if (prop === SYM_DIRECT_SET) {
      return (prop, indexes, value) => {
        if (this.#setOfDefinedProperties.has(prop)) {
          this.#stackIndexes.push(indexes);
          try {
            return this.#setByPropertyName(target, PropertyName.create(prop), value, receiver);
          } finally {
            this.#stackIndexes.pop();
          }
        }
        throw new Error(`undefined property ${prop}`);
      }
    }
    if (this.#setOfDefinedProperties.has(prop)) {
      return this.#getByPropertyName(target, PropertyName.create(prop), receiver);
    }
    const getFunc = ({propName, match}) => {
      this.#stackIndexes.push(match.slice(1));
      try {
        return this.#getByPropertyName(target, propName, receiver);
      } finally {
        this.#stackIndexes.pop();
      }
    };
    if (this.#matchByName.has(prop)) {
      return getFunc(this.#matchByName.get(prop));
    }
    for(const propName of this.#definedPropertyNames) {
      const match = propName.regexp.exec(prop);
      if (!match) continue;
      this.#matchByName.set(prop, {propName, match});
      return getFunc({propName, match});
    }
    throw new Error(`undefined property ${prop}`);
  }

  /**
   * 
   * @param {object} target 
   * @param {string} prop 
   * @param {any} value 
   * @param {Proxy} receiver 
   */
  set(target, prop, value, receiver) {
    if (this.#setOfDefinedProperties.has(prop)) {
      return this.#setByPropertyName(target, PropertyName.create(prop), value, receiver);
    }
    const setFunc = ({propName, match}, value) => {
      this.#stackIndexes.push(match.slice(1));
      try {
        return this.#setByPropertyName(target, propName, value, receiver);
      } finally {
        this.#stackIndexes.pop();
      }
    };
    if (this.#matchByName.has(prop)) {
      return setFunc(this.#matchByName.get(prop), value);
    }
    for(const propName of this.#definedPropertyNames) {
      const match = propName.regexp.exec(prop);
      if (!match) continue;
      this.#matchByName.set(prop, {propName, match});
      return setFunc({propName, match}, value);
    }
    throw new Error(`undefined property ${prop}`);
  }
}