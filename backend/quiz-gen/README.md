# SCRUM - 12 & 44 0-Quiz TASK MVP (OpenAI + Python)

- MVP for the Quiz Generator Task SCRUM-12. Click [_here_](https://cs3398-luna-s26.atlassian.net/jira/software/projects/SCRUM/boards/1?selectedIssue=SCRUM-12) to find the Jira task description. 

- This also includes the [Task SCRUM-44](https://cs3398-luna-s26.atlassian.net/jira/software/projects/SCRUM/boards/1?selectedIssue=SCRUM-44) (_in progress_)

## Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  
```
## How to run

```bash
python quiz.py // runs default notes
python3 quiz.py --notes mynotes.txt (route to specific notes file)
```

