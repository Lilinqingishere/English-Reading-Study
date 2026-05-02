import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import Extension from './pages/Extension';
import Review from './pages/Review';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter basename="/English-Reading-Study">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="extension" element={<Extension />} />
          <Route path="review" element={<Review />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
