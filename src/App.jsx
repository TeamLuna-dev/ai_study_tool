import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { RoomPage } from './components/rooms/RoomPage';
import Navbar from "./components/Navbar";
import { QuizPage } from './components/quiz/QuizPage';

function Home() {
  return <div className="p-6">Welcome to AI Study Notes</div>;
}

function AInotesGenerator() {
  return <div className="p-6">AI notes Generator</div>;
}

function QuizGenerator() {
  return <div className="p-6">Quiz Generator Page</div>;
}

function NotesUploader() {
  return <div className="p-6">Notes Uploader Page</div>;
}

function StudyPlanGenerator() {
  return <div className="p-6">Study Plan Generator Page</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/AI notes Generator" element={<AInotesGenerator />} />
        <Route path="/quiz-generator" element={<QuizGenerator />} />
         <Route path="/notes-uploader" element={<NotesUploader />} />
         <Route path="/study-plan-generator" element={<StudyPlanGenerator />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="/rooms" element={<RoomPage />} />
        <Route path="/quiz" element={<QuizPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
