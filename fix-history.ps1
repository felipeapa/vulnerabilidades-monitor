# Set environment variables for Git filter-branch
$env:FILTER_BRANCH_SQUELCH_WARNING = "1"
$env:GIT_COMMITTER_NAME = "Felipe Apablaza"
$env:GIT_COMMITTER_EMAIL = "felipe.apablaza.herrera@gmail.com"
$env:GIT_AUTHOR_NAME = "Felipe Apablaza"
$env:GIT_AUTHOR_EMAIL = "felipe.apablaza.herrera@gmail.com"

# Run git filter-branch to rewrite all commits
Write-Host "Rewriting Git history..."
git filter-branch -f --env-filter 'export GIT_COMMITTER_NAME="Felipe Apablaza"; export GIT_COMMITTER_EMAIL="felipe.apablaza.herrera@gmail.com"; export GIT_AUTHOR_NAME="Felipe Apablaza"; export GIT_AUTHOR_EMAIL="felipe.apablaza.herrera@gmail.com"'

Write-Host "History corrected!"
