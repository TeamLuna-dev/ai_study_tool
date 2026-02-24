import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { RoomPage } from './components/rooms/RoomPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/rooms" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
