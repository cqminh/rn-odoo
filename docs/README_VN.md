<a id="readme-top"></a>
<div align="center">
  <h1 align="center">
    REACT NATIVE ODOO
  </h1>
  <p align="center">
    <a href="/docs/README_VN.md">Tiếng Việt </a>
    ·
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
  <summary>Nội dung bài</summary>
  <ol>
    <li><a href="#mô-tả-ngắn">Mô tả ngắn</a></li>
    <li><a href="#sử-dụng-cho">Sử dụng cho</a></li>
    <li>
      <a href="#cài-đặt">Cài đặt</a>
    </li>
    <li>
      <a href="#cách-sử-dụng">Cách sử dụng</a>
      <ul>
        <li><a href="#tạo-biến-kết-nối-odoo">Tạo biến kết nối Odoo</a></li>
        <li><a href="#lấy-database">Lấy database</a></li>
        <li><a href="#kết-nối">Kết nối</a></li>
        <li><a href="#kết-nối-bằng-sid">Kết nối bằng SID</a></li>
        <li><a href="#huỷ-kết-nối">Huỷ kết nối</a></li>
        <li><a href="#search-và-read">Search và Read</a></li>
        <li><a href="#tạo-record">Tạo record</a></li>
        <li><a href="#cập-nhật-record">Cập nhật record</a></li>
        <li><a href="#xoá-record">Xoá record</a></li>
        <li><a href="#gọi-một-hàm-trong-odoo">Gọi một hàm trong Odoo</a></li>
      </ul>
    </li>
    <li><a href="#cài-đặt">Tài liệu</a></li>
    <li><a href="#ghi-chú-khác">Ghi chú khác</a></li>
    <li><a href="#liên-hệt">Liên hệ</a></li>
  </ol>
</details>

## Mô tả ngắn
Thư viện dùng để kết nối giữa *React Native* và *Odoo* và có thể sử dụng cho *React*, được viết bằng `typescript`. Và được chỉnh sửa từ [react-native-odoo-promise-based](https://www.npmjs.com/package/react-native-odoo-promise-based).

## Sử dụng cho 
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)

## Cài đặt
```sh
npm install rn-odoo
```

## Cách sử dụng
Hãy xem qua [tài liệu API của Odoo](https://www.odoo.com/documentation/master/developer/reference/external_api.html) nếu bạn cần hỗ trợ về cấu trúc truy vấn dữ liệu. Tôi chỉ cố gắng tạo ra một cách sử dụng dễ dàng nhất.

### Tạo biến kết nối Odoo
Khai báo một biến odoo cho biết các thông tin cơ bản của bạn.
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

### Lấy database
Đối với hàm này bạn chỉ cần truyền vào địa chỉ server Odoo, kết quả trả về là mảng gồm các database của server. Nếu không lấy được thì báo lỗi hoặc mảng rỗng.
```typescript
odoo.getDatabases()
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ });
```

### Kết nối
Trả về dữ liệu của người dùng và session id để có thể đăng nhập cho lần tiếp theo.
```typescript
odoo.connect()
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Kết nối bằng SID
```typescript
odoo.connectWithSid()
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Huỷ kết nối
Đăng xuất và huỷ phiên làm việc của người dùng.
```typescript
odoo.disconnect()
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Search và Read
Gọi hàm `search_read` của Odoo để truy vấn dữ liệu.
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

### Tạo record
Tạo một hoặc nhiều record mới cho model được truyền.
```typescript
odoo.create('delivery.order.line', {
  sale_order_id: 123
  delivered:  'false',
}, context)
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Cập nhật record
Cập nhật một hoặc nhiều record của model.
```typescript
odoo.update('delivery.order.line', [ids], {
  delivered:  'true',
  delivery_note:  'Delivered on time!'
}, context)
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Xoá record
Xoá một hoặc nhiều record của model.
```typescript
odoo.delete('delivery.order.line', [ids], context)
  .then(response => { /* ... */ })
  .catch(e => { /* ... */ })
```

### Gọi một hàm trong Odoo
Nếu bạn có những hàm khác các hàm đặt trưng ở trên, bạn có thể gọi hàm này, sau đó truyền những tham số cần thiết.
```typescript
odoo.call_method(
  "sale.order", 
  "action_confirm", 
  args: [[
    order_id: 1
  ]]
);
```

## Tài liệu
*  [Odoo ORM API Reference](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html)
*  [Odoo Web Service External API](https://www.odoo.com/documentation/master/developer/reference/external_api.html)
*  [react-native-odoo-promise-based](https://www.npmjs.com/package/react-native-odoo-promise-based)

## Ghi chú khác
Thư viện này là phiên bản chỉnh sửa và nâng cấp của thư viện [react-native-odoo-promise-based](https://www.npmjs.com/package/react-native-odoo-promise-based), tôi có sử dụng lại một số thông tin cách của thư viện gốc. Một lần nữa xin cảm ơn.

## Liên hệ
Liên hệ tôi qua [cqminh.it@gmail.com](mailto:cqminh.it@gmail.com)

<p align="right">(<a href="#readme-top">về bên trên</a>)</p>

<h6 align="center" style="font-weight: 600;">Cảm ơn đã ghé qua!./.</h6>