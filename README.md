<a id="readme-top"></a>
<div align="center">
  <h1 align="center">REACT NATIVE ODOO</h1>
  <p align="center">
    <a href="/docs/README_VN.md">Tiếng Việt</a> ·
    <a href="../README.md">English</a>
  </p>
  <p align="center">
    <img alt="GitHub Contributors" src="https://img.shields.io/github/contributors/cqminh/rn-odoo" />
    <img alt="Issues" src="https://img.shields.io/github/issues/cqminh/rn-odoo?color=0088ff" />
    <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/cqminh/rn-odoo" />
    <img alt="Star" src="https://img.shields.io/github/stars/cqminh/rn-odoo" />
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#short-description">Short Description</a></li>
    <li><a href="#supported-platforms">Supported Platforms</a></li>
    <li><a href="#installation">Installation</a></li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#create-odoo-instance">Create Odoo Instance</a></li>
        <li><a href="#get-databases">Get Databases</a></li>
        <li><a href="#connect">Connect</a></li>
        <li><a href="#connect-using-session-id">Connect Using Session ID</a></li>
        <li><a href="#disconnect">Disconnect</a></li>
        <li><a href="#search-and-read">Search and Read</a></li>
        <li><a href="#create-record">Create Record</a></li>
        <li><a href="#update-record">Update Record</a></li>
        <li><a href="#delete-record">Delete Record</a></li>
        <li><a href="#call-custom-method">Call Custom Method</a></li>
      </ul>
    </li>
    <li><a href="#documentation">Documentation</a></li>
    <li><a href="#additional-notes">Additional Notes</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## Short Description
A library for connecting *React Native* to *Odoo*, also usable with *React*, written in `TypeScript`.  
It is a modified and improved version of [react-native-odoo-promise-based](https://www.npmjs.com/package/react-native-odoo-promise-based).

## Supported Platforms
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)

## Installation
```bash
npm install rn-odoo
```

## Usage
If you need help with data queries, refer to the [Odoo External API Documentation](https://www.odoo.com/documentation/master/developer/reference/external_api.html). This library is designed for simplicity and ease of use.

### Create Odoo InstanceCreate Odoo Instance
```typescript
import Odoo from 'rn-odoo';

const odoo = new Odoo({
  host: 'YOUR_SERVER_ADDRESS',
  database: 'YOUR_DATABASE_NAME',
  username: 'YOUR_USERNAME', /* Optional if using a stored session_id */
  password: 'YOUR_PASSWORD', /* Optional if using a stored session_id */
  sid: 'YOUR_SESSION_ID', /* Optional if using username/password */
})
```

### Get Databases
Returns an array of available databases or an empty array/error.
```typescript
odoo.getDatabases()
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ });
```

### Connect
Returns user info and session ID.
```typescript
odoo.connect()
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Connect Using Session ID
```typescript
odoo.connectWithSid()
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Disconnect
Logout and clear session.
```typescript
odoo.disconnect()
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Search and Read
Use `search_read` method to query Odoo records.
```typescript
const  params = {
  ids: [1,2,3,4,5],
  domain: [ [ 'list_price', '>', '50' ], [ 'list_price', '<', '65' ] ],
  fields: [ 'name', 'list_price', 'items' ],
  order:  'list_price DESC',
  limit:  5,
  offset:  0,
}
 
odoo.search_read('product.product', params, context)
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Create Record
Create one or multiple records in a model.
```typescript
odoo.create('delivery.order.line', {
  sale_order_id: 123
  delivered:  'false',
}, context)
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Update Record
Update one or multiple records.
```typescript
odoo.update('delivery.order.line', [ids], {
  delivered:  'true',
  delivery_note:  'Delivered on time!'
}, context)
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Delete Record
Delete one or multiple records.
```typescript
odoo.delete('delivery.order.line', [ids], context)
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Call Custom Method
Call custom method from your model.
```typescript
odoo.call_method(
  "sale.order", 
  "action_confirm", 
  args: [[
    order_id: 1
  ]]
);
```

## Documentation
*  [Odoo ORM API Reference](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html)
*  [Odoo Web Service External API](https://www.odoo.com/documentation/master/developer/reference/external_api.html)
*  [react-native-odoo-promise-based](https://www.npmjs.com/package/react-native-odoo-promise-based)

## Additional Notes
This library is a modified and enhanced version of [react-native-odoo-promise-based](https://www.npmjs.com/package/react-native-odoo-promise-based). Some methods and structures were reused and improved. Special thanks to the original author.

## Contact
Email me at [cqminh.it@gmail.com](mailto:cqminh.it@gmail.com)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<h6 align="center" style="font-weight: 600;">Thanks for visiting!./.</h6>