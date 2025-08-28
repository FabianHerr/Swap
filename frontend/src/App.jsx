import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import Signup from './Signup'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './Login'
import OfferPage from './OfferPage'
import Messages from './Messages'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/register' element={<Signup/>}></Route>
        <Route path='/login' element={<Login/>}></Route>
        <Route path='/offer' element={<OfferPage/>}></Route>
        <Route path='/messages' element={<Messages/>}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
