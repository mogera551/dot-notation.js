
import { Handler } from "../dist/dot-notation.min.js";

class Products {
  tax = 0.10;
  list = [
    { name:"AAAAA", price:1000 },
    { name:"BBBBB", price:1500 },
    { name:"CCCCC", price:1800 },
  ];
  diffAmount;
  get "list.*.price_with_tax"() {
    return this["list.*.price"] * (1 + this.tax);
  }
  get "sum"() {
    return this["@list.*.price"].reduce((sum, price) => sum + price);
  }
  changeAllPrice() {
    this["@list.*.price"] = this["@list.*.price"].map(price => price + this.diffAmount);
  }
}

const products = new Proxy(new Products, new Handler([
  "tax", "list", "list.*", "list.*.name", "list.*.price", "list.*.price_with_tax", "sum"
]));

for(let i = 0; i < products.list.length; i++) {
  console.log(products[`list.${i}.name`], products[`list.${i}.price`], products[`list.${i}.price_with_tax`]);
}
