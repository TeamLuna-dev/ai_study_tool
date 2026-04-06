
   // quizStyles.js
   // Note for Angel:
   // This file currently centralizes (by following SRP) all of the styling components
   // of the quiz feature, but if you find that some styles are only used in one component and not shared across multiple components, feel free to move those styles into the component file itself. 
   // The goal is to keep styles organized and maintainable, so use your judgment on where they fit best.
   
   export const BRAND_BLUE = "#2563eb"; // consistent brand color for primary actions 

    export const layoutStyle = {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,            
    backgroundColor: "#f9fafb",
    };

    export const resultCardStyle = {
        width: "100%",
        maxWidth: 760,
        backgroundColor: "white",
        borderRadius: 16,
        padding: 32,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    };

    export const resultHeaderStyle = {
        textAlign: "center",
        marginBottom: 24,
    };
    
    export const scoreSummaryStyle = {
        textAlign: "center",
        padding: 20,
        borderRadius: 12,
        backgroundColor: "#eff6ff",
        border: "1px solid #bfdbfe",
        marginBottom: 24,
    };

    export const resultSectionStyle = {
        marginTop: 24,
    };

    export const resultSectionTitleStyle = {
        marginBottom: 12,
        fontSize: 20,
        fontWeight: 600,
        color: "#111827",
    };

    export const restartButtonWrapperStyle = {
        display: "flex",
        justifyContent: "center",
        marginTop: 28,
    };

    export const baseButtonStyle = {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    cursor: "pointer",
    fontWeight: 500,
    };

    export const primaryButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: BRAND_BLUE,
    color: "white",
    border: `1px solid ${BRAND_BLUE}`,
    };

    export const secondaryButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "white",
    color: "#111827",
    };

    export const disabledButtonStyle = {
    opacity: 0.6,
    cursor: "not-allowed",
    };

    export const TOPIC_OPTIONS = [
    "Calculus",
    "Biology",
    "Chemistry",
    "Physics",
    "History",
    "Computer Science",
    "Psychology",
    "English",
    "Economics",
    "Other",
    ]; // predefined topics for user to select from, can be extended as needed

    export const reviewCardStyle = {
        backgroundColor: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    };

    export const reviewQuestionStyle = {
        fontWeight: 600,
        color: "#111827",
        marginBottom: 8,
    };

    export const reviewLabelStyle = {
        fontSize: 14,
        fontWeight: 600,
        color: "#374151",
    };

    export const correctAnswerStyle = {
        color: "#16a34a",
        fontWeight: 600,
    };

    export const incorrectAnswerStyle = {
        color: "#dc2626",
        fontWeight: 600,
    };
