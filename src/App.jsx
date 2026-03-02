import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { RoomPage } from './components/rooms/RoomPage';
import Navbar from "./components/Navbar";
import { QuizPage } from './components/quiz/QuizPage';
import  SummaryGen  from "./components/summary-gen/SummaryGen";
import { FileUpload, DropZone, ProgressBar, StatusAlert } from "./components/file-upload";

function NotesUploaderPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Notes Uploader</h1>
      <DropZone />
      <FileUpload />
      <ProgressBar />
      <StatusAlert />
    </div>
  );
}

function Home() {
  return <div className="p-6">Welcome to AI Study Notes</div>;
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
        <Route path="/ai-notes-generator" element={<SummaryGen />} />
        <Route path="/quiz-generator" element={<QuizPage />} />
         <Route path="/notes-uploader" element={<NotesUploaderPage />} />
         <Route path="/study-plan-generator" element={<StudyPlanGenerator />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="/rooms" element={<RoomPage />} />
        <Route path="/quiz" element={<QuizPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
