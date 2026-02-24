import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { RoomPage } from './components/rooms/RoomPage';
import { QuizPage } from './components/quiz/QuizPage';

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
