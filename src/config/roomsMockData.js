/**
 * Mock data for Collaborative Study Rooms
 * Replace with real data from Firebase in future tasks
 */

export const MOCK_MEMBERS = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: null,
    isOnline: true,
    isHost: true,
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    avatar: null,
    isOnline: true,
    isHost: false,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    avatar: null,
    isOnline: false,
    isHost: false,
  },
];

export const MOCK_DOCUMENTS = [
  {
    id: '1',
    fileName: 'Chapter_5_Notes.pdf',
    fileType: 'pdf',
    uploadedBy: 'Sarah Chen',
    uploadedAt: new Date('2024-02-15T10:30:00'),
  },
  {
    id: '2',
    fileName: 'Lecture_Slides.pptx',
    fileType: 'pptx',
    uploadedBy: 'Marcus Johnson',
    uploadedAt: new Date('2024-02-15T11:00:00'),
  },
  {
    id: '3',
    fileName: 'Study_Guide.docx',
    fileType: 'docx',
    uploadedBy: 'Sarah Chen',
    uploadedAt: new Date('2024-02-15T14:20:00'),
  },
];

export const MOCK_MESSAGES = [
  {
    id: '1',
    sender: 'Sarah Chen',
    text: 'Hey everyone! I uploaded the chapter 5 notes.',
    timestamp: new Date('2024-02-15T10:31:00'),
  },
  {
    id: '2',
    sender: 'Marcus Johnson',
    text: 'Thanks! Just added the lecture slides from today.',
    timestamp: new Date('2024-02-15T11:02:00'),
  },
  {
    id: '3',
    sender: 'Emily Rodriguez',
    text: 'Great, I\'ll review these before our study session tomorrow.',
    timestamp: new Date('2024-02-15T11:15:00'),
  },
];

export const MOCK_ROOM = {
  id: 'room-abc123',
  name: 'CS 301 Study Group',
  description: 'Midterm prep for Data Structures',
  inviteCode: 'ABC123',
  createdAt: new Date('2024-02-15T10:00:00'),
};
