import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import Search from './Pages/Search';
import Loading from './Pages/Loading';
import Result from './Pages/Result';
import Scraps from './Pages/Scraps';
import History from './Pages/History';
import PointHistory from './Pages/PointHistory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/search" element={<Search />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/result" element={<Result />} />
        <Route path="/scraps" element={<Scraps />} />
        <Route path="/history" element={<History />} />
        <Route path="/points" element={<PointHistory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;