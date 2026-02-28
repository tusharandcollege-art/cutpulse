const pkg = require('cashfree-pg');
console.log('Keys of cashfree-pg exported object: ', Object.keys(pkg));
const { Cashfree } = pkg;
if (Cashfree) {
    console.log('Cashfree details:', typeof Cashfree, Object.keys(Cashfree), Object.getOwnPropertyNames(Cashfree), typeof Cashfree.PGCreateOrder, typeof Cashfree.prototype?.PGCreateOrder);
} else {
    console.log('Cashfree is not exported!');
}
