![logo](https://raw.githubusercontent.com/owen-tay/OpenHowl/refs/heads/main/app/apple-touch-icon.png)

# OpenHowl
OpenHowl is a self-hosted Discord soundboard with a collaborative web interface. Users can easily edit a sound's start and end points, apply basic effects, and trigger sounds directly from the web app. The system supports seamless uploads of local files and audio extraction from YouTube videos via yt-dlp.

## Quick Installation

The easiest way to get started is to run the installation script, which will automatically:
1. Check and install all required dependencies
2. Configure your server with proper settings
3. Set up SSL certificates
4. Create necessary services

```bash
# Make the script executable
sudo chmod +x ./install.sh

# Run the installation script
sudo ./install.sh
```

During installation, you'll be prompted for:
- Your domain or IP address
- Discord bot token
- Admin and user passwords
- Email for SSL certificates (if using a domain)
- Whether to use Docker for deployment

## Creating a Discord Bot

Before running the installation script, you'll need to create a Discord bot:

1. **Go to the Discord Developer Portal**: [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. **Click on "New Application"**: Name it **OpenHowl** (or any name you prefer), then click **Create**.
3. **Go to "Bot" (Left Sidebar) → Click "Add Bot"**: Confirm with **Yes, do it!**, then enable **Public Bot** (optional).
4. **Copy Your Bot Token**: Click **"Reset Token"**, then **Copy** the generated token. You'll need this during installation.
5. **Configure Bot Permissions**:
   - Go to "OAuth2" Tab → Click "URL Generator"
   - Under "Scopes", select: bot, applications.commands, and voice.
   - Under "Bot Permissions", select: Connect, Speak, and Use Slash Commands.
   - Under "Bot" on the side bay → Privileged Gateway Intents: Enable all intents (Presence, Server Members, Message Content).
6. **Invite the Bot**: Copy the generated URL, open it in your browser, select a server, and authorize the bot.

## System Requirements

The installation script will check and install these requirements, but here's what OpenHowl needs:

- **ffmpeg**: Required for audio processing
- **uvicorn**: For API and websockets
- **npm**: For the React frontend
- **nginx**: For handling routing and SSL
- **python3, python3-venv, python3-pip**: For the Python environment
- **ufw** (optional): For firewall configuration

## YouTube Upload Problems

YouTube is increasingly enforcing the use of "PO Token," which may result in errors when uploading sounds from YouTube. The simplest workaround is to copy your cookies file over to the "cookies.txt". This configuration allows YouTube to access your cookies and should prevent download issues. Please note that your account could be banned or restricted for using this. 

Please check out the yt-dlp documentation for guidance on adding cookies to yt-dlp: [yt-dlp Cookies Documentation](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies).



## Post-Installation Management

After installation, the back-end server and API should run automatically. You can:

- Edit settings or change the password of the User and Admin accounts
- Rebuild the frontend with `npm run build` if needed

### Managing Services

To restart services:
```bash
sudo systemctl restart openhowl-frontend.service openhowl-api.service
```

### Manual Service Start (if needed)

Start Python environment:
```bash
source venv/bin/activate
```

Start backend manually:
```bash
uvicorn app:app --reload
```

Start node server manually:
```bash
npm run start
```

## Troubleshooting

- If your bot is not working, make sure you are in a voice channel as the bot will need to know what channel to join.
- Check service logs for errors: `journalctl -u openhowl-api.service` or `journalctl -u openhowl-frontend.service`
- Ensure all required ports (80, 443) are open on your firewall.  These are required for the Bot to interact with Discord. 

## Disclaimer

- **Use at Your Own Risk**: You are responsible for setting up and securing your installation.
- **Compliance with Terms**: Ensure compliance with Discord's Terms of Service and copyright laws.
- **Third-Party Dependencies**: The maintainers are not responsible for issues caused by dependencies.
- **Security Risks**: Running OpenHowl requires network configuration, hosting and port forwarding. Do not install if you do not understand these risks.

The maintainers are not liable for any misuse, legal issues, or damages caused by the software.