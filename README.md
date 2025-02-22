![logo](https://raw.githubusercontent.com/owen-tay/OpenHowl/refs/heads/main/app/apple-touch-icon.png)



# OpenHowl          
OpenHowl is a self-hosted Discord soundboard with a collaborative web interface. Users can easily edit a sound’s start and end points, apply basic effects, and trigger sounds directly from the web app. The system supports seamless uploads of local files and audio extraction from YouTube videos via yt-dlp.

Please note that YouTube is increasingly enforcing the use of "PO Token," which may result in errors when uploading sounds from YouTube. The simplest workaround is to export your youtube cookies and entering them into a file called cookies.txt in your root install folder using a tool like [Export Cookies](https://addons.mozilla.org/en-GB/firefox/addon/export-cookies-txt/). Consult the yt-dlp documentation for guidance on passing cookies: [yt-dlp Cookies Documentation](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies). 

The file cookies.txt can be edited with sudo nano ./cookies.txt . You may then paste your netscape formatted cookies file.

`By using your account with yt-dlp, you run the risk of it being banned (temporarily or permanently). Be mindful with the request rate and amount of downloads you make with an account. Use it only when necessary, or consider using a throwaway account.`

Though a basic setup script and setup guide is included, it has only been provided to assist and may not be suitable for running on your system. Please make sure you have installed the required packages found below. 

### Setup Guide - Requirements 



- **ffmpeg**  
  Required for audio.

```bash

sudo apt install ffmpeg 
```

- **uvicorn**  
 api / websockets

 ```bash

sudo apt install uvicorn 
```

- **npm**  
  For react frontend server.

 ```bash

sudo apt install npm 
```


- **nginx**  
 handling routing and SSL

 ```bash

sudo apt install nginx 
```


- **python3 python3-venv python3-pip**  
  Necessary for creating Python environments. 
  
```bash
  sudo apt install -y python3 python3-venv python3-pip
  ```


- **ufw**  
  Optional - The script will attempt to create firewall rules if UFW is installed.

```bash
sudo apt install ufw

sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

sudo ufw enable
```


  
### For an HTTPS connection, this script will attempt to create SSL certificates. 
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
4. **Go to "Bot" on the side bay → Privileged Gateway Intents**: Enable all (Presence Intent, Server Members Intent, Message Content Intent).
5. **Copy the Generated URL & Invite Your Bot**: Open the URL in your browser, select a server, and authorize the bot.

---

## Install OpenHowl

### Run the Install Script

The easiest way to install this for beginners is no not install via docker. The script should handle everthing if you type "N" when it prompts you to use it. 

```bash
sudo chmod +x ./install.sh
```
Run the script with 

```bash
sudo  ./install.sh
```

### After install

The back end server and API should run automatically. Feel free to edit any of the settings or change the password of the User and Admin accounts. Please note that *npm run build* may have to run or the whole file reset. 
If your bot is not working make sure you are in a voice channel as the bot will need to know what channel to go into.

To restart services
```bash
 sudo systemctl restart openhowl-frontend.service openhowl-api.service 
 ```


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

