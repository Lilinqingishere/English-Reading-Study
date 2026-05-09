import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import Extension from './pages/Extension';
import Review from './pages/Review';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

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
          {/* 兜底路由：未匹配的路径走 NotFound（page-spec §7） */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
