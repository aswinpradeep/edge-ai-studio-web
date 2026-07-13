#!/bin/bash
# Simple script to push changes and trigger GitHub Pages deployment

# Color formatting
GREEN='\033[0;32m'
NC='\033[0m' # No Color
YELLOW='\033[1;33m'

echo -e "${YELLOW}Staging all changes...${NC}"
git add .

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}No changes to commit.${NC}"
else
    echo -e "${YELLOW}Committing changes...${NC}"
    read -p "Enter commit message [Updates to Edge AI Studio]: " msg
    msg=${msg:-"Updates to Edge AI Studio"}
    git commit -m "$msg"
fi

echo -e "${YELLOW}Pushing to GitHub (master branch)...${NC}"
if git push origin master; then
    echo -e "${GREEN}Successfully pushed to GitHub! Deployment workflow should start shortly.${NC}"
else
    echo -e "${YELLOW}Failed to push. Make sure you have set up a remote origin repository:${NC}"
    echo -e "  git remote add origin https://github.com/yourusername/edge-ai-studio-web.git"
    echo -e "  git push -u origin master"
fi
