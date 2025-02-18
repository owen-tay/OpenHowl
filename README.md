# 🎵 OpenHowl - Setup Guide  

## 1️⃣ Create a Discord Bot & Get Your Token  

Follow these steps to **create your bot** and get the **token**:

1. **Go to the Discord Developer Portal**:  
   👉 [https://discord.com/developers/applications](https://discord.com/developers/applications)  

2. **Click on "New Application"**  
   - Name it **OpenHowl** (or any name you prefer).  
   - Click **Create**.

3. **Go to "Bot" (Left Sidebar) → Click "Add Bot"**  
   - Confirm by clicking **Yes, do it!**  
   - Scroll down and **Enable "Public Bot"** (optional if you want others to invite it).  

4. **Copy Your Bot Token**  
   - Click **"Reset Token"**, then **Copy** the generated token.  
   - Store it safely! You **won’t be able to see it again**.  

---

## 2️⃣ Set Up Permissions & Invite the Bot  

1. **Go to the "OAuth2" Tab → Click "URL Generator"**  
2. **Under "Scopes"**, select:  
   - ✅ `bot`  
   - ✅ `applications.commands`  
    - ✅ `voice`  


3. **Under "Bot Permissions"**, select:  
   - ✅ `Connect` (Allows joining voice channels)  
   - ✅ `Speak` (Plays audio)  
   - ✅ `Use Slash Commands` (Needed for `/OpenHowl join`)  

4. **Copy the Generated URL & Invite Your Bot**  
   - Scroll down and **copy the OAuth2 URL**.  
   - Open it in your browser, select a **server**, and **authorize the bot**.

---

## 3️⃣ Add Your Token to OpenHowl  

1. **In your project folder**, create a file called **`.env.local`**  
2. **Paste your bot token inside**:
   ```env
   DISCORD_BOT_TOKEN=your-bot-token-here
