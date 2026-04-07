   // quizGeneratorStyles.js
   // Note for Angel:
   // This file currently centralizes (by following SRP) the styling components of QuizGenerator.jsx specifically,
   // if you find that some styles are only used in one component and not shared across multiple components, feel free to move those styles into the component file itself. 
   // The goal is to keep styles organized and maintainable, so use your judgment on where they fit best.
   
export const sourceCardsRowStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "24px",
};

export const sourceCardStyle = (isSelected) => ({
  flex: 1,
  padding: "20px 16px",
  borderRadius: "12px",
  border: isSelected ? "2px solid #2563eb" : "1px solid #e8eaed",
  background: isSelected ? "#eff6ff" : "#f7f8fa",
  cursor: "pointer",
  textAlign: "center",
  transition: "all 0.2s",
});

export const sourceCardIconStyle = {
  fontSize: "28px",
  marginBottom: "8px",
};

export const sourceCardLabelStyle = {
  fontWeight: 600,
  color: "#1a1a2e",
  fontSize: "14px",
  marginBottom: "4px",
};

export const sourceCardDescStyle = {
  fontSize: "12px",
  color: "#7a7a8c",
};

export const stepTitleStyle = {
  fontFamily: "'Syne', sans-serif",
  fontSize: "22px",
  fontWeight: 800,
  color: "#1a1a2e",
  margin: "0 0 8px",
};

export const stepSubtitleStyle = {
  color: "#7a7a8c",
  fontSize: "14px",
  marginBottom: "24px",
};

export const docPickerStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e8eaed",
  background: "#f7f8fa",
  fontSize: "14px",
  color: "#1a1a2e",
  marginBottom: "8px",
};

export const notesTextareaStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e8eaed",
  background: "#f7f8fa",
  fontSize: "14px",
  resize: "vertical",
  boxSizing: "border-box",
};

export const continueButtonStyle = (disabled) => ({
  width: "100%",
  marginTop: "24px",
  padding: "13px 24px",
  background: "#2563eb",
  border: "none",
  borderRadius: "10px",
  color: "#fff",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "15px",
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  transition: "opacity 0.2s",
});

export const generatorRootStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f7f8fa",
  padding: "24px",
  fontFamily: "'DM Sans', sans-serif",
};

export const generatorCardStyle = {
  width: "100%",
  maxWidth: "560px",
  background: "#ffffff",
  border: "1px solid #e8eaed",
  borderRadius: "20px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  overflow: "hidden",
  animation: "fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
};

export const generatorInnerStyle = {
  padding: "40px",
};

export const progressTrackStyle = {
  height: "3px",
  background: "#f0f0f0",
};

export const progressFillStyle = (step, total) => ({
  height: "100%",
  background: "#2563eb",
  width: `${(step / total) * 100}%`,
  transition: "width 0.4s cubic-bezier(0.16,1,0.3,1)",
});

export const stepIndicatorRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "32px",
};

export const stepNumbersStyle = {
  display: "flex",
  gap: "8px",
};

export const stepCircleStyle = (s, currentStep) => ({
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 600,
  background: s === currentStep ? "#2563eb" : s < currentStep ? "#e0e7ff" : "#f0f0f0",
  color: s === currentStep ? "white" : s < currentStep ? "#2563eb" : "#9ca3af",
  transition: "all 0.3s",
});

export const stepLabelStyle = {
  fontSize: "13px",
  color: "#7a7a8c",
  fontWeight: 500,
};

export const pillsRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "24px",
};

export const pillStyle = (isSelected) => ({
  padding: "10px 18px",
  borderRadius: "100px",
  border: isSelected ? "2px solid #2563eb" : "1px solid #e8eaed",
  background: isSelected ? "#eff6ff" : "#f7f8fa",
  color: isSelected ? "#2563eb" : "#7a7a8c",
  fontWeight: 500,
  fontSize: "14px",
  cursor: "pointer",
  transition: "all 0.2s",
});

export const countPillStyle = (isSelected) => ({
  flex: 1,
  padding: "12px",
  borderRadius: "10px",
  border: isSelected ? "2px solid #2563eb" : "1px solid #e8eaed",
  background: isSelected ? "#eff6ff" : "#f7f8fa",
  color: isSelected ? "#2563eb" : "#7a7a8c",
  fontWeight: 600,
  fontSize: "15px",
  cursor: "pointer",
  textAlign: "center",
  transition: "all 0.2s",
});

export const backButtonStyle = {
  padding: "13px 18px",
  background: "transparent",
  border: "1px solid #e8eaed",
  borderRadius: "10px",
  color: "#7a7a8c",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "14px",
  cursor: "pointer",
  transition: "all 0.2s",
};

export const summaryCardStyle = {
  background: "#f7f8fa",
  border: "1px solid #e8eaed",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "24px",
};

export const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: "1px solid #e8eaed",
};

export const summaryLabelStyle = {
  fontSize: "13px",
  color: "#7a7a8c",
  fontWeight: 500,
};

export const summaryValueStyle = {
  fontSize: "13px",
  color: "#1a1a2e",
  fontWeight: 600,
};

export const generateButtonStyle = (disabled) => ({
  width: "100%",
  padding: "14px 24px",
  background: disabled ? "#e8eaed" : "#2563eb",
  border: "none",
  borderRadius: "10px",
  color: disabled ? "#9ca3af" : "#fff",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "15px",
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "all 0.2s",
  marginBottom: "12px",
});