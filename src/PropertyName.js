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
   * @type {string[]}
   */
  parentPaths = [];
  /**
   * @type {Set<string>}
   */
  setOfParentPaths;
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
   * 
   * @param {string} name 
   */
  constructor(name) {
    this.name = name;
    this.pathNames = name.split(DELIMITER);
    this.parentPathNames = this.pathNames.slice(0, -1);
    this.parentPaths = this.parentPathNames.reduce((paths, pathName) => { 
      paths.push(paths.at(-1)?.concat(pathName) ?? [pathName]);
      return paths;
    }, []).map(paths => paths.join("."));
    this.setOfParentPaths = new Set(this.parentPaths);
    this.parentPath = this.parentPathNames.join(DELIMITER);
    this.lastPathName = this.pathNames.at(-1);
    this.regexp = new RegExp("^" + name.replaceAll(".", "\\.").replaceAll("*", "([0-9a-zA-Z_]*)") + "$");
    this.level = this.pathNames.filter(pathName => pathName === WILDCARD).length;
    this.isPrimitive = (this.pathNames.length === 1);
    this.nearestWildcardName = undefined;
    this.nearestWildcardParentName = undefined;
    if (this.level > 0) {
      for(let i = this.pathNames.length - 1; i >= 0; i--) {
        if (this.pathNames[i] === WILDCARD) {
          this.nearestWildcardName = this.pathNames.slice(0, i + 1).join(".");
          this.nearestWildcardParentName = this.pathNames.slice(0, i).join(".");
          break;
        }
      }
    }
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

  /**
   * 
   * @param {*} prop 
   * @returns {PropertyAccess}
   */
  static parse(prop) {
    const indexes = [];
    const patternPropElements = [];
    for(const propElement of prop.split(".")) {
      const index = Number(propElement);
      if (isNaN(index)) {
        patternPropElements.push(propElement);
      } else {
        indexes.push(index);
        patternPropElements.push("*");
      }
    }
    return { 
      propName: PropertyName.create(patternPropElements.join(".")),
      indexes
    };
  }
}