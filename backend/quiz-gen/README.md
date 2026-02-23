# SCRUM - 12 & 44 0-Quiz TASK MVP (OpenAI + Python)

- MVP for the Quiz Generator Task SCRUM-12. Click [_here_](https://cs3398-luna-s26.atlassian.net/jira/software/projects/SCRUM/boards/1?selectedIssue=SCRUM-12) to find the Jira task description. 

- This also includes the [Task SCRUM-44](https://cs3398-luna-s26.atlassian.net/jira/software/projects/SCRUM/boards/1?selectedIssue=SCRUM-44) (_in progress_)

## Setup
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  
```
## How to run

```bash
python3 quiz.py # runs default notes
python3 quiz.py --notes mynotes.txt # runs to specific notes file
python3 quiz.py --notes other_notes.txt --raw # makes double API call to verify content
python3 quiz.py --out out/quiz.json # dumps a .json based on the prompt
```

