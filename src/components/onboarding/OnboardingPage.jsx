export default function OnboardingPage() {
  return (
    <div className="onboarding-root">
      <div className="onboarding-card">

        <div className="progress-track">
          <div className="progress-fill" style={{ width: "50%" }} />
        </div>
        <div className="card-inner">
                  <div className="onboarding-header">
            <div className="step-badge">Step 1 of 2</div>
              <h1>Hey there!</h1>
              <p className="subtitle">
            Let's personalise your experience!
              </p>
          </div>

          
          <div className="field-group">
            <label htmlFor="displayName" className="field-label">
            Your name 
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              className="field-input"
              placeholder="e.g. Matt Murdock"
            />
          </div>

          <div className="field-group">

          <label htmlFor="major" className="field-label">
            Subject / Major
          </label>
          <select id="major" className="field-input field-select">
            <option value="">Select your major…</option>
            <option>Biology</option>
            <option>Business</option>
            <option>Computer Science</option>
            <option>Economics</option>
            <option>Engineering</option>
            <option>Mathematics</option>
            <option>Psychology</option>
            <option>Philosophy</option>
            <option>Other</option>
          </select>
        </div>

      </div>

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

                .progress-track {
          height: 3px;
          background: #f0f0f0;
        }
        .progress-fill {
          height: 100%;
          background: #2563eb;
        }
        .onboarding-header { margin-bottom: 32px; }
        .step-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #2563eb;
          background: #f0effe;
          border-radius: 100px;
          padding: 4px 12px;
          margin-bottom: 16px;
        }
        .onboarding-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #1a1a2e;
          margin: 0 0 8px;
          line-height: 1.2;
        }
        .subtitle {
          font-size: 14px;
          color: #7a7a8c;
          margin: 0;
          line-height: 1.6;
        }
        
        .field-group { margin-bottom: 20px; }
        .field-label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #7a7a8c;
        margin-bottom: 8px;
      }

      `}</style>
    </div>
  );
}