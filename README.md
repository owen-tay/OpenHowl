# OpenHowl - Setup Guide

## Requirements

```bash

sudo apt install ffmpeg  #example

```

- **ffmpeg**  
  Required for aduio.

  - **npm**  
  For react frontend server.

- **python3 python3-venv python3-pip**  
  Necessary for creating Python environments. 
  (sudo apt install -y python3 python3-venv python3-pip)

- **ufw**  
  Optional. The script will attempt to create firewall rules if UFW is installed.

- **docker**  
  Optional. 

  
## For an HTTPS connection, this script will attempt to create SSL certificates. 
If you are using a vps or standard IP instead of a domain, expect a browser warning. If you are using a domain the script will ask to use certbot. 


## Create a Discord Bot & Get Your Token

1. **Go to the Discord Developer Portal**: [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. **Click on "New Application"**: Name it **OpenHowl** (or any name you prefer), then click **Create**.
3. **Go to "Bot" (Left Sidebar) → Click "A  dd Bot"**: Confirm with **Yes, do it!**, then enable **Public Bot** (optional).
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
sudo chmod +x ./install.sh
```
Run the script with 

```bash
sudo  ./install.sh
```

## After install


### Docker

Start with

```bash
docker-compose up -d

```
Stop with

```bash
docker-compose down

```

### Without docker 

Start env 

```bash
source venv/bin/activate
```

Start backend

```bash
uvicorn app:app --reload

```

Start node server


```bash
npm run start

```



Disclaimer

OpenHowl is provided "as is" with no warranties or guarantees. By using this, you agree to the following:

    Use at Your Own Risk: You are responsible for setting up and securing your installation.
    Compliance with Terms: Ensure compliance with Discord’s Terms of Service and copyright laws.
    Third-Party Dependencies: The maintainers are not responsible for issues caused by dependencies.
    Security Risks: Running OpenHowl requires network configuration, hosting and port forwarding. Do not install if you do not understand these risks.

The maintainers are not liable for any misuse, legal issues, or damages caused by the software.