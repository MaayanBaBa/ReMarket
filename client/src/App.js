// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Categories from './pages/Categories'
import AddProduct from './pages/AddProduct'
import PurchaseHistory from './pages/PurchaseHistory'
import AdminDashboard from './pages/AdminDashboard'
import MessagesInbox from './pages/MessagesInbox'
import SellerOrders from './pages/SellerOrders'
import Subscribe from './pages/Subscribe'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/products/:id" element={<ProductDetail />} />

        <Route element={<ProtectedRoute roles={['buyer', 'seller', 'admin']} />}>
          <Route path="/subscribe" element={<Subscribe />} />
        </Route>

        <Route element={<ProtectedRoute roles={['seller', 'admin']} redirectTo="/subscribe" />}>
          <Route path="/add-product" element={<AddProduct />} />
        </Route>

        <Route element={<ProtectedRoute roles={['buyer', 'seller', 'admin']} />}>
          <Route path="/history" element={<PurchaseHistory />} />
          <Route path="/inbox" element={<MessagesInbox />} />
        </Route>

        <Route element={<ProtectedRoute roles={['seller', 'admin']} redirectTo="/subscribe" />}>
          <Route path="/seller-orders" element={<SellerOrders />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} requireMainAdmin />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </>
  )
}