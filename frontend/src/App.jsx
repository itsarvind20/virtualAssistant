import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Customize from './pages/Customize'
import { userDataContext } from './context/userDataContext'
import Home from './pages/Home'
import Customize2 from './pages/Customize2'

function App() {
    const { userData, authLoading } = useContext(userDataContext)

    if (authLoading) {
      return (
        <div className="grid min-h-screen place-items-center bg-[#020617] px-4 text-center text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/60">assistant os</p>
            <p className="mt-3 text-sm text-white/70">Loading your assistant...</p>
          </div>
        </div>
      )
    }

  return (
     <Routes>
    <Route path='/' element={(userData?.assistantImage && userData?.assistantName)? <Home/> :<Navigate to={"/customize"}/>}/>
    <Route path='/signup' element={!userData?<SignUp/>:<Navigate to={"/"}/>}/>
    <Route path='/signin' element={!userData?<SignIn/>:<Navigate to={"/"}/>}/>
    <Route path='/customize' element={userData?<Customize/>:<Navigate to={"/signup"}/>}/>
    <Route path='/customize2' element={userData?<Customize2/>:<Navigate to={"/signup"}/>}/>
   </Routes>
  )
}

export default App
