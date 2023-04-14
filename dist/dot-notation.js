const WILDCARD = "*";
const DELIMITER = ".";
const SYM_PREFIX = "dot-notation"; // + Math.trunc(Math.random() * 9999_9999);
const SYM_DIRECT_GET = Symbol.for(SYM_PREFIX + ".direct_get");
const SYM_DIRECT_SET = Symbol.for(SYM_PREFIX + ".direct_set");

class PropertyName {
  /**
   * @type {string}
   */
  name;
  /**
   * @type {string[]}
   */
  pathNames = [];
  /**
   * @type {string[]}
   */
  parentPathNames = [];
  /**
   * @type {string}
   */
  parentPath;
  /**
   * @type {RegExp}
   */
  regexp;
  /**
   * @type {number}
   */
  level = 0;
  /**
   * @type {boolean}
   */
  isPrimitive;
  /**
   * @type {string}
   */
  privateName;

  /**
   * 
   * @param {string} name 
   */
  constructor(name) {
    this.name = name;
    this.pathNames = name.split(DELIMITER);
    this.parentPathNames = this.pathNames.slice(0, -1);
    this.parentPath = this.parentPathNames.join(DELIMITER);
    this.lastPathName = this.pathNames.at(-1);
    this.regexp = new RegExp("^" + name.replaceAll(".", "\\.").replaceAll("*", "([0-9a-zA-Z_]*)") + "$");
    this.level = this.pathNames.filter(pathName => pathName === WILDCARD).length;
    this.isPrimitive = (this.pathNames.length === 1);
    this.privateName = this.isPrimitive ? `_${this.name}` : undefined;
  }

  findNearestWildcard() {
    return PropertyName.findNearestWildcard(this);
  }

  /**
   * 
   * @param {PropertyName} propName 
   * @returns {PropertyName}
   */
  static findNearestWildcard(propName) {
    if (propName.lastPathName === WILDCARD) return propName;
    if (propName.parentPath === "") return undefined;
    return this.findNearestWildcard(PropertyName.create(propName.parentPath));
  }

  /**
   * 
   * @param {string} name 
   * @returns {PropertyName}
   */
  static create(name) {
    const propertyName = this.propertyNameByName.get(name);
    if (propertyName) return propertyName;
    const newPropertyName = new PropertyName(name);
    this.propertyNameByName.set(name, newPropertyName);
    return newPropertyName;
  }
  /**
   * @type {Map<string,PropertyName>}
   */
  static propertyNameByName = new Map;
}

/**
 * @typedef {{propName:PropertyName,indexes:number[]}} PropertyAccess
 */

class Handler {
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
   * @type {Map<string,PropertyAccess>}
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
   * @type {Map<string,PropertyAccess>}
   */
  get matchByName() {
    return this.#matchByName;
  }

  /**
   * 
   * @param {any} target 
   * @param {{propName:PropertyName}}  
   * @param {Proxy} receiver
   * @returns {any}
   */
  #getByPropertyName(target, { propName }, receiver) {
    return Reflect.has(target, propName.name, receiver) ? Reflect.get(target, propName.name, receiver) :
     propName.isPrimitive ? Reflect.get(target, propName.privateName, receiver) :
     Reflect.get(
      this.#getByPropertyName(target, { propName:PropertyName.create(propName.parentPath) }, receiver),
      (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName
     );
  }

  /**
   * 
   * @param {any} target 
   * @param {{propName:PropertyName,value:any}}  
   * @param {Proxy} receiver
   * @returns {boolean}
   */
  #setByPropertyName(target, { propName, value }, receiver) {
    Reflect.has(target, propName.name, receiver) ? Reflect.set(target, propName.name, value, receiver) :
    propName.isPrimitive ? Reflect.set(target, propName.privateName, value, receiver) :
    Reflect.set(
      this.#getByPropertyName(target, { propName:PropertyName.create(propName.parentPath) }, receiver), 
      (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName, 
      value);
    return true;
  }

