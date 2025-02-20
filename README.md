# OpenHowl - Setup Guide

## Create a Discord Bot & Get Your Token

1. **Go to the Discord Developer Portal**: [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. **Click on "New Application"**: Name it **OpenHowl** (or any name you prefer), then click **Create**.
3. **Go to "Bot" (Left Sidebar) → Click "Add Bot"**: Confirm with **Yes, do it!**, then enable **Public Bot** (optional).
4. **Copy Your Bot Token**: Click **"Reset Token"**, then **Copy** the generated token. Store it safely!

---

## Set Up Permissions & Invite the Bot

1. **Go to "OAuth2" Tab → Click "URL Generator"**
2. **Under "Scopes"**, select: `bot`, `applications.commands`, and `voice`.
3. **Under "Bot Permissions"**, select: `Connect`, `Speak`, and `Use Slash Commands`.
4. **Copy the Generated URL & Invite Your Bot**: Open the URL in your browser, select a server, and authorize the bot.

---

# Install OpenHowl

## Run the Install Script

```bash
sudo chmod +x ./install.sh```     

# Running 


```bash
docker-compose up -d

```
# Stopping 

```bash
docker-compose down

```
Disclaimer

OpenHowl is provided "as is" with no warranties or guarantees. By using this software, you agree to the following:

    Use at Your Own Risk: You are responsible for setting up and securing your installation.
    Compliance with Terms: Ensure compliance with Discord’s Terms of Service and copyright laws.
    Third-Party Dependencies: The maintainers are not responsible for issues caused by dependencies.
    Security Risks: Running OpenHowl may require network configuration and port forwarding. Do not install if you do not understand these risks.

The maintainers are not liable for any misuse, legal issues, or damages caused by the software.