import { WILDCARD, DELIMITER } from "./Const.js";

export class PropertyName {
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