  /**
   * 
   * @param {number[]} indexes 
   * @param {()=>{}} callback 
   * @returns 
   */
  #pushIndexes(indexes, callback) {
    this.#stackIndexes.push(indexes);
    try {
      return Reflect.apply(callback, this, []);
    } finally {
      this.#stackIndexes.pop();
    }
  }

  /**
   * 
   * @param {any} target 
   * @param {Proxy} receiver 
   * @returns {({}:PropertyAccess) => {any}  }
   */
  #getFunc = (target, receiver) => ({propName, indexes}) => 
    this.#pushIndexes(indexes, () => this.#getByPropertyName(target, { propName }, receiver));

  /**
   * 
   * @param {any} target 
   * @param {Proxy} receiver 
   * @returns {({}:PropertyAccess, value:any) => {boolean}  }
   */
  #setFunc = (target, receiver) => ({propName, indexes}, value) => 
    this.#pushIndexes(indexes, () => this.#setByPropertyName(target, { propName, value }, receiver));

  /**
   * 
   * @param {any} target
   * @param {{propName:PropertyName,indexes:number[]}} 
   * @param {Proxy} receiver
   * @returns {any[]}
   */
  #getExpandLastLevel(target, { propName, indexes }, receiver) {
    const getFunc = this.#getFunc(target, receiver);
    const wildcardProp = propName.findNearestWildcard();
    if (!wildcardProp) throw new Error(`not found wildcard path of '${propName.name}'`);
    const listProp = PropertyName.create(wildcardProp.parentPath);
    return getFunc({propName:listProp, indexes}).map((value, index) => getFunc({propName, indexes:indexes.concat(index)}));
  }

  /**
   * 
   * @param {any} target
   * @param {{propName:PropertyName,indexes:number[],values:any[]}}  
   * @param {Proxy} receiver
   * @returns {boolean}
   */
  #setExpandLastLevel(target, { propName, indexes, values }, receiver) {
    const getFunc = this.#getFunc(target, receiver);
    const setFunc = this.#setFunc(target, receiver);
    const wildcardProp = propName.findNearestWildcard();
    if (!wildcardProp) throw new Error(`not found wildcard path of '${propName.name}'`);
    const listProp = PropertyName.create(wildcardProp.parentPath);
    const listValues = getFunc({propName:listProp, indexes});
    if (wildcardProp.name === propName.name) {
      // propName末尾が*の場合
      setFunc({propName:listProp, indexes}, values);
    } else {
      if (values.length !== listValues.length) throw new Error(`not match value count '${propName.name}'`);
      for(let i in listValues) {
        setFunc({propName, indexes:indexes.concat(Number(i))}, values[i]);
      }
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
    const getFunc = this.#getFunc(target, receiver);
    let match;
    if (prop === SYM_DIRECT_GET) {
      // プロパティとindexesを直接指定してgetする
      return (prop, indexes) => {
        if (this.#setOfDefinedProperties.has(prop)) {
          return this.#pushIndexes(indexes, () => this.#getByPropertyName(target, { propName:PropertyName.create(prop) }, receiver));
        }
        throw new Error(`undefined property ${prop}`);
      }
    } else if (prop === SYM_DIRECT_SET) {
      // プロパティとindexesを直接指定してsetする
      return (prop, indexes, value) => {
        if (this.#setOfDefinedProperties.has(prop)) {
          return this.#pushIndexes(indexes, () => this.#setByPropertyName(target, { propName:PropertyName.create(prop), value }, receiver));
        }
        throw new Error(`undefined property ${prop}`);
      }
    } else if (match = /^\$([0-9]+)$/.exec(prop)) {
      // $数字のプロパティ
      // indexesへのアクセス
      return this.lastIndexes?.[Number(match[1]) - 1] ?? undefined;
    //} else if (prop.at(0) === "@" && prop.at(1) === "@") {
    } else if (prop.at(0) === "@") {
      const name = prop.slice(1);
      if (!this.#setOfDefinedProperties.has(name)) throw new Error(`undefined property ${name}`);
      const propName = PropertyName.create(name);
      if (((this.lastIndexes?.length ?? 0) + 1) < propName.level) throw new Error(`array level not match`);
      const baseIndexes = this.lastIndexes?.slice(0, propName.level - 1) ?? [];
      return this.#getExpandLastLevel(target, { propName, indexes:baseIndexes }, receiver);
    }
    if (this.#setOfDefinedProperties.has(prop)) {
      // 定義済みプロパティに一致
      return this.#getByPropertyName(target, { propName:PropertyName.create(prop) }, receiver);
    }
    if (this.#matchByName.has(prop)) {
      return getFunc(this.#matchByName.get(prop));
    }
    for(const propName of this.#definedPropertyNames) {
      // 定義済みプロパティの正規表現に一致する場合、indexesを設定して値を取得
      const match = propName.regexp.exec(prop);
      if (!match) continue;
      const indexes = match.slice(1);
      this.#matchByName.set(prop, {propName, indexes});
      return getFunc({propName, indexes});
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
    const setFunc = this.#setFunc(target, receiver);
    if (prop.at(0) === "@") {
      const name = prop.slice(1);
      if (!this.#setOfDefinedProperties.has(name)) throw new Error(`undefined property ${name}`);
      const propName = PropertyName.create(name);
      if (((this.lastIndexes?.length ?? 0) + 1) < propName.level) throw new Error(`array level not match`);
      const baseIndexes = this.lastIndexes?.slice(0, propName.level - 1) ?? [];
      return this.#setExpandLastLevel(target, { propName, indexes:baseIndexes, values:value }, receiver);
    }
    if (this.#setOfDefinedProperties.has(prop)) {
      // 定義済みプロパティに一致
      return this.#setByPropertyName(target, { propName:PropertyName.create(prop), value }, receiver);
    }
    if (this.#matchByName.has(prop)) {
      return setFunc(this.#matchByName.get(prop), value);
    }
    for(const propName of this.#definedPropertyNames) {
      // 定義済みプロパティの正規表現に一致する場合、indexesを設定して値を設定
      const match = propName.regexp.exec(prop);
      if (!match) continue;
      const indexes = match.slice(1);
      this.#matchByName.set(prop, {propName, indexes});
      return setFunc({propName, indexes}, value);
    }
    throw new Error(`undefined property ${prop}`);
  }
}

export { Handler, PropertyName, SYM_DIRECT_GET, SYM_DIRECT_SET };
