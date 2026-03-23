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

        <div className="field-group">
            <label className="field-label">Academic Level</label>
            <div className="level-grid">
              <button type="button" className="level-btn">High School</button>
              <button type="button" className="level-btn">Undergraduate</button>
              <button type="button" className="level-btn">Graduate / Postgrad</button>
            </div>
          </div>

          <div className="btn-row">
            <button type="button" className="btn-back">← Back</button>
            <button type="button" className="btn-primary">Continue →</button>
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

      .field-input {
      width: 100%;
      background: #f7f8fa;
      border: 1px solid #e8eaed;
      border-radius: 10px;
      padding: 12px 14px;
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      color: #1a1a2e;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .field-input::placeholder { color: #b0b0be; }
    .field-input:focus { border-color: #2563eb; }
    .field-select { appearance: none; cursor: pointer; }

    .level-grid { display: flex; gap: 10px; flex-wrap: wrap; }
    .level-btn {
      flex: 1;
      min-width: 100px;
      padding: 10px 14px;
      background: #f7f8fa;
      border: 1px solid #e8eaed;
      border-radius: 10px;
      color: #7a7a8c;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.18s ease;
      text-align: center;
    }
    .level-btn:hover {
      border-color: #2563eb;
      color: #2563eb;
    }

    .btn-row {
      display: flex;
      gap: 12px;
      margin-top: 28px;
    }
    .btn-primary {
      flex: 1;
      padding: 13px 24px;
      background: #2563eb;
      border: none;
      border-radius: 10px;
      color: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-primary:hover { opacity: 0.88; }

    .btn-back {
      padding: 13px 18px;
      background: transparent;
      border: 1px solid #e8eaed;
      border-radius: 10px;
      color: #7a7a8c;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-back:hover { border-color: #b0b0be; color: #1a1a2e; }

      `}</style>
    </div>
  );
}