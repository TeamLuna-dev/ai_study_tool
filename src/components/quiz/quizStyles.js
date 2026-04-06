
   // quizStyles.js
   // Note for Angel:
   // This file currently centralizes (by following SRP) all of the styling components
   // of the quiz feature, but if you find that some styles are only used in one component and not shared across multiple components, feel free to move those styles into the component file itself. 
   // The goal is to keep styles organized and maintainable, so use your judgment on where they fit best.
   
   const BRAND_BLUE = "#2563eb"; // consistent brand color for primary actions 

    const layoutStyle = {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,            
    backgroundColor: "#f9fafb",
    };

    const resultCardStyle = {
        width: "100%",
        maxWidth: 760,
        backgroundColor: "white",
        borderRadius: 16,
        padding: 32,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    };

    const resultHeaderStyle = {
        textAlign: "center",
        marginBottom: 24,
    };

    const scoreSummaryStyle = {
        textAlign: "center",
        padding: 20,
        borderRadius: 12,
        backgroundColor: "#eff6ff",
        border: "1px solid #bfdbfe",
        marginBottom: 24,
    };

    const resultSectionStyle = {
        marginTop: 24,
    };

    const resultSectionTitleStyle = {
        marginBottom: 12,
        fontSize: 20,
        fontWeight: 600,
        color: "#111827",
    };

    const restartButtonWrapperStyle = {
        display: "flex",
        justifyContent: "center",
        marginTop: 28,
    };

    const baseButtonStyle = {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    cursor: "pointer",
    fontWeight: 500,
    };

    const primaryButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: BRAND_BLUE,
    color: "white",
    border: `1px solid ${BRAND_BLUE}`,
    };

    const secondaryButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "white",
    color: "#111827",
    };

    const disabledButtonStyle = {
    opacity: 0.6,
    cursor: "not-allowed",
    };

    const TOPIC_OPTIONS = [
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

    const reviewCardStyle = {
        backgroundColor: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    };

    const reviewQuestionStyle = {
        fontWeight: 600,
        color: "#111827",
        marginBottom: 8,
    };

    const reviewLabelStyle = {
        fontSize: 14,
        fontWeight: 600,
        color: "#374151",
    };

    const correctAnswerStyle = {
        color: "#16a34a",
        fontWeight: 600,
    };

    const incorrectAnswerStyle = {
        color: "#dc2626",
        fontWeight: 600,
    };
