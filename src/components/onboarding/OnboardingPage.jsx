export default function OnboardingPage() {
  return (
    <div className="onboarding-root">
      <div className="onboarding-card">
        <div className="card-inner" />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');

        .onboarding-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f8fa;
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
        }

        .onboarding-card {
          width: 100%;
          max-width: 460px;
          min-height: 200px;
          background: #ffffff;
          border: 1px solid #e8eaed;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }

        .card-inner {
          padding: 40px;
        }

        @media (max-width: 520px) {
          .card-inner { padding: 28px 24px; }
        }
      `}</style>
    </div>
  );
}